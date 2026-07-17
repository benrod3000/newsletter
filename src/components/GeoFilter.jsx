import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, Plus, X } from 'lucide-react'
import { resolveZip } from '../lib/geo'
import gsap from 'gsap'
import L from 'leaflet'

const PRESETS = [1, 5, 10, 25, 50, 100]
const CIRCLE_COLORS = ['#2f7f5f', '#f5e642', '#e03131', '#4a9e7a', '#d4c82e']

/**
 * GeoFilter — multi-ZIP radius filter with GSAP-driven animations.
 *
 * Props:
 *   onChange({ locations: [{lat,lng,city,state,zip}], radius }): called when user applies
 *   onClear(): called when user clears the filter
 *   loading?: boolean — shows spinner on apply button
 *   active?: boolean — highlights the toggle when filter is active
 */
export default function GeoFilter({ onChange, onClear, loading = false, active = false, subscribers = [] }) {
  const [open, setOpen] = useState(false)
  const [zip, setZip] = useState('')
  const [pending, setPending] = useState(null) // { lat, lng, city, state, zip }
  const [resolving, setResolving] = useState(false)
  const [locations, setLocations] = useState([]) // [{ lat, lng, city, state, zip }]
  const [radius, setRadius] = useState(10)
  const [applied, setApplied] = useState(false)
  const panelRef = useRef(null)
  const resolveTimer = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circlesRef = useRef([])
  const subscriberLayerRef = useRef(null)
  const chipsRef = useRef([])
  const addBtnRef = useRef(null)
  const pendingPulse = useRef(null)

  // ─── Panel open/close (GSAP) ───
  useEffect(() => {
    if (!panelRef.current) return
    if (open) {
      panelRef.current.style.height = 'auto'
      const h = panelRef.current.offsetHeight
      panelRef.current.style.height = '0px'
      gsap.to(panelRef.current, { height: h, duration: 0.3, ease: 'power3.out' })
    } else {
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
    if (locations.some(l => l.zip === pending.zip)) {
      setZip('')
      setPending(null)
      return
    }
    const newLoc = pending
    setZip('')
    setPending(null)
    setLocations(prev => [...prev, newLoc])
  }

  // ─── Remove a location with GSAP exit ───
  function removeLocation(index) {
    const chipEl = chipsRef.current[index]
    if (chipEl) {
      gsap.to(chipEl, {
        scale: 0.5, opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: () => setLocations(prev => prev.filter((_, i) => i !== index)),
      })
    } else {
      setLocations(prev => prev.filter((_, i) => i !== index))
    }
  }

  // ─── GSAP-animated circle grow (radius tween → Leaflet) ───
  function animateCircleGrow(circle, targetMeters, duration = 0.5) {
    const proxy = { r: 0 }
    gsap.to(proxy, {
      r: targetMeters, duration, ease: 'power3.out',
      onUpdate: () => { try { circle.setRadius(proxy.r) } catch {} },
    })
  }

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
    circlesRef.current.forEach(c => { try { map.removeLayer(c) } catch {} })
    circlesRef.current = []

    if (locations.length === 0) return

    locations.forEach((loc, i) => {
      const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
      const center = [loc.lat, loc.lng]
      const circle = L.circle(center, {
        radius: 0, color, weight: 3, fillOpacity: 0.08, fillColor: color, dashArray: '6, 8',
      }).addTo(map)
      circlesRef.current.push(circle)
      animateCircleGrow(circle, radius * 1609.34, 0.5 + i * 0.1)
    })

    if (circlesRef.current.length > 0) {
      const bounds = circlesRef.current.reduce(
        (b, c) => b.extend(c.getBounds()),
        L.latLngBounds(circlesRef.current[0].getLatLng(), circlesRef.current[0].getLatLng())
      )
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }

  // ─── Map init & update ───
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        circlesRef.current = []
        subscriberLayerRef.current = null
      }
      return
    }

    const mapEl = document.getElementById('geo-filter-map')
    if (!mapEl) return

    if (!mapRef.current) {
      const dc = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [39.8283, -98.5795]
      const map = L.map(mapEl, {
        center: dc, zoom: 11, zoomControl: true, attributionControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map)
      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }

    const map = mapRef.current
    rebuildCircles(map)

    // Draggable marker on the first location
    if (locations.length > 0) {
      const fc = [locations[0].lat, locations[0].lng]
      if (markerRef.current) {
        markerRef.current.setLatLng(fc)
      } else {
        const marker = L.marker(fc, {
          draggable: true,
          icon: L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;background:#f5e642;border:3px solid #0a0a0a;border-radius:50%;cursor:grab;"></div>',
            iconSize: [16, 16], iconAnchor: [8, 8],
          }),
        }).addTo(map)

        marker.on('dragend', async (e) => {
          const pos = e.target.getLatLng()
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=10`)
            const data = await res.json()
            const pc = data.address?.postcode || ''
            const city = data.address?.city || data.address?.town || data.address?.village || ''
            const state = data.address?.state || ''
            if (pc) setZip(pc)
            setLocations(prev => { const n = [...prev]; n[0] = { ...n[0], lat: pos.lat, lng: pos.lng, city, state }; return n })
          } catch {
            setLocations(prev => { const n = [...prev]; n[0] = { ...n[0], lat: pos.lat, lng: pos.lng }; return n })
          }
        })
        markerRef.current = marker
      }
    } else {
      if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null }
    }

    // Subscriber pins
    if (subscriberLayerRef.current) map.removeLayer(subscriberLayerRef.current)
    const g = L.layerGroup()
    addSubscriberPins(g)
    g.addTo(map)
    subscriberLayerRef.current = g
  }, [open, locations])

  // ─── Radius change: update all circles ───
  useEffect(() => {
    if (!mapRef.current || circlesRef.current.length === 0) return
    circlesRef.current.forEach(c => animateCircleGrow(c, radius * 1609.34, 0.35))
    const bounds = circlesRef.current.reduce(
      (b, c) => b.extend(c.getBounds()),
      L.latLngBounds(circlesRef.current[0].getLatLng(), circlesRef.current[0].getLatLng())
    )
    mapRef.current.fitBounds(bounds, { padding: [40, 40] })
  }, [radius])

  // ─── Actions ───
  function applyFilter() {
    if (locations.length === 0) return
    setApplied(true)
    onChange({ locations, radius })
  }

  function clearFilter() {
    setZip(''); setPending(null); setLocations([]); setRadius(10)
    setApplied(false); setOpen(false)
    onClear?.()
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
                placeholder="e.g. 78701"
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
            <div className="flex flex-wrap gap-2">
              {locations.map((loc, i) => {
                const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length]
                return (
                  <div
                    key={`${loc.zip}-${i}`}
                    ref={el => { chipsRef.current[i] = el }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider bg-white"
                  >
                    <span className="inline-block w-2 h-2 rounded-full border border-brutal-fg" style={{ background: color }} />
                    <span>{loc.city}, {loc.state}</span>
                    <span className="text-brutal-muted">· {loc.zip}</span>
                    <button
                      onClick={() => removeLocation(i)}
                      className="ml-0.5 p-0.5 hover:bg-brutal-red/10 rounded transition-colors"
                      aria-label={`Remove ${loc.city}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Live map */}
          {locations.length > 0 && (
            <div className="border-3 border-brutal-fg overflow-hidden">
              <div className="bg-brutal-fg text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>{locations.length} location{locations.length > 1 ? 's' : ''}</span>
                {subscribers.some(s => s.latitude && s.longitude) && (
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#2f7f5f'}} /> Active</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#f5e642'}} /> Risk</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full border border-white/60" style={{background:'#e03131'}} /> Cold</span>
                  </span>
                )}
                <span className="text-white/60">{radius} mi radius</span>
              </div>
              <div id="geo-filter-map" style={{ height: '220px', width: '100%', background: '#e8e8e0' }} />
            </div>
          )}

          {/* Radius slider */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-2">
              Radius: <span className="text-brutal-green font-heading text-base">{radius} mi</span>
            </label>
            <input
              type="range" min={1} max={100} value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-brutal-surface border-2 border-brutal-fg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-brutal-green [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brutal-fg
                [&::-webkit-slider-thumb]:shadow-brutal [&::-webkit-slider-thumb]:cursor-pointer
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-brutal-green
                [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brutal-fg [&::-moz-range-thumb]:cursor-pointer"
              style={{ accentColor: '#2f7f5f' }}
            />
          </div>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(mi => (
              <button
                key={mi}
                onClick={() => setRadius(mi)}
                className={`px-3 py-1 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
                  radius === mi
                    ? 'border-brutal-fg bg-brutal-green text-white'
                    : 'border-brutal-fg/30 text-brutal-muted hover:border-brutal-fg hover:text-brutal-fg'
                }`}
              >
                {mi} mi
              </button>
            ))}
          </div>

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
