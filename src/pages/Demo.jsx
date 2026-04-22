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
    subject: 'This week\'s best stories',
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

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const totalSent = mockCampaigns.reduce((sum, c) => sum + c.sent, 0)
  const totalOpened = mockCampaigns.reduce((sum, c) => sum + c.opened, 0)
  const avgOpenRate = ((totalOpened / totalSent) * 100).toFixed(1)
  const totalClicked = mockCampaigns.reduce((sum, c) => sum + c.clicked, 0)
  const avgClickRate = ((totalClicked / totalSent) * 100).toFixed(1)
  const totalSubscribers = 12453

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] text-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-xl font-bold">📬 Newsletter Elite</div>
          <Link
            to="/login"
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-amber-400"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Interactive Demo</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Explore the client portal with live sample data
        </p>
        <Link
          to="/"
          className="text-amber-400 hover:underline"
        >
          ← Back to home
        </Link>
      </div>

      {/* Demo Interface */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/60">
          {/* Top Bar */}
          <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-bold">📬 Newsletter Elite Demo</h1>
            </div>
            <div className="text-sm text-zinc-400">
              View Only • <span className="text-amber-400">demo@example.com</span>
            </div>
          </div>

          <div className="flex min-h-[700px]">
            {/* Sidebar */}
            <div className="w-56 border-r border-zinc-800 bg-zinc-950/50 p-4 space-y-1">
              {[
                { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                { id: 'campaigns', label: '✉️ Campaigns', icon: '✉️' },
                { id: 'subscribers', label: '👥 Subscribers', icon: '👥' },
                { id: 'lists', label: '📋 Lists', icon: '📋' },
                { id: 'analytics', label: '📈 Analytics', icon: '📈' },
                { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-4 py-2.5 rounded-lg text-left transition ${
                    activeTab === item.id
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-2xl font-bold mb-8">Dashboard Overview</h2>

                  {/* Metrics Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
                      <p className="text-xs font-medium uppercase text-zinc-500">Total Subscribers</p>
                      <p className="text-3xl font-bold mt-2">{totalSubscribers.toLocaleString()}</p>
                      <p className="text-xs text-green-400 mt-2">↑ 345 this week</p>
                    </div>
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
                      <p className="text-xs font-medium uppercase text-zinc-500">Campaigns Sent</p>
                      <p className="text-3xl font-bold mt-2">{mockCampaigns.length * 12}</p>
                      <p className="text-xs text-zinc-500 mt-2">4 campaigns/week</p>
                    </div>
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
                      <p className="text-xs font-medium uppercase text-zinc-500">Avg Open Rate</p>
                      <p className="text-3xl font-bold mt-2">{avgOpenRate}%</p>
                      <p className="text-xs text-green-400 mt-2">↑ 2.1% vs last month</p>
                    </div>
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
                      <p className="text-xs font-medium uppercase text-zinc-500">Avg Click Rate</p>
                      <p className="text-3xl font-bold mt-2">{avgClickRate}%</p>
                      <p className="text-xs text-green-400 mt-2">↑ 0.8% vs last month</p>
                    </div>
                  </div>

                  {/* Recent Campaigns */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
                    <h3 className="font-bold mb-6 flex items-center gap-2">
                      <span>📧 Recent Campaigns</span>
                      <span className="text-xs text-zinc-500 font-normal">({mockCampaigns.length} total)</span>
                    </h3>
                    <div className="space-y-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-zinc-400 border-b border-zinc-800">
                            <th className="text-left py-2">Campaign</th>
                            <th className="text-right py-2">Sent</th>
                            <th className="text-right py-2">Opens</th>
                            <th className="text-right py-2">Clicks</th>
                            <th className="text-right py-2">Open Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockCampaigns.map((c) => (
                            <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                              <td className="py-3">{c.name}</td>
                              <td className="text-right">{c.sent.toLocaleString()}</td>
                              <td className="text-right text-amber-400">{c.opened.toLocaleString()}</td>
                              <td className="text-right text-amber-300">{c.clicked.toLocaleString()}</td>
                              <td className="text-right text-amber-400">
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

              {activeTab === 'campaigns' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Campaigns</h2>
                  <div className="space-y-3">
                    {mockCampaigns.map((c) => (
                      <div key={c.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60 hover:border-amber-500/50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{c.name}</h4>
                            <p className="text-sm text-zinc-400 mt-1">Subject: {c.subject}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">Sent</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          <div><span className="text-zinc-400">Sent:</span> <span className="font-semibold text-white">{c.sent.toLocaleString()}</span></div>
                          <div><span className="text-zinc-400">Opens:</span> <span className="font-semibold text-amber-400">{c.opened.toLocaleString()} ({((c.opened/c.sent)*100).toFixed(1)}%)</span></div>
                          <div><span className="text-zinc-400">Clicks:</span> <span className="font-semibold text-amber-300">{c.clicked.toLocaleString()} ({((c.clicked/c.sent)*100).toFixed(1)}%)</span></div>
                          <div><span className="text-zinc-400">Unsub:</span> <span className="font-semibold text-red-400">{c.unsubscribed}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'subscribers' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Subscribers</h2>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-white">subscriber{i + 1}@example.com</h4>
                            <p className="text-xs text-zinc-400 mt-1">Joined 2 weeks ago • Confirmed</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">Confirmed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-zinc-500 mt-6">Showing 5 of {totalSubscribers.toLocaleString()} subscribers</p>
                </div>
              )}

              {['lists', 'analytics', 'settings'].includes(activeTab) && (
                <div className="text-center py-20">
                  <p className="text-zinc-400 text-lg">
                    {activeTab === 'lists' && 'Manage your subscriber lists and segments'}
                    {activeTab === 'analytics' && 'Advanced analytics and performance metrics'}
                    {activeTab === 'settings' && 'Workspace branding, automations, and API keys'}
                  </p>
                  <p className="text-zinc-600 text-sm mt-4">
                    Log in to access these features
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-zinc-800">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-zinc-400 mb-8 text-lg">
          Access your own workspace with full client portal features, automated workflows, and white-label branding.
        </p>
        <Link
          to="/login"
          className="inline-block bg-amber-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-400 transition"
        >
          Login to Your Workspace
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-600">
        <p>&copy; 2024 Newsletter Elite. White-label email marketing made easy.</p>
      </footer>
    </div>
  )
}
