import { useState } from 'react'
import { Link } from 'react-router-dom'

// Brutalist UI primitives
function Panel({ children, className = '' }) {
  return (
    <div className={`border-3 border-brutal-fg bg-white ${className}`}>
      {children}
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="border-3 border-brutal-fg bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">
        {label}
      </p>
      <p className="text-2xl font-bold mt-1 font-heading tracking-tight">
        {value}
      </p>
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-[0.9]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-brutal-muted mt-2">
            {subtitle}
          </p>
        )}
      </div>
      <div className="h-1 w-16 bg-brutal-fg" />
    </div>
  )
}

function Table({ children }) {
  return (
    <div className="border-t-3 border-brutal-fg overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  )
}

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
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'subscribers', label: 'Subscribers' },
  { id: 'lists', label: 'Lists' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const totalSent = mockCampaigns.reduce((sum, c) => sum + c.sent, 0)
  const totalOpened = mockCampaigns.reduce((sum, c) => sum + c.opened, 0)
  const totalClicked = mockCampaigns.reduce((sum, c) => sum + c.clicked, 0)

  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1)
  const avgClickRate = ((totalClicked / totalSent) * 100).toFixed(1)
  const totalSubscribers = 12453

  return (
    <div className="space-y-10">

      <PageHeader
        title="Veloce"
        subtitle="Interactive workspace demo with campaigns, subscribers, and performance data"
      />

      <div className="flex gap-3">
        <Link
          to="/login"
          className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 transition"
        >
          Login
        </Link>
        <Link
          to="/"
          className="px-4 py-2 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 transition"
        >
          Home
        </Link>
      </div>

      <Panel>
        <div className="border-b-3 border-brutal-fg bg-brutal-bg px-4 py-3">
          <p className="font-heading text-lg uppercase tracking-wide">Demo Workspace</p>
          <p className="text-xs font-bold text-brutal-muted mt-0.5">View-only environment</p>
        </div>

        <div className="flex flex-col sm:flex-row">
          <aside className="sm:w-56 border-r-0 sm:border-r-3 border-b-3 sm:border-b-0 border-brutal-fg">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider border-3 transition ${
                    activeTab === item.id
                      ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg'
                      : 'border-transparent text-brutal-muted hover:border-brutal-fg hover:text-brutal-fg'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="font-heading text-2xl uppercase tracking-wide">Dashboard</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Subscribers" value={totalSubscribers.toLocaleString()} />
                  <MetricCard label="Sent" value={totalSent.toLocaleString()} />
                  <MetricCard label="Open Rate" value={`${avgOpenRate}%`} />
                  <MetricCard label="Click Rate" value={`${avgClickRate}%`} />
                </div>

                <Panel>
                  <div className="px-4 py-3 border-b-3 border-brutal-fg bg-brutal-bg">
                    <h3 className="font-heading text-lg uppercase tracking-wide">Recent Campaigns</h3>
                  </div>
                  <Table>
                    <thead>
                      <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                        <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Campaign</th>
                        <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Sent</th>
                        <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Opens</th>
                        <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Clicks</th>
                        <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Open Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCampaigns.map((c) => (
                        <tr key={c.id} className="border-t border-brutal-fg">
                          <td className="p-3 font-bold">{c.name}</td>
                          <td className="p-3 text-right font-bold">{c.sent.toLocaleString()}</td>
                          <td className="p-3 text-right">{c.opened.toLocaleString()}</td>
                          <td className="p-3 text-right">{c.clicked.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold">
                            {((c.opened / c.sent) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Panel>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <Panel className="p-8 text-center">
                <p className="font-bold text-brutal-muted uppercase tracking-wider text-sm">
                  {activeTab === 'campaigns' && 'Campaign management view'}
                  {activeTab === 'subscribers' && 'Subscriber database view'}
                  {activeTab === 'lists' && 'Audience segmentation view'}
                  {activeTab === 'analytics' && 'Performance analytics view'}
                  {activeTab === 'settings' && 'Workspace configuration view'}
                </p>
                <p className="text-xs text-brutal-muted/60 mt-2 uppercase tracking-wider">Available in the full dashboard</p>
              </Panel>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}