import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { subscribersAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'
import SubscriberDetailPanel from '../../components/SubscriberDetailPanel'
import { useCommandAction } from '../../components/CommandActionContext'
import { relativeTime } from '../../lib/time'
import GeoFilter from '../../components/GeoFilter'
import { formatDistance } from '../../lib/geo'

// Matches the real `subscribers` table: there's no generic "status" string —
// just a `confirmed` boolean. Unsubscribing hard-deletes the row entirely
// (see /api/unsubscribe), so an "unsubscribed" state never actually shows
// up here — a subscriber is either present (confirmed or pending) or gone.
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: '🟢 Active' },
  { value: 'at_risk', label: '🟡 At Risk' },
  { value: 'cold', label: '🔴 Cold' },
]

const HEALTH_STYLES = {
  active: 'bg-brutal-green text-white',
  at_risk: 'bg-brutal-yellow text-brutal-fg',
  cold: 'bg-brutal-red text-white',
}

const btn = 'px-4 py-2 border-3 border-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition'
const btnPrimary = `${btn} bg-brutal-yellow text-brutal-fg`
const btnSecondary = `${btn} bg-white text-brutal-fg`

export default function SubscribersPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()
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
  const [selectedSubscriber, setSelectedSubscriber] = useState(null)
  const { action, consume } = useCommandAction()

  // Listen for command palette actions
  useEffect(() => {
    if (!action) return
    const id = action.id
    consume()
    if (id === 'add-subscriber') setShowAddForm(true)
    else if (id === 'export-csv') exportCsv()
    else if (id === 'import-csv') setShowImport(true)
  }, [action?.timestamp])

  // CSV import
  const [showImport, setShowImport] = useState(false)
  const [importCsvText, setImportCsvText] = useState('')
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Geo-radius filter
  const [geoFilter, setGeoFilter] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)

  useEffect(() => {
    if (workspaceId) loadSubscribers(statusFilter)
    document.title = 'Subscribers — Veloce'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, statusFilter])

  async function loadSubscribers(status) {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (status === 'active' || status === 'at_risk' || status === 'cold') {
        params.status = status
      } else if (status) {
        params.status = status
      }
      if (dateFrom) params.joined_after = dateFrom
      if (dateTo) params.joined_before = dateTo
      if (geoFilter) {
        params.near_lat = geoFilter.lat
        params.near_lng = geoFilter.lng
        params.radius = geoFilter.radius
      }
      const { data } = await subscribersAPI.list(workspaceId, Object.keys(params).length ? params : undefined)
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
    if (!newSubscriber.email.trim()) { toast.addToast('Please enter an email', 'warning'); return }
    setSaving(true)
    try {
      await subscribersAPI.create(workspaceId, newSubscriber)
      setNewSubscriber({ email: '', first_name: '', last_name: '' })
      setShowAddForm(false)
      await loadSubscribers(statusFilter)
      toast.addToast('Subscriber added', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to add', 'error')
    } finally { setSaving(false) }
  }

  async function removeSubscriber(id) {
    if (!confirm('Remove this subscriber?')) return
    setRemovingId(id)
    try {
      await subscribersAPI.remove(workspaceId, id)
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      setSelectedSubscriber(null)
      toast.addToast('Subscriber removed', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to remove', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)))
    }
  }

  async function bulkRemove() {
    if (!confirm(`Delete ${selectedIds.size} subscriber(s)? This cannot be undone.`)) return
    setBulkRemoving(true)
    try {
      await subscribersAPI.bulkRemove(workspaceId, Array.from(selectedIds))
      setSubscribers((prev) => prev.filter((s) => !selectedIds.has(s.id)))
      setTotal((prev) => Math.max(0, prev - selectedIds.size))
      toast.addToast(`Deleted ${selectedIds.size} subscriber(s)`, 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Bulk delete failed', 'error')
    } finally {
      setBulkRemoving(false)
    }
  }

  async function exportCsv() {
    try {
      const response = await subscribersAPI.exportCsv(workspaceId, statusFilter ? { status: statusFilter } : undefined)
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscribers-${workspaceId.slice(0, 8)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.addToast('Exported CSV', 'success')
    } catch (err) {
      toast.addToast('Failed to export', 'error')
    }
  }

  async function importSubscribers() {
    if (!importCsvText.trim()) { toast.addToast('Paste CSV data first', 'warning'); return }
    setImporting(true)
    setImportResult(null)
    try {
      const { data } = await subscribersAPI.importCsv(workspaceId, importCsvText, importConfirmed)
      setImportResult(data)
      setImportCsvText('')
      toast.addToast(`Imported ${data.processed} subscriber(s)`, 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  function handleFileDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImportCsvText(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">Subscribers</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(!showImport)}
            className={btnSecondary}
          >
            {showImport ? 'Cancel Import' : 'Import CSV'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={btnPrimary}
          >
            + Add Subscriber
          </button>
        </div>
      </div>

      {/* CSV Import */}
      {showImport && (
        <div className="border-3 border-brutal-fg bg-white p-8 space-y-5">
          <h4 className="font-heading text-xl uppercase tracking-wide">Import Subscribers (CSV)</h4>
          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
            Paste CSV or drag a .csv file. Must include an <strong>email</strong> column. Optional: first_name, last_name, phone_number, country, region, city, timezone
          </p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-brutal-fg/30 p-8 text-center cursor-pointer hover:border-brutal-fg transition"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileDrop}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer">
              <p className="text-sm font-bold uppercase tracking-wider text-brutal-muted">
                {importCsvText ? 'File loaded ✓' : 'Drop CSV file here or click to browse'}
              </p>
            </label>
          </div>
          <textarea
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            rows={6}
            placeholder="Or paste CSV here...&#10;email,first_name,last_name&#10;jane@example.com,Jane,Doe"
            className="w-full px-4 py-3 bg-brutal-bg border-3 border-brutal-fg text-sm font-mono focus:outline-none resize-y placeholder:text-brutal-muted"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={importConfirmed}
              onChange={(e) => setImportConfirmed(e.target.checked)}
              id="import-confirmed"
              className="w-4 h-4 accent-brutal-fg"
            />
            <label htmlFor="import-confirmed" className="text-xs font-bold text-brutal-fg/60 uppercase tracking-wider">
              Mark as confirmed (skip verification emails)
            </label>
          </div>
          {importResult && (
            <div className="border border-brutal-fg p-3 bg-brutal-bg text-sm">
              <span className="font-bold">Imported: {importResult.processed}</span>
              {importResult.skipped > 0 && (
                <span className="text-brutal-muted ml-3">Skipped: {importResult.skipped}</span>
              )}
            </div>
          )}
          <button
            onClick={importSubscribers}
            disabled={importing || !importCsvText.trim()}
            className={btnPrimary + ' disabled:opacity-50'}
          >
            {importing ? 'Importing...' : 'Import Subscribers'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border-3 border-brutal-fg overflow-hidden">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${
                statusFilter === f.value
                  ? 'bg-brutal-yellow text-brutal-fg'
                  : 'bg-white text-brutal-muted hover:text-brutal-fg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 bg-white border-3 border-brutal-fg text-xs font-bold focus:outline-none"
          title="Joined after" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 bg-white border-3 border-brutal-fg text-xs font-bold focus:outline-none"
          title="Joined before" />
        <div className="flex gap-2 items-center">
          {[
            { value: 'active', label: '🟢 Active', cls: 'border-brutal-green text-brutal-green' },
            { value: 'at_risk', label: '🟡 At Risk', cls: 'border-brutal-yellow text-brutal-fg' },
            { value: 'cold', label: '🔴 Cold', cls: 'border-brutal-red text-brutal-red' },
          ].map(chip => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(statusFilter === chip.value ? '' : chip.value)}
              className={`px-3 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
                statusFilter === chip.value
                  ? `${chip.cls} bg-white`
                  : 'border-brutal-fg/20 text-brutal-muted hover:border-brutal-fg'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter loaded results by email or name..."
          className="flex-1 max-w-sm px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
        />
        {!loading && !error && (
          <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider ml-auto">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Geo-radius filter */}
      <GeoFilter
        onChange={async (geo) => {
          setGeoFilter(geo)
          setGeoLoading(true)
          await loadSubscribers(statusFilter)
          setGeoLoading(false)
        }}
        onClear={() => {
          setGeoFilter(null)
          loadSubscribers(statusFilter)
        }}
        loading={geoLoading}
        active={!!geoFilter}
      />

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-[57px] z-30 border-3 border-brutal-fg bg-brutal-yellow p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold uppercase tracking-wider">
            {selectedIds.size} selected
          </span>
          <span className="flex-1" />
          <button
            onClick={exportCsv}
            className={btnSecondary}
          >
            Export CSV
          </button>
          <button
            onClick={bulkRemove}
            disabled={bulkRemoving}
            className="px-4 py-2 bg-white border-3 border-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
          >
            {bulkRemoving ? 'Deleting...' : `Delete ${selectedIds.size}`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-bold uppercase tracking-wider hover:opacity-70"
          >
            Clear
          </button>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="border-3 border-brutal-fg bg-white p-8 space-y-5">
          <h4 className="font-heading text-xl uppercase tracking-wide">New Subscriber</h4>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Email</label>
              <input
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                placeholder="subscriber@example.com"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">First name</label>
              <input
                type="text"
                value={newSubscriber.first_name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, first_name: e.target.value })}
                placeholder="Jane"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Last name</label>
              <input
                type="text"
                value={newSubscriber.last_name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, last_name: e.target.value })}
                placeholder="Doe"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>
          </div>
          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
            New subscribers are added as unconfirmed (pending) — the same as a normal signup.
          </p>
          <div className="flex gap-3">
            <button
              onClick={addSubscriber}
              disabled={saving}
              className={btnPrimary + ' disabled:opacity-50'}
            >
              {saving ? 'Adding...' : 'Add Subscriber'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className={btnSecondary}
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
          action={{ label: 'Retry', onClick: () => loadSubscribers(statusFilter) }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={subscribers.length === 0 ? 'No subscribers yet' : 'No matches'}
          description={
            subscribers.length === 0
              ? 'Add your first subscriber to get started.'
              : 'Nothing in the loaded results matches that filter.'
          }
          variant="subscribers"
          action={subscribers.length === 0 ? { label: '+ Add Subscriber', onClick: () => setShowAddForm(true) } : undefined}
        />
      ) : (
        <div className="border-3 border-brutal-fg overflow-x-auto bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                <th className="w-10 p-3 hidden md:table-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 accent-brutal-fg cursor-pointer"
                  />
                </th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Name</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Joined</th>
                {geoFilter && <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Distance</th>}
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const name = [s.first_name, s.last_name].filter(Boolean).join(' ')
                return (
                  <tr key={s.id} className="border-t border-brutal-fg hover:bg-brutal-yellow/10 cursor-pointer transition" onClick={() => setSelectedSubscriber(s)}>
                    <td className="p-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="w-4 h-4 accent-brutal-fg cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-bold" title={s.email}>{s.email}</td>
                    <td className="p-3 text-brutal-muted hidden sm:table-cell" title={name || undefined}>{name || '—'}</td>
                    <td className="p-3 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-1 border border-brutal-fg ${
                            s.confirmed
                              ? 'bg-brutal-green text-white'
                              : 'bg-brutal-yellow text-brutal-fg'
                          }`}
                        >
                          {s.confirmed ? 'confirmed' : 'pending'}
                        </span>
                        {s.health_score && HEALTH_STYLES[s.health_score] && (
                          <span className={`text-xs font-bold px-2 py-1 border border-brutal-fg ${HEALTH_STYLES[s.health_score]}`}>
                            {s.health_score === 'active' ? '🟢' : s.health_score === 'at_risk' ? '🟡' : '🔴'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-brutal-muted text-xs hidden md:table-cell" title={s.created_at ? new Date(s.created_at).toLocaleDateString() : undefined}>
                      {relativeTime(s.created_at)}
                    </td>
                    {geoFilter && (
                      <td className="p-3 text-right">
                        <span className="text-xs font-bold text-brutal-green animate-bounce-in" title={`${s.distance} miles`}>
                          🏠 {formatDistance(s.distance)}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => removeSubscriber(s.id)}
                        disabled={removingId === s.id}
                        className="text-xs font-bold text-brutal-red uppercase tracking-wider hover:opacity-70 disabled:opacity-50"
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

      <SubscriberDetailPanel
        subscriber={selectedSubscriber}
        onClose={() => setSelectedSubscriber(null)}
        onRemove={removeSubscriber}
      />
    </div>
  )
}
