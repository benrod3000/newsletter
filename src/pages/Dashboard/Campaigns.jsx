import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { campaignsAPI, listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'

const STATUS_STYLES = {
  draft: 'bg-brutal-surface text-brutal-fg border-2 border-brutal-fg',
  scheduled: 'bg-brutal-yellow text-brutal-fg border-2 border-brutal-fg',
  sent: 'bg-brutal-green text-white border-2 border-brutal-fg',
}

const AUDIENCE_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed Subscribers' },
  { value: 'all', label: 'All Subscribers' },
  { value: 'pending', label: 'Pending Verification' },
]

export default function CampaignsPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', audience: 'confirmed' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    if (workspaceId) { loadCampaigns(); loadLists() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadLists() {
    try { const { data } = await listsAPI.list(workspaceId); setLists(data.lists || []) } catch {}
  }

  async function loadCampaigns() {
    setLoading(true); setError(null)
    try { const { data } = await campaignsAPI.list(workspaceId); setCampaigns(data.campaigns || []) }
    catch { setError('Could not load campaigns') }
    finally { setLoading(false) }
  }

  async function createCampaign() {
    if (!newCampaign.name.trim() || !newCampaign.subject.trim()) {
      toast.addToast('Please enter a name and subject', 'warning'); return
    }
    setSaving(true)
    try {
      await campaignsAPI.create(workspaceId, { name: newCampaign.name, subject: newCampaign.subject, audience: newCampaign.audience })
      setNewCampaign({ name: '', subject: '', audience: 'confirmed' })
      setShowAddForm(false)
      await loadCampaigns()
      toast.addToast('Draft created successfully', 'success')
    } catch (err) {
      toast.addToast(err?.response?.data?.error || 'Failed to create campaign', 'error')
    } finally { setSaving(false) }
  }

  async function sendNow(id) {
    setBusyId(id)
    try {
      await campaignsAPI.schedule(workspaceId, id)
      await loadCampaigns()
      toast.addToast('Campaign scheduled for delivery', 'success')
    } catch (err) {
      toast.addToast(err?.response?.data?.error || 'Failed to schedule', 'error')
    } finally { setBusyId(null) }
  }

  async function deleteCampaign(id) {
    setBusyId(id)
    try {
      await campaignsAPI.remove(workspaceId, id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast.addToast('Draft deleted', 'success')
    } catch (err) {
      toast.addToast(err?.response?.data?.error || 'Failed to delete', 'error')
    } finally {
      setBusyId(null)
      setConfirmDeleteId(null)
    }
  }

  function getAudienceLabel(a) {
    if (a?.startsWith('list:')) return lists.find((l) => l.id === a.slice(5))?.name || a
    const match = AUDIENCE_OPTIONS.find((opt) => opt.value === a)
    return match ? match.label : a
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b-3 border-brutal-fg pb-4">
        <div>
          <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
            <span className="text-brutal-green">Camp</span>aigns
          </h2>
          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider mt-1">Create, manage, and schedule newsletter broadcasts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border-3 border-brutal-fg bg-white overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition ${viewMode === 'table' ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}>▤ Table</button>
            <button onClick={() => setViewMode('cards')} className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition border-l-3 border-brutal-fg ${viewMode === 'cards' ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}>▥ Cards</button>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition active:translate-y-0">{showAddForm ? 'Close Form' : '+ New Campaign'}</button>
        </div>
      </div>

      {showAddForm && (
        <div className="border-3 border-brutal-fg bg-white p-6 space-y-5 shadow-brutal">
          <div className="flex justify-between items-center border-b-2 border-brutal-fg pb-2">
            <h3 className="font-heading text-2xl uppercase tracking-wide">Create New Draft</h3>
            <span className="text-xs font-mono font-bold bg-brutal-surface px-2 py-1 border border-brutal-fg">Step 1 of 2</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg mb-1.5">Internal Campaign Name</label>
              <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g., July Product Announcement" className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-medium focus:outline-none focus:bg-brutal-yellow/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg mb-1.5">Email Subject Line</label>
              <input type="text" value={newCampaign.subject} onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })} placeholder="e.g., What we shipped this month..." className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-medium focus:outline-none focus:bg-brutal-yellow/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg mb-1.5">Target Audience</label>
            <select value={newCampaign.audience} onChange={(e) => setNewCampaign({ ...newCampaign, audience: e.target.value })} className="w-full sm:w-80 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none cursor-pointer">
              {AUDIENCE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              {lists.length > 0 && (<optgroup label="Custom Lists">{lists.map((l) => (<option key={`list:${l.id}`} value={`list:${l.id}`}>{l.name}</option>))}</optgroup>)}
            </select>
          </div>
          <div className="p-3 bg-brutal-surface/60 border-2 border-brutal-fg text-xs font-bold text-brutal-fg/80 uppercase tracking-wider">ℹ️ Drafts initialize without body content. You can attach email layouts after saving.</div>
          <div className="flex gap-3 pt-2">
            <button onClick={createCampaign} disabled={saving} className="px-5 py-2.5 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition active:translate-y-0 disabled:opacity-50">{saving ? 'Creating Draft...' : 'Create Campaign Draft'}</button>
            <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-surface transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (<LoadingState label="Loading campaign workspace" />) : error ? (
        <EmptyState title="Failed to sync campaigns" description={error} action={<button onClick={loadCampaigns} className="px-4 py-2 border-3 border-brutal-fg bg-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">Retry Connection</button>} />
      ) : campaigns.length === 0 ? (
        <EmptyState title="No campaigns found" description="You haven't initialized any email broadcasts yet." action={<button onClick={() => setShowAddForm(true)} className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">+ Create First Campaign</button>} />
      ) : viewMode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            const status = c.status || 'draft'; const isBusy = busyId === c.id; const isConfirmingDelete = confirmDeleteId === c.id
            return (
              <div key={c.id} className="border-3 border-brutal-fg bg-white p-5 shadow-brutal flex flex-col justify-between space-y-4 hover:-translate-y-1 transition duration-150">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider ${STATUS_STYLES[status]}`}>{status}</span>
                    <span className="text-xs font-mono font-bold text-brutal-muted">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}</span>
                  </div>
                  <h3 className="font-heading text-2xl uppercase tracking-wide text-brutal-fg truncate">{c.title || c.name}</h3>
                  <p className="text-xs font-bold text-brutal-fg/70 line-clamp-2">{c.subject}</p>
                </div>
                <div className="border-t-2 border-brutal-fg pt-3 space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider"><span className="text-brutal-muted">Audience:</span><span className="text-brutal-fg">{getAudienceLabel(c.audience)}</span></div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider"><span className="text-brutal-muted">Sent:</span><span className="font-mono text-brutal-fg">{(c.sent_count ?? 0).toLocaleString()}</span></div>
                </div>
                {status === 'draft' && (
                  <div className="border-t-2 border-brutal-fg pt-3 flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] font-bold uppercase text-brutal-red">Confirm?</span>
                        <button onClick={() => deleteCampaign(c.id)} disabled={isBusy} className="px-2 py-1 bg-brutal-red text-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => sendNow(c.id)} disabled={isBusy} className="flex-1 py-1.5 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 disabled:opacity-50">{isBusy ? 'Scheduling...' : 'Send Now'}</button>
                        <button onClick={() => setConfirmDeleteId(c.id)} disabled={isBusy} className="px-3 py-1.5 border-2 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-red hover:text-white transition">Delete</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border-3 border-brutal-fg overflow-x-auto bg-white shadow-brutal">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-3 border-brutal-fg bg-brutal-surface">
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider">Campaign</th>
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider">Target Audience</th>
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider">Status</th>
                <th className="text-right p-3 font-heading text-lg uppercase tracking-wider">Sent</th>
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider">Last Modified</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const status = c.status || 'draft'; const isBusy = busyId === c.id; const isConfirmingDelete = confirmDeleteId === c.id
                return (
                  <tr key={c.id} className="border-t-2 border-brutal-fg hover:bg-brutal-yellow/10 transition">
                    <td className="p-3"><div className="font-bold text-brutal-fg">{c.title || c.name}</div><div className="text-xs font-bold text-brutal-muted mt-0.5">{c.subject}</div></td>
                    <td className="p-3 text-xs font-bold text-brutal-fg/80 uppercase tracking-wider">{getAudienceLabel(c.audience)}</td>
                    <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider ${STATUS_STYLES[status]}`}>{status}</span></td>
                    <td className="p-3 text-right font-mono font-bold">{(c.sent_count ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-brutal-muted font-mono text-xs">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {status === 'draft' && (
                        <div className="flex items-center justify-end gap-2">
                          {isConfirmingDelete ? (
                            <><button onClick={() => deleteCampaign(c.id)} disabled={isBusy} className="px-2 py-1 bg-brutal-red text-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90">Delete</button><button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider">Cancel</button></>
                          ) : (
                            <><button onClick={() => sendNow(c.id)} disabled={isBusy} className="px-3 py-1 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50">{isBusy ? 'Sending...' : 'Send Now'}</button><button onClick={() => setConfirmDeleteId(c.id)} disabled={isBusy} className="px-2 py-1 border-2 border-transparent text-xs font-bold text-brutal-fg/50 uppercase tracking-wider hover:text-brutal-red hover:border-brutal-fg transition">Delete</button></>
                          )}
                        </div>
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
