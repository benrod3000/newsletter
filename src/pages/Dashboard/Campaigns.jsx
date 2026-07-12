import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { campaignsAPI, listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

// Matches the real `campaigns` table check constraint: status is one of
// draft/scheduled/sent (no "sending"/"failed"). Actually delivering a
// scheduled campaign is handled by an admin-side sweep job
// (app/api/admin/campaigns/process) that needs to run on a schedule —
// "Send Now" here just marks the campaign as due immediately.
const STATUS_STYLES = {
  draft: 'bg-brutal-bg text-brutal-muted border border-brutal-fg',
  scheduled: 'bg-brutal-yellow text-brutal-fg border border-brutal-fg',
  sent: 'bg-brutal-green text-white border border-brutal-fg',
}

const AUDIENCE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed subscribers' },
  { value: 'all', label: 'All subscribers' },
  { value: 'pending', label: 'Pending (unconfirmed)' },
]

export default function CampaignsPage() {
  const { workspaceId } = useAuthStore()
  const [campaigns, setCampaigns] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', audience: 'confirmed' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (workspaceId) {
      loadCampaigns()
      loadLists()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadLists() {
    try {
      const { data } = await listsAPI.list(workspaceId)
      setLists(data.lists || [])
    } catch {
      // Lists are optional, don't block on failure
    }
  }

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">Campaigns</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
        >
          + New Campaign
        </button>
      </div>

      {showAddForm && (
        <div className="border-brutal border-brutal-fg bg-white p-8 space-y-5">
          <h4 className="font-heading text-xl uppercase tracking-wide">New Campaign</h4>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Campaign Name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="e.g., Weekly Roundup"
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Subject Line</label>
              <input
                type="text"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                placeholder="e.g., This week's best stories"
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Audience</label>
            <select
              value={newCampaign.audience}
              onChange={(e) => setNewCampaign({ ...newCampaign, audience: e.target.value })}
              className="w-full sm:w-64 px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              {lists.length > 0 && (
                <optgroup label="Lists">
                  {lists.map((l) => (
                    <option key={`list:${l.id}`} value={`list:${l.id}`}>{l.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
            This creates a draft with no email content yet. Add content and send it from the
            table below once you're ready.
          </p>
          <div className="flex gap-3">
            <button
              onClick={createCampaign}
              disabled={saving}
              className="px-5 py-2.5 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Draft'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
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
              className="px-4 py-2 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80"
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
        <div className="border-brutal border-brutal-fg overflow-x-auto bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Campaign</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Audience</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Sent</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Updated</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const status = c.status || 'draft'
                const isBusy = busyId === c.id
                return (
                  <tr key={c.id} className="border-t border-brutal-fg">
                    <td className="p-3">
                      <div className="font-bold">{c.title}</div>
                      <div className="text-xs text-brutal-muted mt-0.5">{c.subject}</div>
                    </td>
                    <td className="p-3 text-brutal-muted">
                      {c.audience?.startsWith('list:')
                        ? (lists.find((l) => l.id === c.audience.slice(5))?.name || c.audience)
                        : c.audience}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 ${STATUS_STYLES[status] || 'bg-brutal-bg text-brutal-muted border border-brutal-fg'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">{(c.sent_count ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-brutal-muted text-xs">
                      {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right space-x-3 whitespace-nowrap">
                      {status === 'draft' && (
                        <>
                          <button
                            onClick={() => sendNow(c.id)}
                            disabled={isBusy}
                            className="text-xs font-bold text-brutal-green uppercase tracking-wider hover:opacity-70 disabled:opacity-50"
                          >
                            {isBusy ? 'Working...' : 'Send Now'}
                          </button>
                          <button
                            onClick={() => deleteCampaign(c.id)}
                            disabled={isBusy}
                            className="text-xs font-bold text-brutal-fg/50 uppercase tracking-wider hover:text-brutal-fg disabled:opacity-50"
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
