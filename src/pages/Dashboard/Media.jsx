import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload, Trash2, Loader2, AlertCircle, Link as LinkIcon,
  FileText, Image as ImageIcon, Music, Archive, File as FileIcon,
} from 'lucide-react'
import { assetsAPI } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../components/Toast'
import { LoadingState } from '../../components/ux'
import { describeMime, formatBytes, MEDIA_KINDS } from '../../lib/media-kinds'

/**
 * Media // everything this workspace has uploaded.
 *
 * The library existed only inside the capture form builder, which meant files
 * were visible exactly where you were about to use one and nowhere else. There
 * was no answer to "what have I uploaded", no way to clear space without
 * starting to build a widget, and nothing that said which giveaway was handing
 * out which file.
 */

const KIND_ICONS = {
  image: ImageIcon,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: FileIcon,
}

const KIND_LABELS = {
  image: 'Images',
  audio: 'Audio',
  document: 'Documents',
  archive: 'Archives',
  other: 'Other',
}

async function hashFile(file) {
  try {
    if (!globalThis.crypto?.subtle) return undefined
    const buf = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return undefined
  }
}

export default function MediaPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()

  const [assets, setAssets] = useState([])
  const [usage, setUsage] = useState({ used: 0, quota: 0 })
  const [egress, setEgress] = useState({ used: 0, quota: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [kindFilter, setKindFilter] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { document.title = 'Media | Veloce' }, [])

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const { data } = await assetsAPI.list(workspaceId)
      const payload = data?.data ?? data ?? {}
      setAssets(payload.assets ?? [])
      setUsage({ used: payload.used_bytes ?? 0, quota: payload.quota_bytes ?? 0 })
      setEgress({
        used: payload.estimated_egress_bytes ?? 0,
        quota: payload.egress_quota_bytes ?? 0,
      })
      setError(null)
    } catch (err) {
      console.error('Failed to load media:', err)
      setError('Could not load your media.')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { load() }, [load])

  async function handleFile(file) {
    if (!file) return
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      const { data: authData } = await assetsAPI.uploadUrl(workspaceId, {
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        bytes: file.size,
      })
      const auth = authData?.data ?? authData

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', auth.signed_url, true)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(xhr.status === 400 ? 'Storage rejected that file type.' : `Upload failed (${xhr.status}).`)))
        xhr.onerror = () => reject(new Error('Could not reach file storage.'))
        xhr.send(file)
      })

      const { data: createData } = await assetsAPI.create(workspaceId, {
        storage_path: auth.storage_path,
        filename: file.name,
        sha256: await hashFile(file),
      })
      const created = (createData?.data ?? createData)?.asset
      if (created) {
        setAssets(prev => [{ ...created, used_by: [] }, ...prev])
        setUsage(prev => ({ ...prev, used: prev.used + (created.bytes ?? 0) }))
        toast.addToast(`Uploaded ${created.filename}`, 'success')
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed.'
      setError(msg)
      toast.addToast(msg, 'error')
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(asset) {
    setDeletingId(asset.id)
    try {
      await assetsAPI.remove(workspaceId, asset.id)
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      setUsage(prev => ({ ...prev, used: Math.max(0, prev.used - (asset.bytes ?? 0)) }))
      toast.addToast(`Deleted ${asset.filename}`, 'success')
    } catch (err) {
      // A 409 means a giveaway still hands this out, which is the guard doing
      // its job rather than a failure - so the reason is shown, not flattened.
      toast.addToast(err?.response?.data?.error || 'Could not delete that file.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function copyLink(asset) {
    try {
      await navigator.clipboard.writeText(asset.public_url)
      toast.addToast('Link copied', 'success')
    } catch {
      toast.addToast('Could not copy the link', 'error')
    }
  }

  const counts = assets.reduce((acc, a) => {
    const { kind } = describeMime(a.mime)
    acc[kind] = (acc[kind] ?? 0) + 1
    return acc
  }, {})

  const visible = kindFilter ? assets.filter(a => describeMime(a.mime).kind === kindFilter) : assets
  const pct = usage.quota ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0
  const egressPct = egress.quota ? Math.min(100, Math.round((egress.used / egress.quota) * 100)) : 0
  const totalClaims = assets.reduce((sum, a) => sum + (a.claims ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl uppercase">Media</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted mt-1">
            Files you can give away from a capture form
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            id="media-upload"
            className="sr-only"
            disabled={uploading}
            onChange={e => handleFile(e.target.files?.[0])}
            /*
              The same set the bucket enforces. Narrowing the picker is a
              courtesy, not the control: storage rejects anything else with a
              400 regardless of what the file dialog offered.
            */
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.epub,.zip,.docx,.mp3,.txt,.csv"
          />
          <label
            htmlFor="media-upload"
            className={`inline-flex items-center gap-2 px-4 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white text-xs font-bold uppercase tracking-wider transition ${
              uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-brutal'
            }`}
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Uploading {progress}%</>
              : <><Upload size={14} /> Upload a file</>}
          </label>
        </div>
      </div>

      {/*
        Two meters, because they answer different questions and only one of them
        can take the site down.

        Storage is "how much room is left" and is enforced at upload. Bandwidth
        is what giveaway downloads spend, it is shared with the database that
        serves the app, and nothing here can enforce it - a subscriber clicking a
        link is not something the library gets to refuse. Showing it is the whole
        point: it is the only warning that arrives before the platform starts
        answering 402.
      */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-3 border-brutal-fg bg-white p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>Storage</span>
            <span className={pct >= 90 ? 'text-brutal-red' : 'text-brutal-muted'}>
              {assets.length} {assets.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className="font-heading text-2xl leading-none mb-2">
            {formatBytes(usage.used)} <span className="text-sm text-brutal-muted">of {formatBytes(usage.quota)}</span>
          </p>
          <div className="h-2.5 border-2 border-brutal-fg bg-brutal-bg">
            <div
              className={`h-full transition-all ${pct >= 90 ? 'bg-brutal-red' : 'bg-brutal-green'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-2">
            Up to 10 MB per file
          </p>
        </div>

        <div className="border-3 border-brutal-fg bg-white p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
            <span>Downloads this month</span>
            <span className={egressPct >= 80 ? 'text-brutal-red' : 'text-brutal-muted'}>
              {totalClaims.toLocaleString()} {totalClaims === 1 ? 'claim' : 'claims'}
            </span>
          </div>
          <p className="font-heading text-2xl leading-none mb-2">
            {/*
              "Up to", because this is claims multiplied by file size: an upper
              bound rather than a measurement. Repeat downloads can come from
              CDN cache and a recorded click is not a finished download.
            */}
            <span className="text-sm text-brutal-muted">up to </span>
            {formatBytes(egress.used)}
            <span className="text-sm text-brutal-muted"> of {formatBytes(egress.quota)}</span>
          </p>
          <div className="h-2.5 border-2 border-brutal-fg bg-brutal-bg">
            <div
              className={`h-full transition-all ${egressPct >= 80 ? 'bg-brutal-red' : 'bg-brutal-green'}`}
              style={{ width: `${egressPct}%` }}
            />
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${egressPct >= 80 ? 'text-brutal-red' : 'text-brutal-muted'}`}>
            {egressPct >= 80
              ? 'Close to the monthly limit - link large files elsewhere'
              : 'Shared with the rest of Veloce'}
          </p>
        </div>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted -mt-3">
        PDF, images, audio, epub, zip, Word, text or CSV
      </p>

      {uploading && (
        <div className="h-1.5 border-2 border-brutal-fg bg-brutal-bg">
          <div className="h-full bg-brutal-green transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-brutal-red flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
        </p>
      )}

      {/* Kind filter */}
      {assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setKindFilter(null)}
            className={`px-3 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
              kindFilter === null ? 'border-brutal-fg bg-brutal-yellow' : 'border-brutal-fg/30 text-brutal-muted hover:border-brutal-fg'
            }`}
          >
            All {assets.length}
          </button>
          {MEDIA_KINDS.filter(k => counts[k]).map(kind => (
            <button
              key={kind}
              onClick={() => setKindFilter(kind === kindFilter ? null : kind)}
              className={`px-3 py-1.5 border-2 text-[10px] font-bold uppercase tracking-wider transition ${
                kindFilter === kind ? 'border-brutal-fg bg-brutal-yellow' : 'border-brutal-fg/30 text-brutal-muted hover:border-brutal-fg'
              }`}
            >
              {KIND_LABELS[kind]} {counts[kind]}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState label="Loading media" />
      ) : assets.length === 0 ? (
        <div className="border-3 border-brutal-fg bg-white p-10 text-center">
          <Upload size={28} className="mx-auto text-brutal-muted mb-3" />
          <p className="font-heading text-xl uppercase">Nothing uploaded yet</p>
          <p className="text-xs text-brutal-muted mt-2 max-w-md mx-auto">
            Upload the file you want to hand out in exchange for an email address.
            You can pick it when you build a capture form.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(asset => {
            const { kind, label } = describeMime(asset.mime)
            const Icon = KIND_ICONS[kind] ?? FileIcon
            const usedBy = asset.used_by ?? []
            return (
              <div key={asset.id} className="border-3 border-brutal-fg bg-white flex flex-col">
                {/*
                  Images preview themselves; everything else gets its type as a
                  badge. A grid of identical file icons is a list with extra
                  steps, and the thumbnail is free - the bucket is public so no
                  signing round trip is needed to show it.
                */}
                <div className="border-b-3 border-brutal-fg h-32 flex items-center justify-center bg-brutal-bg overflow-hidden">
                  {kind === 'image' ? (
                    <img src={asset.public_url} alt={asset.filename} className="max-h-full max-w-full object-contain" loading="lazy" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-brutal-muted">
                      <Icon size={28} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-xs font-bold break-words" title={asset.filename}>{asset.filename}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
                    {label} · {formatBytes(asset.bytes)}
                    {asset.claims > 0 && ` · ${asset.claims.toLocaleString()} claimed`}
                  </p>

                  {usedBy.length > 0 && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-green">
                      Given away by {usedBy.map(w => w.name).join(', ')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() => copyLink(asset)}
                      className="flex-1 px-2 py-1.5 border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider hover:bg-brutal-yellow/20 transition flex items-center justify-center gap-1"
                    >
                      <LinkIcon size={11} /> Copy link
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      disabled={deletingId === asset.id || usedBy.length > 0}
                      title={usedBy.length > 0 ? 'A capture form still gives this away' : 'Delete this file'}
                      aria-label={`Delete ${asset.filename}`}
                      className="px-2 py-1.5 border-2 border-brutal-fg text-brutal-red hover:bg-brutal-red/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      {deletingId === asset.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
