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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">Subscriber Lists</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
        >
          + New List
        </button>
      </div>

      {showAddForm && (
        <div className="border-brutal border-brutal-fg bg-white p-8 space-y-5">
          <h4 className="font-heading text-xl uppercase tracking-wide">New List</h4>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">List Name</label>
            <input
              type="text"
              value={newList.name}
              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              placeholder="e.g., VIP Customers"
              className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              placeholder="What is this list for?"
              className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Opt-in type</label>
            <select
              value={newList.opt_in_type}
              onChange={(e) => setNewList({ ...newList, opt_in_type: e.target.value })}
              className="w-full sm:w-64 px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
            >
              <option value="single">Single opt-in</option>
              <option value="double">Double opt-in</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createList}
              disabled={saving}
              className="px-5 py-2.5 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create List'}
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
        <LoadingState label="Loading lists" />
      ) : error ? (
        <EmptyState
          title="Couldn't load lists"
          description={error}
          action={
            <button
              onClick={loadLists}
              className="px-4 py-2 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80"
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((l) => (
            <div
              key={l.id}
              className="border-brutal border-brutal-fg bg-white p-5 flex flex-col justify-between"
            >
              <div>
                <h4 className="font-heading text-lg uppercase tracking-wide">{l.name}</h4>
                {l.description && (
                  <p className="text-sm text-brutal-muted mt-1">{l.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-brutal-fg">
                <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
                  {l.opt_in_type === 'double' ? 'Double opt-in' : 'Single opt-in'}
                </span>
                <button
                  onClick={() => removeList(l.id)}
                  disabled={removingId === l.id}
                  className="text-xs font-bold text-brutal-fg/50 uppercase tracking-wider hover:text-brutal-fg disabled:opacity-50"
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
