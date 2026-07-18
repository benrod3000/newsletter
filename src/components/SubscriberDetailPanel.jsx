import { useState, useEffect } from 'react'
import { getAuthToken } from '../lib/api'

export default function SubscriberDetailPanel({ subscriber, onClose, onRemove, onToggleList }) {
  if (!subscriber) return null

  const name = [subscriber.first_name, subscriber.last_name].filter(Boolean).join(' ')
  const location = [subscriber.city, subscriber.region, subscriber.country].filter(Boolean).join(', ')

  // Notes & tags state
  const [notes, setNotes] = useState([])
  const [tags, setTags] = useState([])
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newTag, setNewTag] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editFirst, setEditFirst] = useState(subscriber.first_name || '')
  const [editLast, setEditLast] = useState(subscriber.last_name || '')
  const workspaceId = subscriber.client_id

  useEffect(() => {
    if (!subscriber?.id || !workspaceId) return
    const token = getAuthToken()
    fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/${subscriber.id}/notes`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { setNotes(d.notes || []); setTags(d.tags || []) }).catch(() => {})
    // Load timeline
    setTimelineLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/${subscriber.id}/timeline`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { setTimeline(d.timeline || []) }).catch(() => setTimeline([])).finally(() => setTimelineLoading(false))
  }, [subscriber?.id, workspaceId])

  async function addNote() {
    if (!newNote.trim()) return
    const token = getAuthToken()
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/${subscriber.id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note: newNote })
    })
    const data = await res.json()
    if (data.note) { setNotes(prev => [data.note, ...prev]); setNewNote('') }
  }

  async function addTag() {
    if (!newTag.trim()) return
    const token = getAuthToken()
    await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/${subscriber.id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tag: newTag.trim().toLowerCase() })
    })
    setTags(prev => [...prev, newTag.trim().toLowerCase()])
    setNewTag('')
  }

  async function saveName() {
    const token = getAuthToken()
    await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/${subscriber.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ first_name: editFirst, last_name: editLast })
    })
    subscriber.first_name = editFirst
    subscriber.last_name = editLast
    setEditingName(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-brutal-fg/30" />
      <div
        className="relative w-full max-w-md bg-brutal-bg border-l-3 border-brutal-fg overflow-y-auto shadow-brutal animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-3 border-brutal-fg bg-brutal-yellow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1">Subscriber</p>
              <h2 className="font-heading text-2xl uppercase tracking-wide leading-none break-all">{subscriber.email}</h2>
              {name && !editingName && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold mt-1">{name}</p>
                  <button onClick={() => { setEditingName(true); setEditFirst(subscriber.first_name || ''); setEditLast(subscriber.last_name || '') }} className="text-[10px] font-bold text-brutal-muted hover:text-brutal-fg uppercase tracking-wider">Edit</button>
                </div>
              )}
              {editingName && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input value={editFirst} onChange={e => setEditFirst(e.target.value)} placeholder="First name" className="flex-1 px-3 py-1.5 bg-white border-2 border-brutal-fg text-xs focus:outline-none" />
                    <input value={editLast} onChange={e => setEditLast(e.target.value)} placeholder="Last name" className="flex-1 px-3 py-1.5 bg-white border-2 border-brutal-fg text-xs focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveName} className="px-3 py-1 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg text-[10px] font-bold uppercase tracking-wider">Save</button>
                    <button onClick={() => setEditingName(false)} className="px-3 py-1 border-2 border-brutal-fg bg-white text-brutal-fg text-[10px] font-bold uppercase tracking-wider">Cancel</button>
                  </div>
                </div>
              )}
              {!name && !editingName && (
                <button onClick={() => { setEditingName(true); setEditFirst(''); setEditLast('') }} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg mt-1 uppercase tracking-wider">+ Add name</button>
              )}
            </div>
            <button onClick={onClose} className="px-2 py-1 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-lg leading-none hover:opacity-80">×</button>
          </div>
          <span className={`inline-block mt-3 text-xs font-bold px-2 py-1 border border-brutal-fg ${
            subscriber.confirmed ? 'bg-brutal-green text-white' : 'bg-brutal-yellow text-brutal-fg'
          }`}>
            {subscriber.confirmed ? 'confirmed' : 'pending'}
          </span>
          {subscriber.health_score && (
            <span className={`inline-block ml-2 mt-3 text-xs font-bold px-2 py-1 border border-brutal-fg ${
              subscriber.health_score === 'active' ? 'bg-brutal-green/10 text-brutal-green' :
              subscriber.health_score === 'at_risk' ? 'bg-brutal-yellow/10 text-brutal-yellow-800' :
              'bg-brutal-red/10 text-brutal-red'
            }`}>
              {subscriber.health_score === 'active' ? '🟢' : subscriber.health_score === 'at_risk' ? '🟡' : '🔴'} {subscriber.health_score}
            </span>
          )}
        </div>

        {/* Profile info */}
        <div className="p-6 space-y-6">
          <Section title="Profile">
            {(subscriber.phone || subscriber.phone_number) && <Row label="Phone" value={subscriber.phone || subscriber.phone_number} />}
            {subscriber.sms_consent && <Row label="SMS Consent" value="✅ Yes" />}
            {subscriber.date_of_birth && <Row label="Date of Birth" value={subscriber.date_of_birth} />}
            {location && <Row label="Location" value={location} />}
            {subscriber.postal_code && <Row label="ZIP / Postal" value={subscriber.postal_code} />}
            {(subscriber.latitude && subscriber.longitude) && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Map</span>
                <a
                  href={`https://maps.google.com/?q=${subscriber.latitude},${subscriber.longitude}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs font-bold text-brutal-green hover:underline flex items-center gap-1"
                >
                  📍 View on map →
                </a>
              </div>
            )}
            {subscriber.timezone && <Row label="Timezone" value={subscriber.timezone} />}
            <Row label="Joined" value={subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : '--'} />
          </Section>

          {/* Subscriber Journey Timeline */}
          <Section title="Journey">
            {timelineLoading ? (
              <p className="text-xs text-brutal-muted">Loading timeline...</p>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-brutal-muted">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-brutal-fg/10" />
                {timeline.map((event, i) => (
                  <div key={i} className="flex gap-3 py-1.5 relative">
                    <span className="shrink-0 text-xs z-10">{event.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{event.label}</p>
                      {event.detail && <p className="text-[10px] text-brutal-muted mt-0.5">{event.detail}</p>}
                      <p className="text-[9px] text-brutal-muted mt-0.5">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Attribution">
            {subscriber.utm_source && <Row label="UTM Source" value={subscriber.utm_source} />}
            {subscriber.utm_medium && <Row label="UTM Medium" value={subscriber.utm_medium} />}
            {subscriber.utm_campaign && <Row label="UTM Campaign" value={subscriber.utm_campaign} />}
            {subscriber.referrer && <Row label="Referrer" value={subscriber.referrer} />}
            {!subscriber.utm_source && !subscriber.referrer && <p className="text-xs text-brutal-muted">No attribution data</p>}
          </Section>

          <Section title="Consent">
            <Row label="Email Marketing" value={subscriber.consent_email_marketing ? 'Yes' : 'No'} />
            <Row label="Analytics" value={subscriber.consent_analytics_tracking ? 'Yes' : 'No'} />

          {/* Tags */}
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="px-2 py-0.5 border-2 border-brutal-fg bg-brutal-yellow text-[10px] font-bold uppercase">{t}</span>
              ))}
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="+ tag" className="w-24 px-2 py-0.5 border-2 border-brutal-fg text-[10px] focus:outline-none" />
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <div className="flex gap-2 mb-2">
              <input value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Add a note..." className="flex-1 px-3 py-1.5 border-2 border-brutal-fg text-xs focus:outline-none" />
              <button onClick={addNote} className="px-3 py-1.5 border-2 border-brutal-fg bg-brutal-yellow text-xs font-bold uppercase hover:shadow-brutal transition">Add</button>
            </div>
            {notes.map(n => (
              <div key={n.id} className="border-l-3 border-brutal-fg pl-3 py-1 mb-1">
                <p className="text-xs">{n.note}</p>
                <p className="text-[9px] text-brutal-muted mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </Section>
            {subscriber.suppressed && <Row label="Suppressed" value={subscriber.suppressed_reason || 'Yes'} />}
          </Section>
        </div>

        {/* Actions */}
        <div className="border-t-3 border-brutal-fg p-6 space-y-3 bg-white">
          <button
            onClick={() => onRemove(subscriber.id)}
            className="w-full px-4 py-3 border-3 border-brutal-fg bg-brutal-red text-white font-bold text-xs uppercase tracking-wider hover:opacity-80"
          >
            Remove Subscriber
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-2 border-b border-brutal-fg/20 pb-1">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-brutal-muted font-bold">{label}</span>
      <span className="text-brutal-fg font-bold">{value}</span>
    </div>
  )
}
