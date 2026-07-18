import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, Plus, X } from 'lucide-react'
import { resolveZip } from '../lib/geo'
import gsap from 'gsap'
import L from 'leaflet'

const PRESETS = [1, 5, 10, 25, 50, 100]
const CIRCLE_COLORS = ['#2f7f5f', '#f5e642', '#e03131', '#4a9e7a', '#d4c82e']
const MAX_LOCATIONS = 5
const GEO_FILTER_KEY = 'geo-filter-state'

/**
 * GeoFilter // multi-ZIP radius filter with GSAP-driven animations.
 *
 * Props:
 *   onChange({ locations: [{lat,lng,city,state,zip}], radius }): called when user applies
 *   onClear(): called when user clears the filter
 *   loading?: boolean // shows spinner on apply button
 *   active?: boolean // highlights the toggle when filter is active
 */
export default function GeoFilter({ onChange, onClear, loading = false, active = false, subscribers = [] }) {
  const [open, setOpen] = useState(false)
  const [zip, setZip] = useState('')
  const [pending, setPending] = useState(null) // { lat, lng, city, state, zip }
  const [resolving, setResolving] = useState(false)
  const [locations, setLocations] = useState([]) // each entry: { lat, lng, city, state, zip, radius }
  const [selectedLocIdx, setSelectedLocIdx] = useState(0)
  const [applied, setApplied] = useState(false)
  const panelRef = useRef(null)
  const resolveTimer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const circlesRef = useRef([])
  const subscriberLayerRef = useRef(null)
  const chipsRef = useRef([])
  const addBtnRef = useRef(null)
  const pendingPulse = useRef(null)
  const gsapTweens = useRef([])

  // ─── Rehydrate filter state from localStorage (survives refresh) ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GEO_FILTER_KEY)
      if (saved) {
        const { locations: locs, applied: wasApplied } = JSON.parse(saved)
        if (locs?.length && wasApplied) {
          // Ensure each location has a radius (backward-compat with old single-radius saves)
          setLocations(locs.map((l) => ({ ...l, radius: l.radius ?? 10 })))
          if (locs.length > 0) setSelectedLocIdx(0)
          setApplied(true)
        }
      }
    } catch {}
  }, [])

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
  }, [open])

  // ─── Debounced ZIP resolution ───
  const handleZipChange = useCallback((value) => {
    setZip(value)
    setPending(null)
    if (resolveTimer.current) clearTimeout(resolveTimer.current)

    // Kill pending pulse
    if (pendingPulse.current) { pendingPulse.current.kill(); pendingPulse.current = null }
    if (addBtnRef.current) gsap.set(addBtnRef.current, { clearProps: 'boxShadow' })

    const clean = value.trim()
    if (!/^\d{5}(-\d{4})?$/.test(clean)) return

    resolveTimer.current = setTimeout(async () => {
      setResolving(true)
      try {
        const cacheKey = `geo-zip-${clean}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.ts < 86400000) {
            setPending({ ...parsed.data, zip: clean })
            setResolving(false)
            return
          }
        }

        const result = await resolveZip(clean)
        if (result) {
          localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }))
          setPending({ ...result, zip: clean })
        } else {
          setPending(null)
        }
      } catch {
        setPending(null)
      } finally {
        setResolving(false)
      }
    }, 600)
  }, [])

  // ─── Pulse the Add button when a ZIP is pending ───
  useEffect(() => {
    if (pendingPulse.current) { pendingPulse.current.kill(); pendingPulse.current = null }
    if (addBtnRef.current) gsap.set(addBtnRef.current, { clearProps: 'boxShadow' })

    if (pending && addBtnRef.current) {
      pendingPulse.current = gsap.to(addBtnRef.current, {
        boxShadow: '0 0 0 5px rgba(47,127,95,0.25)',
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      })
    }

    return () => { if (pendingPulse.current) pendingPulse.current.kill() }
  }, [pending])

  // ─── Add a pending location ───
  function addLocation() {
    if (!pending) return
    if (locations.length >= MAX_LOCATIONS) return
    if (locations.some(l => l.zip === pending.zip)) {
      // Flash the existing chip
      const idx = locations.findIndex(l => l.zip === pending.zip)
      if (chipsRef.current[idx]) {
        gsap.fromTo(chipsRef.current[idx], { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 })
      }
      setZip('')
      setPending(null)
      return
    }
    const newLoc = { ...pending, radius: 10 }
    setZip('')
    setPending(null)
    setLocations(prev => [...prev, newLoc])
    setSelectedLocIdx(locations.length)
  }

  // Press Enter to add
  function handleKeyDown(e) {
    if (e.key === 'Enter' && pending) {
      e.preventDefault()
      addLocation()
    }
  }

  // ─── Remove a location with GSAP exit (guard against double-remove) ───
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
      onUpdate: () => { try { circle.setRadius(proxy.r) } catch {} },
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

  // ─── Helper: add subscriber pins to a Leaflet layer ───
  function addSubscriberPins(layer) {
    subscribers.forEach(s => {
      if (!s.latitude || !s.longitude) return
      const colors = { active: '#2f7f5f', at_risk: '#f5e642', cold: '#e03131' }
      const sizes = { active: 7, at_risk: 5, cold: 3 }
      L.circleMarker([s.latitude, s.longitude], {
        radius: sizes[s.health_score] || 4, color: '#0a0a0a',
        fillColor: colors[s.health_score] || '#a8a49a', fillOpacity: 1, weight: 2,
      }).addTo(layer)
    })
  }

  // ─── Rebuild all circles on the map ───
  function rebuildCircles(map) {
    // Kill any running GSAP circle animations first
    gsapTweens.current.forEach(t => t.kill())
    gsapTweens.current = []

    circlesRef.current.forEach(c => { try { map.removeLayer(c) } catch {} })
    circlesRef.current = []

    if (locations.length === 0) return

    // Compute bounds from all locations + their max radius
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
    try { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 }) } catch {}
  }

// ─── Helper: create a draggable marker at a location ───
  function createMarker(map, loc, index, onDragEnd) {
    const color = CIRCLE_COLORS[index % CIRCLE_COLORS.length]
    const marker = L.marker([loc.lat, loc.lng], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:${color};border:3px solid #0a0a0a;border-radius:50%;cursor:grab;"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      }),
    }).addTo(map)
    marker.on('dragend', async (e) => {
      const pos = e.target.getLatLng()
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=10`, {
          headers: { 'User-Agent': 'VeloceNewsletter/1.0' }
        })
        const data = await res.json()
        const pc = data.address?.postcode || ''
        const city = data.address?.city || data.address?.town || data.address?.village || ''
        const state = data.address?.state || ''
        if (pc) setZip(pc)
        onDragEnd(index, { lat: pos.lat, lng: pos.lng, city, state, zip: pc })
      } catch {
        onDragEnd(index, { lat: pos.lat, lng: pos.lng })
      }
    })
    return marker
  }

  // ─── Rebuild all markers on the map ───
  function rebuildMarkers(map, locs) {
    // Remove old markers
    markersRef.current.forEach(m => { try { map.removeLayer(m) } catch {} })
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

        // Click-to-place: reverse geocode click and add as pending
        map.on('click', async (e) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10`, {
              headers: { 'User-Agent': 'VeloceNewsletter/1.0' }
            })
            const data = await res.json()
            const pc = data.address?.postcode || ''
            const city = data.address?.city || data.address?.town || data.address?.village || ''
            const state = data.address?.state || ''
            const loc = { lat: e.latlng.lat, lng: e.latlng.lng, city, state, zip: pc }
            if (locations.length < MAX_LOCATIONS) {
              setLocations(prev => [...prev, loc])
            } else {
              setPending(loc)
            }
          } catch {
            const loc = { lat: e.latlng.lat, lng: e.latlng.lng, city: '', state: '', zip: '' }
            if (locations.length < MAX_LOCATIONS) {
              setLocations(prev => [...prev, loc])
            } else {
              setPending(loc)
            }
          }
        })

        // Draw circles, markers, pins
        rebuildCircles(map)
        rebuildMarkers(map, locations)

        const g = L.layerGroup()
        addSubscriberPins(g)
        g.addTo(map)
        subscriberLayerRef.current = g
      }, 150)
      return
    }

    // Map exists — update circles, markers, pins
    const map = mapRef.current
    rebuildCircles(map)
    rebuildMarkers(map, locations)

    if (subscriberLayerRef.current) map.removeLayer(subscriberLayerRef.current)
    const g = L.layerGroup()
    addSubscriberPins(g)
    g.addTo(map)
    subscriberLayerRef.current = g
  }, [open, locations])

  // ─── Location radius change: update a single circle ───
  function updateLocationRadius(index, newRadius) {
    setLocations(prev => {
      const n = [...prev]
      if (n[index]) n[index] = { ...n[index], radius: newRadius }
      return n
    })
    // Animate the specific circle
    if (mapRef.current && circlesRef.current[index]) {
      const circle = circlesRef.current[index]
      const proxy = { r: 0 }
      const tw = gsap.to(proxy, {
        r: newRadius * 1609.34, duration: 0.35, ease: 'power3.out',
        onUpdate: () => { try { circle.setRadius(proxy.r) } catch {} },
      })
      gsapTweens.current.push(tw)
    }
  }

  // ─── Actions ───
  function applyFilter() {
    if (locations.length === 0) return
    setApplied(true)
    onChange({ locations })
    try { localStorage.setItem(GEO_FILTER_KEY, JSON.stringify({ locations, applied: true })) } catch {}
  }

  function clearFilter() {
    setZip(''); setPending(null); setLocations([])
    setApplied(false); setOpen(false)
    onClear?.()
    try { localStorage.removeItem(GEO_FILTER_KEY) } catch {}
  }

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
          ? `📍 ${locations[0].city}, ${locations[0].state}${locations.length > 1 ? ` +${locations.length - 1} more` : ''} · ${radius} mi`
          : '📍 Radius filter'}
        <span className="ml-auto text-[10px] opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      <div ref={panelRef} style={{ height: '0px', overflow: 'hidden' }} className="border-t-3 border-brutal-fg">
        <div className="p-6 space-y-6">
          {/* ZIP input + Add button */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
              Add ZIP Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={zip}
                onChange={e => handleZipChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={locations.length >= MAX_LOCATIONS}
                placeholder={locations.length >= MAX_LOCATIONS ? `Max ${MAX_LOCATIONS} locations` : "e.g. 78701"}
                maxLength={10}
                className="flex-1 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
              />
              <button
                ref={addBtnRef}
                onClick={addLocation}
                disabled={!pending}
                className="px-3 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition active:translate-y-0.5"
                aria-label="Add location"
              >
                <Plus size={16} />
              </button>
            </div>
            {resolving && (
              <p className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
                <Loader2 size={10} className="animate-spin" /> Resolving...
              </p>
            )}
            {pending && !resolving && (
              <p className="mt-1.5 text-[10px] font-bold text-brutal-green uppercase tracking-wider animate-fade-in">
                ✓ {pending.city}, {pending.state} · Add
              </p>
            )}
            {!pending && !resolving && zip.length >= 5 && (
              <p className="mt-1.5 text-[10px] font-bold text-brutal-red uppercase tracking-wider animate-fade-in">
                ZIP not found
              </p>
            )}
          </div>

          {/* Location chips */}
          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {locations.map((loc, i) => {
                const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
                const isSelected = i === selectedLocIdx
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
                    <span>{loc.city || 'Pin'}, {loc.state || '—'}</span>
                    <span className="text-brutal-muted">· {loc.zip || 'no ZIP'}</span>
                    <span className="text-brutal-green">· {locRadius}mi</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLocation(i) }}
                      className="ml-0.5 p-0.5 hover:bg-brutal-red/10 rounded transition-colors"
                      aria-label={`Remove ${loc.city}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
              {locations.length > 1 && (
                <button onClick={() => { setLocations([]); setZip('') }}
                  className="px-2 py-1.5 border-2 border-brutal-fg text-[9px] font-bold uppercase tracking-wider text-brutal-red hover:bg-brutal-red/10 transition">
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Live map — always visible when panel is open */}
          <div className="border-3 border-brutal-fg overflow-hidden">
            <div className="bg-brutal-fg text-white px-3 py-1.5 flex flex-wrap items-center justify-between text-[10px] font-bold uppercase tracking-wider gap-x-3 gap-y-1">
              <span>{locations.length} location{locations.length !== 1 ? 's' : ''}{locations.length === 0 ? ' — click the map to add' : ''}</span>
              {subscribers.some(s => s.latitude && s.longitude) && (
                  <span className="hidden sm:flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#2f7f5f'}} /> Active</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#f5e642'}} /> Risk</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#e03131'}} /> Cold</span>
                  </span>
                )}
                <span className="text-white/60 whitespace-nowrap">☌ {totalInRange} in range</span>
              </div>
              <div id="geo-filter-map" className="h-[220px] sm:h-[260px]" style={{ width: '100%', background: '#e8e8e0', touchAction: 'auto' }} />
            </div>

          {/* Per-location radius slider */}
          {locations.length > 0 && locations[selectedLocIdx] && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-2">
                Radius {locations.length > 1 ? `(${locations[selectedLocIdx].city || '#'}${selectedLocIdx + 1})` : ''}: <span className="text-brutal-green font-heading text-base">{locations[selectedLocIdx].radius ?? 10} mi</span>
              </label>
              <input
                type="range" min={1} max={100}
                value={locations[selectedLocIdx].radius ?? 10}
                onChange={e => updateLocationRadius(selectedLocIdx, Number(e.target.value))}
                className="w-full h-2 bg-brutal-surface border-2 border-brutal-fg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:bg-brutal-green [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brutal-fg
                  [&::-webkit-slider-thumb]:shadow-brutal [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-brutal-green
                  [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brutal-fg [&::-moz-range-thumb]:cursor-pointer"
                style={{ accentColor: '#2f7f5f' }}
              />
            </div>
          )}

          {/* Preset chips */}
          {locations.length > 0 && locations[selectedLocIdx] && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted self-center">Quick:</span>
              {PRESETS.map(mi => (
                <button
                  key={mi}
                  onClick={() => updateLocationRadius(selectedLocIdx, mi)}
                  className={`px-3 py-1 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
                    (locations[selectedLocIdx].radius ?? 10) === mi
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
              {loading ? 'Loading...' : 'Show subscribers'}
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
