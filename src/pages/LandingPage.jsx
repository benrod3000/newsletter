import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main className="space-y-12">
      <div className="max-w-2xl space-y-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">
          Veloce
        </p>

        <h1 className="text-5xl sm:text-7xl font-heading tracking-tight leading-[0.9] uppercase">
          Veloce
          <span className="block text-brutal-muted mt-1">Control Layer</span>
        </h1>

        <p className="text-base sm:text-lg text-brutal-fg/70 leading-relaxed max-w-lg">
          Manage subscribers, campaigns, automations, and branding in a single workspace.
          Built for multi-tenant systems that need clarity over decoration.
        </p>

        <div className="h-1 w-16 bg-brutal-fg" />
      </div>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-6 py-3 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
        >
          Login
        </Link>

        <Link
          to="/demo"
          className="px-6 py-3 border-brutal border-brutal-fg bg-brutal-bg text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
        >
          Demo
        </Link>
      </div>

      <div className="pt-8 space-y-2 text-xs font-bold text-brutal-muted uppercase tracking-[0.15em]">
        <p>Subscribers / Campaigns / Analytics / Automations</p>
        <p>Workspace isolated architecture</p>
      </div>
    </main>
  )
}