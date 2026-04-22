import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] px-5 text-white sm:px-6">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="text-xl font-bold">📬 Newsletter Elite</div>
          <div className="space-x-4">
            <Link to="/demo" className="text-zinc-400 hover:text-white">
              Demo
            </Link>
            <Link
              to="/login"
              className="bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-amber-400"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-2xl py-16 text-center sm:py-20">
        <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          White-Label Newsletter Platform
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Give your clients a professional email marketing dashboard. Manage subscribers,
          run campaigns, track analytics — all with your branding.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="inline-block bg-amber-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-400 transition"
          >
            Get Started
          </Link>
          <Link
            to="/demo"
            className="inline-block border border-zinc-700 text-zinc-200 px-8 py-3 rounded-lg font-bold hover:border-zinc-600 transition"
          >
            View Demo
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-3xl py-16 sm:py-20">
        <h2 className="mb-8 text-center text-3xl font-bold">
          Features Your Clients Will Love
        </h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-bold mb-2">Subscriber Management</h3>
            <p className="text-zinc-400">
              Import, organize, and segment your audience with powerful list tools.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">✉️</div>
            <h3 className="font-bold mb-2">Campaign Builder</h3>
            <p className="text-zinc-400">
              Drag-and-drop campaign editor with HTML support and performance tracking.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-bold mb-2">Real-Time Analytics</h3>
            <p className="text-zinc-400">
              Track opens, clicks, geographic data, and subscriber engagement.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold mb-2">GDPR Compliant</h3>
            <p className="text-zinc-400">
              Built-in consent management, DSAR support, and privacy controls.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-bold mb-2">Geo-Targeting</h3>
            <p className="text-zinc-400">
              Segment audiences by location for hyper-targeted campaigns.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-bold mb-2">White-Label Ready</h3>
            <p className="text-zinc-400">
              Custom branding, domains, and sender identities for each workspace.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-xl border-t border-zinc-800 py-16 text-center sm:py-20">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-zinc-400 mb-8">
          Create an account or log in to your workspace.
        </p>
        <Link
          to="/login"
          className="inline-block bg-amber-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-amber-400 transition"
        >
          Login to Dashboard
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-zinc-600">
        <p>&copy; 2024 Newsletter Elite. All rights reserved.</p>
      </footer>
    </div>
  )
}
