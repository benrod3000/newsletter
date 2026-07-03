import { useState } from 'react'
import { Link } from 'react-router-dom'

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
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Demo Workspace
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Client Portal
            <span className="block text-zinc-400">Interactive Demo</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Sample workspace showing campaigns, subscribers, and performance data.
          </p>

          <div className="h-px w-16 bg-zinc-800" />

          <div className="flex gap-3">
            <Link
              to="/login"
              className="px-4 py-2 border border-zinc-700 text-xs uppercase tracking-wide hover:border-white transition"
            >
              Login
            </Link>
            <Link
              to="/"
              className="px-4 py-2 border border-zinc-800 text-xs uppercase tracking-wide text-zinc-400 hover:text-white hover:border-zinc-600 transition"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Frame */}
        <div className="border border-zinc-800">
          {/* Topbar */}
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-sm font-semibold">Demo Workspace</p>
            <p className="text-xs text-zinc-500">View-only environment</p>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <aside className="w-56 border-r border-zinc-800">
              <nav className="p-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wide border transition ${
                      activeTab === item.id
                        ? 'border-white text-white'
                        : 'border-transparent text-zinc-500 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Dashboard</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 uppercase">Subscribers</p>
                      <p className="text-2xl font-semibold mt-2">{totalSubscribers.toLocaleString()}</p>
                    </div>
                    <div className="border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 uppercase">Sent</p>
                      <p className="text-2xl font-semibold mt-2">{totalSent.toLocaleString()}</p>
                    </div>
                    <div className="border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 uppercase">Open Rate</p>
                      <p className="text-2xl font-semibold mt-2">{avgOpenRate}%</p>
                    </div>
                    <div className="border border-zinc-800 p-3">
                      <p className="text-xs text-zinc-500 uppercase">Click Rate</p>
                      <p className="text-2xl font-semibold mt-2">{avgClickRate}%</p>
                    </div>
                  </div>

                  <div className="border border-zinc-800">
                    <div className="p-3 border-b border-zinc-800">
                      <p className="text-sm font-semibold">Recent Campaigns</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-zinc-500 uppercase">
                          <tr>
                            <th className="text-left p-3">Campaign</th>
                            <th className="text-right p-3">Sent</th>
                            <th className="text-right p-3">Opens</th>
                            <th className="text-right p-3">Clicks</th>
                            <th className="text-right p-3">Open Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockCampaigns.map((c) => (
                            <tr key={c.id} className="border-t border-zinc-800">
                              <td className="p-3">{c.name}</td>
                              <td className="p-3 text-right">{c.sent.toLocaleString()}</td>
                              <td className="p-3 text-right">{c.opened.toLocaleString()}</td>
                              <td className="p-3 text-right">{c.clicked.toLocaleString()}</td>
                              <td className="p-3 text-right">
                                {((c.opened / c.sent) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'dashboard' && (
                <div className="border border-zinc-800 p-6">
                  <p className="text-zinc-400">
                    {activeTab === 'campaigns' && 'Campaign management view'}
                    {activeTab === 'subscribers' && 'Subscriber database view'}
                    {activeTab === 'lists' && 'Audience segmentation view'}
                    {activeTab === 'analytics' && 'Performance analytics view'}
                    {activeTab === 'settings' && 'Workspace configuration view'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}