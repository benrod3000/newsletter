import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X, Search, LocateFixed, Users } from 'lucide-react'
import { resolveZip, searchPlaces } from '../lib/geo'
import gsap from 'gsap'
import L from 'leaflet'

const PRESETS = [1, 5, 10, 25, 50, 100]
const CIRCLE_COLORS = ['#2b7657', '#f5e642', '#e03131', '#4a9e7a', '#d4c82e']
const MAX_LOCATIONS = 5
const GEO_FILTER_KEY = 'geo-filter-state'

/**
 * Animated integer — tweens from its previous value to the new one whenever
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
 */
export default function GeoFilter({ onChange, onClear, loading = false, active = false, subscribers = [] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [geoLocating, setGeoLocating] = useState(false)
  const [selectedLocIdx, setSelectedLocIdx] = useState(0)
  const panelRef = useRef(null)
  const searchTimer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const circlesRef = useRef([])
  const subscriberLayerRef = useRef(null)
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
        if (/^\d{5}(-\d{4})?$/.test(clean)) {
          const r = await resolveZip(clean)
          if (r) results = [{ ...r, zip: clean, label: [r.city, r.state].filter(Boolean).join(', ') || `ZIP ${clean}` }]
        } else {
          results = await searchPlaces(clean)
        }
        setSuggestions(results)
      } catch (err) {
        console.error('[GeoFilter] search failed:', err)
        setSuggestions([])
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

  // ─── GSAP-animated circle grow (radius tween → Leaflet) ───
  function animateCircleGrow(circle, targetMeters, duration = 0.5) {
    const proxy = { r: 0 }
    const tw = gsap.to(proxy, {
      r: targetMeters, duration, ease: 'power3.out',
      onUpdate: () => { try { circle.setRadius(proxy.r) } catch { /* circle may be detached */ } },
    })
    gsapTweens.current.push(tw)
  }

  // ─── Count subscribers within any location's radius (Haversine) ───
  const totalInRange = locations.length > 0 ? (() => {
    const set = new Set()
    const R = 3959
    locations.forEach(loc => {
      const locRadius = loc.radius ?? 10
      subscribers.forEach(s => {
        if (!s.id || !s.latitude || !s.longitude) return
        const dLat = (s.latitude - loc.lat) * Math.PI / 180
        const dLng = (s.longitude - loc.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.lat * Math.PI / 180) * Math.cos(s.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        if (2 * R * Math.asin(Math.sqrt(a)) <= locRadius) set.add(s.id)
      })
    })
    return set.size
  })() : 0

  const hasPlottable = subscribers.some(s => s.latitude && s.longitude)
  const maxRadius = locations.length ? Math.max(...locations.map(l => l.radius ?? 10)) : 0
  // Derived (not synced) so removing a location can never leave a stale index.
  const safeIdx = locations.length ? Math.min(selectedLocIdx, locations.length - 1) : 0

  // ─── Helper: add subscriber pins to a Leaflet layer ───
  function addSubscriberPins(layer) {
    subscribers.forEach(s => {
      if (!s.latitude || !s.longitude) return
      const colors = { active: '#2b7657', at_risk: '#f5e642', cold: '#e03131' }
      const sizes = { active: 7, at_risk: 5, cold: 3 }
      L.circleMarker([s.latitude, s.longitude], {
        radius: sizes[s.health_score] || 4, color: '#0a0a0a',
        fillColor: colors[s.health_score] || '#a8a49a', fillOpacity: 1, weight: 2,
      }).addTo(layer)
    })
  }

  // ─── Rebuild all circles on the map ───
  function rebuildCircles(map) {
    gsapTweens.current.forEach(t => t.kill())
    gsapTweens.current = []

    circlesRef.current.forEach(c => { try { map.removeLayer(c) } catch { /* already removed */ } })
    circlesRef.current = []

    if (locations.length === 0) return

    const lats = locations.map(l => l.lat)
    const lngs = locations.map(l => l.lng)
    const maxDegOffset = Math.max(...locations.map(l => ((l.radius ?? 10) * 1609.34) / 111320))
    const bounds = L.latLngBounds(
      [Math.min(...lats) - maxDegOffset, Math.min(...lngs) - maxDegOffset],
      [Math.max(...lats) + maxDegOffset, Math.max(...lngs) + maxDegOffset]
    )

    locations.forEach((loc, i) => {
      const locRadius = loc.radius ?? 10
      const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
      const center = [loc.lat, loc.lng]
      const circle = L.circle(center, {
        radius: 0, color, weight: 3, fillOpacity: 0.08, fillColor: color, dashArray: '6, 8',
      }).addTo(map)
      circlesRef.current.push(circle)
      animateCircleGrow(circle, locRadius * 1609.34, 0.5 + i * 0.1)
    })

    map.invalidateSize()
    try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch { /* bounds may be empty */ }
  }

  // ─── Helper: create a draggable marker at a location ───
  function createMarker(map, loc, index, onDragEnd) {
    const color = CIRCLE_COLORS[index % CIRCLE_COLORS.length]
    const marker = L.marker([loc.lat, loc.lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:${color};border:3px solid #0a0a0a;border-radius:50%;cursor:grab;box-shadow:0 0 0 3px rgba(255,255,255,0.6);"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      }),
    }).addTo(map)
    marker.on('dragend', async (e) => {
      const pos = e.target.getLatLng()
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=10`, {
          headers: { Accept: 'application/json' }
        })
        const data = await res.json()
        const pc = data.address?.postcode || ''
        const city = data.address?.city || data.address?.town || data.address?.village || ''
        const state = data.address?.state || ''
        onDragEnd(index, { lat: pos.lat, lng: pos.lng, city, state, zip: pc })
      } catch {
        onDragEnd(index, { lat: pos.lat, lng: pos.lng })
      }
    })
    return marker
  }

  // ─── Rebuild all markers on the map ───
  function rebuildMarkers(map, locs) {
    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch { /* already removed */ } })
    markersRef.current = []

    locs.forEach((loc, i) => {
      const m = createMarker(map, loc, i, (idx, updated) => {
        setLocations(prev => {
          const n = [...prev]
          if (n[idx]) n[idx] = { ...n[idx], ...updated }
          return n
        })
      })
      markersRef.current.push(m)
    })
  }

  // ─── Map init & update ───
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        gsapTweens.current.forEach(t => t.kill())
        gsapTweens.current = []
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current = []
        circlesRef.current = []
        subscriberLayerRef.current = null
      }
      return
    }

    const mapEl = document.getElementById('geo-filter-map')
    if (!mapEl) return

    if (!mapRef.current) {
      setTimeout(() => {
        const el = document.getElementById('geo-filter-map')
        if (!el || mapRef.current) return

        const center = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [39.8283, -98.5795]
        const map = L.map(el, {
          center, zoom: locations.length > 0 ? 10 : 4, zoomControl: true, attributionControl: true, scrollWheelZoom: false,
        })
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map)
        mapRef.current = map
        map.invalidateSize()

        // Click-to-place: reverse geocode the click, then add via the live ref
        map.on('click', async (e) => {
          let loc = { lat: e.latlng.lat, lng: e.latlng.lng, city: '', state: '', zip: '' }
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10`, {
              headers: { Accept: 'application/json' }
            })
            const data = await res.json()
            loc = {
              lat: e.latlng.lat, lng: e.latlng.lng,
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: data.address?.state || '',
              zip: data.address?.postcode || '',
            }
          } catch { /* keep bare coords */ }
          addLocationRef.current(loc)
        })

        rebuildCircles(map)
        rebuildMarkers(map, locations)

        const g = L.layerGroup()
        addSubscriberPins(g)
        g.addTo(map)
        subscriberLayerRef.current = g
      }, 150)
      return
    }

    const map = mapRef.current
    rebuildCircles(map)
    rebuildMarkers(map, locations)

    if (subscriberLayerRef.current) map.removeLayer(subscriberLayerRef.current)
    const g = L.layerGroup()
    addSubscriberPins(g)
    g.addTo(map)
    subscriberLayerRef.current = g
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locations])

  // ─── Location radius change: update a single circle ───
  function updateLocationRadius(index, newRadius) {
    setLocations(prev => {
      const n = [...prev]
      if (n[index]) n[index] = { ...n[index], radius: newRadius }
      return n
    })
    if (mapRef.current && circlesRef.current[index]) {
      const circle = circlesRef.current[index]
      const proxy = { r: 0 }
      const tw = gsap.to(proxy, {
        r: newRadius * 1609.34, duration: 0.35, ease: 'power3.out',
        onUpdate: () => { try { circle.setRadius(proxy.r) } catch { /* circle may be gone */ } },
      })
      gsapTweens.current.push(tw)
    }
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
      {/* Toggle button */}
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
          : 'Radius filter'}
        <span className="ml-auto text-[10px] opacity-60">{open ? '▲' : '▼'}</span>
      </button>

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
                No matches — try a city name or 5-digit ZIP
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
              {hasPlottable && (
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#2b7657'}} /> Active</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#f5e642'}} /> Risk</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#e03131'}} /> Cold</span>
                </span>
              )}
            </div>
            <div id="geo-filter-map" className="h-[300px] sm:h-[360px]" style={{ width: '100%', background: '#e8e8e0', touchAction: 'auto' }} />
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
                  <span className="font-heading text-4xl sm:text-5xl leading-none"><AnimatedStat value={totalInRange} /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">subscribers<br className="hidden sm:inline" /> in range</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 text-right shrink-0">
                  {locations.length} area{locations.length !== 1 ? 's' : ''}<br />up to {maxRadius} mi
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
              {loading ? 'Loading...' : hasPlottable && locations.length > 0 ? `Show ${totalInRange} subscribers` : 'Show subscribers'}
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
