import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="editorial-shell bg-[#0d0d0d] text-white">
      <div className="editorial-column">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
          Newsletter Elite
        </p>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
          White-Label{' '}
          <span className="text-amber-400">→</span>{' '}
          Control
        </h1>

        <p className="editorial-copy mt-5 text-lg leading-relaxed text-zinc-400">
          Give your clients a professional email marketing dashboard.
          <br />
          Subscribers, campaigns, analytics, and branding in one place.
        </p>

        <div className="my-8 h-px w-16 bg-zinc-700" />

        <div className="editorial-actions">
          <Link
            to="/login"
            className="editorial-button"
          >
            Login
          </Link>
          <Link
            to="/demo"
            className="editorial-button-secondary"
          >
            View Demo
          </Link>
        </div>

        <div className="editorial-copy mt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Built for agencies and operators who need
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
            <li>Subscriber and list management</li>
            <li>Campaign sending and analytics</li>
            <li>Branding and automation controls</li>
          </ul>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Demo available. Login required for workspace access.
        </p>
      </div>
    </main>
  )
}
