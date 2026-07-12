import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useReveal } from '../../App'
import { analyticsAPI } from '../../lib/api'
import { LoadingState } from '../../components/ux'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">
        {label}
      </p>
      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  )
}

export default function DashboardHome() {
  const { email, workspaceId } = useAuthStore()
  const ref = useRef(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useReveal(ref, {
    y: 10,
    duration: 0.6,
    stagger: 0.06,
  })

  useEffect(() => {
    if (!workspaceId) return

    let cancelled = false

    async function loadOverview() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await analyticsAPI.overview(workspaceId)
        if (!cancelled) setStats(data)
      } catch (err) {
        console.error('Failed to load dashboard overview:', err)
        if (!cancelled) setError('Could not load workspace metrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOverview()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const fmt = (n) =>
    typeof n === 'number' ? n.toLocaleString() : '—'
  const fmtPct = (n) =>
    typeof n === 'number' ? `${n.toFixed(1)}%` : '—'

  return (
    <div ref={ref} className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of your workspace activity
        </p>
      </div>

      {/* KPI GRID */}
      {loading ? (
        <LoadingState label="Loading metrics" />
      ) : (
        <>
          {error && (
            <p className="text-xs text-amber-500 uppercase tracking-wide">
              {error} — showing last known values
            </p>
          )}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard label="Total Subscribers" value={fmt(stats?.total_subscribers)} />
            <StatCard label="Campaigns Sent" value={fmt(stats?.campaigns_sent)} />
            <StatCard label="Avg Open Rate" value={fmtPct(stats?.avg_open_rate)} />
            <StatCard label="Avg Click Rate" value={fmtPct(stats?.avg_click_rate)} />
          </div>
        </>
      )}

      {/* WORKSPACE INFO */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h3 className="font-bold mb-4 text-white">
          Workspace Info
        </h3>

        <p className="text-sm text-zinc-400">
          <strong>Email:</strong> {email}
        </p>

        <p className="text-sm text-zinc-400 mt-2">
          <strong>Workspace ID:</strong> {workspaceId}
        </p>
      </div>
    </div>
  )
}
