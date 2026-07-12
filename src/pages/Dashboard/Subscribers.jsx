import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { subscribersAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

// Matches the real `subscribers` table: there's no generic "status" string —
// just a `confirmed` boolean. Unsubscribing hard-deletes the row entirely
// (see /api/unsubscribe), so an "unsubscribed" state never actually shows
// up here — a subscriber is either present (confirmed or pending) or gone.
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
]

export default function SubscribersPage() {
  const { workspaceId } = useAuthStore()
  const [subscribers, setSubscribers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSubscriber, setNewSubscriber] = useState({ email: '', first_name: '', last_name: '' })
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (workspaceId) loadSubscribers(statusFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, statusFilter])

  async function loadSubscribers(status) {
    setLoading(true)
    setError(null)
    try {
      const { data } = await subscribersAPI.list(workspaceId, status ? { status } : undefined)
      setSubscribers(data.subscribers || [])
      setTotal(data.total ?? data.subscribers?.length ?? 0)
    } catch (err) {
      console.error('Failed to load subscribers:', err)
      setError('Could not load subscribers. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  // The backend doesn't support a search query param, so this filters the
  // currently-loaded page client-side rather than hitting the API again.
  const filtered = useMemo(() => {
    if (!search.trim()) return subscribers
    const q = search.trim().toLowerCase()
    return subscribers.filter((s) =>
      [s.email, s.first_name, s.last_name].some((v) => v?.toLowerCase().includes(q))
    )
  }, [subscribers, search])

  async function addSubscriber() {
    if (!newSubscriber.email.trim()) {
      alert('Please enter an email address')
      return
    }
    setSaving(true)
    try {
      await subscribersAPI.create(workspaceId, newSubscriber)
      setNewSubscriber({ email: '', first_name: '', last_name: '' })
      setShowAddForm(false)
      await loadSubscribers(statusFilter)
    } catch (err) {
      console.error('Failed to add subscriber:', err)
      const message = err?.response?.data?.error || 'Failed to add subscriber'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  async function removeSubscriber(id) {
    if (!confirm('Remove this subscriber? This cannot be undone.')) return
    setRemovingId(id)
    try {
      await subscribersAPI.remove(workspaceId, id)
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to remove subscriber:', err)
      const message = err?.response?.data?.error || 'Failed to remove subscriber'
      alert(message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Subscribers</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-black font-medium rounded"
        >
          + Add Subscriber
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-zinc-800 rounded overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wide transition ${
                statusFilter === f.value
                  ? 'bg-amber-500 text-black font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter loaded results by email or name..."
          className="flex-1 max-w-sm px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm"
        />
        {!loading && !error && (
          <span className="text-xs text-zinc-500 uppercase tracking-wide ml-auto">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <h4 className="font-semibold">New Subscriber</h4>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
              <input
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                placeholder="subscriber@example.com"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">First name</label>
              <input
                type="text"
                value={newSubscriber.first_name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, first_name: e.target.value })}
                placeholder="Jane"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Last name</label>
              <input
                type="text"
                value={newSubscriber.last_name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            New subscribers are added as unconfirmed (pending) — the same as a normal signup.
          </p>
          <div className="flex gap-2">
            <button
              onClick={addSubscriber}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Subscriber'}
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

      {/* List */}
      {loading ? (
        <LoadingState label="Loading subscribers" />
      ) : error ? (
        <EmptyState
          title="Couldn't load subscribers"
          description={error}
          action={
            <button
              onClick={() => loadSubscribers(statusFilter)}
              className="px-4 py-2 text-xs uppercase tracking-wide border border-zinc-700 hover:border-white transition"
            >
              Retry
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={subscribers.length === 0 ? 'No subscribers yet' : 'No matches'}
          description={
            subscribers.length === 0
              ? 'Add your first subscriber to get started.'
              : 'Nothing in the loaded results matches that filter.'
          }
        />
      ) : (
        <div className="rounded-lg border border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/60">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const name = [s.first_name, s.last_name].filter(Boolean).join(' ')
                return (
                  <tr key={s.id} className="border-t border-zinc-800">
                    <td className="p-3">{s.email}</td>
                    <td className="p-3 text-zinc-400">{name || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          s.confirmed
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-amber-900/30 text-amber-400'
                        }`}
                      >
                        {s.confirmed ? 'confirmed' : 'pending'}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => removeSubscriber(s.id)}
                        disabled={removingId === s.id}
                        className="text-xs text-zinc-500 hover:text-red-400 uppercase tracking-wide disabled:opacity-50"
                      >
                        {removingId === s.id ? 'Removing...' : 'Remove'}
                      </button>
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
