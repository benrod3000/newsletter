import { Link } from 'react-router-dom'
import { useState } from 'react'

const mockCampaigns = [
  {
    id: '1',
    name: 'Welcome to Our Newsletter',
    subject: 'Get started with exclusive content',
    sent: 5432,
    opened: 2168,
    clicked: 365,
    unsubscribed: 12,
  },
  {
    id: '2',
    name: 'Weekly Tech Roundup',
    subject: "This week's best stories",
    sent: 4800,
    opened: 1584,
    clicked: 240,
    unsubscribed: 8,
  },
  {
    id: '3',
    name: 'Product Launch Announcement',
    subject: 'Introducing our newest feature',
    sent: 8100,
    opened: 3402,
    clicked: 612,
    unsubscribed: 22,
  },
  {
    id: '4',
    name: 'Flash Sale Alert',
    subject: '48-hour limited-time offer',
    sent: 6200,
    opened: 2232,
    clicked: 435,
    unsubscribed: 15,
  },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'campaigns', label: 'Campaign Performance' },
  { id: 'subscribers', label: 'Subscriber Records' },
  { id: 'lists', label: 'Audience Lists' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Workspace Settings' },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const totalSent = mockCampaigns.reduce((sum, campaign) => sum + campaign.sent, 0)
  const totalOpened = mockCampaigns.reduce((sum, campaign) => sum + campaign.opened, 0)
  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1)
  const totalClicked = mockCampaigns.reduce((sum, campaign) => sum + campaign.clicked, 0)
  const avgClickRate = ((totalClicked / totalSent) * 100).toFixed(1)
  const totalSubscribers = 12453

  return (
    <main className="demo-shell">
      <div className="demo-page">
        <div className="demo-hero">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Interactive Preview
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Client Portal{' '}
            <span className="text-amber-400">→</span>{' '}
            Demo
          </h1>

          <p className="editorial-copy mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Explore the workspace interface with sample performance data, campaign history, and subscriber records.
          </p>

          <div className="my-8 h-px w-16 bg-zinc-700" />

          <div className="editorial-actions">
            <Link to="/login" className="editorial-button">
              Go to Login
            </Link>
            <Link to="/" className="editorial-button-secondary">
              Back Home
            </Link>
          </div>

          <div className="demo-note">
            This demo is view-only. There is currently no seeded public email/password for the client portal. Real portal logins are created per workspace from the backend admin system.
          </div>
        </div>

        <section className="demo-frame">
          <div className="demo-topbar">
            <div>
              <p className="text-sm font-semibold text-white">Newsletter Elite Demo Workspace</p>
              <p className="mt-1 text-sm text-zinc-500">Sample client environment with mock campaign and subscriber data.</p>
            </div>
            <span className="demo-pill">View Only</span>
          </div>

          <div className="demo-layout">
            <aside className="demo-sidebar">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`demo-tab ${activeTab === item.id ? 'is-active' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </aside>

            <div className="demo-content">
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>

                  <div className="demo-stats">
                    <div className="demo-card">
                      <p className="text-xs font-medium uppercase demo-muted">Total Subscribers</p>
                      <p className="mt-2 text-3xl font-bold text-white">{totalSubscribers.toLocaleString()}</p>
                      <p className="mt-2 text-xs demo-success">↑ 345 this week</p>
                    </div>
                    <div className="demo-card">
                      <p className="text-xs font-medium uppercase demo-muted">Campaigns Sent</p>
                      <p className="mt-2 text-3xl font-bold text-white">{mockCampaigns.length * 12}</p>
                      <p className="mt-2 text-xs demo-muted">4 campaigns/week</p>
                    </div>
                    <div className="demo-card">
                      <p className="text-xs font-medium uppercase demo-muted">Avg Open Rate</p>
                      <p className="mt-2 text-3xl font-bold text-white">{avgOpenRate}%</p>
                      <p className="mt-2 text-xs demo-success">↑ 2.1% vs last month</p>
                    </div>
                    <div className="demo-card">
                      <p className="text-xs font-medium uppercase demo-muted">Avg Click Rate</p>
                      <p className="mt-2 text-3xl font-bold text-white">{avgClickRate}%</p>
                      <p className="mt-2 text-xs demo-success">↑ 0.8% vs last month</p>
                    </div>
                  </div>

                  <div className="demo-card">
                    <h3 className="mb-6 text-lg font-bold text-white">
                      Recent Campaigns <span className="text-xs font-normal text-zinc-500">({mockCampaigns.length} total)</span>
                    </h3>
                    <div className="demo-table-wrap">
                      <table className="demo-table">
                        <thead>
                          <tr>
                            <th className="text-left">Campaign</th>
                            <th className="text-right">Sent</th>
                            <th className="text-right">Opens</th>
                            <th className="text-right">Clicks</th>
                            <th className="text-right">Open Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockCampaigns.map((campaign) => (
                            <tr key={campaign.id}>
                              <td>{campaign.name}</td>
                              <td className="text-right">{campaign.sent.toLocaleString()}</td>
                              <td className="text-right demo-accent">{campaign.opened.toLocaleString()}</td>
                              <td className="text-right demo-subaccent">{campaign.clicked.toLocaleString()}</td>
                              <td className="text-right demo-accent">
                                {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div>
                  <h2 className="text-2xl font-bold text-white">Campaigns</h2>
                  <div className="mt-6 space-y-3">
                    {mockCampaigns.map((campaign) => (
                      <div key={campaign.id} className="demo-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{campaign.name}</h4>
                            <p className="mt-1 text-sm text-zinc-400">Subject: {campaign.subject}</p>
                          </div>
                          <span className="demo-pill">Sent</span>
                        </div>
                        <div className="demo-stats" style={{ marginTop: '1rem', marginBottom: 0 }}>
                          <div>
                            <span className="demo-muted">Sent:</span>{' '}
                            <span className="font-semibold text-white">{campaign.sent.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="demo-muted">Opens:</span>{' '}
                            <span className="font-semibold demo-accent">
                              {campaign.opened.toLocaleString()} ({((campaign.opened / campaign.sent) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div>
                            <span className="demo-muted">Clicks:</span>{' '}
                            <span className="font-semibold demo-subaccent">
                              {campaign.clicked.toLocaleString()} ({((campaign.clicked / campaign.sent) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <div>
                            <span className="demo-muted">Unsub:</span>{' '}
                            <span className="font-semibold demo-danger">{campaign.unsubscribed}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'subscribers' && (
                <div>
                  <h2 className="text-2xl font-bold text-white">Subscribers</h2>
                  <div className="mt-6 space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="demo-card">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-white">subscriber{index + 1}@example.com</h4>
                            <p className="mt-1 text-xs text-zinc-400">Joined 2 weeks ago • Confirmed</p>
                          </div>
                          <span className="demo-pill">Confirmed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-zinc-500">Showing 5 of {totalSubscribers.toLocaleString()} subscribers</p>
                </div>
              )}

              {['lists', 'analytics', 'settings'].includes(activeTab) && (
                <div className="demo-empty">
                  <div>
                    <p className="text-lg text-zinc-400">
                      {activeTab === 'lists' && 'Manage your subscriber lists and segments'}
                      {activeTab === 'analytics' && 'Advanced analytics and performance metrics'}
                      {activeTab === 'settings' && 'Workspace branding, automations, and API keys'}
                    </p>
                    <p className="mt-4 text-sm text-zinc-600">Log in to access these features</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="demo-hero mt-10 border-t border-zinc-800 pt-8">
          <h2 className="text-2xl font-bold text-white">Need a real workspace login?</h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">
            Client portal credentials are provisioned per workspace from the backend admin system. Once a workspace user exists, you can sign in from the client portal with that email and password.
          </p>
        </div>
      </div>
    </main>
  )
}
