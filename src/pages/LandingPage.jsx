import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-6 text-white">
      <div className="w-full max-w-lg">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
          Newsletter Elite
        </p>

        <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          White-Label{' '}
          <span className="text-amber-400">→</span>{' '}
          Control
        </h1>

        <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
          Give your clients a professional email marketing dashboard.
          <br />
          Subscribers, campaigns, analytics, and branding in one place.
        </p>

        <div className="my-8 h-px w-16 bg-zinc-700" />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
          >
            Login
          </Link>
          <Link
            to="/demo"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-bold text-zinc-200 transition hover:border-zinc-600"
          >
            View Demo
          </Link>
        </div>

        <div className="mt-8 max-w-md rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-4">
          <p className="text-sm text-zinc-300">Built for agencies and operators who need:</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
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
