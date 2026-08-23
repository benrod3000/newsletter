import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReveal } from '../../hooks/use-gsap'
import { analyticsAPI, auditAPI, campaignsAPI, brandingAPI } from '../../lib/api'
import { fmt, fmtPct } from '../../lib/format'
import { LoadingState } from '../../components/ux'
import MetricCard from '../../components/ui/MetricCard'
import Panel from '../../components/ui/Panel'
import { Mail, Upload, Zap, Globe } from 'lucide-react'
import Card from '../../components/ui/Card'
import { relativeTime } from '../../lib/time'
import { describeAudit, SENSITIVE_ACTIONS } from '../../lib/audit'

/**
 * MetricCard's change/trend props, or nothing at all.
 *
 * Returns `{}` when there is no comparison to make, because MetricCard renders
 * an arrow for any truthy `change` - so a fabricated or zero delta becomes a
 * green "↑" that asserts growth nobody measured. No previous period, no arrow.
 */
function deltaProps(current, previous, format) {
  if (typeof current !== 'number') return {}

  // No baseline: report the raw figure if the caller wants it shown, with no
  // direction implied.
  if (typeof previous !== 'number') {
    return current > 0 && format ? { change: format(current), trendUp: true } : {}
  }

  const diff = current - previous
  if (diff === 0) return {}
  const shown = format ? format(Math.abs(diff)) : fmt(Math.abs(diff))
  return { change: shown, trendUp: diff > 0 }
}

/**
 * Daily signups as a filled line. Inline SVG rather than a chart library: this
 * is one series of fourteen points on a page that should not pull a dependency
 * to draw it.
 */
function Sparkline({ points }) {
  const W = 600
  const H = 90
  const max = Math.max(...points.map((p) => p.count), 1)
  const step = points.length > 1 ? W / (points.length - 1) : W
  const coords = points.map((p, i) => [i * step, H - (p.count / max) * (H - 8) - 4])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const total = points.reduce((sum, p) => sum + p.count, 0)
  const peak = points.reduce((best, p) => (p.count > best.count ? p : best), points[0])

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-24"
        role="img"
        aria-label={`${total} signups over ${points.length} days, peaking at ${peak.count} on ${peak.date}`}
      >
        <path d={area} fill="#2b7657" opacity="0.12" />
        <path d={line} fill="none" stroke="#2b7657" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
        <span>{points[0]?.date}</span>
        <span className="text-brutal-fg">{fmt(total)} total · peak {fmt(peak.count)}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const { email, workspaceId, role, workspaceName } = useAuthStore()
  const ref = useRef(null)
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [error, setError] = useState(null)
  const [securityLog, setSecurityLog] = useState([])
  const [securityLoading, setSecurityLoading] = useState(true)
  // Sources for the attention panel. Both load independently of the metrics and
  // of each other: a homepage that cannot tell you something is wrong because
  // one of four requests failed is the problem, not a smaller version of it.
  const [campaignRows, setCampaignRows] = useState(null)
  const [provider, setProvider] = useState(null)
  /*
   * "Now", from state rather than Date.now() during render - the purity rule
   * rejects the latter, and the attention checks are all relative to it
   * ("overdue by fifteen minutes", "stuck for an hour"). Ticking means a
   * dashboard left open on a second monitor notices a send going overdue
   * instead of holding the moment it was loaded.
   */
  const [nowTs, setNowTs] = useState(null)

  useReveal(ref, { stagger: 0.1, y: 20 })

  // Deferred, following Analytics.jsx, so the effect body never calls setState
  // synchronously. One minute is plenty for thresholds measured in fifteen.
  useEffect(() => {
    queueMicrotask(() => setNowTs(Date.now()))
    const id = setInterval(() => setNowTs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!workspaceId) return
    document.title = 'Your audience · Veloce'
    let cancelled = false

    async function loadOverview() {
      setLoading(true)
      setError(null)
      try {
        const { data: body } = await analyticsAPI.overview(workspaceId)
        // The route replies through apiSuccess(), so the payload arrives wrapped
        // as { data: {...} }. Reading `body.total_subscribers` off the envelope
        // yielded undefined for every metric, and fmt(undefined) renders '--' -
        // so a workspace with 10,310 subscribers showed four empty cards and
        // looked like the stats had stopped updating. Unwrapped tolerantly, the
        // same way Analytics.jsx does, so this keeps working if the route is
        // ever changed to return the payload flat.
        if (!cancelled) setStats(body?.data ?? body)
      } catch (err) {
        console.error('Failed to load overview:', err)
        if (!cancelled) setError('Could not load workspace metrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function loadActivity() {
      setActivityLoading(true)
      try {
        const { data: body } = await analyticsAPI.activity(workspaceId)
        // Same envelope as the overview above: apiSuccess({ activity }).
        const payload = body?.data ?? body
        if (!cancelled) setActivities(payload?.activity || [])
      } catch (err) {
        // Non-fatal: the panel falls back to its empty state. Logged rather
        // than swallowed so a broken endpoint is still diagnosable.
        console.error('Failed to load activity:', err)
      }
      finally { if (!cancelled) setActivityLoading(false) }
    }

    async function loadSecurityLog() {
      // Owner-gated endpoint; anyone else gets a 403 and an empty panel that is
      // never rendered anyway. Skipping the request avoids a guaranteed 403 in
      // the console on every dashboard load for editors and viewers.
      if (role !== 'owner') { setSecurityLoading(false); return }
      setSecurityLoading(true)
      try {
        const { data } = await auditAPI.list(workspaceId, 5)
        if (!cancelled) setSecurityLog(data?.data?.logs || [])
      } catch (err) {
        console.error('Failed to load security activity:', err)
      }
      finally { if (!cancelled) setSecurityLoading(false) }
    }

    async function loadCampaignStates() {
      try {
        const { data } = await campaignsAPI.list(workspaceId)
        const rows = data?.campaigns || data?.data?.campaigns || []
        if (!cancelled) setCampaignRows(rows)
      } catch (err) {
        // Left null rather than []: an empty array would read as "no campaigns
        // need attention", which is a different claim from "we could not check".
        console.error('Failed to load campaign states:', err)
      }
    }

    async function loadProviderStatus() {
      try {
        const { data } = await brandingAPI.providerStatus(workspaceId)
        if (!cancelled) setProvider(data?.data ?? data ?? null)
      } catch (err) {
        console.error('Failed to load provider status:', err)
      }
    }

    loadOverview()
    loadActivity()
    loadSecurityLog()
    loadCampaignStates()
    loadProviderStatus()
    return () => { cancelled = true }
  }, [workspaceId, role])

  /**
   * Things that are wrong, or about to be, in severity order.
   *
   * The page had no version of this. Everything on it described the past -
   * four totals and a feed - so the only way to discover that broadcasts could
   * not send, or that a campaign had been sitting scheduled for a day, was to
   * go and look at the page that owns it. Over one week of building, the honest
   * top line would have been "your scheduled send cannot run" three times, and
   * the homepage said "Avg Open Rate --".
   *
   * Every entry is a real condition read from real data, not a suggestion. If
   * the data that would prove a condition failed to load, no entry is produced:
   * the alternative is a panel that reports all-clear because a request 500'd,
   * which is worse than no panel.
   */
  function attentionItems() {
    const items = []

    if (provider && provider.configured === false) {
      items.push({
        key: 'provider-missing',
        level: 'error',
        title: 'Broadcasts cannot send',
        detail: provider.missing_fields?.length
          ? `Your email provider is not configured: ${provider.missing_fields.join(', ')} missing.`
          : 'Your email provider is not configured.',
        to: '/dashboard/settings',
        action: 'Set it up',
      })
    } else if (provider && provider.key_valid === false) {
      items.push({
        key: 'provider-invalid',
        level: 'error',
        title: 'Your provider rejected its API key',
        detail: provider.details || 'Sending will fail until the key is replaced.',
        to: '/dashboard/settings',
        action: 'Fix the key',
      })
    } else if (provider?.platform_key) {
      // Not an error - it sends. But it sends on shared reputation, and the
      // operator should know that is what is happening rather than discover it
      // from a deliverability problem they did not cause.
      items.push({
        key: 'platform-key',
        level: 'info',
        title: 'Sending on the shared account',
        detail: 'Your broadcasts use the platform provider key, so deliverability is shared with other workspaces. Add your own key to build your own sender reputation.',
        to: '/dashboard/settings',
        action: 'Add your key',
      })
    }

    if (campaignRows && nowTs !== null) {
      const now = nowTs

      // Scheduled and past due. The processor runs every five minutes, so
      // anything more than fifteen minutes late is not "about to go" - it is
      // stuck, and this is the only place that would say so.
      const overdue = campaignRows.filter(
        (c) => c.status === 'scheduled' && c.scheduled_for && new Date(c.scheduled_for).getTime() < now - 15 * 60 * 1000
      )
      if (overdue.length) {
        items.push({
          key: 'overdue',
          level: 'error',
          title: `${overdue.length} scheduled broadcast${overdue.length === 1 ? ' is' : 's are'} overdue`,
          detail: `"${overdue[0].subject || overdue[0].title}" was due ${relativeTime(overdue[0].scheduled_for)} and has not gone out.`,
          to: '/dashboard/campaigns',
          action: 'Check it',
        })
      }

      // Mid-flight for longer than a send should take. Recovery finishes these,
      // so one sitting here means recovery is not finishing them.
      const stalled = campaignRows.filter(
        (c) => c.status === 'sending' && c.last_sent_at && new Date(c.last_sent_at).getTime() < now - 60 * 60 * 1000
      )
      if (stalled.length) {
        items.push({
          key: 'stalled',
          level: 'error',
          title: `${stalled.length} broadcast${stalled.length === 1 ? ' is' : 's are'} stuck mid-send`,
          detail: `"${stalled[0].subject || stalled[0].title}" started ${relativeTime(stalled[0].last_sent_at)} and has not finished. Some recipients may not have received it.`,
          to: '/dashboard/campaigns',
          action: 'Review',
        })
      }

      const failed = campaignRows.filter((c) => c.last_error)
      if (failed.length) {
        items.push({
          key: 'failed',
          level: 'error',
          title: `${failed.length} broadcast${failed.length === 1 ? '' : 's'} reported an error`,
          detail: failed[0].last_error,
          to: '/dashboard/campaigns',
          action: 'See why',
        })
      }

      const upcoming = campaignRows.filter(
        (c) => c.status === 'scheduled' && c.scheduled_for && new Date(c.scheduled_for).getTime() >= now - 15 * 60 * 1000
      )
      if (upcoming.length) {
        items.push({
          key: 'upcoming',
          level: 'info',
          title: `${upcoming.length} broadcast${upcoming.length === 1 ? '' : 's'} scheduled`,
          detail: `Next: "${upcoming[0].subject || upcoming[0].title}" ${relativeTime(upcoming[0].scheduled_for)}.`,
          to: '/dashboard/campaigns',
          action: 'View',
        })
      }
    }

    return items
  }

  const attention = attentionItems()
  const periodDays = stats?.period?.days ?? 14
  const growth = stats?.subscriber_growth ?? []
  /*
   * top_campaigns is sorted by open rate, so [0] is the best performer rather
   * than the most recent. "How did the one I just sent do" is the question this
   * page is being opened to answer, so sort by time here.
   */
  const lastBroadcast = (stats?.top_campaigns ?? [])
    .slice()
    .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))[0] ?? null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div ref={ref} className="space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <p className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none">
          {greeting()}, <span className="text-brutal-green">{email?.split('@')[0] || 'there'}</span>.
        </p>
        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
          {/* Signup asks for a workspace name, so the first screen after it
              should show that the answer was kept. Sessions predating this, and
              OAuth sign-ins, have no name stored and fall back. */}
          {workspaceName
            ? `Here's what's happening in ${workspaceName}.`
            : "Here's what's happening in your workspace."}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="border-3 border-brutal-fg bg-brutal-yellow p-4">
          <p className="text-xs font-bold uppercase tracking-wide">⚠ {error}</p>
        </div>
      )}

      {/* Needs attention // above the metrics, because a broken send matters
          more than last fortnight's open rate */}
      {attention.length > 0 && (
        <div className="space-y-2">
          {attention.map((item) => (
            <div
              key={item.key}
              className={`border-3 border-brutal-fg p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                item.level === 'error' ? 'bg-brutal-red/10' : 'bg-brutal-bg'
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 border-2 border-brutal-fg flex items-center justify-center text-xs font-heading ${
                  item.level === 'error' ? 'bg-brutal-red text-white' : 'bg-brutal-yellow'
                }`}
                aria-hidden="true"
              >
                {item.level === 'error' ? '!' : 'i'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-brutal-muted mt-0.5 break-words">{item.detail}</p>
              </div>
              <Link
                to={item.to}
                className="shrink-0 px-3 py-1.5 border-3 border-brutal-fg bg-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal transition text-center"
              >
                {item.action}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      {loading ? (
        <LoadingState label="Loading metrics" />
      ) : (
        /*
          The `change` on Audience read `+${total_subscribers}` - it reported
          the entire audience as this period's growth, so 10,310 contacts
          rendered as "↑ +10,310". Deltas now come from `previous`, which the
          endpoint has always returned and this page has never read.
        */
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/subscribers" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition">
            <MetricCard
              label="Audience"
              value={fmt(stats?.total_subscribers)}
              accentColor="border-t-brutal-green"
              {...deltaProps(stats?.new_subscribers, null, (n) => `+${fmt(n)} in ${periodDays}d`)}
            />
          </Link>
          <Link to="/dashboard/subscribers" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition">
            <MetricCard
              label={`New in ${periodDays} days`}
              value={fmt(stats?.new_subscribers)}
              accentColor="border-t-brutal-yellow"
              {...deltaProps(stats?.new_subscribers, stats?.previous?.new_subscribers)}
            />
          </Link>
          {/*
            Capture-form signups, which is where every piece of engagement in
            this workspace has actually come from. It was already in the
            payload and shown only on Analytics, so the homepage reported two
            campaign rates of zero and omitted the thing that was working.
          */}
          <Link to="/dashboard/widgets" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition">
            <MetricCard
              label="Form signups"
              value={fmt(stats?.lead_magnet?.submissions)}
              accentColor="border-t-brutal-green"
              {...deltaProps(stats?.lead_magnet?.submissions, stats?.previous?.lead_magnet?.submissions)}
            />
          </Link>
          {/*
            One engagement figure, not two, and only once something has been
            sent. An open rate computed from zero campaigns is not 0% - it is
            unknown, and printing 0.0% next to "Avg Open Rate" states a result
            that was never measured.
          */}
          <Link to="/dashboard/analytics" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition">
            <MetricCard
              label={stats?.campaigns_sent ? `Open rate · ${stats.campaigns_sent} sent` : 'Open rate'}
              value={stats?.campaigns_sent ? fmtPct(stats?.avg_open_rate) : '--'}
              accentColor="border-t-brutal-fg"
              {...(stats?.campaigns_sent ? deltaProps(stats?.avg_open_rate, stats?.previous?.avg_open_rate, (n) => `${n.toFixed(1)} pts`) : {})}
            />
          </Link>
        </div>
      )}

      {/* Growth // 14 days of daily counts, fetched all along and never drawn */}
      {!loading && growth.length > 1 && growth.some((d) => d.count > 0) && (
        <Panel title={`Signups · last ${periodDays} days`}>
          <Sparkline points={growth} />
        </Panel>
      )}

      {/* Next Best Action // shown when user has activity but hasn't sent recently */}
      {stats && stats.total_subscribers > 0 && stats.campaigns_sent === 0 && (
        <Card padding="p-6" className="flex items-start gap-4 shadow-brutal">
          <div className="w-10 h-10 border-3 border-brutal-fg bg-brutal-yellow flex items-center justify-center shrink-0">
            <span className="text-lg font-heading">→</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">You have contacts but no broadcasts yet</p>
            <p className="text-xs text-brutal-muted mt-1">Your people are waiting. Create your first broadcast to start engaging your audience.</p>
            {/* Router navigation, not window.location - a full reload here
                re-downloads the app in the middle of onboarding. */}
            <Link to="/dashboard/campaigns" className="inline-block mt-3 px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
              Write Your First Broadcast →
            </Link>
          </div>
        </Card>
      )}

      {/* Next Best Action // no subscribers yet */}
      {stats && stats.total_subscribers === 0 && (
        <Card padding="p-6" className="flex items-start gap-4 shadow-brutal">
          <div className="w-10 h-10 border-3 border-brutal-fg bg-brutal-green flex items-center justify-center shrink-0">
            <span className="text-lg font-heading text-white">1</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Start building your audience</p>
            <p className="text-xs text-brutal-muted mt-1">Set up a signup widget and start collecting subscribers. Embed it on your website in under a minute.</p>
            <Link to="/dashboard/widgets" className="inline-block mt-3 px-4 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
              Create a Widget →
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
            <span>← 1. Widget</span>
            <span className="opacity-30">2. Subscribers</span>
            <span className="opacity-30">3. Campaign</span>
          </div>
        </Card>
      )}

      {/* Onboarding Checklist // show when workspace is empty */}
      {stats && stats.total_subscribers === 0 && stats.campaigns_sent === 0 && (
        <Card padding="p-6" className="shadow-brutal">
          <h3 className="font-heading text-xl uppercase tracking-wide mb-4">🚀 Get Started in 3 Steps</h3>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Create a widget', desc: 'Embed a signup form on your website to start collecting subscribers.', to: '/dashboard/widgets' },
              { step: 2, label: 'Import or add subscribers', desc: 'Upload a CSV or manually add your first subscribers.', to: '/dashboard/subscribers' },
              { step: 3, label: 'Send your first newsletter', desc: 'Write and send your first email to your audience.', to: '/dashboard/campaigns' },
            ].map((item) => (
              <Link key={item.step} to={item.to} className="flex items-center gap-4 p-4 border-3 border-brutal-fg/20 hover:border-brutal-fg hover:shadow-brutal transition">
                <span className="w-8 h-8 border-3 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-heading text-lg shrink-0">{item.step}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-[10px] text-brutal-muted mt-0.5">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions + Workspace Info */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Panel title="Start something">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard/campaigns" className="border-3 border-brutal-fg bg-brutal-bg p-4 hover:shadow-brutal hover:bg-white active:translate-y-0.5 transition flex items-center gap-3">
              <Mail size={18} className="text-brutal-green shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Write Newsletter</span>
            </Link>
            <Link to="/dashboard/subscribers" className="border-3 border-brutal-fg bg-brutal-bg p-4 hover:shadow-brutal hover:bg-white active:translate-y-0.5 transition flex items-center gap-3">
              <Upload size={18} className="text-brutal-green shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Import Audience</span>
            </Link>
            <Link to="/dashboard/settings" className="border-3 border-brutal-fg bg-brutal-bg p-4 hover:shadow-brutal hover:bg-white active:translate-y-0.5 transition flex items-center gap-3">
              <Zap size={18} className="text-brutal-green shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Automation</span>
            </Link>
            <Link to="/dashboard/widgets" className="border-3 border-brutal-fg bg-brutal-bg p-4 hover:shadow-brutal hover:bg-white active:translate-y-0.5 transition flex items-center gap-3">
              <Globe size={18} className="text-brutal-green shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Widget</span>
            </Link>
          </div>
        </Panel>

        {/*
          The Account panel stood here: an avatar, the signed-in address and a
          role badge. All three are things the reader already knows about
          themselves - the address is in the header of every page - so it spent
          half a row saying nothing. Replaced with the last broadcast's result,
          which is the question an operator opens this page to answer, and which
          `top_campaigns` has been returning unread all along.
        */}
        {lastBroadcast ? (
          <Panel title="Last broadcast">
            <div className="space-y-3">
              <p className="text-sm font-bold truncate" title={lastBroadcast.name}>{lastBroadcast.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
                {relativeTime(lastBroadcast.sent_at)} · {fmt(lastBroadcast.sent)} recipient{lastBroadcast.sent === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-brutal-fg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Opened</p>
                  <p className="font-heading text-2xl leading-none mt-1">{fmtPct(lastBroadcast.open_rate)}</p>
                </div>
                <div className="border-2 border-brutal-fg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Clicked</p>
                  <p className="font-heading text-2xl leading-none mt-1">{fmtPct(lastBroadcast.click_rate)}</p>
                </div>
              </div>
              <Link to="/dashboard/analytics" className="inline-block text-[10px] font-bold uppercase tracking-wider text-brutal-green underline">
                See all results
              </Link>
            </div>
          </Panel>
        ) : (
          <Panel title="Last broadcast">
            <div className="text-center py-6">
              <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Nothing sent yet</p>
              <p className="text-[10px] text-brutal-muted mt-1">Results will appear here after your first broadcast.</p>
            </div>
          </Panel>
        )}
      </div>

      {/* Recent Activity */}
      <Panel title="Recent Activity">
        {activityLoading ? (
          <LoadingState label="Loading activity" />
        ) : activities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Your audience is growing</p>
            <p className="text-[10px] text-brutal-muted mt-1">Start writing or add someone to your audience</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b-2 border-brutal-fg/10 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-brutal-green shrink-0" />
                  <p className="text-xs font-bold">{a.description}</p>
                </div>
                <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">{relativeTime(a.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/*
        Owners only, because the endpoint is owner-gated: the log carries every
        member's IP and user agent, which is the right thing to show the account
        owner and the wrong thing to show their colleagues. Rendering it for
        anyone else would just produce a permanently empty panel.
      */}
      {role === 'owner' && (
        <Panel title="Security Activity">
          {securityLoading ? (
            <LoadingState label="Loading security activity" />
          ) : securityLog.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Nothing to report</p>
              <p className="text-[10px] text-brutal-muted mt-1">Sign-ins, exports and credential changes appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityLog.map((log) => {
                const sensitive = SENSITIVE_ACTIONS.has(log.action)
                return (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b-2 border-brutal-fg/10 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2 w-2 shrink-0 ${sensitive ? 'bg-brutal-yellow-dark' : 'bg-brutal-green'}`} />
                      <p className="text-xs font-bold truncate">{describeAudit(log)}</p>
                    </div>
                    <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider shrink-0 ml-3">
                      {relativeTime(log.created_at)}
                    </p>
                  </div>
                )
              })}
              <Link
                to="/dashboard/settings"
                className="block pt-2 text-[10px] font-bold uppercase tracking-wider text-brutal-muted hover:text-brutal-fg transition"
              >
                View all in Settings →
              </Link>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
