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

function AnimatedStatCard({ label, value, delay = 0 }) {
  const ref = useRef(null)
  const [displayed, setDisplayed] = useState(0)
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay, ease: 'power3.out' })
    if (numVal > 0) {
      gsap.fromTo({ val: 0 }, { val: 0 }, {
        val: numVal, duration: 1.2, delay: delay + 0.2, ease: 'power2.out',
        onUpdate: function () { setDisplayed(Math.round(this.targets()[0].val)) },
      })
    } else {
      setDisplayed(numVal)
    }
  }, [numVal, delay])

  return (
    <div ref={ref} className="border-3 border-brutal-fg bg-white p-6 border-t-[6px] border-t-brutal-yellow hover:shadow-brutal transition">
      <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">{label}</p>
      <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">{typeof value === 'number' ? displayed.toLocaleString() : value}</p>
    </div>
  )
}

function AnimatedGrowthChart({ points, height = 40 }) {
  const chartRef = useRef(null)
  const max = Math.max(...points.map((p) => p.count ?? 0), 1)

  useEffect(() => {
    const bars = chartRef.current?.querySelectorAll('.growth-bar')
    if (!bars?.length) return
    gsap.fromTo(bars, { scaleY: 0, transformOrigin: 'bottom' }, {
      scaleY: 1, duration: 0.6, stagger: 0.03, ease: 'power3.out',
      scrollTrigger: { trigger: chartRef.current, start: 'top 90%' },
    })
  }, [points])

  return (
    <div ref={chartRef} className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <h3 className="font-heading text-xl uppercase tracking-wide mb-6">Subscriber Growth</h3>
      <div className="flex items-end gap-2" style={{ height: `${height * 4}px` }}>
        {points.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div
              className="growth-bar w-full bg-brutal-yellow border-2 border-brutal-fg hover:bg-brutal-yellow-dark transition cursor-pointer"
              style={{ height: `${Math.max((p.count / max) * 100, 2)}%` }}
              title={`${p.count} on ${p.date}`}
            />
            <span className="text-[10px] font-bold text-brutal-muted whitespace-nowrap">
              {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CampaignPerformance({ campaigns, onSelect }) {
  const ref = useRef(null)
  const maxSent = Math.max(...campaigns.map(c => c.sent ?? 0), 1)

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
      <h3 className="font-heading text-xl uppercase tracking-wide mb-6">📊 Campaign Performance</h3>
      <div className="space-y-3">
        {campaigns.map((c, i) => (
          <button
            key={c.id ?? i}
            type="button"
            onClick={() => onSelect?.(c)}
            className="perf-row w-full text-left space-y-1.5 cursor-pointer hover:bg-brutal-yellow/10 transition p-1 -m-1"
          >
            <div className="flex justify-between text-xs font-bold">
              <span className="truncate">{c.name}</span>
              <span className="text-brutal-muted shrink-0 ml-2">{c.sent.toLocaleString()} sent</span>
            </div>
            <div className="flex gap-1 h-5">
              <div className="relative flex-1 border-2 border-brutal-fg bg-brutal-surface overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-brutal-green transition-all" style={{ width: `${Math.min(c.open_rate ?? 0, 100)}%` }} title={`${(c.open_rate ?? 0).toFixed(1)}% opened`} />
              </div>
              <div className="relative flex-1 border-2 border-brutal-fg bg-brutal-surface overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-brutal-yellow transition-all" style={{ width: `${Math.min(c.click_rate ?? 0, 100)}%` }} title={`${(c.click_rate ?? 0).toFixed(1)}% clicked`} />
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-brutal-muted">
              <span>🟢 {(c.open_rate ?? 0).toFixed(1)}% open</span>
              <span>🟡 {(c.click_rate ?? 0).toFixed(1)}% click</span>
            </div>
          </button>
        ))}
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
        const { data } = await analyticsAPI.live(workspaceId)
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
      } catch {}
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
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsError, setSmsError] = useState(null)
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

      const { data } = await analyticsAPI.overview(workspaceId, { days })
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })) } catch {}
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
    const controller = new AbortController()
    loadOverview()
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => loadOverview(true), 60000)
    return () => { controller.abort(); clearInterval(interval) }
  }, [workspaceId, days])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false

    async function loadHeatmap() {
      setHeatmapLoading(true)
      setHeatmapError(null)
      try {
        const { data } = await analyticsAPI.heatmap(workspaceId)
        if (!cancelled) setHeatmap(data)
      } catch {
        if (!cancelled) setHeatmapError(true)
      } finally {
        if (!cancelled) setHeatmapLoading(false)
      }
    }

    async function loadSms() {
      setSmsLoading(true)
      setSmsError(null)
      try {
        const { data } = await analyticsAPI.sms(workspaceId)
        if (!cancelled) setSmsStats(data)
      } catch {
        if (!cancelled) setSmsError(true)
      } finally {
        if (!cancelled) setSmsLoading(false)
      }
    }

    loadHeatmap()
    loadSms()
    return () => { cancelled = true }
  }, [workspaceId])

  const growth = overview?.subscriber_growth || []
  const topCampaigns = overview?.top_campaigns || []
  const [detailCampaign, setDetailCampaign] = useState(null)

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
          {/* LIVE PULSE - top priority, first thing you see */}
          <ErrorBoundary><LivePulse workspaceId={workspaceId} /></ErrorBoundary>

          {/* STAT CARDS */}
          <div className="grid md:grid-cols-4 gap-5">
            <AnimatedStatCard label="Contacts" value={overview?.total_subscribers ?? 0} delay={0} />
            <AnimatedStatCard label="Broadcasts Sent" value={overview?.campaigns_sent ?? 0} delay={0.1} />
            <AnimatedStatCard label="Avg Open Rate" value={overview?.avg_open_rate != null ? `${overview.avg_open_rate.toFixed(1)}%` : '--'} delay={0.2} />
            <AnimatedStatCard label="Avg Click Rate" value={overview?.avg_click_rate != null ? `${overview.avg_click_rate.toFixed(1)}%` : '--'} delay={0.3} />
          </div>

          {/* GROWTH CHART */}
          {growth.length > 0 ? (
            <AnimatedGrowthChart points={growth} />
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
              {heatmapLoading ? (
                <div className="border-3 border-brutal-fg bg-white p-6"><p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Loading heatmap...</p></div>
              ) : heatmapError ? (
                <div className="border-3 border-brutal-fg bg-white p-6"><p className="text-xs font-bold text-brutal-red uppercase tracking-wider">Couldn't load heatmap</p></div>
              ) : heatmap && heatmap.totalOpens > 0 ? (
                <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
                  <h3 className="font-heading text-xl uppercase tracking-wide mb-4">When They Open</h3>
                  <p className="text-xs text-brutal-muted mb-4">
                    Best time: <strong className="text-brutal-green">{heatmap.bestHour}:00</strong> · Best day: <strong className="text-brutal-green">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][heatmap.bestDay]}</strong> · {heatmap.totalOpens.toLocaleString()} opens
                  </p>
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-2">By Hour</p>
                    <div className="flex items-end gap-0.5 h-16">
                      {heatmap.hours.map((h) => (
                        <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full bg-brutal-green border border-brutal-fg hover:bg-brutal-green-light transition" style={{ height: `${Math.max(h.pct, 2)}%`, opacity: h.pct / 100 + 0.15 }} title={`${h.count} opens at ${h.hour}:00`} />
                          <span className="text-[8px] font-bold text-brutal-muted">{h.hour}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-2">By Day</p>
                    <div className="flex items-end gap-1 h-12">
                      {heatmap.days.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full bg-brutal-yellow border border-brutal-fg hover:bg-brutal-yellow-dark transition" style={{ height: `${Math.max(d.pct, 4)}%`, opacity: d.pct / 100 + 0.2 }} title={`${d.count} opens on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.day]}`} />
                          <span className="text-[8px] font-bold text-brutal-muted">{['S','M','T','W','T','F','S'][d.day]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </ErrorBoundary>

            {/* Campaign Performance */}
            {topCampaigns.length > 0 && (
              <ErrorBoundary><CampaignPerformance campaigns={topCampaigns} onSelect={setDetailCampaign} /></ErrorBoundary>
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
                    <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Broadcast</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Sent</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Open Rate</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c, i) => (
                    <tr key={c.id ?? i} className="border-t border-brutal-fg hover:bg-brutal-yellow/10 transition cursor-pointer" onClick={() => setDetailCampaign(c)}>
                      <td className="p-3 font-bold">{c.name}</td>
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
