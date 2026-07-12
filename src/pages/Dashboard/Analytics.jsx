import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { analyticsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}

// Simple CSS bar chart — no charting library needed for a single series.
function GrowthChart({ points }) {
  const max = Math.max(...points.map((p) => p.count), 1)
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <h3 className="font-bold mb-6 text-white">Subscriber Growth</h3>
      <div className="flex items-end gap-2 h-40">
        {points.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div
              className="w-full bg-amber-500/70 group-hover:bg-amber-500 rounded-t transition"
              style={{ height: `${Math.max((p.count / max) * 100, 2)}%` }}
              title={`${p.count} on ${p.date}`}
            />
            <span className="text-[10px] text-zinc-600 rotate-0">
              {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { workspaceId } = useAuthStore()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (workspaceId) loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadOverview() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await analyticsAPI.overview(workspaceId)
      setOverview(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Could not load analytics. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  const growth = overview?.subscriber_growth || []
  const topCampaigns = overview?.top_campaigns || []

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '—')
  const fmtPct = (n) => (typeof n === 'number' ? `${n.toFixed(1)}%` : '—')

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics</h2>

      {loading ? (
        <LoadingState label="Loading analytics" />
      ) : error ? (
        <EmptyState
          title="Couldn't load analytics"
          description={error}
          action={
            <button
              onClick={loadOverview}
              className="px-4 py-2 text-xs uppercase tracking-wide border border-zinc-700 hover:border-white transition"
            >
              Retry
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard label="Total Subscribers" value={fmt(overview?.total_subscribers)} />
            <StatCard label="Campaigns Sent" value={fmt(overview?.campaigns_sent)} />
            <StatCard label="Avg Open Rate" value={fmtPct(overview?.avg_open_rate)} />
            <StatCard label="Avg Click Rate" value={fmtPct(overview?.avg_click_rate)} />
          </div>

          {growth.length > 0 ? (
            <GrowthChart points={growth} />
          ) : (
            <EmptyState
              title="No growth data yet"
              description="Subscriber growth will appear here once you have history to show."
            />
          )}

          <div className="rounded-lg border border-zinc-800 overflow-x-auto">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h3 className="font-bold text-white">Top Performing Campaigns</h3>
            </div>
            {topCampaigns.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-sm">
                No campaign performance data yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/60">
                  <tr>
                    <th className="text-left p-3">Campaign</th>
                    <th className="text-right p-3">Sent</th>
                    <th className="text-right p-3">Open Rate</th>
                    <th className="text-right p-3">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c, i) => (
                    <tr key={c.id ?? i} className="border-t border-zinc-800">
                      <td className="p-3">{c.name}</td>
                      <td className="p-3 text-right">{fmt(c.sent)}</td>
                      <td className="p-3 text-right">{fmtPct(c.open_rate)}</td>
                      <td className="p-3 text-right">{fmtPct(c.click_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
