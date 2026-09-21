import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X, Search, LocateFixed, Users } from 'lucide-react'
import { resolveZip, searchPlaces } from '../lib/geo'
import { milesBetween, pointInAnyRadius, resolveInRange } from '../lib/geo-count'
import gsap from 'gsap'
import { Map as MapLibreMap, Marker, Popup, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { circleFeature, boundsForLocations } from '../lib/geo-circle'

/*
 * Basemap tiles.
 *
 * CARTO began requiring a key for their basemaps and now stamps
 * "API KEY REQUIRED" diagonally across every unauthenticated tile. The tiles
 * still return 200, so nothing errors - the map just renders with a watermark
 * through it.
 *
 * The key is a URL parameter on a public tile request, so it is public by
 * nature; CARTO restricts it by referring domain rather than by secrecy. It
 * still comes from the environment rather than the source so it can differ
 * between preview and production, and so rotating it is a config change.
 *
 * Without a key this falls back to the unauthenticated URL, which works and is
 * watermarked. That is deliberate: a missing key should degrade the map's looks,
 * not break radius filtering, which is the part that does the work.
 */
const CARTO_KEY = import.meta.env.VITE_CARTO_BASEMAP_KEY || ''

/*
 * Vector, not raster.
 *
 * The same CARTO Positron this always used, served as a vector style rather than
 * pre-rendered PNG tiles. Labels and borders stay sharp at any zoom and on any
 * display, and the style is data rather than pictures, so the basemap can later
 * be restyled to match the rest of the product instead of being whatever the
 * tile server baked in.
 *
 * Vector tiles are not watermarked the way the raster ones were - they carry no
 * pixels to stamp - but the key still goes on the style request. It is what the
 * account is identified by, and a style URL that works with and without it today
 * is not a promise about tomorrow.
 */
const BASEMAP_STYLE = `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json${CARTO_KEY ? `?key=${encodeURIComponent(CARTO_KEY)}` : ''}`

const PRESETS = [1, 5, 10, 25, 50, 100]
const CIRCLE_COLORS = ['#2b7657', '#f5e642', '#e03131', '#4a9e7a', '#d4c82e']
const MAX_LOCATIONS = 5
const GEO_FILTER_KEY = 'geo-filter-state'

/**
 * Animated integer - tweens from its previous value to the new one whenever
 * `value` changes, so the in-range count rolls as you drag the radius.
 */
function AnimatedStat({ value }) {
  const ref = useRef(null)
  const prev = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const proxy = { n: prev.current }
    const tw = gsap.to(proxy, {
      n: value, duration: 0.5, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(proxy.n).toLocaleString() },
      onComplete: () => { prev.current = value },
    })
    return () => { tw.kill(); prev.current = value }
  }, [value])
  return <span ref={ref}>{value.toLocaleString()}</span>
}

/**
 * GeoFilter // multi-location radius filter with a live map.
 *
 * Entry is by city/place search, ZIP, "use my location", or clicking the map.
 * Props:
 *   onChange({ locations: [{lat,lng,city,state,zip,radius}] }): called on apply
 *   onClear(): called when the filter is cleared
 *   loading?: boolean // spinner on the apply button
 *   active?: boolean  // highlights the toggle when a filter is active
 *   subscribers?: [{ id, latitude, longitude, health_score }] // plotted + counted
 *   total?: number // workspace-wide count, so the preview can say when it is
 *                  // counting a sample rather than everyone
 *   clusters?: [{ lat, lng, total, active, at_risk, cold }] // server-aggregated
 *                  // pins. Supplied, these replace `subscribers` on the map.
 *   inRange?: number|null // exact server count inside the radius. A number here
 *                  // replaces the local Haversine estimate and drops the tilde.
 *   summaryLoading?: boolean // the exact count is in flight
 *   onPreview?: ({ open, locations }) => void // the draft selection, on every
 *                  // change. `onChange` only fires on apply, so without this the
 *                  // parent cannot fetch a count for a radius still being dragged.
 *   defaultOpen?: boolean // start expanded. For places whose job is to show the
 *                  // map rather than to offer it, like the demo page.
 */
export default function GeoFilter({
  onChange, onClear, loading = false, active = false, subscribers = [], total = null,
  clusters = null, inRange = null, summaryLoading = false, onPreview = null,
  defaultOpen = false,
}) {
  /*
   * Starts expanded when a filter is already in force.
   *
   * `locations` and `applied` rehydrate from localStorage, so coming back to
   * this page with a radius applied used to show a filtered table of 500 people
   * above a collapsed bar - the control explaining why was one click away, and
   * nothing on screen connected the two. If the filter is doing something, it
   * should be visible doing it.
   */
  const [open, setOpen] = useState(() => {
    if (defaultOpen) return true
    try {
      const saved = localStorage.getItem(GEO_FILTER_KEY)
      return saved ? JSON.parse(saved).applied === true : false
    } catch { return false }
  })
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const [geoLocating, setGeoLocating] = useState(false)
  const [selectedLocIdx, setSelectedLocIdx] = useState(0)
  const panelRef = useRef(null)
  const searchTimer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const chipsRef = useRef([])
  const gsapTweens = useRef([])
  const addLocationRef = useRef(() => {})
  const locationsRef = useRef([])

  // Rehydrate from localStorage via lazy initializers (avoids setState-in-effect)
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem(GEO_FILTER_KEY)
      if (saved) {
        const { locations: locs, applied: wasApplied } = JSON.parse(saved)
        if (locs?.length && wasApplied) {
          return locs.map((l) => ({ ...l, radius: l.radius ?? 10 }))
        }
      }
    } catch { /* localStorage may be blocked */ }
    return []
  })
  const [applied, setApplied] = useState(() => {
    try {
      const saved = localStorage.getItem(GEO_FILTER_KEY)
      return saved ? JSON.parse(saved).applied === true : false
    } catch { return false }
  })

  // ─── Panel open/close (GSAP) ───
  useEffect(() => {
    if (!panelRef.current) return
    if (open) {
      panelRef.current.style.height = 'auto'
      panelRef.current.style.overflow = 'hidden'
      const h = panelRef.current.offsetHeight
      panelRef.current.style.height = '0px'
      gsap.to(panelRef.current, { height: h, duration: 0.3, ease: 'power3.out',
        onComplete: () => {
          panelRef.current.style.height = 'auto'
          panelRef.current.style.overflow = 'visible'
        }
      })
    } else {
      panelRef.current.style.overflow = 'hidden'
      gsap.to(panelRef.current, { height: 0, duration: 0.25, ease: 'power2.in' })
    }
  }, [open])

  // ─── Stagger chips entrance when panel opens ───
  useEffect(() => {
    if (!open || locations.length === 0) return
    const tl = gsap.timeline({ delay: 0.15 })
    locations.forEach((_, i) => {
      tl.from(chipsRef.current[i], { y: -12, scale: 0.85, opacity: 0, duration: 0.3, ease: 'back.out(1.7)' }, i * 0.06)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Mirror locations into a ref so async callers (map click, geolocation) always
  // read the current list without going stale.
  useEffect(() => { locationsRef.current = locations }, [locations])

  /*
   * Report the draft selection upward on every edit.
   *
   * `onChange` fires on apply, which is the right moment to refilter a table and
   * the wrong one to count with: the count is what tells you whether to apply at
   * all. The parent debounces - this fires on each tick of a slider drag.
   */
  const previewRef = useRef(onPreview)
  useEffect(() => { previewRef.current = onPreview }, [onPreview])
  useEffect(() => {
    previewRef.current?.({ open, locations })
  }, [open, locations])

  // ─── Debounced search: ZIP → resolveZip, otherwise forward-geocode ───
  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    const clean = value.trim()
    if (clean.length < 3) { setSuggestions([]); setSearching(false); return }

    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        let results = []
        setSearchFailed(false)
        if (/^\d{5}(-\d{4})?$/.test(clean)) {
          const r = await resolveZip(clean)
          if (r) results = [{ ...r, zip: clean, label: [r.city, r.state].filter(Boolean).join(', ') || `ZIP ${clean}` }]
        } else {
          results = await searchPlaces(clean)
        }
        setSuggestions(results)
      } catch (err) {
        // setSuggestions([]) alone renders "No matches", so a network failure
        // told the user the place does not exist.
        console.error('[GeoFilter] search failed:', err)
        setSuggestions([])
        setSearchFailed(true)
      } finally {
        setSearching(false)
      }
    }, 450)
  }, [])

  // ─── Add a location (dedupes by ZIP or proximity; caps at MAX_LOCATIONS) ───
  const addLocation = useCallback((loc) => {
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return
    const prev = locationsRef.current
    setQuery('')
    setSuggestions([])
    if (prev.length >= MAX_LOCATIONS) return

    const dupIdx = prev.findIndex((l) =>
      (loc.zip && l.zip && l.zip === loc.zip) ||
      (Math.abs(l.lat - loc.lat) < 0.01 && Math.abs(l.lng - loc.lng) < 0.01)
    )
    if (dupIdx >= 0) {
      const el = chipsRef.current[dupIdx]
      if (el) gsap.fromTo(el, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1 })
      setSelectedLocIdx(dupIdx)
      return
    }

    const next = [...prev, { ...loc, radius: loc.radius ?? 10 }]
    locationsRef.current = next
    setLocations(next)
    setSelectedLocIdx(next.length - 1) // focus the one just added
  }, [])

  // Keep a live ref so the once-bound map click handler always adds correctly
  useEffect(() => { addLocationRef.current = addLocation }, [addLocation])

  // Press Enter to add the top suggestion
  function handleKeyDown(e) {
    if (e.key === 'Enter' && suggestions.length) {
      e.preventDefault()
      addLocation(suggestions[0])
    }
  }

  // ─── "Use my location" via the browser geolocation API ───
  function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let city = '', state = '', zip = ''
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { Accept: 'application/json' } }
          )
          const data = await res.json()
          city = data.address?.city || data.address?.town || data.address?.village || ''
          state = data.address?.state || ''
          zip = data.address?.postcode || ''
        } catch { /* reverse geocode is best-effort */ }
        setGeoLocating(false)
        addLocation({ lat: latitude, lng: longitude, city, state, zip })
      },
      () => { setGeoLocating(false) },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    )
  }

  // ─── Remove a location with a GSAP exit (guard against double-remove) ───
  function removeLocation(index) {
    const chipEl = chipsRef.current[index]
    if (!chipEl || chipEl.dataset.removing === 'true') return
    chipEl.dataset.removing = 'true'
    gsap.to(chipEl, {
      scale: 0.5, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: () => setLocations(prev => prev.filter((_, i) => i !== index)),
    })
  }

  /*
   * The ids inside any location's radius (Haversine).
   *
   * The set itself is what the map needs, not just its size: every contact
   * rendered identically whether it was inside the circle or not, so a cleared
   * filter and an applied one drew the same green dots and the map looked like
   * it was still holding a selection. The pins below dim anything outside.
   */
  const inRangeIds = (() => {
    const set = new Set()
    if (locations.length === 0) return set
    locations.forEach(loc => {
      const locRadius = loc.radius ?? 10
      subscribers.forEach(s => {
        if (!s.id || !s.latitude || !s.longitude) return
        if (milesBetween(loc.lat, loc.lng, s.latitude, s.longitude) <= locRadius) set.add(s.id)
      })
    })
    return set
  })()

  /** Which clusters fall inside some radius, so the map can dim the rest. */
  const clusterInRange = (c) => pointInAnyRadius(c.lat, c.lng, locations)

  const plottedClusters = Array.isArray(clusters) ? clusters.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)) : null

  /*
   * How many contacts the selection catches, and whether that is an estimate.
   * The ranking lives in lib/geo-count.js, where it is unit tested - it is the
   * part of this component most likely to be got wrong later.
   */
  const { count: totalInRange, sampling } = resolveInRange({
    exact: inRange,
    clusters: plottedClusters,
    locations,
    sampleCount: inRangeIds.size,
    loadedCount: subscribers.length,
    total,
  })

  const hasPlottable = plottedClusters
    ? plottedClusters.length > 0
    : subscribers.some(s => s.latitude && s.longitude)

  /*
   * What the closed teaser can claim about this workspace, for free.
   *
   * `clusters` only arrives once the panel has been opened, by design - the
   * summary query is the thing the closed state exists to avoid. So the mapped
   * figure is used when it happens to be known, and otherwise this falls back to
   * the table's own total, which the page has already fetched. It says
   * "contacts" rather than "contacts mapped" in that case, because a contact
   * without coordinates is not on the map and promising otherwise would be the
   * same overstatement the in-range count used to make.
   */
  const mappedLabel = (() => {
    if (plottedClusters?.length) {
      const plotted = plottedClusters.reduce((sum, c) => sum + (c.total ?? 0), 0)
      return `${plotted.toLocaleString()} contact${plotted === 1 ? '' : 's'} mapped`
    }
    if (typeof total === 'number' && total > 0) {
      return `${total.toLocaleString()} contact${total === 1 ? '' : 's'} to filter`
    }
    return null
  })()

  const maxRadius = locations.length ? Math.max(...locations.map(l => l.radius ?? 10)) : 0
  // Derived (not synced) so removing a location can never leave a stale index.
  const safeIdx = locations.length ? Math.min(selectedLocIdx, locations.length - 1) : 0

  const HEALTH_COLORS = { active: '#2b7657', at_risk: '#f5e642', cold: '#e03131' }

  /*
   * Everything below draws the map, and all of it speaks [lng, lat].
   *
   * MapLibre and GeoJSON put longitude first; Leaflet put latitude first. The
   * rest of this component, the API and the database all use {lat, lng}, so the
   * flip happens here and only here. Reversing it does not throw - it silently
   * puts Denver in Antarctica.
   */

  /** Contacts, or server-aggregated clusters, as one GeoJSON collection. */
  function buildPinData() {
    const filtering = locations.length > 0

    if (plottedClusters) {
      const maxTotal = plottedClusters.reduce((m, c) => Math.max(m, c.total ?? 0), 0) || 1
      return {
        type: 'FeatureCollection',
        features: plottedClusters.map(c => {
          const bands = [['active', c.active ?? 0], ['at_risk', c.at_risk ?? 0], ['cold', c.cold ?? 0]]
          const [dominant] = bands.sort((a, b) => b[1] - a[1])[0]
          const parts = bands.filter(([, n]) => n > 0).map(([k, n]) => `${n.toLocaleString()} ${k.replace('_', ' ')}`)
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
            properties: {
              inRange: !filtering || clusterInRange(c),
              // Area scales with the count, so radius goes by square root - the
              // circle's area carries the number rather than its width.
              size: 5 + 15 * Math.sqrt((c.total ?? 0) / maxTotal),
              color: HEALTH_COLORS[dominant] || '#a8a49a',
              tooltip: `<strong>${(c.total ?? 0).toLocaleString()} contact${c.total === 1 ? '' : 's'}</strong>${parts.length ? `<br>${parts.join(' · ')}` : ''}`,
            },
          }
        }),
      }
    }

    const sizes = { active: 7, at_risk: 5, cold: 3 }
    return {
      type: 'FeatureCollection',
      features: subscribers
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
          properties: {
            inRange: !filtering || inRangeIds.has(s.id),
            size: sizes[s.health_score] || 4,
            color: HEALTH_COLORS[s.health_score] || '#a8a49a',
            tooltip: '',
          },
        })),
    }
  }

  /**
   * The radius circles, as polygons.
   *
   * `radiusOverride` lets the GSAP tween redraw them mid-animation without
   * touching component state: Leaflet had `circle.setRadius()` for this, and a
   * vector map has no equivalent because its circles are sized in pixels rather
   * than metres. See lib/geo-circle.js.
   */
  function buildCircleData(radiusOverride = null) {
    return {
      type: 'FeatureCollection',
      features: locations.map((loc, i) => circleFeature(
        loc.lat,
        loc.lng,
        radiusOverride?.[i] ?? loc.radius ?? 10,
        { color: CIRCLE_COLORS[i % CIRCLE_COLORS.length] }
      )),
    }
  }

  function setSourceData(id, data) {
    const src = mapRef.current?.getSource(id)
    if (src) src.setData(data)
  }

  /** Grow each circle from nothing to its radius, staggered. */
  function animateCircles() {
    gsapTweens.current.forEach(t => t.kill())
    gsapTweens.current = []
    if (locations.length === 0) { setSourceData('geo-circles', buildCircleData([])); return }

    const proxy = locations.map(() => 0)
    locations.forEach((loc, i) => {
      const tw = gsap.to(proxy, {
        [i]: loc.radius ?? 10,
        duration: 0.5 + i * 0.1,
        ease: 'power3.out',
        onUpdate: () => setSourceData('geo-circles', buildCircleData(proxy)),
      })
      gsapTweens.current.push(tw)
    })
  }

  /** A draggable pin per location, reverse geocoded on drop. */
  function rebuildMarkers(map, locs) {
    markersRef.current.forEach(m => { try { m.remove() } catch { /* already gone */ } })
    markersRef.current = []

    locs.forEach((loc, i) => {
      const el = document.createElement('div')
      el.style.cssText = `width:16px;height:16px;background:${CIRCLE_COLORS[i % CIRCLE_COLORS.length]};border:3px solid #0a0a0a;border-radius:50%;cursor:grab;box-shadow:0 0 0 3px rgba(255,255,255,0.6);`

      const marker = new Marker({ element: el, draggable: true })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map)

      marker.on('dragend', async () => {
        const { lat, lng } = marker.getLngLat()
        let patch = { lat, lng }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
            headers: { Accept: 'application/json' },
          })
          const data = await res.json()
          patch = {
            lat, lng,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || '',
            zip: data.address?.postcode || '',
          }
        } catch { /* reverse geocode is best-effort */ }
        setLocations(prev => {
          const n = [...prev]
          if (n[i]) n[i] = { ...n[i], ...patch }
          return n
        })
      })

      markersRef.current.push(marker)
    })
  }

  /** Frame every circle, not just every centre. */
  function fitToLocations(map) {
    const bounds = boundsForLocations(locations)
    if (!bounds) return
    try {
      map.fitBounds(bounds, { padding: 40, maxZoom: 13, duration: 600 })
    } catch { /* bounds may be degenerate */ }
  }

  // ─── Map init & update ───
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        gsapTweens.current.forEach(t => t.kill())
        gsapTweens.current = []
        markersRef.current.forEach(m => { try { m.remove() } catch { /* already gone */ } })
        markersRef.current = []
        mapRef.current.remove()
        mapRef.current = null
      }
      return
    }

    if (!mapRef.current) {
      const el = document.getElementById('geo-filter-map')
      if (!el) return

      const map = new MapLibreMap({
        container: el,
        style: BASEMAP_STYLE,
        center: locations.length > 0 ? [locations[0].lng, locations[0].lat] : [-98.5795, 39.8283],
        zoom: locations.length > 0 ? 9 : 3,
        // Scroll belongs to the page here. A filter panel that swallows the
        // wheel traps anyone scrolling past it towards the contacts table.
        scrollZoom: false,
        attributionControl: { compact: true },
      })
      mapRef.current = map

      /*
       * A map that fails silently is worse than one that throws.
       *
       * MapLibre reports a missing style, a refused tile or a bad layer through
       * this event rather than by rejecting a promise, so without it a blank
       * canvas is indistinguishable from an empty map - which is exactly how
       * this port's first broken build looked.
       */
      map.on('error', (e) => {
        console.error('[GeoFilter] map error:', e?.error?.message || e?.error || e)
      })

      map.addControl(new NavigationControl({ showCompass: false }), 'top-left')

      map.on('load', () => {
        map.addSource('geo-circles', { type: 'geojson', data: buildCircleData([]) })
        map.addLayer({
          id: 'geo-circles-fill', type: 'fill', source: 'geo-circles',
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.08 },
        })
        map.addLayer({
          id: 'geo-circles-line', type: 'line', source: 'geo-circles',
          paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-dasharray': [2, 1.5] },
        })

        map.addSource('geo-pins', { type: 'geojson', data: buildPinData() })
        map.addLayer({
          id: 'geo-pins-layer', type: 'circle', source: 'geo-pins',
          paint: {
            // Out of range is context rather than content: dimmed and smaller,
            // so the ones the filter caught are the only thing reading as
            // selected.
            'circle-radius': ['case', ['get', 'inRange'], ['get', 'size'], ['max', 3, ['*', ['get', 'size'], 0.55]]],
            'circle-color': ['case', ['get', 'inRange'], ['get', 'color'], '#d4d0c8'],
            'circle-opacity': ['case', ['get', 'inRange'], 0.85, 0.4],
            'circle-stroke-width': ['case', ['get', 'inRange'], 2, 1],
            'circle-stroke-color': ['case', ['get', 'inRange'], '#0a0a0a', '#a8a49a'],
          },
        })

        animateCircles()
        rebuildMarkers(map, locationsRef.current)
        fitToLocations(map)

        const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 10 })
        map.on('mousemove', 'geo-pins-layer', (e) => {
          const f = e.features?.[0]
          if (!f?.properties?.tooltip) return
          map.getCanvas().style.cursor = 'pointer'
          popup.setLngLat(f.geometry.coordinates.slice()).setHTML(f.properties.tooltip).addTo(map)
        })
        map.on('mouseleave', 'geo-pins-layer', () => {
          map.getCanvas().style.cursor = ''
          popup.remove()
        })
      })

      // Click-to-place: reverse geocode the click, then add via the live ref.
      map.on('click', async (e) => {
        const { lat, lng } = e.lngLat
        let loc = { lat, lng, city: '', state: '', zip: '' }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
            headers: { Accept: 'application/json' },
          })
          const data = await res.json()
          loc = {
            lat, lng,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || '',
            zip: data.address?.postcode || '',
          }
        } catch { /* keep bare coords */ }
        addLocationRef.current(loc)
      })

      return
    }

    const map = mapRef.current
    if (!map.isStyleLoaded()) return

    setSourceData('geo-pins', buildPinData())
    animateCircles()
    rebuildMarkers(map, locations)
    fitToLocations(map)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locations, clusters])

  // ─── Location radius change: redraw one circle ───
  function updateLocationRadius(index, newRadius) {
    setLocations(prev => {
      const n = [...prev]
      if (n[index]) n[index] = { ...n[index], radius: newRadius }
      return n
    })
  }

  // ─── Actions ───
  function applyFilter() {
    if (locations.length === 0) return
    setApplied(true)
    onChange({ locations })
    try { localStorage.setItem(GEO_FILTER_KEY, JSON.stringify({ locations, applied: true })) } catch { /* localStorage may be full */ }
  }

  function clearFilter() {
    setQuery(''); setSuggestions([]); setLocations([])
    setApplied(false); setOpen(false)
    onClear?.()
    try { localStorage.removeItem(GEO_FILTER_KEY) } catch { /* localStorage may be blocked */ }
  }

  const selRadius = locations[safeIdx]?.radius ?? 10
  const fillPct = ((selRadius - 1) / 99) * 100

  // ─── Render ───
  return (
    <div className="border-3 border-brutal-fg bg-white">
      {/*
        Closed with nothing applied, this is a pitch rather than a control.

        It used to be a white bar reading "Radius filter" with a small triangle,
        which is the same shape as every other form control on the page - so the
        most distinctive thing in the product looked like an advanced-options
        disclosure and went unopened. Nothing about it suggested a map.

        It stays closed by default even so, because open costs about 600px above
        the contacts table plus Leaflet, tiles and a summary query on every
        visit, and most sessions came here to find one person. The fix for
        discoverability is to say what is behind the door, not to remove it.
      */}
      {!open && !applied && !active ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left px-4 py-4 bg-white hover:bg-brutal-yellow/10 transition group"
        >
          <div className="flex items-start gap-3">
            <span className="shrink-0 border-3 border-brutal-fg bg-brutal-green text-white p-1.5">
              <MapPin size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-fg">Filter by location</p>
              <p className="text-[11px] text-brutal-muted mt-0.5 normal-case">
                Draw a radius around any city and see who is inside it.
              </p>
              {mappedLabel && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-green mt-1.5">{mappedLabel}</p>
              )}
            </div>
            <span className="shrink-0 self-center px-3 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg text-[10px] font-bold uppercase tracking-wider group-hover:shadow-brutal transition">
              Open the map
            </span>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
            active || applied
              ? 'bg-brutal-green text-white border-brutal-fg'
              : 'bg-white text-brutal-fg hover:bg-brutal-yellow/20'
          }`}
        >
          <MapPin size={14} />
          {applied && locations.length > 0
            ? `${locations[0].city || 'Pin'}, ${locations[0].state || '-'}${locations.length > 1 ? ` +${locations.length - 1} more` : ''} · ${locations[0]?.radius ?? 10} mi`
            : 'Filter by location'}
          <span className="ml-auto text-[10px] opacity-60">{open ? '▲' : '▼'}</span>
        </button>
      )}

      <div ref={panelRef} style={{ height: '0px', overflow: 'hidden' }} className="border-t-3 border-brutal-fg">
        <div className="p-5 sm:p-6 space-y-5">
          {/* Search: city / place / ZIP + use my location */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
              Add a city, place, or ZIP
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-muted">
                  {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={locations.length >= MAX_LOCATIONS}
                  placeholder={locations.length >= MAX_LOCATIONS ? `Max ${MAX_LOCATIONS} locations` : 'e.g. Austin, TX or 78701'}
                  className="w-full pl-9 pr-3 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition disabled:opacity-50"
                />
              </div>
              <button
                onClick={useMyLocation}
                disabled={locations.length >= MAX_LOCATIONS || geoLocating}
                className="shrink-0 px-3 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-[10px] uppercase tracking-wider hover:bg-brutal-yellow/20 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-y-0.5 flex items-center gap-1.5"
                title="Use my location"
                aria-label="Use my location"
              >
                {geoLocating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                <span className="hidden sm:inline">Near me</span>
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <ul className="mt-2 border-3 border-brutal-fg divide-y divide-brutal-fg/15 bg-white animate-fade-in">
                {suggestions.map((s, i) => (
                  <li key={`${s.lat},${s.lng},${i}`}>
                    <button
                      onClick={() => addLocation(s)}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-brutal-yellow/20 transition"
                    >
                      <MapPin size={13} className="text-brutal-green shrink-0" />
                      <span className="text-xs font-bold">{s.label || `${s.city}, ${s.state}`}</span>
                      {s.zip && <span className="text-[10px] text-brutal-muted ml-auto">{s.zip}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!searching && query.trim().length >= 3 && suggestions.length === 0 && (
              <p className="mt-1.5 text-[10px] font-bold text-brutal-red uppercase tracking-wider">
                {searchFailed
                  ? 'Lookup unavailable - check your connection and try again'
                  : 'No matches - try a city name or 5-digit ZIP'}
              </p>
            )}
          </div>

          {/* Location chips */}
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {locations.map((loc, i) => {
                const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
                const isSelected = i === safeIdx
                const locRadius = loc.radius ?? 10
                return (
                  <div
                    key={`${loc.zip}-${i}`}
                    ref={el => { chipsRef.current[i] = el }}
                    onClick={() => setSelectedLocIdx(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      isSelected
                        ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg'
                        : 'border-brutal-fg bg-white text-brutal-fg/70 hover:bg-brutal-yellow/20'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full border border-brutal-fg shrink-0" style={{ background: color }} />
                    <span>{loc.city || 'Pin'}, {loc.state || '-'}</span>
                    <span className="text-brutal-green">· {locRadius}mi</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLocation(i) }}
                      className="ml-0.5 p-0.5 hover:bg-brutal-red/10 rounded transition-colors"
                      aria-label={`Remove ${loc.city || 'location'}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
              {locations.length > 1 && (
                <button onClick={() => { setLocations([]); setQuery('') }}
                  className="px-2 py-1.5 border-2 border-brutal-fg text-[9px] font-bold uppercase tracking-wider text-brutal-red hover:bg-brutal-red/10 transition">
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Live map */}
          <div className="border-3 border-brutal-fg overflow-hidden">
            <div className="bg-brutal-fg text-white px-3 py-1.5 flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-wider gap-x-3 gap-y-1">
              <span>{locations.length === 0 ? 'Click the map to drop a pin' : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}</span>
              {/*
                Says "your contacts" explicitly. The dots are health-coloured, so
                the common case is green - and green is also this UI's selection
                colour, which made a cleared filter look like it was still
                holding a selection. Naming what they are costs two words.
              */}
              {hasPlottable && (
                <span className="flex items-center gap-2">
                  {/*
                    With clusters, one circle is many contacts, so the legend has
                    to say that - otherwise a big dot reads as one important
                    person rather than five hundred ordinary ones.
                  */}
                  <span className="opacity-70">{plottedClusters ? 'Circle size = contacts:' : 'Your contacts:'}</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#2b7657'}} /> Active</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#f5e642'}} /> Risk</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#e03131'}} /> Cold</span>
                  {locations.length > 0 && (
                    <span className="flex items-center gap-1 opacity-70"><span className="inline-block w-2 h-2 rounded-full border border-white/40" style={{background:'#d4d0c8'}} /> Outside</span>
                  )}
                </span>
              )}
            </div>
            {/*
              `isolation: isolate` is what keeps the map under the dashboard header.

              A map library ships its own stacking. Leaflet used panes at 400-700
              and controls at 1000; MapLibre's controls and popups do the same
              thing at its own values. Either way those numbers come from foreign
              CSS and, without a stacking context here, they compete directly
              against the header's `z-40` (DashboardLayout.jsx) in the root
              context - which is how scrolling up once drew the map over the nav.

              Isolating forms a stacking context its children cannot escape, so
              the library's internal ordering stays internal and the whole map
              composites as one layer at this container's own level. That holds
              whatever the library numbers its layers, which is why the fix
              survived the port from Leaflet to MapLibre unchanged.

              Deliberately not fixed by raising the header: it would then have to
              outrank whatever the map uses, and the mobile drawer at z-50 and
              the modals above it would each need raising to stay above the
              header. Containing the one component that imports foreign CSS is
              the smaller and more durable change.
            */}
            <div
              id="geo-filter-map"
              className="h-[300px] sm:h-[360px]"
              style={{ width: '100%', background: '#e8e8e0', touchAction: 'auto', isolation: 'isolate' }}
            />
          </div>
          <p className="text-[10px] text-brutal-muted -mt-2">
            Tip: click the map to drop a pin, or drag a pin to fine-tune it.
          </p>

          {/* Hero count / coverage summary */}
          {locations.length > 0 && (
            hasPlottable ? (
              <div className="border-3 border-brutal-fg bg-brutal-green text-white px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2 min-w-0">
                  <Users size={20} className="shrink-0 self-center" />
                  <span className="font-heading text-4xl sm:text-5xl leading-none flex items-center gap-2">
                    {sampling && '~'}<AnimatedStat value={totalInRange} />
                    {/*
                      The number keeps its last value while a new one is being
                      fetched rather than blanking, so dragging the slider reads
                      as a figure catching up rather than the panel flickering.
                    */}
                    {summaryLoading && <Loader2 size={16} className="animate-spin opacity-70" />}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                    subscribers<br className="hidden sm:inline" /> in range
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 text-right shrink-0">
                  {locations.length} area{locations.length !== 1 ? 's' : ''}<br />up to {maxRadius} mi
                  {/*
                    Said out loud only when it is still an estimate. Silence used
                    to mean "this is a total", which was the problem: the tilde
                    was easy to miss and nothing else admitted to the sampling.
                  */}
                  {sampling && <><br /><span className="opacity-90">estimated from {subscribers.length} loaded</span></>}
                </span>
              </div>
            ) : (
              <div className="border-3 border-brutal-fg bg-brutal-surface px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brutal-fg/70 flex items-center gap-2">
                <MapPin size={14} className="text-brutal-green" />
                Targeting {locations.length} area{locations.length !== 1 ? 's' : ''} · up to {maxRadius} mi radius
              </div>
            )
          )}

          {/* Per-location radius slider */}
          {locations.length > 0 && locations[safeIdx] && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-2">
                Radius {locations.length > 1 ? `· ${locations[safeIdx].city || `#${safeIdx + 1}`}` : ''}: <span className="text-brutal-green font-heading text-base">{selRadius} mi</span>
              </label>
              <input
                type="range" min={1} max={100}
                value={selRadius}
                onChange={e => updateLocationRadius(safeIdx, Number(e.target.value))}
                className="w-full h-2.5 border-2 border-brutal-fg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:bg-brutal-green [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brutal-fg
                  [&::-webkit-slider-thumb]:shadow-brutal [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-brutal-green
                  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brutal-fg [&::-moz-range-thumb]:cursor-pointer"
                style={{ background: `linear-gradient(to right, #2b7657 0%, #2b7657 ${fillPct}%, #e8e8e0 ${fillPct}%, #e8e8e0 100%)` }}
              />
            </div>
          )}

          {/* Preset chips */}
          {locations.length > 0 && locations[safeIdx] && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted self-center">Quick:</span>
              {PRESETS.map(mi => (
                <button
                  key={mi}
                  onClick={() => updateLocationRadius(safeIdx, mi)}
                  className={`px-3 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
                    selRadius === mi
                      ? 'border-brutal-fg bg-brutal-green text-white'
                      : 'border-brutal-fg/30 text-brutal-muted hover:border-brutal-fg hover:text-brutal-fg'
                  }`}
                >
                  {mi} mi
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-brutal-fg/20">
            <button
              onClick={applyFilter}
              disabled={locations.length === 0 || loading}
              className="flex-1 px-4 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-y-0.5"
            >
              {loading
                ? 'Loading...'
                : hasPlottable && locations.length > 0
                  ? `Show ${sampling ? '~' : ''}${totalInRange.toLocaleString()} subscribers`
                  : 'Show subscribers'}
            </button>
            {applied && (
              <button
                onClick={clearFilter}
                className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-red/10 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
