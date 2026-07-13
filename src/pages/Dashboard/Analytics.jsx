import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { analyticsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

function StatCard({ label, value }) {
  return (
    <div className="border-3 border-brutal-fg bg-white p-5 border-t-[6px] border-t-brutal-yellow hover:shadow-brutal transition">
      <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">{label}</p>
      <p className="text-3xl font-bold mt-2 text-brutal-fg font-heading tracking-tight">{value}</p>
    </div>
  )
}

// Simple CSS bar chart — no charting library needed for a single series.
function GrowthChart({ points }) {
  const max = Math.max(...points.map((p) => p.count), 1)
  return (
    <div className="border-3 border-brutal-fg bg-white p-6 shadow-brutal">
      <h3 className="font-heading text-xl uppercase tracking-wide mb-6">Subscriber Growth</h3>
      <div className="flex items-end gap-2 h-40">
        {points.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div
              className="w-full bg-brutal-yellow border-2 border-brutal-fg hover:bg-brutal-yellow-dark transition"
              style={{ height: `${Math.max((p.count / max) * 100, 2)}%` }}
              title={`${p.count} on ${p.date}`}
            />
            <span className="text-[10px] font-bold text-brutal-muted">
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
  const [days, setDays] = useState(14)

  useEffect(() => {
    if (workspaceId) loadOverview()
    document.title = 'Analytics — Veloce'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, days])

  async function loadOverview() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await analyticsAPI.overview(workspaceId, { days })
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
    <div className="space-y-8">
      <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
        <span className="text-brutal-green">Analyt</span>ics
      </h2>

      {loading ? (
        <LoadingState label="Loading analytics" />
      ) : error ? (
        <EmptyState
          title="Couldn't load analytics"
          description={error}
          action={{ label: 'Retry', onClick: loadOverview }}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-5">
            <StatCard label="Total Subscribers" value={fmt(overview?.total_subscribers)} />
            <StatCard label="Campaigns Sent" value={fmt(overview?.campaigns_sent)} />
            <StatCard label="Avg Open Rate" value={fmtPct(overview?.avg_open_rate)} />
            <StatCard label="Avg Click Rate" value={fmtPct(overview?.avg_click_rate)} />
          </div>

          {/* Date range toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Range:</span>
            <div className="flex border-3 border-brutal-fg overflow-hidden">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${
                    days === d
                      ? 'bg-brutal-yellow text-brutal-fg'
                      : 'bg-white text-brutal-muted hover:text-brutal-fg'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {growth.length > 0 ? (
            <GrowthChart points={growth} />
          ) : (
            <EmptyState
              title="No growth data yet"
              description="Subscriber growth will appear here once you have history to show."
            />
          )}

          <div className="border-3 border-brutal-fg overflow-x-auto bg-white">
            <div className="px-4 py-3 border-b-3 border-brutal-fg bg-brutal-bg">
              <h3 className="font-heading text-lg uppercase tracking-wide">Top Performing Campaigns</h3>
            </div>
            {topCampaigns.length === 0 ? (
              <div className="p-6 text-center text-sm font-bold text-brutal-muted">
                No campaign performance data yet
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                    <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Campaign</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Sent</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Open Rate</th>
                    <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c, i) => (
                    <tr key={c.id ?? i} className="border-t border-brutal-fg">
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3 text-right font-bold">{fmt(c.sent)}</td>
                      <td className="p-3 text-right font-bold">{fmtPct(c.open_rate)}</td>
                      <td className="p-3 text-right font-bold">{fmtPct(c.click_rate)}</td>
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
