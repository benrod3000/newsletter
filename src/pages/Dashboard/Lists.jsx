import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'
import Btn from '../../components/ui/Button'
import { useCommandAction } from '../../components/useCommandAction'
import ConfirmModal from '../../components/ConfirmModal'

export default function ListsPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()
  const [lists, setLists] = useState([])
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newList, setNewList] = useState({ name: '', description: '', opt_in_type: 'single' })
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const { action, consume } = useCommandAction()

  useEffect(() => {
    if (!action) return
    const id = action.id
    consume()
    if (id === 'create-list') setShowAddForm(true)
  }, [action?.timestamp])

  useEffect(() => {
    if (workspaceId) loadLists()
    document.title = 'Segments | Veloce'
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
    if (!newList.name.trim()) { toast.addToast('Please enter a list name', 'warning'); return }
    setSaving(true)
    try {
      await listsAPI.create(workspaceId, newList)
      setNewList({ name: '', description: '', opt_in_type: 'single' })
      setShowAddForm(false)
      await loadLists()
      toast.addToast('List created', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to create list', 'error')
    } finally { setSaving(false) }
  }

  async function removeList(id) {
    setConfirmDeleteId(null)
    setRemovingId(id)
    try {
      await listsAPI.remove(workspaceId, id)
      setLists((prev) => prev.filter((l) => l.id !== id))
      toast.addToast('List deleted', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to delete list', 'error')
    } finally { setRemovingId(null) }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
          <span className="text-brutal-green">Segments</span>
        </h2>
        <Btn
          variant="primary"
          size="md"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          + New List
        </Btn>
      </div>

      {showAddForm && (
        <div className="border-3 border-brutal-fg bg-white p-8 space-y-6">
          <h4 className="font-heading text-xl uppercase tracking-wide">New Segment</h4>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Segment Name</label>
            <input
              type="text"
              value={newList.name}
              onChange={(e) => setNewList({ ...newList, name: e.target.value })}
              placeholder="e.g., VIP Customers"
              className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={newList.description}
              onChange={(e) => setNewList({ ...newList, description: e.target.value })}
              placeholder="What is this list for?"
              className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Opt-in type</label>
            <select
              value={newList.opt_in_type}
              onChange={(e) => setNewList({ ...newList, opt_in_type: e.target.value })}
              className="w-full sm:w-64 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
            >
              <option value="single">Single opt-in</option>
              <option value="double">Double opt-in</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Btn
              variant="primary"
              size="md"
              onClick={createList}
              disabled={saving}
              loading={saving}
            >
              {saving ? 'Creating...' : 'Create Segment'}
            </Btn>
            <Btn
              variant="secondary"
              size="md"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading lists" />
      ) : error ? (
        <EmptyState
          title="Couldn't load lists"
          description={error}
          action={{ label: 'Retry', onClick: loadLists }}
        />
      ) : lists.length === 0 ? (
        <EmptyState
          title="No segments yet"
          description="Create a segment to organize your contacts."
          variant="lists"
          action={{ label: '+ New Segment', onClick: () => setShowAddForm(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((l) => (
            <div
              key={l.id}
              className="border-3 border-brutal-fg bg-white p-5 flex flex-col justify-between"
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
                  onClick={() => setConfirmDeleteId(l.id)}
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

      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete list"
        message="The list will be deleted. Subscribers on it are kept in your audience."
        confirmLabel="Delete list"
        danger
        onConfirm={() => removeList(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
