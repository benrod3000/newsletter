import { useEffect, useRef, useState } from 'react'
import { listsAPI } from '../lib/api'
import { useToast } from './Toast'
import { LoadingState } from './ux'
import Btn from './ui/Button'
import { X, Users, Check, Clock, Ban } from 'lucide-react'

/**
 * Who is in a list, and where each of them came from.
 *
 * The Lists page could create a list and delete it, with nothing in between. So
 * a list was a name you could not open: the only way to find out who was in one
 * was to filter Contacts and infer, and the only way to fix a typo in its name
 * was to delete it - which takes the membership with it.
 */

/**
 * Turn `consent_source` into something readable.
 *
 * Capture forms record `widget:<slug>`, so the raw value already says where
 * someone came from - it just says it in a shape meant for code.
 */
export function describeSource(source) {
  if (!source) return 'Imported or added manually'
  if (source.startsWith('widget:')) return `Capture form: ${source.slice(7)}`
  if (source === 'signup') return 'Signed up directly'
  return source
}

function StatusBadge({ member }) {
  const [Icon, label, cls] = member.suppressed
    ? [Ban, 'Suppressed', 'text-brutal-red']
    : member.confirmed
      ? [Check, 'Confirmed', 'text-brutal-green']
      : [Clock, 'Pending', 'text-brutal-muted']

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      <Icon size={12} /> {label}
    </span>
  )
}

export default function ListMembersPanel({ list, workspaceId, onClose, onListUpdated }) {
  const toast = useToast()
  const panelRef = useRef(null)

  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const [description, setDescription] = useState(list.description || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await listsAPI.members(workspaceId, list.id, { limit: 200 })
        if (cancelled) return
        setMembers(data?.members || [])
        setTotal(data?.total ?? 0)
      } catch (err) {
        const apiErr = err?.response?.data?.error
        if (!cancelled) setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Could not load members')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [workspaceId, list.id])

  async function saveDetails() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { data } = await listsAPI.update(workspaceId, list.id, {
        name: name.trim(),
        description: description.trim(),
      })
      onListUpdated?.(data?.id ? data : { ...list, name: name.trim(), description: description.trim() })
      setEditing(false)
      toast.addToast('List updated', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Could not update list', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(member) {
    setRemovingId(member.id)
    try {
      await listsAPI.removeMembers(workspaceId, list.id, [member.id])
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      setTotal((t) => Math.max(0, t - 1))
      // Said explicitly, because "remove" next to a contact reasonably reads as
      // "delete this person".
      toast.addToast(`${member.email} removed from this list. They are still in your audience.`, 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Could not remove', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-brutal-fg/40 p-4 overflow-y-auto">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Members of ${list.name}`}
        className="w-full max-w-3xl my-8 border-3 border-brutal-fg bg-white shadow-brutal focus:outline-none"
      >
        {/* Header */}
        <div className="border-b-3 border-brutal-fg p-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="List name"
                  maxLength={80}
                  className="w-full px-3 py-2 bg-brutal-bg border-3 border-brutal-fg font-heading text-xl uppercase tracking-wide focus:outline-none focus:bg-brutal-yellow/10"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label="List description"
                  placeholder="Description (optional)"
                  maxLength={200}
                  className="w-full px-3 py-2 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                />
              </div>
            ) : (
              <>
                <h3 className="font-heading text-2xl uppercase tracking-wide truncate">{list.name}</h3>
                {list.description && <p className="text-sm text-brutal-muted mt-1">{list.description}</p>}
              </>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-2 flex items-center gap-1.5">
              <Users size={12} />
              {total.toLocaleString()} {total === 1 ? 'contact' : 'contacts'}
              {' · '}
              {list.opt_in_type === 'double' ? 'Double opt-in' : 'Single opt-in'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <Btn variant="primary" size="sm" onClick={saveDetails} disabled={saving || !name.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </Btn>
                <button
                  onClick={() => { setEditing(false); setName(list.name); setDescription(list.description || '') }}
                  className="px-3 py-1.5 border-3 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:bg-brutal-surface transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 border-3 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:bg-brutal-yellow/20 transition"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="p-1.5 border-3 border-brutal-fg bg-white hover:bg-brutal-surface transition">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="p-5">
          {loading ? (
            <LoadingState label="Loading members" />
          ) : error ? (
            <div className="border-3 border-brutal-red bg-brutal-red/5 p-4">
              <p className="text-xs font-bold text-brutal-red">{error}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Nobody on this list yet</p>
              <p className="text-[10px] text-brutal-muted mt-1">
                Point a capture form at it, or add contacts from the Contacts page.
              </p>
            </div>
          ) : (
            <div className="border-3 border-brutal-fg divide-y-2 divide-brutal-fg/10">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {[m.first_name, m.last_name].filter(Boolean).join(' ') || m.email}
                    </p>
                    {(m.first_name || m.last_name) && (
                      <p className="text-[11px] text-brutal-muted truncate">{m.email}</p>
                    )}
                    <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider mt-0.5">
                      {describeSource(m.consent_source)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge member={m} />
                    <button
                      onClick={() => removeMember(m)}
                      disabled={removingId === m.id}
                      title="Remove from this list. The contact stays in your audience."
                      className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-red disabled:opacity-40 transition"
                    >
                      {removingId === m.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > members.length && (
            <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider mt-3">
              Showing {members.length} of {total.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
