import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'

export default function ListsPage() {
  const { workspaceId } = useAuthStore()
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newList, setNewList] = useState({ name: '', description: '', opt_in_type: 'single' })
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (workspaceId) loadLists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadLists() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await listsAPI.list(workspaceId)
      setLists(data.lists || [])
    } catch (err) {
      console.error('Failed to load lists:', err)
      setError('Could not load lists. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  async function createList() {
    if (!newList.name.trim()) {
      alert('Please enter a list name')
      return
    }
    setSaving(true)
    try {
      await listsAPI.create(workspaceId, newList)
      setNewList({ name: '', description: '', opt_in_type: 'single' })
      setShowAddForm(false)
      await loadLists()
    } catch (err) {
      console.error('Failed to create list:', err)
      const message = err?.response?.data?.error || 'Failed to create list'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  async function removeList(id) {
    if (!confirm('Delete this list? Subscribers on it will not be deleted.')) return
    setRemovingId(id)
    try {
      await listsAPI.remove(workspaceId, id)
      setLists((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      console.error('Failed to delete list:', err)
      const message = err?.response?.data?.error || 'Failed to delete list'
      alert(message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Subscriber Lists</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-black font-medium rounded"
        >
          + New List
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <h4 className="font-semibold">New List</h4>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">List Name</label>
            <input
              type="text"
              value={newList.name}
              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              placeholder="e.g., VIP Customers"
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description (optional)</label>
            <input
              type="text"
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              placeholder="What is this list for?"
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Opt-in type</label>
            <select
              value={newList.opt_in_type}
              onChange={(e) => setNewList({ ...newList, opt_in_type: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            >
              <option value="single">Single opt-in</option>
              <option value="double">Double opt-in</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createList}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create List'}
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
        <LoadingState label="Loading lists" />
      ) : error ? (
        <EmptyState
          title="Couldn't load lists"
          description={error}
          action={
            <button
              onClick={loadLists}
              className="px-4 py-2 text-xs uppercase tracking-wide border border-zinc-700 hover:border-white transition"
            >
              Retry
            </button>
          }
        />
      ) : lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create a list to start segmenting your audience."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((l) => (
            <div
              key={l.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col justify-between"
            >
              <div>
                <h4 className="font-semibold text-white">{l.name}</h4>
                {l.description && (
                  <p className="text-sm text-zinc-500 mt-1">{l.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">
                  {l.opt_in_type === 'double' ? 'Double opt-in' : 'Single opt-in'}
                </span>
                <button
                  onClick={() => removeList(l.id)}
                  disabled={removingId === l.id}
                  className="text-xs text-zinc-500 hover:text-red-400 uppercase tracking-wide disabled:opacity-50"
                >
                  {removingId === l.id ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
