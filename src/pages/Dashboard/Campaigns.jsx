import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { campaignsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

// Matches the real `campaigns` table check constraint: status is one of
// draft/scheduled/sent (no "sending"/"failed"). Actually delivering a
// scheduled campaign is handled by an admin-side sweep job
// (app/api/admin/campaigns/process) that needs to run on a schedule —
// "Send Now" here just marks the campaign as due immediately.
const STATUS_STYLES = {
  draft: 'bg-zinc-800 text-zinc-400',
  scheduled: 'bg-amber-900/30 text-amber-400',
  sent: 'bg-green-900/30 text-green-400',
}

const AUDIENCE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed subscribers' },
  { value: 'all', label: 'All subscribers' },
  { value: 'pending', label: 'Pending (unconfirmed)' },
]

export default function CampaignsPage() {
  const { workspaceId } = useAuthStore()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', audience: 'confirmed' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (workspaceId) loadCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadCampaigns() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await campaignsAPI.list(workspaceId)
      setCampaigns(data.campaigns || [])
    } catch (err) {
      console.error('Failed to load campaigns:', err)
      setError('Could not load campaigns. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  async function createCampaign() {
    if (!newCampaign.name.trim() || !newCampaign.subject.trim()) {
      alert('Please enter a campaign name and subject')
      return
    }
    setSaving(true)
    try {
      // The backend column is `title`, but its POST body takes `name` — see
      // app/api/clients/[workspaceId]/campaigns/route.ts.
      await campaignsAPI.create(workspaceId, {
        name: newCampaign.name,
        subject: newCampaign.subject,
        audience: newCampaign.audience,
      })
      setNewCampaign({ name: '', subject: '', audience: 'confirmed' })
      setShowAddForm(false)
      await loadCampaigns()
    } catch (err) {
      console.error('Failed to create campaign:', err)
      const message = err?.response?.data?.error || 'Failed to create campaign'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  async function sendNow(id) {
    if (!confirm('Schedule this campaign to send immediately? This cannot be undone once the send job runs.')) return
    setBusyId(id)
    try {
      await campaignsAPI.schedule(workspaceId, id)
      await loadCampaigns()
    } catch (err) {
      console.error('Failed to schedule campaign:', err)
      const message = err?.response?.data?.error || 'Failed to schedule campaign'
      alert(message)
    } finally {
      setBusyId(null)
    }
  }

  async function deleteCampaign(id) {
    if (!confirm('Delete this draft campaign? This cannot be undone.')) return
    setBusyId(id)
    try {
      await campaignsAPI.remove(workspaceId, id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete campaign:', err)
      const message = err?.response?.data?.error || 'Failed to delete campaign'
      alert(message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Campaigns</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-black font-medium rounded"
        >
          + New Campaign
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <h4 className="font-semibold">New Campaign</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Campaign Name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="e.g., Weekly Roundup"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Subject Line</label>
              <input
                type="text"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                placeholder="e.g., This week's best stories"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Audience</label>
            <select
              value={newCampaign.audience}
              onChange={(e) => setNewCampaign({ ...newCampaign, audience: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500">
            This creates a draft with no email content yet. Add content and send it from the
            table below once you're ready.
          </p>
          <div className="flex gap-2">
            <button
              onClick={createCampaign}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Draft'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading campaigns" />
      ) : error ? (
        <EmptyState
          title="Couldn't load campaigns"
          description={error}
          action={
            <button
              onClick={loadCampaigns}
              className="px-4 py-2 text-xs uppercase tracking-wide border border-zinc-700 hover:border-white transition"
            >
              Retry
            </button>
          }
        />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign to start sending."
        />
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/60">
              <tr>
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Audience</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Sent</th>
                <th className="text-left p-3">Updated</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const status = c.status || 'draft'
                const isBusy = busyId === c.id
                return (
                  <tr key={c.id} className="border-t border-zinc-800">
                    <td className="p-3">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-zinc-500">{c.subject}</div>
                    </td>
                    <td className="p-3 text-zinc-400">{c.audience}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[status] || 'bg-zinc-800 text-zinc-400'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-right">{(c.sent_count ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-zinc-400">
                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      {status === 'draft' && (
                        <>
                          <button
                            onClick={() => sendNow(c.id)}
                            disabled={isBusy}
                            className="text-xs text-amber-500 hover:text-amber-400 uppercase tracking-wide disabled:opacity-50"
                          >
                            {isBusy ? 'Working...' : 'Send Now'}
                          </button>
                          <button
                            onClick={() => deleteCampaign(c.id)}
                            disabled={isBusy}
                            className="text-xs text-zinc-500 hover:text-red-400 uppercase tracking-wide disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
