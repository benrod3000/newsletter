import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { subscribersAPI, getAuthToken } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'
import SubscriberDetailPanel from '../../components/SubscriberDetailPanel'
import { useCommandAction } from '../../components/CommandActionContext'
import { relativeTime } from '../../lib/time'
import GeoFilter from '../../components/GeoFilter'
import { formatDistance } from '../../lib/geo'
import Btn from '../../components/ui/Button'
import { STATUS_FILTERS, HEALTH_STYLES } from './Subscribers/constants'

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
  const [dragActive, setDragActive] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [bulkTagging, setBulkTagging] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [bulkMoving, setBulkMoving] = useState(false)
  const [subscriberLists, setSubscriberLists] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Geo-radius filter
  const [geoFilter, setGeoFilter] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)

  // Audience segments
  const [segments, setSegments] = useState([])
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  const [segmentName, setSegmentName] = useState('')
  const [savingSegment, setSavingSegment] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const searchTimer = useRef(null)

  useEffect(() => {
    if (workspaceId) loadSubscribers()
    document.title = 'Contacts | Veloce'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, statusFilter, dateFrom, dateTo, geoFilter, page])

  useEffect(() => {
    if (!workspaceId) return
    const token = getAuthToken()
    fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscriber-lists`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => setSubscriberLists(d.lists || d || [])).catch(() => {})
    // Load saved segments
    setSegmentsLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/segments`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => { setSegments(d.segments || []); setSegmentsLoading(false) }).catch(() => setSegmentsLoading(false))
  }, [workspaceId])

  async function loadSubscribers() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (statusFilter === 'active' || statusFilter === 'at_risk' || statusFilter === 'cold') {
        params.status = statusFilter
      } else if (statusFilter) {
        params.status = statusFilter
      }
      if (dateFrom) params.joined_after = dateFrom
      if (dateTo) params.joined_before = dateTo
      if (geoFilter) {
        params.near_lat = geoFilter.locations[0].lat
        params.near_lng = geoFilter.locations[0].lng
        params.radius = geoFilter.radius
      }
      if (search.trim()) params.search = search.trim()
      params.limit = perPage
      params.offset = (page - 1) * perPage
      const { data } = await subscribersAPI.list(workspaceId, params)
      setSubscribers(data.subscribers || [])
      setTotal(data.total ?? data.subscribers?.length ?? 0)
    } catch (err) {
      console.error('Failed to load subscribers:', err)
      setError('Could not load subscribers. Is the API running?')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search // resets to page 1 and reloads from server
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      if (workspaceId) loadSubscribers()
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  async function addSubscriber() {
    if (!newSubscriber.email.trim()) { toast.addToast('Please enter an email', 'warning'); return }
    setSaving(true)
    try {
      await subscribersAPI.create(workspaceId, newSubscriber)
      setNewSubscriber({ email: '', first_name: '', last_name: '' })
      setShowAddForm(false)
      await loadSubscribers()
      toast.addToast('Added to your audience.', 'success')
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
      toast.addToast('Removed from your audience.', 'success')
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
    if (selectedIds.size === subscribers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(subscribers.map((s) => s.id)))
    }
  }

  async function bulkRemove() {
    if (!confirm(`Delete ${selectedIds.size} subscriber(s)? This cannot be undone.`)) return
    setBulkRemoving(true)
    try {
      await subscribersAPI.bulkRemove(workspaceId, Array.from(selectedIds))
      setSubscribers((prev) => prev.filter((s) => !selectedIds.has(s.id)))
      setTotal((prev) => Math.max(0, prev - selectedIds.size))
      toast.addToast(`Removed ${selectedIds.size} from your audience.`, 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Bulk delete failed', 'error')
    } finally {
      setBulkRemoving(false)
    }
  }

  // ─── Audience segments ───
  async function saveSegment() {
    if (!segmentName.trim()) return
    setSavingSegment(true)
    try {
      const token = getAuthToken()
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (search.trim()) filters.search = search.trim()
      if (geoFilter) filters.geoFilter = geoFilter
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: segmentName.trim(), filters }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.addToast(`Segment "${segmentName.trim()}" saved`, 'success')
        setSegmentName('')
        setSegments(prev => [data.segment, ...prev])
      } else toast.addToast(data.error || 'Failed to save', 'error')
    } catch { toast.addToast('Failed to save segment', 'error') }
    finally { setSavingSegment(false) }
  }

  function applySegment(s) {
    const f = s.filters || {}
    setStatusFilter(f.status || '')
    setSearch(f.search || '')
    setGeoFilter(f.geoFilter || null)
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
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none"><span className="text-brutal-green">Contacts</span></h2>
        <div className="flex gap-3">
          <Btn
            variant="secondary"
            size="md"
            onClick={() => setShowImport(!showImport)}
          >
            {showImport ? 'Cancel Import' : 'Import CSV'}
          </Btn>
          <Btn
            variant="primary"
            size="md"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Subscriber
          </Btn>
        </div>
      </div>

      {/* CSV Import */}
      {showImport && (
        <div className="border-3 border-brutal-fg bg-white p-8 space-y-6">
          <h4 className="font-heading text-xl uppercase tracking-wide">Import Contacts (CSV)</h4>

          {/* Visual CSV template */}
          <div className="border-2 border-brutal-fg/20 bg-brutal-bg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b-2 border-brutal-fg/20 bg-brutal-surface">
              <p className="text-[9px] font-bold uppercase tracking-wider">📄 template.csv</p>
              <button
                onClick={() => {
                  const csv = 'email,first_name,last_name,phone_number,country,region,city,timezone\njane@example.com,Jane,Doe,+15125550199,US,California,Los Angeles,America/Los_Angeles\njohn@example.com,John,Smith,+12125550199,US,New York,New York,America/New_York'
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'subscribers-template.csv'; a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 border border-brutal-fg bg-white hover:bg-brutal-yellow/20 transition"
              >
                ⬇ Download Template
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-[10px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-brutal-fg/20">
                    <th className="text-left font-bold px-2 py-1 text-brutal-green">email *</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">first_name</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">last_name</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">phone_number</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">country</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">region</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">city</th>
                    <th className="text-left font-bold px-2 py-1 text-brutal-muted">timezone</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-brutal-fg/10">
                    <td className="px-2 py-1.5">jane@example.com</td>
                    <td className="px-2 py-1.5">Jane</td>
                    <td className="px-2 py-1.5">Doe</td>
                    <td className="px-2 py-1.5">+15125550199</td>
                    <td className="px-2 py-1.5">US</td>
                    <td className="px-2 py-1.5">California</td>
                    <td className="px-2 py-1.5">Los Angeles</td>
                    <td className="px-2 py-1.5">America/Los_Angeles</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1.5">john@example.com</td>
                    <td className="px-2 py-1.5">John</td>
                    <td className="px-2 py-1.5">Smith</td>
                    <td className="px-2 py-1.5">+12125550199</td>
                    <td className="px-2 py-1.5">US</td>
                    <td className="px-2 py-1.5">New York</td>
                    <td className="px-2 py-1.5">New York</td>
                    <td className="px-2 py-1.5">America/New_York</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
            Paste CSV or drag a .csv file. Must include an <strong>email</strong> column. Optional: first_name, last_name, phone_number (10 digits), country, region, city, timezone
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { setDragActive(false); handleFileDrop(e) }}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition ${
              dragActive ? 'border-brutal-green bg-brutal-green/5' : 'border-brutal-fg/30 hover:border-brutal-fg'
            } ${importCsvText ? 'bg-brutal-green/10 border-brutal-green border-solid' : ''}`}
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
          <Btn
            variant="primary"
            size="md"
            onClick={importSubscribers}
            disabled={importing || !importCsvText.trim()}
            loading={importing}
          >
            {importing ? 'Importing...' : 'Import Subscribers'}
          </Btn>
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
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
          await loadSubscribers()
          setGeoLoading(false)
        }}
        onClear={() => {
          setGeoFilter(null)
          loadSubscribers()
        }}
        loading={geoLoading}
        active={!!geoFilter}
        subscribers={subscribers}
      />

      {/* Save current filter as a segment */}
      {(statusFilter || search.trim() || geoFilter) && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={segmentName}
            onChange={e => setSegmentName(e.target.value)}
            placeholder="Name this segment..."
            maxLength={60}
            className="flex-1 max-w-xs px-3 py-1.5 bg-white border-3 border-brutal-fg text-xs focus:outline-none focus:bg-brutal-yellow/10"
          />
          <button
            onClick={saveSegment}
            disabled={!segmentName.trim() || savingSegment}
            className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal disabled:opacity-40 transition"
          >
            {savingSegment ? 'Saving...' : '💾 Save Filter'}
          </button>
        </div>
      )}

      {/* Saved segments */}
      {segmentsLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-20 h-6 border-2 border-brutal-fg/10 bg-brutal-surface/50 animate-pulse" />
          ))}
        </div>
      ) : segments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {segments.map(s => (
            <button
              key={s.id}
              onClick={() => applySegment(s)}
              className="px-2.5 py-1 border-2 border-brutal-fg text-[9px] font-bold uppercase tracking-wider bg-white hover:bg-brutal-yellow/20 transition"
            >
              🔖 {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-[57px] z-30 border-3 border-brutal-fg bg-brutal-yellow p-4 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-bold uppercase tracking-wider">
            {selectedIds.size} selected
          </span>
          <span className="flex-1" />
          <Btn
            variant="secondary"
            size="md"
            onClick={exportCsv}
          >
            Export CSV
          </Btn>
          <div className="relative">
            <button
              onClick={() => setShowListPicker(!showListPicker)}
              disabled={bulkMoving}
              className="px-4 py-2 bg-white border-3 border-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50"
            >
              {bulkMoving ? 'Moving...' : 'Move to List'}
            </button>
            {showListPicker && (
              <div className="absolute top-full right-0 mt-1 border-3 border-brutal-fg bg-white shadow-brutal z-40 min-w-[180px]">
                <div className="border-b-2 border-brutal-fg bg-brutal-yellow px-3 py-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Select List</span>
                </div>
                {subscriberLists?.map((list) => (
                  <button
                    key={list.id}
                    onClick={async () => {
                      setShowListPicker(false)
                      setBulkMoving(true)
                      try {
                        const token = getAuthToken()
                        await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscriber-lists/${list.id}/members`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ subscriber_ids: Array.from(selectedIds) }),
                        })
                        toast.addToast(`Moved ${selectedIds.size} subscribers to "${list.name}"`, 'success')
                        setSelectedIds(new Set())
                      } catch {
                        toast.addToast('Failed to move subscribers', 'error')
                      } finally { setBulkMoving(false) }
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-brutal-yellow/20 border-b border-brutal-fg/10 last:border-0"
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              const tag = prompt('Tag name:')
              if (!tag) return
              setBulkTagging(true)
              try {
                const token = getAuthToken()
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscribers/tags/bulk`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ subscriberIds: Array.from(selectedIds), tag }),
                })
                const data = await res.json()
                if (data.ok) {
                  toast.addToast(`Tagged ${data.tagged} subscribers with "${tag}"`, 'success')
                } else {
                  toast.addToast(data.error || 'Failed to tag subscribers', 'error')
                }
              } catch {
                toast.addToast('Failed to tag subscribers', 'error')
              } finally {
                setBulkTagging(false)
                setSelectedIds(new Set())
              }
            }}
            disabled={bulkTagging}
            className="px-4 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50"
          >
            {bulkTagging ? 'Tagging...' : 'Tag Selected'}
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
        <div className="border-3 border-brutal-fg bg-white p-8 space-y-6">
          <h4 className="font-heading text-xl uppercase tracking-wide">New Contact</h4>
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Email</label>
              <input
                type="email"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                placeholder="subscriber@example.com"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                autoFocus
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
            New subscribers are added as unconfirmed (pending), the same as a normal signup.
          </p>
          <div className="flex gap-3">
            <Btn
              variant="primary"
              size="md"
              onClick={addSubscriber}
              disabled={saving}
              loading={saving}
            >
              {saving ? 'Adding...' : 'Add Subscriber'}
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

      {/* List */}
      {loading ? (
        <LoadingState label="Loading subscribers" />
      ) : error ? (
        <EmptyState
          title="Couldn't load subscribers"
          description={error}
          action={{ label: 'Retry', onClick: () => loadSubscribers() }}
        />
      ) : subscribers.length === 0 ? (
        <EmptyState
          title={total === 0 && !search ? 'Your audience starts here' : 'No matches'}
          description={
            total === 0 && !search
              ? 'Import your contacts or create a signup form.'
              : 'Nothing matches that filter or search. Try different criteria.'
          }
          variant="subscribers"
          action={!search ? { label: '+ Add Subscriber', onClick: () => setShowAddForm(true) } : undefined}
        />
      ) : (
        <div className="border-3 border-brutal-fg overflow-x-auto bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-3 border-brutal-fg bg-brutal-bg">
                <th className="w-10 p-3 hidden md:table-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === subscribers.length && subscribers.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 accent-brutal-fg cursor-pointer"
                  />
                </th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Name</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden lg:table-cell">📍 Location</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden md:table-cell">📱 Phone</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Joined</th>
                {geoFilter && <th className="text-right p-3 font-bold text-xs uppercase tracking-wider">Distance</th>}
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => {
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
                    <td className="p-3 text-brutal-muted hidden sm:table-cell" title={name || undefined}>{name || '--'}</td>
                    <td className="p-3 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 border border-brutal-fg ${s.confirmed ? 'bg-brutal-green text-white' : 'bg-brutal-yellow text-brutal-fg'}`}>
                          {s.confirmed ? 'confirmed' : 'pending'}
                        </span>
                        {s.health_score && HEALTH_STYLES[s.health_score] && (
                          <span className={`text-xs font-bold px-2 py-1 border border-brutal-fg ${HEALTH_STYLES[s.health_score]}`}>
                            {s.health_score === 'active' ? '🟢' : s.health_score === 'at_risk' ? '🟡' : '🔴'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[11px] text-brutal-muted hidden lg:table-cell">
                      {[s.city, s.region, s.postal_code].filter(Boolean).join(', ') || '--'}
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
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t-3 border-brutal-fg bg-brutal-bg px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-30 disabled:hover:shadow-none"
                >
                  ← Previous
                </button>
                <span className="text-[10px] font-bold text-brutal-muted px-2">
                  {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} of {total.toLocaleString()}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border-2 border-brutal-fg bg-white text-[10px] font-bold uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-30 disabled:hover:shadow-none"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
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
