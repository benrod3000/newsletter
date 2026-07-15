import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { campaignsAPI, listsAPI, templatesAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/Toast'
import EmailEditor from '../../components/EmailEditor'
import GeoFilter from '../../components/GeoFilter'
import ConfirmModal from '../../components/ConfirmModal'
import { useCommandAction } from '../../components/CommandActionContext'
import { STATUS_STYLES, AUDIENCE_OPTIONS, generateSubjects, getAudienceLabel } from './Campaigns/constants'

export default function CampaignsPage() {
  const { workspaceId, email } = useAuthStore()
  const toast = useToast()
  const [campaigns, setCampaigns] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [editingId, setEditingId] = useState(null)
  const [editCampaign, setEditCampaign] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editAudience, setEditAudience] = useState('confirmed')
  const [geoAudience, setGeoAudience] = useState(null)
  const [autosaving, setAutosaving] = useState(false)
  const autosaveTimer = useRef(null)
  const [testEmailId, setTestEmailId] = useState(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false)
  const [smsOpen, setSmsOpen] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsCount, setSmsCount] = useState(0)
  const [smsPreview, setSmsPreview] = useState(false)
  const [twoChannel, setTwoChannel] = useState(false) // Also send SMS follow-up
  const [geoTrigger, setGeoTrigger] = useState(false) // Location-triggered
  const [smsImages, setSmsImages] = useState('') // RCS carousel (comma-separated URLs)
  const [confirmAction, setConfirmAction] = useState(null) // { title, message, onConfirm, danger }
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineEditVal, setInlineEditVal] = useState('')
  const { action, consume } = useCommandAction()
  const pendingSends = useRef({}) // { [campaignId]: { pollCount: number, intervalId: any } }

  function startPollingSend(id) {
    if (pendingSends.current[id]) return
    let pollCount = 0
    const intervalId = setInterval(async () => {
      pollCount++
      try {
        const { data } = await campaignsAPI.list(workspaceId)
        const updated = (data.campaigns || []).find(c => c.id === id)
        if (updated && updated.status === 'sent') {
          clearInterval(intervalId)
          delete pendingSends.current[id]
          await loadCampaigns()
          toast.addToast(`Your newsletter reached ${(updated.sent_count || 0).toLocaleString()} people.`, 'success')
        } else if (pollCount >= 30) {
          // 5 min timeout (~10s × 30)
          clearInterval(intervalId)
          delete pendingSends.current[id]
          toast.addToast('Still delivering. Check back in a moment.', 'info')
        }
      } catch { /* keep polling */ }
    }, 10000)
    pendingSends.current[id] = { pollCount, intervalId }
  }

  useEffect(() => {
    return () => {
      // Cleanup all polling intervals on unmount
      Object.values(pendingSends.current).forEach(p => clearInterval(p.intervalId))
      pendingSends.current = {}
    }
  }, [])


  useEffect(() => {
    if (!action) return
    const id = action.id
    consume()
    if (id === 'create-campaign') startNewCampaign()
  }, [action?.timestamp])

  useEffect(() => {
    if (workspaceId) { loadCampaigns(); loadLists() }
    document.title = 'Campaigns | Veloce'
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
    // Called from startNewCampaign when user clicks Save/Send for the first time
    // Creates a draft with the current editor state, returns the new ID
    if (!editSubject.trim()) {
      toast.addToast('Please enter a subject line', 'warning'); return null
    }
    setAutosaving(true)
    try {
      const { data } = await campaignsAPI.create(workspaceId, { title: editSubject.slice(0, 60), subject: editSubject, audience: editAudience })
      await loadCampaigns()
      return data?.campaign?.id || null
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to create', 'error')
      return null
    } finally { setAutosaving(false) }
  }

  async function startNewCampaign() {
    setEditingId('new')
    setEditCampaign({ name: '', title: '', subject: '', audience: 'confirmed' })
    setEditContent('')
    setEditSubject('')
    setEditAudience('confirmed')
    setGeoAudience(null)
    setShowAddForm(false)
  }

  async function sendNow(id) {
    if (id === 'new') {
      const newId = await createCampaign()
      if (!newId) return
      setEditingId(newId)
      id = newId
    }
    const campaign = campaigns.find(c => c.id === id)
    // Show custom confirm with cost estimate
    const recipientCount = getAudienceLabel(campaign?.audience) === '📍 Geo-Targeted' ? 'geo-targeted' : campaign?.sent_count || 'all confirmed'
    setConfirmAction({
      title: 'Send Campaign?',
      message: `"${campaign?.title || campaign?.name}" will be sent to ${recipientCount} subscribers. This cannot be undone. Estimated cost: $${Math.ceil(((campaign?.sent_count || 100) * 0.0001))} via AWS SES.`,
      onConfirm: async () => {
        setConfirmAction(null)
        setBusyId(id)
        try {
          toast.addToast('Preparing your newsletter for delivery...', 'info')
          await campaignsAPI.schedule(workspaceId, id)
          await loadCampaigns()
          toast.addToast('Your newsletter is scheduled. Tracking delivery...', 'success')
          startPollingSend(id)
        } catch (err) {
          const apiErr = err?.response?.data?.error
          toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to schedule', 'error')
        } finally { setBusyId(null) }
      },
      onCancel: () => setConfirmAction(null),
    })
  }

  async function handleSendTest() {
    if (!testEmail.trim() || !testEmailId) return
    setTestSending(true)
    try {
      await campaignsAPI.sendTest(workspaceId, testEmailId, testEmail.trim())
      toast.addToast(`Test sent to ${testEmail.trim()}`, 'success')
      setTestEmailId(null)
      setTestEmail('')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to send test', 'error')
    } finally { setTestSending(false) }
  }

  async function deleteCampaign(id) {
    setBusyId(id)
    try {
      await campaignsAPI.remove(workspaceId, id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast.addToast('Draft deleted', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to delete', 'error')
    } finally {
      setBusyId(null)
      setConfirmDeleteId(null)
    }
  }

  // ---- Edit draft flow ----
  function openEditor(c) {
    setEditingId(c.id)
    setEditCampaign(c)
    setEditContent(c.editor_html || '')
    setEditSubject(c.subject || '')
    setEditAudience(c.audience || 'confirmed')
  }

  function closeEditor() {
    if (editContent && editContent !== (editCampaign?.editor_html || '')) {
      if (!confirm('You have unsaved changes. Leave anyway?')) return
    }
    setEditingId(null)
    setEditCampaign(null)
    setEditContent('')
    setEditSubject('')
    setEditAudience('confirmed')
  }

  // Autosave with debounce
  const autosave = useCallback((html) => {
    if (!editingId || !workspaceId) return
    setEditContent(html)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      setAutosaving(true)
      try {
        await campaignsAPI.update(workspaceId, editingId, { editor_html: html })
      } catch (err) {
        console.error('Autosave failed:', err)
      } finally {
        setAutosaving(false)
      }
    }, 1500)
  }, [editingId, workspaceId])

  async function saveDraft() {
    if (editingId === 'new') {
      const newId = await createCampaign()
      if (!newId) return
      setEditingId(newId)
      if (editContent) {
        await campaignsAPI.update(workspaceId, newId, { editor_html: editContent, subject: editSubject, audience: editAudience })
      }
      await loadCampaigns()
      return
    }
    if (!editingId || !workspaceId) return
    setAutosaving(true)
    try {
      await campaignsAPI.update(workspaceId, editingId, {
        editor_html: editContent,
        subject: editSubject,
        audience: editAudience,
      })
      toast.addToast('Saved. Your newsletter is ready when you are.', 'success')
      await loadCampaigns()
    } catch (err) {
      toast.addToast('Failed to save draft', 'error')
    } finally {
      setAutosaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          open={true}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Send"
          onConfirm={confirmAction.onConfirm}
          onCancel={confirmAction.onCancel}
          danger={confirmAction.danger}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-4 border-b-3 border-brutal-fg pb-4">
        <div>
          <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
            <span className="text-brutal-green">Your</span> Newsletters
          </h2>
          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider mt-1">Write, review, and send to your audience</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border-3 border-brutal-fg bg-white overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition ${viewMode === 'table' ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}>▤ Table</button>
            <button onClick={() => setViewMode('cards')} className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition border-l-3 border-brutal-fg ${viewMode === 'cards' ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}>▥ Cards</button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider transition border-l-3 border-brutal-fg ${viewMode === 'calendar' ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}>📅 Calendar</button>
          </div>
          <Button variant="primary" size="md" onClick={startNewCampaign}>+ New Newsletter</Button>
          <button
            onClick={async () => {
              setSmsOpen(!smsOpen)
              if (!smsOpen) {
                try {
                  const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/campaigns/sms`, { headers: { Authorization: `Bearer ${token}` } })
                  const data = await res.json()
                  setSmsCount(data.reachable || 0)
                } catch { setSmsCount(0) }
              }
            }}
            className="px-3 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal transition flex items-center gap-1.5"
          >
            📱 SMS/RC{smsOpen ? 'S ▲' : 'S ▼'}
          </button>
        </div>
      </div>
      {/* SMS / RCS Panel */}
      {smsOpen && (
        <div className="border-3 border-brutal-fg bg-white p-5 space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-xl uppercase tracking-wide">📱 SMS / RCS Campaign</h3>
              <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider mt-0.5">
                {smsCount > 0 ? `${smsCount} subscribers with phone consent` : 'Loading...'} · RCS on Android, SMS fallback on iOS
              </p>
            </div>
            <span className="text-[9px] font-bold bg-brutal-surface px-2 py-1 border border-brutal-fg uppercase">Beta</span>
          </div>
          <textarea
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            placeholder="Your message here (160 character limit suggested for SMS)"
            maxLength={320}
            rows={3}
            className="w-full px-4 py-3 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 resize-y"
          />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">RCS Images (optional, comma-separated URLs)</label>
            <input
              type="text"
              value={smsImages}
              onChange={e => setSmsImages(e.target.value)}
              placeholder="https://example.com/promo1.jpg, https://example.com/promo2.jpg"
              className="w-full px-3 py-2 bg-white border-3 border-brutal-fg text-xs font-mono focus:outline-none focus:bg-brutal-yellow/10"
            />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSmsPreview(!smsPreview)} className="px-3 py-1 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:bg-brutal-surface transition">
              {smsPreview ? '✕ Hide Preview' : '📱 Preview'}
            </button>
            <span className="text-[10px] text-brutal-muted font-bold">{smsMessage.length}/320</span>
          </div>
          {smsPreview && smsMessage && (
            <div className="grid grid-cols-2 gap-3">
              {/* RCS Preview (Android) */}
              <div className="border-2 border-brutal-green p-3 bg-white">
                <p className="text-[8px] font-bold uppercase tracking-wider text-brutal-green mb-1">RCS (Android)</p>
                <div className="bg-gray-100 p-3 rounded max-w-[200px] text-xs">
                  <p className="font-bold text-xs mb-1">Your Business</p>
                  <p>{smsMessage.slice(0, 160)}</p>
                  {smsMessage.length > 0 && (
                    <button className="mt-2 px-3 py-1 bg-brutal-green text-white text-[10px] font-bold border border-brutal-fg">CTA Button</button>
                  )}
                </div>
              </div>
              {/* SMS Preview (iOS) */}
              <div className="border-2 border-brutal-fg/30 p-3 bg-white">
                <p className="text-[8px] font-bold uppercase tracking-wider text-brutal-muted mb-1">SMS (iOS)</p>
                <div className="bg-gray-100 p-3 rounded max-w-[200px] text-[11px]">
                  <p>{smsMessage.slice(0, 160)}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-brutal-muted font-bold">{smsMessage.length}/320</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={geoTrigger} onChange={e => setGeoTrigger(e.target.checked)} className="w-3 h-3 border border-brutal-fg accent-brutal-green" />
                <span className="text-[9px] font-bold text-brutal-muted uppercase">📍 Trigger on location</span>
              </label>
            </div>
            <button
              onClick={async () => {
                if (!smsMessage.trim()) { toast.addToast('Enter a message', 'warning'); return }
                setSmsSending(true)
                try {
                  const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
                  const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/campaigns/sms`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ message: smsMessage.trim() }),
                  })
                  const data = await res.json()
                  if (data.scheduled) toast.addToast(`SMS scheduled for ${data.scheduled} recipients`, 'success')
                  else toast.addToast(data.error || 'Failed', 'error')
                } catch { toast.addToast('Failed to send', 'error') }
                finally { setSmsSending(false) }
              }}
              disabled={smsSending || !smsMessage.trim()}
              className="px-5 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50"
            >
              {smsSending ? 'Sending...' : `Send to ${smsCount} contacts`}
            </button>
          </div>
        </div>
      )}
      {/* ======== EDIT DRAFT PANEL (also used for new newsletters) ======== */}
      {(editingId || editingId === 'new') && (
        <div className="border-3 border-brutal-fg bg-white shadow-brutal animate-fade-up">
          <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-heading text-xl uppercase tracking-wide">{editingId === 'new' ? 'New Newsletter' : 'Edit Newsletter'}</span>
              {editCampaign?.name && <span className="text-[10px] font-mono font-bold bg-brutal-fg text-brutal-yellow px-2 py-0.5">{editCampaign.name}</span>}
            </div>
            <button onClick={closeEditor} className="px-3 py-1 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">
              Close
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Subject + Audience row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">Subject Line</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                    placeholder="Summer Sale Starts Now ☀️"
                  />
                  <div className="relative">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowSubjectSuggestions(!showSubjectSuggestions)}
                    >
                      Suggest
                    </Button>
                    {showSubjectSuggestions && (
                      <div className="absolute right-0 top-full mt-1 w-72 border-3 border-brutal-fg bg-white shadow-brutal z-20">
                        <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-3 py-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Subject Ideas</span>
                        </div>
                        {generateSubjects(editCampaign?.name || '', editContent).map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setEditSubject(s); setShowSubjectSuggestions(false) }}
                            className="w-full text-left px-3 py-2 text-xs font-bold border-b border-brutal-fg/20 last:border-0 hover:bg-brutal-yellow/20 transition"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">Audience</label>
                <select
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
                >
                  {AUDIENCE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  {lists.length > 0 && (<optgroup label="Custom Lists">{lists.map((l) => (<option key={`list:${l.id}`} value={`list:${l.id}`}>{l.name}</option>))}</optgroup>)}
                </select>
                {editAudience === 'geo' && (
                  <div className="mt-3">
                    <GeoFilter
                      onChange={(geo) => setGeoAudience(geo)}
                      onClear={() => setGeoAudience(null)}
                      active={!!geoAudience}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* TipTap Editor */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">Email Content</label>
              <EmailEditor
                content={editContent}
                onChange={autosave}
                onSave={saveDraft}
                saving={autosaving}
              />
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-2 border-t-3 border-brutal-fg">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${autosaving ? 'text-brutal-yellow' : 'text-brutal-green'}`}>
                  {autosaving ? '● Saving...' : '● Saved'}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={twoChannel} onChange={e => setTwoChannel(e.target.checked)} className="w-3.5 h-3.5 border-2 border-brutal-fg accent-brutal-green" />
                  <span className="text-[9px] font-bold text-brutal-muted uppercase tracking-wider">📱 Also text subscribers</span>
                </label>
              </div>
              <div className="flex gap-2">
                {editingId !== 'new' && (
                  <button
                    onClick={async () => {
                      const name = prompt('Template name:', editCampaign?.title || editCampaign?.name || '')
                      if (!name?.trim()) return
                      try {
                        await templatesAPI.create(workspaceId, {
                          name: name.trim(),
                          subject: editSubject,
                          editor_html: editContent,
                          audience: editAudience,
                          category: 'campaign',
                        })
                        toast.addToast(`Saved "${name.trim()}" as template`, 'success')
                      } catch (err) {
                        const apiErr = err?.response?.data?.error
                        toast.addToast(apiErr || 'Failed to save template', 'error')
                      }
                    }}
                    disabled={autosaving}
                    className="px-4 py-2 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-[10px] uppercase tracking-wider hover:bg-brutal-surface transition disabled:opacity-50"
                  >
                    Save as Template
                  </button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => sendNow(editingId)}
                  disabled={autosaving}
                >
                  {editingId === 'new' ? 'Write & Send' : 'Send Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (<LoadingState label="Loading campaign workspace" />) : error ? (
        <EmptyState title="Couldn't load your newsletters" description={error} action={{ label: 'Try Again', onClick: loadCampaigns }} />
      ) : campaigns.length === 0 ? (
        <EmptyState title="Nothing sent yet" description="Your first newsletter is waiting to be written." action={{ label: '+ Write Your First Newsletter', onClick: startNewCampaign }} />
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
                  <h3 className="font-heading text-2xl uppercase tracking-wide text-brutal-fg truncate" title={c.title || c.name}>{c.title || c.name}</h3>
                  <p className="text-xs font-bold text-brutal-fg/70 line-clamp-2" title={c.subject}>{c.subject}</p>
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
                        <button onClick={() => openEditor(c)} className="flex-1 py-1.5 border-2 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-yellow transition">Edit</button>
                        <button onClick={() => { setTestEmailId(c.id); setTestEmail(email || '') }} className="px-2 py-1.5 border-2 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-green hover:text-white transition" title="Send test">🧪</button>
                        <button onClick={() => sendNow(c.id)} disabled={isBusy} className="flex-1 py-1.5 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 disabled:opacity-50">{isBusy ? 'Scheduling...' : 'Send'}</button>
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
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider hidden sm:table-cell">Audience</th>
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider">Status</th>
                <th className="text-right p-3 font-heading text-lg uppercase tracking-wider hidden md:table-cell">Sent</th>
                <th className="text-left p-3 font-heading text-lg uppercase tracking-wider hidden md:table-cell">Modified</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const status = c.status || 'draft'; const isBusy = busyId === c.id; const isConfirmingDelete = confirmDeleteId === c.id
                return (
                  <tr key={c.id} className="border-t-2 border-brutal-fg hover:bg-brutal-yellow/10 transition">
                    <td className="p-3">
                      {inlineEditId === c.id ? (
                        <input
                          type="text"
                          value={inlineEditVal}
                          onChange={e => setInlineEditVal(e.target.value)}
                          onBlur={async () => {
                            if (inlineEditVal.trim() && inlineEditVal !== (c.title || c.name)) {
                              await campaignsAPI.update(workspaceId, c.id, { title: inlineEditVal.trim() })
                              toast.addToast('Campaign renamed', 'success')
                            }
                            setInlineEditId(null)
                            loadCampaigns()
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setInlineEditId(null) }}
                          className="px-2 py-1 border-3 border-brutal-fg text-sm focus:outline-none bg-brutal-yellow/20"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="font-bold text-brutal-fg cursor-pointer hover:text-brutal-green transition"
                          onClick={(e) => { e.stopPropagation(); setInlineEditId(c.id); setInlineEditVal(c.title || c.name || '') }}
                          title="Click to rename"
                        >
                          {c.title || c.name}
                        </div>
                      )}
                      <div className="text-xs font-bold text-brutal-muted mt-0.5">{c.subject}</div>
                    </td>
                    <td className="p-3 text-xs font-bold text-brutal-fg/80 uppercase tracking-wider hidden sm:table-cell">{getAudienceLabel(c.audience)}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider ${pendingSends.current[c.id] ? 'bg-brutal-yellow text-brutal-fg border-2 border-brutal-fg animate-pulse' : STATUS_STYLES[status]}`}>
                        {pendingSends.current[c.id] ? 'sending...' : status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold hidden md:table-cell">{(c.sent_count ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-brutal-muted font-mono text-xs hidden md:table-cell">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {status === 'draft' ? (
                        <div className="flex items-center justify-end gap-2">
                          {isConfirmingDelete ? (
                            <><button onClick={() => deleteCampaign(c.id)} disabled={isBusy} className="px-2 py-1 bg-brutal-red text-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider hover:opacity-90">Delete</button><button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-white border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider">Cancel</button></>
                          ) : (
                            <><button onClick={() => openEditor(c)} className="px-3 py-1 border-2 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-yellow transition">Edit</button><button onClick={() => sendNow(c.id)} disabled={isBusy} className="px-3 py-1 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50">{isBusy ? 'Sending...' : 'Send Now'}</button><button onClick={() => setConfirmDeleteId(c.id)} disabled={isBusy} className="px-2 py-1 border-2 border-transparent text-xs font-bold text-brutal-fg/50 uppercase tracking-wider hover:text-brutal-red hover:border-brutal-fg transition">Delete</button></>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-brutal-muted font-bold uppercase tracking-wider">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ======== Calendar View ======== */}
      {viewMode === 'calendar' && (
        (() => {
          const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
          const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
          const firstDay = new Date(calendarYear, calendarMonth, 1).getDay()
          const today = new Date()
          const calendarDays = []
          for (let i = 0; i < firstDay; i++) calendarDays.push(null)
          for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)
          const getDayCampaigns = (day) => {
            if (!day) return []
            const dateStr = `${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            return campaigns.filter(c => {
              const d = c.scheduled_for || c.last_sent_at || c.created_at
              return d && d.startsWith(dateStr)
            })
          }

          return (
            <div className="border-3 border-brutal-fg bg-white shadow-brutal">
              <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => { if (calendarMonth===0) { setCalendarMonth(11); setCalendarYear(y=>y-1) } else setCalendarMonth(m=>m-1) }} className="px-3 py-1 border-2 border-brutal-fg bg-white text-xs font-bold hover:bg-brutal-surface">←</button>
                  <span className="font-heading text-xl uppercase">{months[calendarMonth]} {calendarYear}</span>
                  <button onClick={() => { if (calendarMonth===11) { setCalendarMonth(0); setCalendarYear(y=>y+1) } else setCalendarMonth(m=>m+1) }} className="px-3 py-1 border-2 border-brutal-fg bg-white text-xs font-bold hover:bg-brutal-surface">→</button>
                </div>
                <button onClick={() => { setCalendarMonth(today.getMonth()); setCalendarYear(today.getFullYear()) }} className="px-3 py-1 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase">Today</button>
              </div>
              <div className="grid grid-cols-7 border-b-2 border-brutal-fg">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="p-2 text-center text-[10px] font-bold uppercase tracking-wider bg-brutal-surface border-r border-brutal-fg/20 last:border-r-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayCamps = getDayCampaigns(day)
                  const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear()
                  return (
                    <div key={i} className={`min-h-[60px] sm:min-h-[80px] p-1.5 border-r border-b border-brutal-fg/20 ${day ? 'hover:bg-brutal-yellow/5' : 'bg-brutal-bg/50'} ${isToday ? 'ring-2 ring-brutal-green' : ''}`}>
                      {day && <p className={`text-xs font-bold mb-0.5 ${isToday ? 'text-brutal-green' : ''}`}>{day}</p>}
                      {dayCamps.slice(0, 2).map(c => (
                        <div key={c.id} className={`text-[8px] font-bold uppercase px-1 py-0.5 mb-0.5 truncate ${c.status === 'sent' ? 'bg-brutal-green/20 text-brutal-green' : c.status === 'scheduled' ? 'bg-brutal-yellow/30 text-brutal-fg' : 'bg-brutal-surface text-brutal-muted'}`}>
                          {c.title || c.name || 'Draft'}
                        </div>
                      ))}
                      {dayCamps.length > 2 && <div className="text-[7px] text-brutal-muted font-bold">+{dayCamps.length-2} more</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()
      )}

      {/* Test email modal */}
      {testEmailId && (
        <div className="border-3 border-brutal-fg bg-brutal-yellow p-5 space-y-3 animate-fade-up">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Send test email</span>
            <button onClick={() => { setTestEmailId(null); setTestEmail('') }} className="px-2 py-0.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs hover:opacity-80">×</button>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none placeholder:text-brutal-muted"
              onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
            />
            <button
              onClick={handleSendTest}
              disabled={testSending || !testEmail.trim()}
              className="px-5 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
            >
              {testSending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
