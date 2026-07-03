import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useReveal } from '../App'

export default function LandingPage() {
  const ref = useRef(null)

  useReveal(ref, {
    y: 14,
    duration: 0.7,
    stagger: 0.08,
  })

  return (
    <main ref={ref} className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Veloce
          </p>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Veloce
            <span className="block text-zinc-400">Control Layer</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Manage subscribers, campaigns, automations, and branding in a single workspace.
            Built for multi-tenant systems that need clarity over decoration.
          </p>
        </div>

        <div className="h-px w-16 bg-zinc-800" />

        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 border border-zinc-700 text-sm uppercase tracking-wide hover:border-white transition"
          >
            Login
          </Link>

          <Link
            to="/demo"
            className="px-4 py-2 border border-zinc-800 text-sm uppercase tracking-wide text-zinc-400 hover:text-white hover:border-zinc-600 transition"
          >
            Demo
          </Link>
        </div>

        <div className="pt-10 space-y-2 text-xs text-zinc-600 uppercase tracking-wide">
          <p>Subscribers / Campaigns / Analytics / Automations</p>
          <p>Workspace isolated architecture</p>
        </div>
      </div>
    </main>
  )
}