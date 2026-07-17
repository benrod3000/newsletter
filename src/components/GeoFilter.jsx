import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { resolveZip } from '../lib/geo'
import L from 'leaflet'

const PRESETS = [1, 5, 10, 25, 50, 100]

/**
 * GeoFilter — collapsible radius filter panel with radar visualization.
 *
 * Props:
 *   onChange({ lat, lng, radius, city, state, zip }): called when user applies the filter
 *   onClear(): called when user clears the filter
 *   loading?: boolean — shows spinner on apply button
 *   active?: boolean — highlights the toggle when filter is active
 */
export default function GeoFilter({ onChange, onClear, loading = false, active = false, subscribers = [] }) {
  const [open, setOpen] = useState(false)
  const [zip, setZip] = useState('')
  const [resolved, setResolved] = useState(null) // { lat, lng, city, state }
  const [resolving, setResolving] = useState(false)
  const [radius, setRadius] = useState(10)
  const [applied, setApplied] = useState(false)
  const panelRef = useRef(null)
  const resolveTimer = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)
  const subscriberLayerRef = useRef(null)

  // GSAP open/close animation
  useEffect(() => {
    if (!panelRef.current) return
    if (open) {
      panelRef.current.style.height = 'auto'
      const h = panelRef.current.offsetHeight
      panelRef.current.style.height = '0px'
      requestAnimationFrame(() => {
        panelRef.current.style.transition = 'height 300ms ease-out'
        panelRef.current.style.height = h + 'px'
      })
    } else {
      panelRef.current.style.transition = 'height 250ms ease-in'
      panelRef.current.style.height = '0px'
    }
  }, [open])

  // Debounced ZIP resolution
  const handleZipChange = useCallback((value) => {
    setZip(value)
    setResolved(null)
    if (resolveTimer.current) clearTimeout(resolveTimer.current)

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
            setResolved(parsed.data)
            setResolving(false)
            return
          }
        }

        const result = await resolveZip(clean)
        if (result) {
          localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }))
        }
        setResolved(result)
      } catch {
        setResolved(null)
      } finally {
        setResolving(false)
      }
    }, 600)
  }, [])

  // Helper: add subscriber pins to a Leaflet layer (layer group or map)
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

  // Initialize map when panel opens; update in place when ZIP resolves (no rebuild)
  useEffect(() => {
    if (!open) {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        circleRef.current = null
        subscriberLayerRef.current = null
      }
      return
    }

    // Keep old map visible while resolving new ZIP
    if (!resolved) return

    const mapEl = document.getElementById('geo-filter-map')
    if (!mapEl) return

    const center = [resolved.lat, resolved.lng]

    // Map exists — smooth update (no flicker)
    if (mapRef.current) {
      mapRef.current.setView(center, 11)

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setLatLng(center)
      } else {
        const marker = L.marker(center, {
          draggable: true,
          icon: L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;background:#f5e642;border:3px solid #0a0a0a;border-radius:50%;cursor:grab;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(mapRef.current)

        marker.on('dragend', async (e) => {
          const pos = e.target.getLatLng()
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=10`)
            const data = await res.json()
            const postalCode = data.address?.postcode || ''
            const city = data.address?.city || data.address?.town || data.address?.village || ''
            const state = data.address?.state || ''
            if (postalCode) setZip(postalCode)
            setResolved({ lat: pos.lat, lng: pos.lng, city, state })
          } catch {
            setResolved(prev => prev ? { ...prev, lat: pos.lat, lng: pos.lng } : null)
          }
        })

        markerRef.current = marker
      }

      // Rebuild circle
      if (circleRef.current) mapRef.current.removeLayer(circleRef.current)
      const circle = L.circle(center, {
        radius: radius * 1609.34, color: '#2f7f5f', weight: 3, fillOpacity: 0, dashArray: '6, 8',
      }).addTo(mapRef.current)
      circleRef.current = circle
      mapRef.current.fitBounds(circle.getBounds(), { padding: [30, 30] })

      // Rebuild subscriber pins
      if (subscriberLayerRef.current) mapRef.current.removeLayer(subscriberLayerRef.current)
      const group = L.layerGroup()
      addSubscriberPins(group)
      group.addTo(mapRef.current)
      subscriberLayerRef.current = group

      return
    }

    // First-time init
    const timer = setTimeout(() => {
      const map = L.map(mapEl, {
        center,
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map)

      // Draggable center marker
      const marker = L.marker(center, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#f5e642;border:3px solid #0a0a0a;border-radius:50%;cursor:grab;"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map)

      marker.on('dragend', async (e) => {
        const pos = e.target.getLatLng()
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=10`)
          const data = await res.json()
          const postalCode = data.address?.postcode || ''
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || ''
          if (postalCode) setZip(postalCode)
          setResolved({ lat: pos.lat, lng: pos.lng, city, state })
        } catch {
          setResolved(prev => prev ? { ...prev, lat: pos.lat, lng: pos.lng } : null)
        }
      })

      markerRef.current = marker

      // Radius circle
      const circle = L.circle(center, {
        radius: radius * 1609.34, color: '#2f7f5f', weight: 3, fillOpacity: 0, dashArray: '6, 8',
      }).addTo(map)
      circleRef.current = circle

      // Auto-zoom
      map.fitBounds(circle.getBounds(), { padding: [30, 30] })

      // Subscriber pins
      const group = L.layerGroup()
      addSubscriberPins(group)
      group.addTo(map)
      subscriberLayerRef.current = group

      mapRef.current = map
      setTimeout(() => map.invalidateSize(), 100)
    }, 100)
  }, [open, resolved])

  // Update radius circle + auto-zoom when radius changes (no dependency on resolved)
  useEffect(() => {
    if (!mapRef.current || !resolved || !circleRef.current) return
    const map = mapRef.current

    map.removeLayer(circleRef.current)

    const circle = L.circle([resolved.lat, resolved.lng], {
      radius: radius * 1609.34, color: '#2f7f5f', weight: 3, fillOpacity: 0, dashArray: '6, 8',
    }).addTo(map)
    circleRef.current = circle

    // Auto-zoom so the full circle is visible
    map.fitBounds(circle.getBounds(), { padding: [30, 30] })
  }, [radius])

  function applyFilter() {
    if (!resolved) return
    setApplied(true)
    onChange({
      lat: resolved.lat,
      lng: resolved.lng,
      radius,
      city: resolved.city,
      state: resolved.state,
      zip: zip.trim(),
    })
  }

  function clearFilter() {
    setZip('')
    setResolved(null)
    setRadius(10)
    setApplied(false)
    setOpen(false)
    onClear?.()
  }

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
        {applied && resolved
          ? `📍 ${resolved.city}, ${resolved.state} · ${radius} mi`
          : '📍 Radius filter'}
        <span className="ml-auto text-[10px] opacity-60">{open ? '▲' : '▼'}</span>
      </button>

      {/* Collapsible panel */}
      <div
        ref={panelRef}
        style={{ height: '0px', overflow: 'hidden' }}
        className="border-t-3 border-brutal-fg"
      >
        <div className="p-6 space-y-6">
          {/* ZIP input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
              ZIP Code
            </label>
            <input
              type="text"
              value={zip}
              onChange={e => handleZipChange(e.target.value)}
              placeholder="e.g. 78701"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
            />
            {/* Resolved city/state */}
            {resolving && (
              <p className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
                <Loader2 size={10} className="animate-spin" /> Resolving...
              </p>
            )}
            {resolved && !resolving && (
              <p className="mt-1.5 text-[10px] font-bold text-brutal-green uppercase tracking-wider animate-fade-in">
                ✓ {resolved.city}, {resolved.state}
              </p>
            )}
            {!resolved && !resolving && zip.length >= 5 && (
              <p className="mt-1.5 text-[10px] font-bold text-brutal-red uppercase tracking-wider animate-fade-in">
                ZIP not found
              </p>
            )}
          </div>

          {/* Live map — integrated as visual feedback loop */}
          {resolved && (
            <div className="border-3 border-brutal-fg overflow-hidden">
              <div className="bg-brutal-fg text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>{resolved.city}, {resolved.state}</span>
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
              type="range"
              min={1}
              max={100}
              value={radius}
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
              disabled={!resolved || loading}
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
