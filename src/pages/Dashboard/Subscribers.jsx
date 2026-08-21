import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { subscribersAPI, savedFiltersAPI, getAuthToken } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'
import SubscriberDetailPanel from '../../components/SubscriberDetailPanel'
import { useCommandAction } from '../../components/useCommandAction'
import { relativeTime } from '../../lib/time'
import GeoFilter from '../../components/GeoFilter'
import { formatDistance } from '../../lib/geo'
import Btn from '../../components/ui/Button'
import ConfirmModal from '../../components/ConfirmModal'
import PromptModal from '../../components/PromptModal'
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
  const [importConsent, setImportConsent] = useState(false)
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importProgress, setImportProgress] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [bulkTagging, setBulkTagging] = useState(false)
  // Destructive actions and free-text input go through in-app dialogs rather
  // than window.confirm/prompt.
  const [confirmBulkRemove, setConfirmBulkRemove] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState(null)
  const [tagPromptOpen, setTagPromptOpen] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [bulkMoving, setBulkMoving] = useState(false)
  const [newListPromptOpen, setNewListPromptOpen] = useState(false)
  const [subscriberLists, setSubscriberLists] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Geo-radius filter
  const [geoFilter, setGeoFilter] = useState(null)
  // geoLoading removed: it tracked the duplicate load that no longer happens.
  // The GeoFilter spinner now reads the page's own `loading`, which is the
  // request it was always meant to be reporting on.
  /**
   * Sequence number for list requests, so a slow earlier response cannot
   * overwrite a newer one.
   *
   * Applying a radius fired two loads at once - one directly from the
   * GeoFilter's onChange and one from the effect below, which watches
   * geoFilter. The direct call read the state it was in the middle of setting,
   * so it requested the *unfiltered* list, and whichever finished last won.
   * The unfiltered query counts 10,310 rows with count:exact and is reliably
   * the slower of the two, so it usually landed second and replaced the seven
   * matches with everybody - which is exactly what "it says 7 and shows all"
   * looks like.
   *
   * The duplicate call is gone (see the GeoFilter props below), and this makes
   * the remaining ordering safe rather than relying on it.
   */
  const loadSeq = useRef(0)

  // Audience segments
  const [segments, setSegments] = useState([])
  const [segmentsLoading, setSegmentsLoading] = useState(true)
  // Which saved filter is currently applied, so the UI can show it and offer
  // a way back. Cleared by any manual filter change below.
  const [activeSegmentId, setActiveSegmentId] = useState(null)
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
    // Through the API client so an expired session redirects to sign in rather
    // than silently rendering an empty filter bar.
    setSegmentsLoading(true)
    savedFiltersAPI.list(workspaceId)
      .then(({ data }) => setSegments(data?.segments || data?.data?.segments || []))
      .catch(() => setSegments([]))
      .finally(() => setSegmentsLoading(false))
  }, [workspaceId])

  async function loadSubscribers() {
    const seq = ++loadSeq.current
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
      if (geoFilter?.locations?.length) {
        // The radius lives on the location, not on the payload - GeoFilter emits
        // `{ locations: [{ lat, lng, radius, ... }] }` and each area carries its
        // own. Reading `geoFilter.radius` gave undefined, axios dropped the
        // param, and the API fell back to its 10-mile default: pick 25 miles and
        // you silently got 10.
        const [area] = geoFilter.locations
        params.near_lat = area.lat
        params.near_lng = area.lng
        params.radius = area.radius ?? 10
      }
      if (search.trim()) params.search = search.trim()
      params.limit = perPage
      params.offset = (page - 1) * perPage
      const { data } = await subscribersAPI.list(workspaceId, params)
      if (seq !== loadSeq.current) return // A newer request has already answered.
      setSubscribers(data.subscribers || [])
      setTotal(data.total ?? data.subscribers?.length ?? 0)
    } catch (err) {
      if (seq !== loadSeq.current) return
      console.error('Failed to load subscribers:', err)
      setError('Could not load subscribers. Is the API running?')
    } finally {
      if (seq === loadSeq.current) setLoading(false)
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

  /**
   * Create a list and put the current selection in it, in one step.
   *
   * Two calls rather than one endpoint, because the API has no
   * create-with-members route and inventing one for this is more surface than
   * the feature needs. The order matters: if the member add fails, the list
   * still exists and is visible in the picker, so a retry is "move to list"
   * rather than a duplicate-name 409.
   */
  async function createListFromSelection(name) {
    setNewListPromptOpen(false)
    setBulkMoving(true)
    const ids = Array.from(selectedIds)
    try {
      const token = getAuthToken()
      const base = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

      const createRes = await fetch(`${base}/api/clients/${workspaceId}/subscriber-lists`, {
        method: 'POST', headers, body: JSON.stringify({ name }),
      })
      if (!createRes.ok) {
        // 409 is the common one and is worth saying plainly - the name is taken.
        const msg = createRes.status === 409
          ? `A list called "${name}" already exists.`
          : `Could not create the list (HTTP ${createRes.status}).`
        toast.addToast(msg, 'error')
        return
      }
      const created = await createRes.json().catch(() => null)
      const list = created?.list ?? created?.data?.list ?? created
      if (!list?.id) {
        toast.addToast('List created, but the response had no id - add the members from the picker.', 'error')
        return
      }

      const addRes = await fetch(`${base}/api/clients/${workspaceId}/subscriber-lists/${list.id}/members`, {
        method: 'POST', headers, body: JSON.stringify({ subscriber_ids: ids }),
      })
      if (!addRes.ok) throw new Error(`HTTP ${addRes.status}`)
      const body = await addRes.json().catch(() => null)
      const added = body?.added ?? ids.length

      setSubscriberLists((prev) => [...prev, list])
      setSelectedIds(new Set())
      toast.addToast(`Created "${name}" with ${added} contact${added === 1 ? '' : 's'}.`, 'success')
    } catch {
      toast.addToast(`List "${name}" was created but the contacts could not be added. Try Move to List.`, 'error')
    } finally {
      setBulkMoving(false)
    }
  }

  async function bulkTag(tag) {
    setTagPromptOpen(false)
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
  }

  async function bulkRemove() {
    setConfirmBulkRemove(false)
    setBulkRemoving(true)
    try {
      const res = await subscribersAPI.bulkRemove(workspaceId, Array.from(selectedIds))
      // Trust the server's count: ids the workspace doesn't own are filtered out.
      const removed = res?.data?.deleted ?? selectedIds.size
      setSubscribers((prev) => prev.filter((s) => !selectedIds.has(s.id)))
      setTotal((prev) => Math.max(0, prev - removed))
      toast.addToast(`Removed ${removed} from your audience.`, 'success')
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
      const filters = {}
      if (statusFilter) filters.status = statusFilter
      if (search.trim()) filters.search = search.trim()
      if (geoFilter) filters.geoFilter = geoFilter
      const { data } = await savedFiltersAPI.create(workspaceId, { name: segmentName.trim(), filters })
      const saved = data?.segment || data?.data?.segment
      toast.addToast(`Saved filter "${segmentName.trim()}"`, 'success')
      setSegmentName('')
      if (saved) setSegments(prev => [saved, ...prev])
      setActiveSegmentId(saved?.id ?? null)
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to save filter', 'error')
    }
    finally { setSavingSegment(false) }
  }

  function applySegment(s) {
    const f = s.filters || {}
    setStatusFilter(f.status || '')
    setSearch(f.search || '')
    setGeoFilter(f.geoFilter || null)
    setActiveSegmentId(s.id)
  }

  function clearSegment() {
    setStatusFilter('')
    setSearch('')
    setGeoFilter(null)
    setActiveSegmentId(null)
  }

  async function removeSegment(id, name) {
    try {
      await savedFiltersAPI.remove(workspaceId, id)
      setSegments(prev => prev.filter(s => s.id !== id))
      if (activeSegmentId === id) setActiveSegmentId(null)
      toast.addToast(`Removed "${name}"`, 'success')
    } catch {
      toast.addToast('Failed to remove filter', 'error')
    }
  }

  /**
   * Export contacts as CSV.
   *
   * Pass `{ selection: true }` to export only the ticked rows. Without it the export
   * follows the current status filter, which is what the header button means.
   *
   * These were the same action before, offered from the bulk bar - so ticking five
   * contacts and pressing Export produced the entire list. Two call sites now, each
   * saying which set it means.
   */
  async function exportCsv({ selection = false } = {}) {
    const ids = selection ? [...selectedIds] : []
    if (selection && ids.length === 0) return

    try {
      const params = {}
      if (selection) params.ids = ids.join(',')
      else if (statusFilter) params.status = statusFilter

      const response = await subscribersAPI.exportCsv(workspaceId, params)
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selection
        ? `subscribers-selected-${ids.length}.csv`
        : `subscribers-${workspaceId.slice(0, 8)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.addToast(selection ? `Exported ${ids.length} contacts` : 'Exported CSV', 'success')
    } catch (err) {
      // The route answers 400 with a reason - too many selected, a malformed id -
      // and those are worth showing rather than flattening to "failed".
      let apiErr = err?.response?.data?.error
      // responseType is blob, so an error body arrives as a Blob rather than JSON.
      if (err?.response?.data instanceof Blob) {
        try { apiErr = JSON.parse(await err.response.data.text())?.error } catch { apiErr = null }
      }
      toast.addToast(apiErr || 'Failed to export', 'error')
    }
  }

  /**
   * Rows per request. The CSV is sent as a JSON string and Vercel rejects
   * bodies over roughly 4.5 MB at the edge, before the function runs, so a
   * large file cannot go up in one piece however high the server's row limit
   * is. 5,000 rows is well under that ceiling and matches the server's cap.
   */
  const IMPORT_CHUNK_ROWS = 5000

  async function importSubscribers() {
    if (!importCsvText.trim()) { toast.addToast('Paste CSV data first', 'warning'); return }

    const lines = importCsvText.trim().split('\n')
    if (lines.length < 2) { toast.addToast('CSV needs a header row and at least one data row', 'warning'); return }

    const header = lines[0]
    const dataRows = lines.slice(1)
    const chunks = []
    for (let i = 0; i < dataRows.length; i += IMPORT_CHUNK_ROWS) {
      chunks.push([header, ...dataRows.slice(i, i + IMPORT_CHUNK_ROWS)].join('\n'))
    }

    setImporting(true)
    setImportResult(null)
    setImportProgress({ done: 0, total: chunks.length, rows: dataRows.length })

    // Totals accumulate across chunks so the panel reports the whole file
    // rather than whichever piece happened to go last.
    const totals = { processed: 0, duplicates: 0, skipped: 0, skippedDetails: [] }

    try {
      for (let i = 0; i < chunks.length; i++) {
        const { data } = await subscribersAPI.importCsv(workspaceId, chunks[i], importConfirmed, importConsent)
        totals.processed += data?.processed || 0
        totals.duplicates += data?.duplicates || 0
        totals.skipped += data?.skipped || 0
        if (data?.skippedDetails?.length && totals.skippedDetails.length < 20) {
          totals.skippedDetails.push(...data.skippedDetails.slice(0, 20 - totals.skippedDetails.length))
        }
        setImportProgress({ done: i + 1, total: chunks.length, rows: dataRows.length })
      }
      setImportResult(totals)
      setImportCsvText('')
      toast.addToast(`Imported ${totals.processed.toLocaleString()} subscriber(s)`, 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      const msg = typeof apiErr === 'object' ? apiErr?.message : apiErr
      // Earlier chunks already committed, so say what landed rather than
      // implying the whole file failed.
      setImportResult(totals)
      toast.addToast(
        `${msg || 'Import failed'}${totals.processed ? ` (${totals.processed.toLocaleString()} imported before the failure)` : ''}`,
        'error'
      )
    } finally {
      setImporting(false)
      setImportProgress(null)
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
          {/*
            Export sits beside Import, where someone looking for it would look.

            It existed only inside the bulk action bar, which renders when at least
            one contact is ticked - so the feature was invisible unless you happened
            to select something first, and it is not a bulk action: `exportCsv`
            ignores the selection entirely and exports whatever the current filter
            matches. Offering it there implied it would export the ticked rows.
          */}
          <Btn
            variant="secondary"
            size="md"
            onClick={exportCsv}
            title={statusFilter ? `Export contacts matching "${statusFilter}"` : 'Export all contacts'}
          >
            Export CSV
          </Btn>
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
                  // latitude/longitude are optional but are what make radius
                  // search work for imported contacts - nothing looks them up
                  // afterwards, so a row without them never appears on the map.
                  const csv = 'email,first_name,last_name,phone_number,country,region,city,postal_code,timezone,latitude,longitude\njane@example.com,Jane,Doe,+15125550199,US,California,Los Angeles,90001,America/Los_Angeles,34.0522,-118.2437\njohn@example.com,John,Smith,+12125550199,US,New York,New York,10001,America/New_York,40.7128,-74.0060'
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
            Paste CSV or drag a .csv file. Must include an <strong>email</strong> column. Optional: first_name, last_name, phone_number (10 digits), country, region, city, postal_code, timezone, and <strong>latitude / longitude</strong> - include those two if you want imported contacts to appear in radius searches
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
          {/*
            Consent is asserted here rather than assumed. Imported rows used to land
            with no consent recorded, which once sending began enforcing consent read
            as "declined" for people nobody had asked - 10,300 rows needed a backfill.
            Leaving this unticked stores the contacts but does not make them mailable,
            which is the safe direction.
          */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={importConsent}
              onChange={(e) => setImportConsent(e.target.checked)}
              id="import-consent"
              className="w-4 h-4 mt-0.5 accent-brutal-fg"
            />
            <label htmlFor="import-consent" className="text-xs font-bold text-brutal-fg/60 uppercase tracking-wider leading-relaxed">
              These contacts gave me permission to email them
              <span className="block text-[10px] text-brutal-muted normal-case tracking-normal mt-0.5">
                Required to send to them. Without it they are stored but excluded from every campaign.
              </span>
            </label>
          </div>
          {importProgress && importProgress.total > 1 && (
            <div className="border border-brutal-fg p-3 bg-brutal-bg text-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span>Uploading {importProgress.rows.toLocaleString()} rows</span>
                <span className="text-brutal-muted">Part {importProgress.done} of {importProgress.total}</span>
              </div>
              <div className="h-2 border-2 border-brutal-fg bg-white" role="progressbar"
                aria-valuenow={importProgress.done} aria-valuemin={0} aria-valuemax={importProgress.total}>
                <div className="h-full bg-brutal-green transition-all"
                  style={{ width: `${Math.round((importProgress.done / importProgress.total) * 100)}%` }} />
              </div>
            </div>
          )}
          {importResult && (
            <div className="border border-brutal-fg p-3 bg-brutal-bg text-sm">
              <span className="font-bold">Imported: {importResult.processed.toLocaleString()}</span>
              {importResult.duplicates > 0 && (
                <span className="text-brutal-muted ml-3">Duplicates merged: {importResult.duplicates.toLocaleString()}</span>
              )}
              {importResult.skipped > 0 && (
                <span className="text-brutal-muted ml-3">Skipped: {importResult.skipped.toLocaleString()}</span>
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
            {importing
              ? (importProgress && importProgress.total > 1
                  ? `Importing ${importProgress.done}/${importProgress.total}...`
                  : 'Importing...')
              : 'Import Subscribers'}
          </Btn>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border-3 border-brutal-fg overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${
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
      {/*
        Both handlers only set state. They used to also call loadSubscribers()
        directly, which read the geoFilter it was in the middle of setting and
        so requested the unfiltered list - a second, racing request whose slower
        count:exact scan usually landed last and put all 10,310 rows back. The
        effect above already reloads when geoFilter changes; one path is enough.

        Page resets to 1 because the filtered set is far smaller: applying a
        radius while on page 3 of 10,310 otherwise lands past the end of seven
        results and shows an empty table.
      */}
      <GeoFilter
        onChange={(geo) => {
          setPage(1)
          setGeoFilter(geo)
        }}
        onClear={() => {
          setPage(1)
          setGeoFilter(null)
        }}
        loading={loading}
        active={!!geoFilter}
        subscribers={subscribers}
        total={total}
      />

      {/* Save the current filter values under a name, for re-use. */}
      {(statusFilter || search.trim() || geoFilter) && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={segmentName}
            onChange={e => setSegmentName(e.target.value)}
            placeholder="Name this filter..."
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

      {/*
        Saved filters. Named sets of the filter values above, re-run against
        Contacts when clicked - not a stored group of people. That is Lists,
        which is a different thing with a different page.

        Previously these rendered as unlabelled chips that appeared only once one
        existed, with no indication that clicking one did anything or that one
        was currently applied. Which is why "how do I browse a segment" had no
        obvious answer: it was already possible and looked like decoration.
      */}
      {segmentsLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-20 h-6 border-2 border-brutal-fg/10 bg-brutal-surface/50 animate-pulse" />
          ))}
        </div>
      ) : segments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">
            Saved filters {'·'} click to apply
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {segments.map(s => {
              const active = activeSegmentId === s.id
              return (
                <span
                  key={s.id}
                  className={`inline-flex items-center border-2 border-brutal-fg text-[9px] font-bold uppercase tracking-wider transition ${
                    active ? 'bg-brutal-yellow' : 'bg-white hover:bg-brutal-yellow/20'
                  }`}
                >
                  <button
                    onClick={() => applySegment(s)}
                    className="px-2.5 py-1"
                    aria-pressed={active}
                  >
                    {active ? '✓' : '🔖'} {s.name}
                  </button>
                  <button
                    onClick={() => removeSegment(s.id, s.name)}
                    aria-label={`Remove saved filter ${s.name}`}
                    title="Remove this saved filter"
                    className="px-1.5 py-1 border-l-2 border-brutal-fg hover:bg-brutal-red hover:text-white transition"
                  >
                    ×
                  </button>
                </span>
              )
            })}
            {activeSegmentId && (
              <button
                onClick={clearSegment}
                className="px-2.5 py-1 border-2 border-dashed border-brutal-fg/50 text-[9px] font-bold uppercase tracking-wider text-brutal-muted hover:border-brutal-fg hover:text-brutal-fg transition"
              >
                Clear filter
              </button>
            )}
          </div>
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
            onClick={() => exportCsv({ selection: true })}
          >
            Export {selectedIds.size} Selected
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
                {/*
                  Creating the list from here is the point when a radius is
                  applied: the reason to select seven people in Encinitas is
                  usually to make them a list, and previously the only way was to
                  leave, create an empty list on another page, come back, and
                  re-select. The picker offered existing lists only.
                */}
                <button
                  onClick={() => { setShowListPicker(false); setNewListPromptOpen(true) }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-brutal-green hover:bg-brutal-green/10 border-b-2 border-brutal-fg/20"
                >
                  + New list from selection
                </button>
                {subscriberLists?.map((list) => (
                  <button
                    key={list.id}
                    onClick={async () => {
                      setShowListPicker(false)
                      setBulkMoving(true)
                      try {
                        const token = getAuthToken()
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/subscriber-lists/${list.id}/members`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ subscriber_ids: Array.from(selectedIds) }),
                        })
                        // fetch only rejects on network failure, so without this a
                        // 403 or 500 still reported success. Reachable now that the
                        // endpoint requires the editor role.
                        if (!res.ok) throw new Error(`HTTP ${res.status}`)
                        const body = await res.json().catch(() => null)
                        const added = body?.added ?? selectedIds.size
                        toast.addToast(`Moved ${added} subscribers to "${list.name}"`, 'success')
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
            onClick={() => setTagPromptOpen(true)}
            disabled={bulkTagging}
            className="px-4 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50"
          >
            {bulkTagging ? 'Tagging...' : 'Tag Selected'}
          </button>
          <button
            onClick={() => setConfirmBulkRemove(true)}
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
                    aria-label={selectedIds.size === subscribers.length && subscribers.length > 0 ? 'Deselect all subscribers' : 'Select all subscribers'}
                    className="w-4 h-4 accent-brutal-fg cursor-pointer"
                  />
                </th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Name</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden lg:table-cell"><span aria-hidden="true">📍</span> Location</th>
                <th className="text-left p-3 font-bold text-xs uppercase tracking-wider hidden md:table-cell"><span aria-hidden="true">📱</span> Phone</th>
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
                        aria-label={`Select ${s.email}`}
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
                    {/*
                      The Phone cell, which the header has always declared and the body
                      never rendered. Everything after Location was therefore shifted
                      one column left: the signup time sat under PHONE and the Remove
                      button under JOINED, which is what "things don't seem aligned"
                      was showing.

                      Two columns hold a number and both are real. `phone` is what a
                      capture form writes; `phone_number` is what CSV import writes and
                      what the import template documents. A contact can have either, so
                      the cell reads both rather than picking one and being blank for
                      half the list.
                    */}
                    <td className="p-3 text-brutal-muted text-xs hidden md:table-cell">
                      {s.phone || s.phone_number || '--'}
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
                        onClick={() => setConfirmRemoveId(s.id)}
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
        onRemove={(id) => setConfirmRemoveId(id)}
      />

      <ConfirmModal
        open={!!confirmRemoveId}
        title="Remove subscriber"
        message="They will be removed from your audience. This cannot be undone."
        confirmLabel="Remove"
        danger
        onConfirm={() => { const id = confirmRemoveId; setConfirmRemoveId(null); removeSubscriber(id) }}
        onCancel={() => setConfirmRemoveId(null)}
      />

      <ConfirmModal
        open={confirmBulkRemove}
        title={`Delete ${selectedIds.size} subscriber${selectedIds.size === 1 ? '' : 's'}`}
        message="They will be permanently removed from your audience. This cannot be undone."
        confirmLabel={`Delete ${selectedIds.size}`}
        danger
        onConfirm={bulkRemove}
        onCancel={() => setConfirmBulkRemove(false)}
      />

      <PromptModal
        open={tagPromptOpen}
        title="Tag selected"
        message={`Apply a tag to ${selectedIds.size} selected subscriber${selectedIds.size === 1 ? '' : 's'}.`}
        label="Tag name"
        placeholder="e.g. vip"
        confirmLabel="Apply tag"
        validate={(v) => (!v ? 'Enter a tag name' : v.length > 50 ? 'Keep tags under 50 characters' : '')}
        onSubmit={bulkTag}
        onCancel={() => setTagPromptOpen(false)}
      />

      <PromptModal
        open={newListPromptOpen}
        title="New list from selection"
        message={
          geoFilter?.locations?.length
            ? `${selectedIds.size} contact${selectedIds.size === 1 ? '' : 's'} selected within ${geoFilter.locations[0].radius ?? 10} mi of ${geoFilter.locations[0].city || 'the selected point'}.`
            : `${selectedIds.size} contact${selectedIds.size === 1 ? '' : 's'} selected.`
        }
        label="List name"
        placeholder={
          geoFilter?.locations?.[0]?.city
            ? `e.g. ${geoFilter.locations[0].city} ${geoFilter.locations[0].radius ?? 10}mi`
            : 'e.g. Local subscribers'
        }
        confirmLabel="Create list"
        validate={(v) => (!v ? 'Enter a list name' : v.length > 100 ? 'Keep list names under 100 characters' : '')}
        onSubmit={createListFromSelection}
        onCancel={() => setNewListPromptOpen(false)}
      />
    </div>
  )
}
