import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { analyticsAPI } from '../../lib/api'
import { fmt, fmtPct } from '../../lib/format'
import { EmptyState, LoadingState } from '../../components/ux'
import ErrorBoundary from '../../components/ErrorBoundary'
import CampaignTimeline from '../../components/CampaignTimeline'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
if (typeof window !== 'undefined') { gsap.registerPlugin(ScrollTrigger) }

/**
 * Period-over-period change. Rendered with an arrow glyph as well as colour so
 * direction survives a greyscale or colour-blind reading.
 */
function Delta({ current, previous, unit = 'count', periodDays }) {
  const hasPrior = previous != null && Number.isFinite(previous)
  if (!hasPrior || (previous === 0 && unit === 'count' && current === 0)) {
    return <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-1.5">No prior period to compare</p>
  }

  // Rates compare in percentage points; counts compare in absolute units.
  const diff = current - previous
  const flat = Math.abs(diff) < (unit === 'points' ? 0.05 : 0.5)
  const up = diff > 0
  const magnitude = unit === 'points' ? `${Math.abs(diff).toFixed(1)} pts` : Math.abs(Math.round(diff)).toLocaleString()
  const tone = flat ? 'text-brutal-muted' : up ? 'text-brutal-green' : 'text-brutal-red'
  const glyph = flat ? '→' : up ? '▲' : '▼'
  const word = flat ? 'no change' : up ? 'up' : 'down'

  return (
    <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${tone}`}>
      <span aria-hidden="true">{glyph} </span>
      {flat ? 'No change' : `${magnitude} ${word}`}
      <span className="text-brutal-muted"> vs prior {periodDays}d</span>
    </p>
  )
}

function AnimatedStatCard({ label, value, delay = 0, current, previous, unit, periodDays, hint }) {
  const ref = useRef(null)
  const [displayed, setDisplayed] = useState(0)
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0
  // Only the tweened branch needs state; the non-animated case renders numVal
  // directly so the effect never has to setState synchronously on mount.
  const shown = typeof value === 'number' && numVal > 0 ? displayed : numVal

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out' })
    if (typeof value !== 'number' || numVal <= 0) return
    const proxy = { val: 0 }
    const tw = gsap.to(proxy, {
      val: numVal, duration: 1.2, delay: delay + 0.2, ease: 'power2.out',
      onUpdate: () => setDisplayed(Math.round(proxy.val)),
    })
    return () => tw.kill()
  }, [numVal, delay, value])

  return (
    <div ref={ref} className="border-3 border-brutal-fg bg-white p-6 border-t-[6px] border-t-brutal-yellow hover:shadow-brutal transition">
      <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">{label}</p>
      <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">
        {typeof value === 'number' ? shown.toLocaleString() : value}
      </p>
      {hint && <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-1">{hint}</p>}
      {current != null && <Delta current={current} previous={previous} unit={unit} periodDays={periodDays} />}
    </div>
  )
}

function AnimatedGrowthChart({ points, height = 40 }) {
  const chartRef = useRef(null)
  const [dragStart, setDragStart] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [selection, setSelection] = useState(null) // { start, end } bar indices, inclusive

  // Past ~5 weeks, one bar per day is an unreadable comb. Roll days up into
  // weeks so the trend stays legible at 90d; keep daily granularity when short.
  const { bars, bucketed } = useMemo(() => {
    if (points.length <= 35) return { bars: points.map(p => ({ ...p, total: p.count ?? 0 })), bucketed: false }
    const weeks = []
    for (let i = 0; i < points.length; i += 7) {
      const slice = points.slice(i, i + 7)
      weeks.push({ date: slice[0].date, total: slice.reduce((s, p) => s + (p.count ?? 0), 0) })
    }
    return { bars: weeks, bucketed: true }
  }, [points])

  const max = Math.max(...bars.map((b) => b.total), 1)
  const total = points.reduce((s, p) => s + (p.count ?? 0), 0)
  const labelEvery = Math.ceil(bars.length / 8) // keep ~8 axis labels max
  const barAvg = bars.length ? total / bars.length : 0
  const avgLinePct = Math.min((barAvg / max) * 100, 100)

  const range = selection ? [Math.min(selection.start, selection.end), Math.max(selection.start, selection.end)] : null
  const rangeBars = range ? bars.slice(range[0], range[1] + 1) : []
  const rangeTotal = rangeBars.reduce((s, b) => s + b.total, 0)
  const rangeAvg = rangeBars.length ? rangeTotal / rangeBars.length : 0

  // A brief drag (or a plain click) collapses to a single-bar selection, which
  // still reads fine as "vs your average" for that one day/week.
  function finishDrag(endIndex) {
    if (dragStart == null) return
    setSelection({ start: dragStart, end: endIndex })
    setDragStart(null)
    setDragging(false)
  }

  // Only listening while an actual drag is in progress, so a mouseup anywhere
  // on the page (not just on a bar) still ends the selection cleanly.
  useEffect(() => {
    if (!dragging) return
    const onUp = () => setDragging(false)
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [dragging])

  useEffect(() => {
    const els = chartRef.current?.querySelectorAll('.growth-bar')
    if (!els?.length) return
    gsap.fromTo(els, { scaleY: 0, transformOrigin: 'bottom' }, {
      scaleY: 1, duration: 0.6, stagger: 0.03, ease: 'power3.out',
      scrollTrigger: { trigger: chartRef.current, start: 'top 90%' },
    })
  }, [bars])

  return (
    <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">Subscriber Growth</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
          +{total.toLocaleString()} total{bucketed ? ' · weekly' : ' · daily'} · peak {max.toLocaleString()}
        </span>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mb-5">
        Drag across bars to compare a range against the period average.
      </p>
      <div
        ref={chartRef}
        className="relative flex items-end gap-1.5 select-none"
        style={{ height: `${height * 4}px` }}
        onMouseLeave={() => { if (dragging) finishDrag(selection?.end ?? dragStart) }}
      >
        {/* Average reference line — every bar reads against this without hovering */}
        <div
          className="absolute left-0 right-0 border-t-2 border-dashed border-brutal-fg/50 z-10 pointer-events-none"
          style={{ bottom: `${avgLinePct}%` }}
          title={`Average: ${barAvg.toFixed(1)}/${bucketed ? 'wk' : 'day'}`}
        />
        {bars.map((b, i) => {
          const inRange = range && i >= range[0] && i <= range[1]
          const vsAvg = b.total - barAvg
          const vsAvgLabel = Math.abs(vsAvg) < 0.5 ? 'even with avg' : `${vsAvg > 0 ? '+' : ''}${vsAvg.toFixed(1)} vs avg`
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-2 min-w-0"
              onMouseDown={() => { setSelection(null); setDragStart(i); setDragging(true) }}
              onMouseEnter={() => { if (dragging) setSelection({ start: dragStart, end: i }) }}
              onMouseUp={() => finishDrag(i)}
            >
              <div
                className={`growth-bar w-full border-2 border-brutal-fg transition cursor-pointer ${
                  inRange ? 'bg-brutal-fg' : 'bg-brutal-yellow hover:bg-brutal-yellow-dark'
                }`}
                style={{ height: `${Math.max((b.total / max) * 100, 2)}%` }}
                title={`${b.total.toLocaleString()} ${bucketed ? 'in week of' : 'on'} ${new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${vsAvgLabel})`}
              />
              <span className="text-[10px] font-bold text-brutal-muted whitespace-nowrap h-3">
                {i % labelEvery === 0 ? new Date(b.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>
          )
        })}
      </div>
      {range && (
        <div className="mt-4 border-2 border-brutal-fg bg-brutal-yellow/20 px-3 py-2 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {new Date(bars[range[0]].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {range[1] > range[0] && ` – ${new Date(bars[range[1]].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
          </span>
          <span className="text-xs font-bold">
            {rangeTotal.toLocaleString()} total
            <span className="text-brutal-muted font-bold"> · {rangeAvg.toFixed(1)}/{bucketed ? 'wk' : 'day'} avg</span>
            <span className={`font-bold ${rangeAvg >= total / bars.length ? 'text-brutal-green' : 'text-brutal-red'}`}>
              {' '}vs {(total / bars.length).toFixed(1)} overall
            </span>
          </span>
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="ml-auto px-2 py-0.5 border-2 border-brutal-fg bg-white text-[9px] font-bold uppercase tracking-wider hover:bg-brutal-red/10 transition"
          >
            Clear ✕
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * A single 0–100% rate track with a marker showing the workspace average, so a
 * campaign reads as "beat/missed your normal" rather than a bare percentage.
 */
function RateBar({ label, rate, average, colorClass }) {
  const pct = Math.min(Math.max(rate ?? 0, 0), 100)
  const avgPct = Math.min(Math.max(average ?? 0, 0), 100)
  const beats = (rate ?? 0) >= (average ?? 0)
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-0.5">
        <span className="text-brutal-muted uppercase tracking-wider">{label}</span>
        <span className={beats ? 'text-brutal-green' : 'text-brutal-muted'}>
          {pct.toFixed(1)}%
          <span className="text-brutal-muted"> · avg {avgPct.toFixed(1)}%</span>
        </span>
      </div>
      <div className="relative h-4 border-2 border-brutal-fg bg-brutal-surface overflow-hidden">
        <div className={`absolute inset-y-0 left-0 ${colorClass} transition-all`} style={{ width: `${pct}%` }} />
        {avgPct > 0 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-brutal-fg"
            style={{ left: `${avgPct}%` }}
            title={`Your average: ${avgPct.toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  )
}

function CampaignPerformance({ campaigns, onFocus, focusedId, avgOpen, avgClick }) {
  const ref = useRef(null)

  useEffect(() => {
    const rows = ref.current?.querySelectorAll('.perf-row')
    if (!rows?.length) return
    gsap.fromTo(rows, { opacity: 0, x: -20 }, {
      opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%' },
    })
  }, [campaigns])

  return (
    <div ref={ref} className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <h3 className="font-heading text-xl uppercase tracking-wide mb-1">Campaign Performance</h3>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-5">
        Bars are 0–100%. The vertical line marks your average.
      </p>
      <div className="space-y-4">
        {campaigns.map((c, i) => {
          const isFocused = c.id === focusedId
          return (
            <button
              key={c.id ?? i}
              type="button"
              onClick={() => onFocus?.(isFocused ? null : c.id)}
              aria-pressed={isFocused}
              className={`perf-row w-full text-left space-y-2 cursor-pointer transition p-2 -m-0.5 border-2 ${
                isFocused ? 'border-brutal-fg bg-brutal-yellow/20' : 'border-transparent hover:bg-brutal-yellow/10'
              }`}
            >
              <div className="flex justify-between text-xs font-bold">
                <span className="truncate">{c.name}</span>
                <span className="text-brutal-muted shrink-0 ml-2">{(c.sent ?? 0).toLocaleString()} sent</span>
              </div>
              <RateBar label="Open" rate={c.open_rate} average={avgOpen} colorClass="bg-brutal-green" />
              <RateBar label="Click" rate={c.click_rate} average={avgClick} colorClass="bg-brutal-yellow" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function fmtHour(h) {
  const period = h < 12 ? 'am' : 'pm'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}${period}`
}

function OpenTimeHeatmap({ heatmap, loading, error, days }) {
  const [selectedHour, setSelectedHour] = useState(null)

  // Clicking an hour re-derives the day-of-week breakdown from the raw
  // day x hour matrix, so "By Day" answers "who opens at 3pm specifically"
  // instead of always showing the all-hours aggregate.
  const dayBreakdown = useMemo(() => {
    if (selectedHour == null || !heatmap?.matrix?.length) return heatmap?.days ?? []
    const counts = heatmap.matrix.map((row) => row.counts[selectedHour] ?? 0)
    const max = Math.max(...counts, 1)
    return counts.map((count, day) => ({ day, count, pct: Math.round((count / max) * 100) }))
  }, [selectedHour, heatmap])
  const selectedHourTotal = useMemo(() => dayBreakdown.reduce((s, d) => s + d.count, 0), [dayBreakdown])

  if (loading) {
    return <div className="border-3 border-brutal-fg bg-white p-6"><p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Loading open times…</p></div>
  }
  if (error) {
    return <div className="border-3 border-brutal-fg bg-white p-6"><p className="text-xs font-bold text-brutal-red uppercase tracking-wider">Couldn't load open times</p></div>
  }
  // Explain the section instead of vanishing when there's nothing to show yet.
  if (!heatmap || !heatmap.totalOpens) {
    return (
      <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
        <h3 className="font-heading text-xl uppercase tracking-wide mb-2">When They Open</h3>
        <p className="text-sm text-brutal-muted leading-relaxed">
          Once your broadcasts collect opens in this window, this shows the hours and days
          your audience is most active — so you know when to hit send.
        </p>
      </div>
    )
  }

  const tzName = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return null }
  })()

  return (
    <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="font-heading text-xl uppercase tracking-wide">When They Open</h3>
        <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted shrink-0">
          {heatmap.totalOpens.toLocaleString()} opens · {days}d
        </span>
      </div>

      {/* Recommendation, phrased as an action */}
      <div className="border-2 border-brutal-green bg-brutal-green/5 px-3 py-2 mb-5">
        <p className="text-xs font-bold">
          <span className="text-brutal-green">Best time to send:</span>{' '}
          {DAY_NAMES[heatmap.bestDay]} around {fmtHour(heatmap.bestHour)}
        </p>
        {tzName && <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mt-0.5">Times shown in {tzName}</p>}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">By Hour</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">Click an hour to filter days</p>
        </div>
        <div className="flex items-end gap-0.5 h-20">
          {heatmap.hours.map((h) => {
            const isSelected = h.hour === selectedHour
            return (
              <button
                key={h.hour}
                type="button"
                onClick={() => setSelectedHour(isSelected ? null : h.hour)}
                aria-pressed={isSelected}
                className="flex-1 flex flex-col items-center justify-end gap-1 h-full cursor-pointer group"
              >
                <div
                  className={`w-full border transition ${
                    isSelected
                      ? 'bg-brutal-fg border-brutal-fg'
                      : h.hour === heatmap.bestHour
                        ? 'bg-brutal-green border-brutal-fg'
                        : 'bg-brutal-green/40 border-brutal-fg group-hover:bg-brutal-green/70'
                  }`}
                  style={{ height: `${Math.max(h.pct, 2)}%` }}
                  title={`${h.count.toLocaleString()} opens at ${fmtHour(h.hour)}`}
                />
                {h.hour % 6 === 0 && <span className="text-[8px] font-bold text-brutal-muted">{fmtHour(h.hour)}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
            By Day{selectedHour != null && <span className="text-brutal-fg"> — at {fmtHour(selectedHour)}</span>}
          </p>
          {selectedHour != null && (
            <button
              type="button"
              onClick={() => setSelectedHour(null)}
              className="px-2 py-0.5 border-2 border-brutal-fg bg-brutal-yellow/20 text-[9px] font-bold uppercase tracking-wider hover:bg-brutal-red/10 transition"
            >
              Clear ✕
            </button>
          )}
        </div>
        {selectedHour != null && selectedHourTotal === 0 ? (
          <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider mb-2">
            No opens recorded at {fmtHour(selectedHour)} in this window.
          </p>
        ) : (
          <div className="flex items-end gap-1 h-14">
            {dayBreakdown.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                <div
                  className={`w-full border border-brutal-fg transition ${d.day === heatmap.bestDay && selectedHour == null ? 'bg-brutal-yellow-dark' : 'bg-brutal-yellow/50 hover:bg-brutal-yellow'}`}
                  style={{ height: `${Math.max(d.pct, 4)}%` }}
                  title={`${d.count.toLocaleString()} opens on ${DAY_NAMES[d.day]}${selectedHour != null ? ` at ${fmtHour(selectedHour)}` : ''}`}
                />
                <span className="text-[8px] font-bold text-brutal-muted">{DAY_SHORT[d.day]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignDetailModal({ campaign, workspaceId, onClose }) {
  const panelRef = useRef(null)
  const restoreFocusTo = useRef(null)

  // Reachable via the now-keyboard-accessible performance rows, so it needs the
  // same Escape-to-close, focus-trap, and focus-restore contract as ConfirmModal.
  useEffect(() => {
    if (!campaign) return

    restoreFocusTo.current = document.activeElement
    panelRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusTo.current?.focus?.()
    }
  }, [campaign?.id])

  if (!campaign) return null
  const openRate = campaign.open_rate ?? 0
  const clickRate = campaign.click_rate ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-brutal-fg/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-detail-title"
        tabIndex={-1}
        className="relative border-3 border-brutal-fg bg-white shadow-brutal p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="campaign-detail-title" className="font-heading text-xl uppercase tracking-wide truncate">{campaign.name}</h3>
          <button onClick={onClose} aria-label="Close campaign details" className="p-1 border-2 border-brutal-fg hover:bg-brutal-red/10 transition font-bold text-lg leading-none">✕</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="border-2 border-brutal-fg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">Sent</p>
              <p className="text-xl font-heading text-brutal-fg">{fmt(campaign.sent)}</p>
            </div>
            <div className="border-2 border-brutal-fg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">Opens</p>
              <p className="text-xl font-heading text-brutal-green">{fmtPct(openRate)}</p>
            </div>
            <div className="border-2 border-brutal-fg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">Clicks</p>
              <p className="text-xl font-heading text-brutal-yellow-dark">{fmtPct(clickRate)}</p>
            </div>
          </div>
          {/* Open rate bar */}
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span>Open Rate</span><span>{openRate.toFixed(1)}%</span>
            </div>
            <div className="h-6 border-2 border-brutal-fg bg-brutal-surface overflow-hidden">
              <div className="h-full bg-brutal-green transition-all" style={{ width: `${Math.min(openRate, 100)}%` }} />
            </div>
          </div>
          {/* Click rate bar */}
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span>Click Rate</span><span>{clickRate.toFixed(1)}%</span>
            </div>
            <div className="h-6 border-2 border-brutal-fg bg-brutal-surface overflow-hidden">
              <div className="h-full bg-brutal-yellow transition-all" style={{ width: `${Math.min(clickRate, 100)}%` }} />
            </div>
          </div>
          <CampaignTimeline campaignId={campaign.id} workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  )
}

function SubscriberGeoSummary({ overview }) {
  if (!overview?.top_campaigns?.length) return null
  const totalSent = overview.top_campaigns.reduce((sum, c) => sum + (c.sent ?? 0), 0)
  const totalOpens = overview.top_campaigns.reduce((sum, c) => sum + ((c.sent ?? 0) * (c.open_rate ?? 0) / 100), 0)

  return (
    <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <h3 className="font-heading text-xl uppercase tracking-wide mb-4">🌍 Audience Reach</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Total Sent</p>
          <p className="text-2xl font-heading text-brutal-fg">{fmt(totalSent)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Est. Opens</p>
          <p className="text-2xl font-heading text-brutal-green">{fmt(Math.round(totalOpens))}</p>
        </div>
      </div>
      <p className="text-[9px] text-brutal-muted font-bold uppercase mt-3">
        {overview.total_subscribers?.toLocaleString() || 0} subscribers · {overview.campaigns_sent ?? 0} campaigns sent
      </p>
    </div>
  )
}

function LivePulse({ workspaceId }) {
  const [events, setEvents] = useState([])
  const [pulseId, setPulseId] = useState(null)
  const ref = useRef(null)

  // Poll every 20 seconds
  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false

    async function fetchLive() {
      try {
        const { data: body } = await analyticsAPI.live(workspaceId)
        const data = body?.data ?? body
        if (!cancelled && data?.events?.length) {
          setEvents(prev => {
            const existing = new Set(prev.map((e) => `${e.email}-${e.timestamp}`))
            const newEvents = data.events.filter((e) => !existing.has(`${e.email}-${e.timestamp}`))
            if (newEvents.length) {
              setPulseId(Date.now())
            }
            // Keep last 10
            return [...newEvents, ...prev].slice(0, 10)
          })
        }
      } catch (err) {
        console.error('Live pulse poll failed:', err)
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, 20000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [workspaceId])

  // GSAP pulse on new events
  useEffect(() => {
    if (!pulseId || !ref.current) return
    gsap.fromTo(ref.current, { scale: 1 }, {
      scale: [1, 1.05, 1], duration: 0.4, ease: 'power2.inOut',
    })
  }, [pulseId])

  if (events.length === 0) return null

  return (
    <div ref={ref} className="border-3 border-brutal-fg bg-white p-5 shadow-brutal">
      <h3 className="font-heading text-lg uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-brutal-green rounded-full animate-pulse" />
        Just Happened
      </h3>
      <div className="space-y-2">
        {events.slice(0, 5).map((e, i) => (
          <div key={`${e.email}-${e.timestamp}`} className="flex items-center gap-3 text-xs animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${e.type === 'open' ? 'bg-brutal-green' : 'bg-brutal-yellow'}`} />
            <span className="font-bold text-brutal-fg truncate">{e.email}</span>
            <span className="text-brutal-muted">{e.type === 'open' ? 'opened' : 'clicked'}</span>
            <span className="text-brutal-muted font-mono text-[10px] truncate">{e.campaign}</span>
            <span className="ml-auto text-[9px] text-brutal-muted font-mono shrink-0">
              {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { workspaceId } = useAuthStore()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(14)
  const [heatmap, setHeatmap] = useState(null)
  const [smsStats, setSmsStats] = useState(null)
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const [heatmapError, setHeatmapError] = useState(null)
  const [showSms, setShowSms] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (!workspaceId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const cacheKey = `analytics-overview-${workspaceId}-${days}`
      const cached = !isRefresh ? sessionStorage.getItem(cacheKey) : null
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 60000) {
          setOverview(parsed.data); setLoading(false); setRefreshing(false)
          return
        }
      }

      const { data: body } = await analyticsAPI.overview(workspaceId, { days })
      // This route wraps its payload as { data: ... } (apiSuccess) while the
      // sibling analytics routes return it flat. Unwrap tolerantly so the page
      // works with either envelope instead of silently rendering zeros.
      const data = body?.data ?? body
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })) } catch { /* quota */ }
      setOverview(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Could not load analytics. Is the API running?')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId, days])

  useEffect(() => {
    if (!workspaceId) return
    document.title = 'Analytics | Veloce'
    // Deferred so the effect body itself never calls setState synchronously —
    // loadOverview sets loading/overview state before its first await.
    queueMicrotask(() => loadOverview())
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => loadOverview(true), 60000)
    return () => clearInterval(interval)
  }, [workspaceId, days, loadOverview])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false

    async function loadHeatmap() {
      setHeatmapLoading(true)
      setHeatmapError(null)
      try {
        const { data: body } = await analyticsAPI.heatmap(workspaceId, {
          days,
          tzOffset: new Date().getTimezoneOffset(),
        })
        if (!cancelled) setHeatmap(body?.data ?? body)
      } catch {
        if (!cancelled) setHeatmapError(true)
      } finally {
        if (!cancelled) setHeatmapLoading(false)
      }
    }

    // SMS is an optional channel — the panel stays hidden unless it's set up
    // and has reach, so there's no separate loading/error surface to track.
    async function loadSms() {
      try {
        const { data: body } = await analyticsAPI.sms(workspaceId)
        if (!cancelled) setSmsStats(body?.data ?? body)
      } catch { /* SMS panel simply stays hidden */ }
    }

    loadHeatmap()
    loadSms()
    return () => { cancelled = true }
  }, [workspaceId, days])

  const prev = overview?.previous
  const [detailCampaign, setDetailCampaign] = useState(null)
  const [focusedCampaignId, setFocusedCampaignId] = useState(null)
  const [sort, setSort] = useState({ key: 'open_rate', dir: 'desc' })

  // Workspace averages act as the reference line campaigns are measured against.
  const avgOpen = overview?.avg_open_rate ?? 0
  const avgClick = overview?.avg_click_rate ?? 0

  // Memoize the derived arrays so their references stay stable across renders —
  // otherwise the sort memo below recomputes every render (and the compiler bails).
  const growth = useMemo(() => overview?.subscriber_growth || [], [overview])
  const allCampaigns = useMemo(() => overview?.top_campaigns || [], [overview])

  // Cross-filter: focusing a campaign scopes the campaign-level views to it.
  const focused = useMemo(() => allCampaigns.find(c => c.id === focusedCampaignId) || null, [allCampaigns, focusedCampaignId])
  const topCampaigns = useMemo(() => (focused ? [focused] : allCampaigns), [focused, allCampaigns])

  const sortedCampaigns = useMemo(() => {
    const rows = [...topCampaigns]
    const { key, dir } = sort
    rows.sort((a, b) => {
      const av = key === 'name' ? String(a.name || '') : (a[key] ?? 0)
      const bv = key === 'name' ? String(b.name || '') : (b[key] ?? 0)
      if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return dir === 'asc' ? av - bv : bv - av
    })
    return rows
  }, [topCampaigns, sort])

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })
  }

  return (
    <div className="space-y-8">
      {/* Header with period selector + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
          <span className="text-brutal-green">Analyt</span>ics
          {!loading && overview && (
            <span className="inline-block ml-3 w-2.5 h-2.5 bg-brutal-green animate-pulse align-middle" title="Auto-refreshing" />
          )}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex border-3 border-brutal-fg overflow-hidden">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${
                  days === d ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => loadOverview(true)}
            disabled={refreshing}
            className="p-2 border-3 border-brutal-fg bg-white hover:bg-brutal-yellow/20 transition disabled:opacity-50"
            title="Refresh data"
          >
            <span className={`text-sm font-bold ${refreshing ? 'animate-spin inline-block' : ''}`}>⟳</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading analytics" />
      ) : error ? (
        <EmptyState
          title="Couldn't load analytics"
          description={error}
          action={{ label: 'Retry', onClick: () => loadOverview(true) }}
        />
      ) : (
        <div className="space-y-8">
          {/* Active cross-filter */}
          {focused && (
            <div className="border-3 border-brutal-fg bg-brutal-yellow px-4 py-2.5 flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider">Focused on</span>
              <span className="text-xs font-bold truncate">{focused.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/70">
                {(focused.open_rate ?? 0).toFixed(1)}% open vs {avgOpen.toFixed(1)}% average
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setDetailCampaign(focused)}
                  className="px-3 py-1.5 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:shadow-brutal transition"
                >
                  View details
                </button>
                <button
                  onClick={() => setFocusedCampaignId(null)}
                  className="px-3 py-1.5 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:bg-brutal-red/10 transition"
                >
                  Clear filter ✕
                </button>
              </div>
            </div>
          )}

          {/* LIVE PULSE - top priority, first thing you see */}
          <ErrorBoundary><LivePulse workspaceId={workspaceId} /></ErrorBoundary>

          {/* STAT CARDS */}
          <div className="grid md:grid-cols-4 gap-5">
            <AnimatedStatCard
              label="Contacts"
              value={overview?.total_subscribers ?? 0}
              hint={`${(overview?.new_subscribers ?? 0).toLocaleString()} new in ${days}d`}
              current={overview?.new_subscribers}
              previous={prev?.new_subscribers}
              unit="count"
              periodDays={days}
              delay={0}
            />
            <AnimatedStatCard
              label={`Broadcasts Sent (${days}d)`}
              value={overview?.campaigns_sent ?? 0}
              current={overview?.campaigns_sent}
              previous={prev?.campaigns_sent}
              unit="count"
              periodDays={days}
              delay={0.1}
            />
            <AnimatedStatCard
              label="Avg Open Rate"
              value={overview?.avg_open_rate != null ? `${overview.avg_open_rate.toFixed(1)}%` : '--'}
              current={overview?.avg_open_rate}
              previous={prev?.avg_open_rate}
              unit="points"
              periodDays={days}
              delay={0.2}
            />
            <AnimatedStatCard
              label="Avg Click Rate"
              value={overview?.avg_click_rate != null ? `${overview.avg_click_rate.toFixed(1)}%` : '--'}
              current={overview?.avg_click_rate}
              previous={prev?.avg_click_rate}
              unit="points"
              periodDays={days}
              delay={0.3}
            />
          </div>

          {/* GROWTH CHART */}
          {growth.length > 0 ? (
            <AnimatedGrowthChart key={days} points={growth} />
          ) : (
            <EmptyState
              title="No growth data yet"
              description="Growth data appears here once you welcome your first contacts."
            />
          )}

          {/* CAMPAIGN PERFORMANCE + HEATMAP side by side on desktop */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Email Open Heatmap */}
            <ErrorBoundary>
              <OpenTimeHeatmap key={days} heatmap={heatmap} loading={heatmapLoading} error={heatmapError} days={days} />
            </ErrorBoundary>

            {/* Campaign Performance */}
            {topCampaigns.length > 0 && (
              <ErrorBoundary>
                <CampaignPerformance
                  campaigns={topCampaigns}
                  onFocus={setFocusedCampaignId}
                  focusedId={focusedCampaignId}
                  avgOpen={avgOpen}
                  avgClick={avgClick}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Audience Reach */}
          {overview && (
            <ErrorBoundary><SubscriberGeoSummary overview={overview} /></ErrorBoundary>
          )}

          {/* SMS - collapsible, most users don't need it */}
          {smsStats && smsStats.reachable > 0 && (
            <div className="border-3 border-brutal-fg bg-white shadow-brutal">
              <button
                onClick={() => setShowSms(!showSms)}
                className="w-full flex items-center justify-between p-4 hover:bg-brutal-yellow/5 transition text-left"
              >
                <h3 className="font-heading text-lg uppercase tracking-wide">📱 SMS / RCS Stats</h3>
                <span className={`text-sm font-bold transition-transform ${showSms ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {showSms && (
                <div className="px-4 pb-4 border-t-2 border-brutal-fg pt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Reachable</p><p className="text-2xl font-heading text-brutal-green">{smsStats.reachable}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Sent</p><p className="text-2xl font-heading">{smsStats.sent ?? '--'}</p></div>
                    <div><p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Response Rate</p><p className="text-2xl font-heading text-brutal-muted">{smsStats.responseRate ?? '--'}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Campaign Detail Modal */}
          {detailCampaign && (
            <ErrorBoundary><CampaignDetailModal campaign={detailCampaign} workspaceId={workspaceId} onClose={() => setDetailCampaign(null)} /></ErrorBoundary>
          )}

          {/* Top Campaigns Table */}
          <div className="border-3 border-brutal-fg overflow-x-auto bg-white shadow-brutal">
            <div className="px-4 py-3 border-b-3 border-brutal-fg bg-brutal-bg">
              <h3 className="font-heading text-lg uppercase tracking-wide">All Broadcasts</h3>
            </div>
            {topCampaigns.length === 0 ? (
              <div className="p-6 text-center text-sm font-bold text-brutal-muted">
                No broadcast data yet. Send your first broadcast to see stats here.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                    {[
                      { key: 'name', label: 'Broadcast', align: 'left' },
                      { key: 'sent', label: 'Sent', align: 'right' },
                      { key: 'open_rate', label: 'Open Rate', align: 'right' },
                      { key: 'click_rate', label: 'Click Rate', align: 'right' },
                    ].map(col => {
                      const active = sort.key === col.key
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          className={`p-0 font-bold text-xs uppercase tracking-wider text-${col.align}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className={`w-full p-3 font-bold text-xs uppercase tracking-wider hover:bg-brutal-yellow/20 transition flex items-center gap-1 ${
                              col.align === 'right' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {col.label}
                            <span aria-hidden="true" className={active ? 'text-brutal-green' : 'text-brutal-fg/25'}>
                              {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </button>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((c, i) => (
                    <tr key={c.id ?? i} className={`border-t border-brutal-fg transition ${c.id === focusedCampaignId ? 'bg-brutal-yellow/20' : 'hover:bg-brutal-yellow/10'}`}>
                      <td className="p-0 font-bold">
                        {/* A button rather than a row click, so the same action is reachable by keyboard */}
                        <button
                          type="button"
                          onClick={() => setDetailCampaign(c)}
                          className="w-full text-left p-3 font-bold hover:underline underline-offset-2"
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className="p-3 text-right font-bold">{fmt(c.sent)}</td>
                      <td className="p-3 text-right font-bold">{fmtPct(c.open_rate)}</td>
                      <td className="p-3 text-right font-bold">{fmtPct(c.click_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
