import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { deliverabilityAPI } from '../../lib/api'
import { fmtPct } from '../../lib/format'
import { EmptyState, LoadingState } from '../../components/ux'
import ErrorBoundary from '../../components/ErrorBoundary'
import { Shield, AlertTriangle, CheckCircle, XCircle, HelpCircle, Search, RefreshCw } from 'lucide-react'
import type { DeliverabilityOverview, DnsCheckResult, DnsHealthReport, Recommendation, DnsCheckResponse } from '../../lib/types'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
if (typeof window !== 'undefined') { gsap.registerPlugin(ScrollTrigger) }

// ── Helpers ──

function scoreColor(score: number): string {
  if (score >= 80) return 'text-brutal-green'
  if (score >= 50) return 'text-brutal-yellow-dark'
  return 'text-brutal-red'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Healthy'
  if (score >= 50) return 'Needs Attention'
  return 'At Risk'
}

function dnsIcon(status: string) {
  switch (status) {
    case 'pass': return <CheckCircle size={16} className="text-brutal-green" />
    case 'warning': return <AlertTriangle size={16} className="text-brutal-yellow-dark" />
    case 'fail': return <XCircle size={16} className="text-brutal-red" />
    default: return <HelpCircle size={16} className="text-brutal-muted" />
  }
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    pass: 'border-brutal-green text-brutal-green',
    warning: 'border-brutal-yellow-dark text-brutal-yellow-dark',
    fail: 'border-brutal-red text-brutal-red',
    unknown: 'border-brutal-muted text-brutal-muted',
  }
  return `border-2 px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] || map.unknown}`
}

// ── Animated Score Ring ──

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const ringRef = useRef<HTMLDivElement>(null)
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  useEffect(() => {
    const el = ringRef.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' })
    const circle = el.querySelector('.score-ring-fg')
    if (circle) {
      gsap.fromTo(circle, { strokeDashoffset: circumference }, {
        strokeDashoffset: offset,
        duration: 1.2,
        ease: 'power2.out',
      })
    }
  }, [score, circumference, offset])

  return (
    <div ref={ringRef} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-brutal-surface" />
        <circle cx={size / 2} cy={size / 2} r="45" fill="none" strokeWidth="6" strokeLinecap="round"
          className={`score-ring-fg ${scoreColor(score)}`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.2s ease',
            stroke: 'currentColor',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-heading font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">/ 100</span>
      </div>
    </div>
  )
}

// ── DNS Record Row ──

function DnsRow({ result, delay = 0 }: { result: DnsCheckResult; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, delay, ease: 'power2.out' })
  }, [delay])

  return (
    <div ref={ref} className="border-2 border-brutal-fg p-4 bg-white hover:shadow-brutal transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {dnsIcon(result.status)}
          <div className="min-w-0">
            <p className="text-sm font-bold text-brutal-fg truncate">{result.label}</p>
            <p className="text-xs text-brutal-muted mt-0.5 line-clamp-2">{result.message}</p>
          </div>
        </div>
        <span className={`shrink-0 ${statusBadge(result.status)}`}>{result.status}</span>
      </div>
      {result.value && (
        <div className="mt-2 ml-8">
          <code className="text-[11px] bg-brutal-surface px-2 py-1 border border-brutal-fg/20 break-all block">{result.value}</code>
        </div>
      )}
    </div>
  )
}

// ── Recommendation Row ──

function RecRow({ rec, delay = 0 }: { rec: Recommendation; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const priorityColors: Record<number, string> = { 1: 'border-l-brutal-red', 2: 'border-l-brutal-yellow', 3: 'border-l-brutal-green' }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay, ease: 'power2.out' })
  }, [delay])

  return (
    <div ref={ref} className={`border-2 border-l-[6px] border-brutal-fg p-4 bg-white ${priorityColors[rec.priority] || ''}`}>
      <div className="flex items-start gap-2">
        {rec.priority === 1 && <AlertTriangle size={14} className="text-brutal-red shrink-0 mt-0.5" />}
        <div>
          <p className="text-sm font-bold text-brutal-fg">{rec.title}</p>
          <p className="text-xs text-brutal-muted mt-1">{rec.description}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──

export default function DeliverabilityPage() {
  const { workspaceId } = useAuthStore()
  const [data, setData] = useState<DeliverabilityOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Custom domain check state
  const [customDomain, setCustomDomain] = useState('')
  const [dnsResult, setDnsResult] = useState<DnsCheckResponse | null>(null)
  const [checkingDomain, setCheckingDomain] = useState(false)
  const [dnsError, setDnsError] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (!workspaceId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const cacheKey = `deliverability-${workspaceId}`
      const cached = !isRefresh ? sessionStorage.getItem(cacheKey) : null
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 60000) {
          setData(parsed.data)
          setLoading(false)
          return
        }
      }

      const res = await deliverabilityAPI.overview(workspaceId)
      const overview = res.data?.data
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: overview, ts: Date.now() })) } catch { /* storage unavailable */ }
      setData(overview || null)
    } catch (err) {
      console.error('Deliverability load error:', err)
      setError('Could not load deliverability data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    document.title = 'Deliverability | Veloce'
    loadData()
    const interval = setInterval(() => loadData(true), 60000)
    return () => clearInterval(interval)
  }, [workspaceId])

  // ── Custom domain DNS check ──

  const handleCheckDomain = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const domain = customDomain.trim().toLowerCase()
    if (!domain || !workspaceId) return

    setCheckingDomain(true)
    setDnsError(null)
    setDnsResult(null)

    try {
      const res = await deliverabilityAPI.checkDns(workspaceId, domain)
      setDnsResult(res.data?.data || null)
    } catch (err: any) {
      setDnsError(err?.response?.data?.error?.message || 'DNS check failed')
    } finally {
      setCheckingDomain(false)
    }
  }, [customDomain, workspaceId])

  // ── Derived data ──

  const score = data?.score ?? 0
  const dnsHealth = data?.dnsHealth
  const recommendations = data?.recommendations || []

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
            <span className="text-brutal-green">Deliver</span>ability
          </h2>
          <p className="text-xs text-brutal-muted font-bold uppercase tracking-wider mt-1">
            Monitor your email health and inbox placement
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="p-2 border-3 border-brutal-fg bg-white hover:bg-brutal-yellow/20 transition"
          title="Refresh"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Loading / Error / Empty states ── */}
      {loading ? (
        <LoadingState label="Loading deliverability data" />
      ) : error ? (
        <EmptyState
          title="Couldn't load deliverability"
          description={error}
          variant="default"
          action={{ label: 'Retry', onClick: () => loadData(true) }}
        />
      ) : (
        <div className="space-y-8">
          {/* ── Score + Stat cards ── */}
          <div className="grid md:grid-cols-4 gap-5">
            {/* Overall Score */}
            <div className="md:col-span-1 border-3 border-brutal-fg bg-white p-6 flex flex-col items-center justify-center">
              <ScoreRing score={score} size={120} />
              <p className={`mt-3 text-sm font-heading font-bold uppercase tracking-wide ${scoreColor(score)}`}>
                {scoreLabel(score)}
              </p>
            </div>

            {/* DNS Score */}
            <div className="border-3 border-brutal-fg bg-white p-6 border-t-[6px] border-t-brutal-green">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">DNS Health</p>
              <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">{data?.dnsScore ?? '—'}</p>
              <p className="text-[10px] text-brutal-muted mt-1 font-bold">SPF · DKIM · DMARC · MX</p>
            </div>

            {/* Bounce Rate */}
            <div className={`border-3 border-brutal-fg bg-white p-6 border-t-[6px] ${(data?.bounceRate || 0) > 0.02 ? 'border-t-brutal-red' : 'border-t-brutal-green'}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Bounce Rate</p>
              <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">{fmtPct((data?.bounceRate || 0) * 100)}</p>
              <p className="text-[10px] text-brutal-muted mt-1 font-bold">{data?.totalSends?.toLocaleString() || 0} sends (30d)</p>
            </div>

            {/* Complaint Rate */}
            <div className={`border-3 border-brutal-fg bg-white p-6 border-t-[6px] ${(data?.complaintRate || 0) > 0.001 ? 'border-t-brutal-red' : 'border-t-brutal-green'}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Complaint Rate</p>
              <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">{fmtPct((data?.complaintRate || 0) * 100)}</p>
              <p className="text-[10px] text-brutal-muted mt-1 font-bold">Target: &lt;0.1%</p>
            </div>
          </div>

          {/* ── DNS Health Panel ── */}
          {dnsHealth && (
            <div className="border-3 border-brutal-fg bg-white shadow-brutal">
              <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-6 py-3">
                <h3 className="font-heading text-lg uppercase tracking-wide flex items-center gap-2">
                  <Shield size={18} />
                  DNS Configuration — {dnsHealth.domain}
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <DnsRow result={dnsHealth.spf} delay={0} />
                <DnsRow result={dnsHealth.dkim} delay={0.1} />
                <DnsRow result={dnsHealth.dmarc} delay={0.2} />
                <DnsRow result={dnsHealth.mx} delay={0.3} />
              </div>
            </div>
          )}

          {/* ── Recommendations ── */}
          {recommendations.length > 0 && (
            <div className="border-3 border-brutal-fg bg-white shadow-brutal">
              <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-6 py-3">
                <h3 className="font-heading text-lg uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Recommendations
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {recommendations.map((rec, i) => (
                  <RecRow key={i} rec={rec} delay={i * 0.08} />
                ))}
              </div>
            </div>
          )}

          {/* ── Custom Domain Checker ── */}
          <div className="border-3 border-brutal-fg bg-white shadow-brutal">
            <div className="border-b-3 border-brutal-fg bg-brutal-surface px-6 py-3">
              <h3 className="font-heading text-lg uppercase tracking-wide">Check Another Domain</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCheckDomain} className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => { setCustomDomain(e.target.value); setDnsError(null) }}
                    placeholder="e.g., myotherdomain.com"
                    className="w-full border-3 border-brutal-fg px-4 py-2 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-brutal-yellow uppercase placeholder:normal-case"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingDomain || !customDomain.trim()}
                  className="border-3 border-brutal-fg bg-brutal-yellow px-4 py-2 text-sm font-bold hover:bg-brutal-yellow-dark transition disabled:opacity-50 flex items-center gap-2"
                >
                  {checkingDomain ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Check
                </button>
              </form>

              {dnsError && (
                <p className="mt-3 text-sm text-brutal-red font-bold">{dnsError}</p>
              )}

              {dnsResult && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
                    Results for {dnsResult.domain} (via {dnsResult.provider})
                  </p>
                  <DnsRow result={dnsResult.spf} delay={0} />
                  <DnsRow result={dnsResult.dkim} delay={0.05} />
                  <DnsRow result={dnsResult.dmarc} delay={0.1} />
                  <DnsRow result={dnsResult.mx} delay={0.15} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
