import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReveal } from '../../hooks/use-gsap'
import { analyticsAPI, auditAPI } from '../../lib/api'
import { fmt, fmtPct } from '../../lib/format'
import { LoadingState } from '../../components/ux'
import MetricCard from '../../components/ui/MetricCard'
import Panel from '../../components/ui/Panel'
import Badge from '../../components/ui/Badge'
import { Mail, Upload, Zap, Globe } from 'lucide-react'
import Card from '../../components/ui/Card'
import { relativeTime } from '../../lib/time'
import { describeAudit, SENSITIVE_ACTIONS } from '../../lib/audit'

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

  useReveal(ref, { stagger: 0.1, y: 20 })

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

    loadOverview()
    loadActivity()
    loadSecurityLog()
    return () => { cancelled = true }
  }, [workspaceId, role])

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

      {/* KPI Grid */}
      {loading ? (
        <LoadingState label="Loading metrics" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/subscribers" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Audience" value={fmt(stats?.total_subscribers)} accentColor="border-t-brutal-green" change={stats?.total_subscribers > 0 ? `+${stats?.total_subscribers}` : undefined} /></Link>
          <Link to="/dashboard/campaigns" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Broadcasts Sent" value={fmt(stats?.campaigns_sent)} accentColor="border-t-brutal-yellow" /></Link>
          <Link to="/dashboard/analytics" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Avg Open Rate" value={fmtPct(stats?.avg_open_rate)} accentColor="border-t-brutal-green" /></Link>
          <Link to="/dashboard/analytics" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Avg Click Rate" value={fmtPct(stats?.avg_click_rate)} accentColor="border-t-brutal-fg" /></Link>
        </div>
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

        {/* Workspace Info */}
        <Panel title="Account" accent="bg-brutal-fg text-white">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-heading text-lg font-bold uppercase shrink-0">
                {email?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-bold truncate">{email}</p>
                <Badge variant="green">{role || 'owner'}</Badge>
              </div>
            </div>
          </div>
        </Panel>
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
