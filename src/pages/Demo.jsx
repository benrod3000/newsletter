import { Link } from 'react-router-dom'

export default function DemoPage() {
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
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Demo Dashboard</h1>
        <p className="text-zinc-400 text-lg mb-8">
          See what your clients will have access to
        </p>
        <Link
          to="/"
          className="text-amber-400 hover:underline"
        >
          ← Back to home
        </Link>
      </div>

      {/* Demo Screenshot */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/60">
          <div className="border-b border-zinc-800 bg-zinc-800/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-zinc-700 rounded-lg">☰</button>
              <h1 className="font-bold">📬 Newsletter Elite</h1>
            </div>
            <button className="px-3 py-1 text-sm border border-zinc-700 rounded-lg hover:border-zinc-600">
              Logout
            </button>
          </div>

          <div className="flex min-h-[600px]">
            {/* Sidebar */}
            <div className="w-56 border-r border-zinc-800 bg-zinc-950/50 p-4 space-y-1">
              <div className="px-4 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300">
                📊 Dashboard
              </div>
              <div className="px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                ✉️ Campaigns
              </div>
              <div className="px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                👥 Subscribers
              </div>
              <div className="px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                📋 Lists
              </div>
              <div className="px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                📈 Analytics
              </div>
              <div className="px-4 py-2.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                ⚙️ Settings
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

              <div className="grid grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Total Subscribers', value: '12,453' },
                  { label: 'Campaigns Sent', value: '48' },
                  { label: 'Avg Open Rate', value: '32.5%' },
                  { label: 'Avg Click Rate', value: '4.2%' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60"
                  >
                    <p className="text-xs font-medium uppercase text-zinc-500">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
                <h3 className="font-bold mb-4">Recent Campaigns</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Q2 Product Launch', sent: '5,234', opens: '1,687', clicks: '212' },
                    { name: 'Weekly Newsletter', sent: '4,891', opens: '1,523', clicks: '189' },
                    { name: 'Flash Sale Announcement', sent: '6,112', opens: '2,145', clicks: '365' },
                  ].map((campaign) => (
                    <div
                      key={campaign.name}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg text-sm"
                    >
                      <span>{campaign.name}</span>
                      <span className="text-zinc-400">
                        {campaign.sent} sent • {campaign.opens} opens • {campaign.clicks} clicks
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-zinc-800">
        <h2 className="text-2xl font-bold mb-4">Try it yourself</h2>
        <p className="text-zinc-400 mb-6">
          Log in to your workspace to access the full client portal experience.
        </p>
        <Link
          to="/login"
          className="inline-block bg-amber-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-400"
        >
          Go to Login
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-600">
        <p>&copy; 2024 Newsletter Elite. All rights reserved.</p>
      </footer>
    </div>
  )
}
