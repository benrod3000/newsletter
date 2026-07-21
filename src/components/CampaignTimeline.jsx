import { useState, useEffect } from 'react'
import { getAuthToken } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function CampaignTimeline({ campaignId, workspaceId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId || !workspaceId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_URL}/api/clients/${workspaceId}/campaigns/${campaignId}/activity`,
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        )
        const data = await res.json()
        if (!cancelled && data.data?.activity) setEvents(data.data.activity)
      } catch { /* non-critical */ }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [campaignId, workspaceId])

  if (loading) return (
    <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider text-center py-2">
      Loading timeline...
    </p>
  )

  if (events.length === 0) return (
    <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider text-center py-2">
      No activity recorded yet
    </p>
  )

  const dotColor = (type) => {
    if (type?.includes('failed')) return 'bg-brutal-red'
    if (type?.includes('completed') || type?.includes('sent')) return 'bg-brutal-green'
    if (type?.includes('sending') || type?.includes('queued') || type?.includes('preparing')) return 'bg-brutal-yellow'
    if (type?.includes('retrying') || type?.includes('fallback')) return 'bg-orange-400'
    return 'bg-brutal-surface'
  }

  return (
    <div className="border-t-2 border-brutal-fg/20 pt-3 mt-3">
      <h4 className="font-heading text-sm uppercase tracking-wide mb-3 text-brutal-fg/60">Activity</h4>
      <div className="space-y-0 relative pl-4 border-l-2 border-brutal-fg/20">
        {events.map((event, i) => (
          <div key={event.id || i} className="relative pb-3 last:pb-0">
            <div className={`absolute -left-[13px] top-1 w-4 h-4 border-2 border-brutal-fg ${dotColor(event.event_type)}`} />
            <div className="ml-3">
              <p className="text-xs font-bold text-brutal-fg leading-tight">{event.description}</p>
              <p className="text-[9px] text-brutal-muted font-mono mt-0.5">
                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
