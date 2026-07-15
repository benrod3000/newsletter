import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useReveal } from '../../App'
import { analyticsAPI } from '../../lib/api'
import { LoadingState } from '../../components/ux'
import MetricCard from '../../components/ui/MetricCard'
import Panel from '../../components/ui/Panel'
import Badge from '../../components/ui/Badge'
import { Mail, Upload, Zap, Globe } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { relativeTime } from '../../lib/time'

export default function DashboardHome() {
  const { email, workspaceId } = useAuthStore()
  const ref = useRef(null)
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [error, setError] = useState(null)

  useReveal(ref, { stagger: 0.1, y: 20 })

  useEffect(() => {
    if (!workspaceId) return
    document.title = 'Your audience · Veloce'
    let cancelled = false

    async function loadOverview() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await analyticsAPI.overview(workspaceId)
        if (!cancelled) setStats(data)
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
        const { data } = await analyticsAPI.activity(workspaceId)
        if (!cancelled) setActivities(data.activity || [])
      } catch {}
      finally { if (!cancelled) setActivityLoading(false) }
    }

    loadOverview()
    loadActivity()
    return () => { cancelled = true }
  }, [workspaceId])

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString() : '—'
  const pct = (n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '—'

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div ref={ref} className="space-y-8 sm:space-y-10">
      {/* Greeting */}
      <div className="space-y-2">
        <p className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none">
          {greeting()}, <span className="text-brutal-green">{email?.split('@')[0] || 'there'}</span>.
        </p>
        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
          Here's what's happening in your workspace.
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
          <Link to="/dashboard/campaigns" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Newsletters Sent" value={fmt(stats?.campaigns_sent)} accentColor="border-t-brutal-yellow" /></Link>
          <Link to="/dashboard/analytics" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Avg Open Rate" value={pct(stats?.avg_open_rate)} accentColor="border-t-brutal-green" /></Link>
          <Link to="/dashboard/analytics" className="cursor-pointer hover:shadow-brutal hover:-translate-y-0.5 transition"><MetricCard label="Avg Click Rate" value={pct(stats?.avg_click_rate)} accentColor="border-t-brutal-fg" /></Link>
        </div>
      )}

      {/* Next Best Action — shown when user has activity but hasn't sent recently */}
      {stats && stats.total_subscribers > 0 && stats.campaigns_sent === 0 && (
        <Card padding="p-6" className="flex items-start gap-4 shadow-brutal">
          <div className="w-10 h-10 border-3 border-brutal-fg bg-brutal-yellow flex items-center justify-center shrink-0">
            <span className="text-lg font-heading">→</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">You have subscribers but no campaigns yet</p>
            <p className="text-xs text-brutal-muted mt-1">Your audience is waiting. Create your first newsletter to start engaging your subscribers.</p>
            <Button variant="primary" size="md" onClick={() => window.location.href = '/dashboard/campaigns'}>Write Your First Newsletter →</Button>
          </div>
        </Card>
      )}

      {/* Next Best Action — no subscribers yet */}
      {stats && stats.total_subscribers === 0 && (
        <Card padding="p-6" className="flex items-start gap-4 shadow-brutal">
          <div className="w-10 h-10 border-3 border-brutal-fg bg-brutal-green flex items-center justify-center shrink-0">
            <span className="text-lg font-heading text-white">1</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Start building your audience</p>
            <p className="text-xs text-brutal-muted mt-1">Set up a signup widget and start collecting subscribers. Embed it on your website in under a minute.</p>
            <Button variant="primary" size="md" onClick={() => window.location.href = '/dashboard/widgets'} className="bg-brutal-green text-white border-brutal-fg">Create a Widget →</Button>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
            <span>← 1. Widget</span>
            <span className="opacity-30">2. Subscribers</span>
            <span className="opacity-30">3. Campaign</span>
          </div>
        </Card>
      )}

      {/* Onboarding Checklist — show when workspace is empty */}
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
        <Panel title="Workspace" accent="bg-brutal-fg text-white">
          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mb-0.5">Email</p>
              <p className="text-sm font-mono font-bold truncate">{email}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mb-0.5">Workspace ID</p>
              <p className="text-xs font-mono text-brutal-muted truncate">{workspaceId}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Badge variant="green">Active</Badge>
              <Badge variant="muted">Multi-tenant</Badge>
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
    </div>
  )
}
