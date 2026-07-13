import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { resolveZip } from '../lib/geo'

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
export default function GeoFilter({ onChange, onClear, loading = false, active = false }) {
  const [open, setOpen] = useState(false)
  const [zip, setZip] = useState('')
  const [resolved, setResolved] = useState(null) // { lat, lng, city, state }
  const [resolving, setResolving] = useState(false)
  const [radius, setRadius] = useState(10)
  const [applied, setApplied] = useState(false)
  const panelRef = useRef(null)
  const resolveTimer = useRef(null)

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
        const result = await resolveZip(clean)
        setResolved(result)
      } catch {
        setResolved(null)
      } finally {
        setResolving(false)
      }
    }, 600)
  }, [])

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
        <div className="p-5 space-y-5">
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

          {/* Radar display */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Concentric rings */}
              <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
              <div className="absolute inset-[15%] rounded-full border border-dashed border-brutal-fg/20" />
              <div className="absolute inset-[35%] rounded-full border border-dashed border-brutal-fg/25" />
              <div className="absolute inset-[55%] rounded-full border border-dashed border-brutal-fg/30" />

              {/* Animated radar pulses */}
              <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
              <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
              <div className="absolute inset-0 rounded-full border-3 border-brutal-green/20 animate-radar-3" />

              {/* Center dot */}
              <div className="relative z-10 w-4 h-4 bg-brutal-green rounded-full border-2 border-brutal-fg shadow-brutal" />
            </div>
          </div>

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
