import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Users, BarChart3, Globe, Zap } from 'lucide-react'
import Btn from '../components/ui/Button'
import gsap from 'gsap'

function Panel({ children, className = '', title, accent }) {
  return (
    <div className={`border-3 border-brutal-fg bg-white ${className}`}>
      {title && <div className={`border-b-3 border-brutal-fg ${accent || 'bg-brutal-yellow'} px-4 py-2.5`}>
        <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
      </div>}
      {children}
    </div>
  )
}

const mockCampaigns = [
  { id: '1', name: 'Welcome Sequence', subject: 'Get started with exclusive content', sent: 5432, opened: 2168, clicked: 365, status: 'sent' },
  { id: '2', name: 'Weekly Tech Roundup', subject: "This week's best stories", sent: 4800, opened: 1584, clicked: 240, status: 'sent' },
  { id: '3', name: 'Product Launch', subject: 'Introducing our newest feature', sent: 8100, opened: 3402, clicked: 612, status: 'sent' },
  { id: '4', name: 'Flash Sale Alert', subject: '48-hour limited-time offer', sent: 6200, opened: 2232, clicked: 435, status: 'draft' },
]

const mockSubscribers = [
  { email: 'sarah.chen@example.com', location: 'San Francisco, US', joined: 'Mar 15, 2026', opens: 42, clicks: 8 },
  { email: 'james.wilson@example.com', location: 'London, UK', joined: 'Mar 12, 2026', opens: 18, clicks: 3 },
  { email: 'maria.garcia@example.com', location: 'Barcelona, ES', joined: 'Mar 10, 2026', opens: 31, clicks: 12 },
  { email: 'alex.kim@example.com', location: 'Seoul, KR', joined: 'Mar 8, 2026', opens: 55, clicks: 15 },
  { email: 'emma.brown@example.com', location: 'Melbourne, AU', joined: 'Mar 5, 2026', opens: 8, clicks: 1 },
  { email: 'david.nguyen@example.com', location: 'Toronto, CA', joined: 'Mar 1, 2026', opens: 27, clicks: 6 },
  { email: 'lisa.patel@example.com', location: 'Mumbai, IN', joined: 'Feb 28, 2026', opens: 14, clicks: 2 },
  { email: 'tom.mueller@example.com', location: 'Berlin, DE', joined: 'Feb 25, 2026', opens: 39, clicks: 9 },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'campaigns', label: 'Campaigns', icon: Mail },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: Globe },
  { id: 'automations', label: 'Automations', icon: Zap },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const totalSent = mockCampaigns.reduce((s, c) => s + c.sent, 0)
  const totalOpened = mockCampaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked = mockCampaigns.reduce((s, c) => s + c.clicked, 0)
  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1)
  const avgClickRate = ((totalClicked / totalSent) * 100).toFixed(1)
  const ctorRate = ((totalClicked / totalOpened) * 100).toFixed(1)

  // GSAP animations on tab switch
  const contentRef = useRef(null)

  useEffect(() => {
    if (!contentRef.current) return
    const ctx = gsap.context(() => {
      // Stagger rows/tables
      gsap.fromTo('.demo-stagger', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' })
      // Bounce badges
      gsap.fromTo('.demo-bounce', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.7)' })
      // Slide cards
      gsap.fromTo('.demo-slide', { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' })
    }, contentRef)
    return () => ctx.revert()
  }, [activeTab])

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">Interactive Demo</p>
        <h1 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
          See <span className="text-brutal-green">Veloce</span> in action
        </h1>
        <p className="text-sm text-brutal-muted max-w-lg">
          Realistic preview of a workspace with 12,453 subscribers, 4 campaigns, 6 automations, and live analytics.
        </p>
      </div>

      <div className="flex gap-3">
        <Link to="/signup" className="px-5 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
          Create Free Account
        </Link>
        <Btn variant="primary" size="md" onClick={() => window.location.href = '/login'}>
          Sign In
        </Btn>
      </div>

      <Panel title="Demo Workspace · 12,453 subscribers" accent="bg-brutal-fg text-white">
        <div className="flex flex-col sm:flex-row">
          <aside className="sm:w-52 border-r-0 sm:border-r-3 border-b-3 sm:border-b-0 border-brutal-fg">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-3 transition flex items-center gap-2.5 ${
                      activeTab === item.id ? 'border-brutal-fg bg-brutal-yellow' : 'border-transparent text-brutal-fg/40 hover:text-brutal-fg hover:border-brutal-fg'
                    }`}>
                    <Icon size={15} /> {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>

          <div ref={contentRef} className="flex-1 p-5 sm:p-6">
            {/* ===== DASHBOARD ===== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Subscribers', value: '12,453' },
                    { label: 'Campaigns Sent', value: '24' },
                    { label: 'Open Rate', value: `${avgOpenRate}%` },
                    { label: 'Click Rate', value: `${avgClickRate}%` },
                  ].map((m) => (
                    <div key={m.label} className="demo-bounce border-3 border-brutal-fg bg-brutal-bg p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">{m.label}</p>
                      <p className="text-2xl font-heading uppercase leading-none text-brutal-green">{m.value}</p>
                    </div>
                  ))}
                </div>

                <Panel title="📍 Radius Filter" accent="bg-brutal-green text-white">
                  <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                      <div className="absolute inset-[15%] rounded-full border border-dashed border-brutal-fg/20" />
                      <div className="absolute inset-[35%] rounded-full border border-dashed border-brutal-fg/25" />
                      <div className="absolute inset-[55%] rounded-full border border-dashed border-brutal-fg/30" />
                      <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                      <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                      <div className="absolute inset-0 rounded-full border-3 border-brutal-green/20 animate-radar-3" />
                      <div className="relative z-10 w-3.5 h-3.5 bg-brutal-green rounded-full border-2 border-brutal-fg" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1">Target subscribers by radius</p>
                      <p className="text-[10px] text-brutal-muted uppercase leading-relaxed">
                        Enter any ZIP code. See subscribers within 5, 10, or 25 miles. Send geo-targeted campaigns to people near your business.
                      </p>
                      <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                        {[5, 10, 25].map(mi => (
                          <span key={mi} className="px-2 py-0.5 border-2 border-brutal-fg text-[10px] font-bold bg-brutal-yellow">{mi} mi</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Recent Campaigns">
                  <div className="divide-y-2 divide-brutal-fg/10">
                    {mockCampaigns.map((c) => (
                      <div key={c.id} className="demo-stagger px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{c.name}</p>
                          <p className="text-[10px] text-brutal-muted uppercase">{c.subject}</p>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div><p className="text-xs font-bold text-brutal-green">{((c.opened / c.sent) * 100).toFixed(1)}%</p><p className="text-[9px] text-brutal-muted uppercase">Open</p></div>
                          <div><p className="text-xs font-bold">{c.sent.toLocaleString()}</p><p className="text-[9px] text-brutal-muted uppercase">Sent</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {/* ===== CAMPAIGNS ===== */}
            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">4 Campaigns</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {mockCampaigns.map((c) => (
                    <div key={c.id} className="demo-slide border-3 border-brutal-fg p-4 hover:shadow-brutal transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border-2 ${c.status === 'sent' ? 'bg-brutal-green text-white border-brutal-fg' : 'bg-brutal-yellow border-brutal-fg'}`}>{c.status}</span>
                        <span className="text-[10px] text-brutal-muted font-bold">{c.sent.toLocaleString()} sent</span>
                      </div>
                      <h3 className="font-heading text-lg uppercase tracking-wide">{c.name}</h3>
                      <p className="text-xs text-brutal-muted mt-1">{c.subject}</p>
                      <div className="flex gap-3 mt-3 pt-3 border-t-2 border-brutal-fg/10">
                        <span className="text-[10px] font-bold text-brutal-green">{((c.opened / c.sent) * 100).toFixed(1)}% opens</span>
                        <span className="text-[10px] font-bold text-brutal-muted">{((c.clicked / c.sent) * 100).toFixed(1)}% clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== SUBSCRIBERS ===== */}
            {activeTab === 'subscribers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">8 shown · 12,453 total</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 border-2 border-brutal-fg text-brutal-muted uppercase">🌍 6 countries</span>
                </div>
                <div className="border-3 border-brutal-fg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-brutal-fg bg-brutal-bg">
                        <th className="text-left p-2.5 font-bold uppercase tracking-wider">Email</th>
                        <th className="text-left p-2.5 font-bold uppercase tracking-wider hidden sm:table-cell">Location</th>
                        <th className="text-left p-2.5 font-bold uppercase tracking-wider hidden md:table-cell">Joined</th>
                        <th className="text-right p-2.5 font-bold uppercase tracking-wider">Opens</th>
                        <th className="text-right p-2.5 font-bold uppercase tracking-wider hidden sm:table-cell">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockSubscribers.map((s, i) => (
                        <tr key={i} className="demo-stagger border-t border-brutal-fg/10 hover:bg-brutal-yellow/5">
                          <td className="p-2.5 font-mono font-bold truncate max-w-[180px]">{s.email}</td>
                          <td className="p-2.5 text-brutal-muted hidden sm:table-cell">{s.location}</td>
                          <td className="p-2.5 text-brutal-muted hidden md:table-cell">{s.joined}</td>
                          <td className="p-2.5 text-right font-bold text-brutal-green">{s.opens}</td>
                          <td className="p-2.5 text-right font-bold hidden sm:table-cell">{s.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Avg Open', value: `${avgOpenRate}%` },
                    { label: 'Avg Click', value: `${avgClickRate}%` },
                    { label: 'CTOR', value: `${ctorRate}%` },
                    { label: 'Bounce', value: '0.3%' },
                  ].map((m) => (
                    <div key={m.label} className="border-3 border-brutal-fg bg-white p-4 text-center">
                      <p className="text-2xl font-heading uppercase leading-none text-brutal-green">{m.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>

                <Panel title="Subscriber Growth">
                  <div className="space-y-3 p-4">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => {
                      const h = [15, 35, 55, 70, 85, 100][i]
                      return (
                        <div key={m} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase w-8 text-brutal-muted">{m}</span>
                          <div className="flex-1 h-4 bg-brutal-surface border border-brutal-fg">
                            <div className="h-full bg-brutal-green" style={{ width: `${h}%` }} />
                          </div>
                          <span className="text-[10px] font-mono font-bold">{Math.round(h * 124.53).toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                </Panel>

                <Panel title="Audience by Region">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                    {[
                      { region: '🇺🇸 United States', pct: 38 },
                      { region: '🇬🇧 United Kingdom', pct: 15 },
                      { region: '🇩🇪 Germany', pct: 12 },
                      { region: '🇨🇦 Canada', pct: 9 },
                      { region: '🇦🇺 Australia', pct: 8 },
                      { region: '🌍 Other', pct: 18 },
                    ].map((r) => (
                      <div key={r.region} className="flex items-center justify-between border-2 border-brutal-fg p-3">
                        <span className="text-xs font-bold">{r.region}</span>
                        <span className="text-xs font-bold text-brutal-green">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {/* ===== AUTOMATIONS ===== */}
            {activeTab === 'automations' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Pre-built · Toggle on, they just work</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: '📬', title: 'Confirm & Remind',
                      desc: 'Reminds unconfirmed subscribers after 48 hours. Removes them after 7 days.',
                      detail: 'Runs daily at 6am · 3 subscribers in queue', active: true,
                    },
                    {
                      icon: '🧹', title: 'Auto-Clean Cold Subs',
                      desc: 'Moves 60+ day cold subscribers to a Cold Leads list. Removes at 90 days.',
                      detail: 'Runs daily at 2am · 47 cold subscribers', active: true,
                    },
                    {
                      icon: '🏷️', title: 'Smart Auto-Tagging',
                      desc: 'Labels subscribers as engaged, clicker, slipping, mobile, weekend-reader.',
                      detail: 'Runs daily at 4am · 2,831 tagged this week', active: true,
                    },
                    {
                      icon: '👋', title: 'Welcome Drip',
                      desc: 'Sends 3 emails over 7 days to new subscribers. Pre-written sequence.',
                      detail: 'Ready to activate · 3× higher open rates', active: false,
                    },
                    {
                      icon: '📊', title: 'Weekly List Health Report',
                      desc: 'Every Monday at 8am. Summary of list health with actionable tips.',
                      detail: 'Ready to activate · next report in 4 days', active: false,
                    },
                    {
                      icon: '🔄', title: 'Re-Engagement Rescue',
                      desc: 'Detects quiet subscribers and sends win-back emails automatically.',
                      detail: 'Coming soon', active: false, disabled: true,
                    },
                  ].map((auto) => (
                    <div key={auto.title} className={`demo-slide border-3 border-brutal-fg bg-white p-5 flex flex-col ${auto.disabled ? 'opacity-50' : 'hover:shadow-brutal transition'}`}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl shrink-0">{auto.icon}</span>
                        <div>
                          <h4 className="font-heading text-lg uppercase tracking-wide leading-none">{auto.title}</h4>
                          <p className="text-xs text-brutal-muted mt-1 leading-relaxed">{auto.desc}</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-brutal-fg/60 uppercase tracking-wider mt-2">{auto.detail}</p>
                      <div className="mt-auto pt-3 border-t border-brutal-fg/20">
                        <span className={`text-xs font-bold uppercase tracking-wider ${auto.active ? 'text-brutal-green' : 'text-brutal-muted'}`}>
                          {auto.disabled ? '⏳ Coming Soon' : auto.active ? '✅ Active, runs daily' : '⏸ Paused, toggle to activate'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}