import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, File, Trash2, Loader2, Check, AlertCircle } from 'lucide-react'
import { assetsAPI } from '../lib/api'

/**
 * AssetPicker // the workspace's content library, as a chooser.
 *
 * Giveaways used to require the operator to host the file somewhere else and
 * paste a link, which fails in the worst possible place: a dead link or a wrong
 * Drive permission looks fine in the builder and only breaks for the subscriber,
 * after they have handed over their address.
 *
 * Props:
 *   workspaceId: string
 *   value?: string|null            // selected asset id
 *   onChange(assetId|null): void   // selection changed
 *   disabled?: boolean
 */

function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  const mb = bytes / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

/**
 * The file's SHA-256, computed in the browser.
 *
 * Sent so a file later found to be malicious can be blocked everywhere at once
 * rather than hunted workspace by workspace. Best effort: `crypto.subtle` needs
 * a secure context, so it is absent over plain http in local development, and a
 * missing hash must not block an upload.
 */
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

export default function AssetPicker({ workspaceId, value = null, onChange, disabled = false }) {
  const [assets, setAssets] = useState([])
  const [usage, setUsage] = useState({ used: 0, quota: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const { data } = await assetsAPI.list(workspaceId)
      const payload = data?.data ?? data ?? {}
      setAssets(payload.assets ?? [])
      setUsage({ used: payload.used_bytes ?? 0, quota: payload.quota_bytes ?? 0 })
    } catch (err) {
      console.error('Failed to load library:', err)
      setError('Could not load your library.')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { load() }, [load])

  /**
   * Upload in three steps, because the bytes never touch the API.
   *
   * Vercel caps serverless request bodies at a few megabytes, so proxying the
   * file through our own route would put a ceiling under the whole feature. The
   * API authorises and hands back a signed URL, the browser PUTs to storage
   * directly, and only then is the row recorded - so a cancelled or failed
   * upload leaves no library entry promising a file that is not there.
   */
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

      // XHR rather than fetch: this is the one request where progress matters,
      // and fetch cannot report upload progress.
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', auth.signed_url, true)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(
              // Storage rejects a type the bucket does not allow with a 400,
              // which is worth saying plainly rather than as a status code.
              xhr.status === 400
                ? 'Storage rejected that file type.'
                : `Upload failed (${xhr.status}).`
            )))
        /*
         * onerror is a network-level failure, not an HTTP error - the request
         * never got an answer. The usual cause is the page's own
         * Content-Security-Policy: this PUT goes to the storage origin rather
         * than to our API, so the storage host has to be in `connect-src` or
         * the browser blocks it before it leaves the page. That is exactly what
         * happened on first release, and "Upload failed" gave no way to tell.
         */
        xhr.onerror = () => reject(new Error(
          'Could not reach file storage. If this keeps happening the storage host may be blocked by the page security policy.'
        ))
        xhr.ontimeout = () => reject(new Error('The upload timed out.'))
        xhr.send(file)
      })

      const { data: createData } = await assetsAPI.create(workspaceId, {
        storage_path: auth.storage_path,
        filename: file.name,
        sha256: await hashFile(file),
      })
      const created = (createData?.data ?? createData)?.asset
      if (created) {
        setAssets(prev => [created, ...prev])
        setUsage(prev => ({ ...prev, used: prev.used + (created.bytes ?? 0) }))
        onChange?.(created.id)
      }
    } catch (err) {
      // The API's own sentence is better than anything generic: it names the
      // cap, the remaining quota, or the type that was refused.
      setError(err?.response?.data?.error || err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(asset) {
    setDeletingId(asset.id)
    setError(null)
    try {
      await assetsAPI.remove(workspaceId, asset.id)
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      setUsage(prev => ({ ...prev, used: Math.max(0, prev.used - (asset.bytes ?? 0)) }))
      if (value === asset.id) onChange?.(null)
    } catch (err) {
      // A 409 means a live giveaway still hands this out. That is the whole
      // point of the guard, so the reason is shown rather than swallowed.
      setError(err?.response?.data?.error || 'Could not delete that file.')
    } finally {
      setDeletingId(null)
    }
  }

  const pct = usage.quota ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0

  return (
    <div className="border-3 border-brutal-fg bg-white">
      <div className="bg-brutal-fg text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider gap-3">
        <span>Your library</span>
        {usage.quota > 0 && (
          <span className={pct >= 90 ? 'text-brutal-yellow' : 'opacity-70'}>
            {formatBytes(usage.used)} of {formatBytes(usage.quota)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <input
            ref={inputRef}
            type="file"
            id="asset-upload"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={e => handleFile(e.target.files?.[0])}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.epub,.zip,.docx,.mp3,.txt,.csv"
          />
          <label
            htmlFor="asset-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 border-3 border-dashed border-brutal-fg text-xs font-bold uppercase tracking-wider transition ${
              disabled || uploading
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-brutal-yellow/20'
            }`}
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" /> Uploading {progress}%</>
              : <><Upload size={14} /> Upload a file</>}
          </label>
          {uploading && (
            <div className="mt-2 h-1.5 border-2 border-brutal-fg bg-brutal-bg">
              <div className="h-full bg-brutal-green transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {/*
            Lists what the bucket actually accepts. This used to read "PDF,
            images, epub, zip or docx", which omitted audio, text and CSV - all
            three were already allowed, so the copy was telling people a file
            would be rejected when it would have uploaded fine.
          */}
          <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1.5">
            PDF, images, audio, epub, zip, Word, text or CSV. Up to 10 MB.
          </p>
        </div>

        {error && (
          <p className="text-xs font-bold text-brutal-red flex items-start gap-1.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </p>
        )}

        {loading ? (
          <p className="text-[10px] font-bold text-brutal-muted uppercase">Loading...</p>
        ) : assets.length === 0 ? (
          <p className="text-[10px] font-bold text-brutal-muted uppercase">
            Nothing here yet. Upload the file you want to give away.
          </p>
        ) : (
          <ul className="divide-y divide-brutal-fg/15 border-3 border-brutal-fg max-h-56 overflow-y-auto">
            {assets.map(asset => {
              const selected = asset.id === value
              return (
                <li key={asset.id} className={selected ? 'bg-brutal-green/10' : ''}>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onChange?.(selected ? null : asset.id)}
                      disabled={disabled}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left disabled:opacity-50"
                    >
                      {selected
                        ? <Check size={14} className="text-brutal-green shrink-0" />
                        : <File size={14} className="text-brutal-muted shrink-0" />}
                      <span className="text-xs font-bold truncate">{asset.filename}</span>
                      <span className="text-[10px] text-brutal-muted ml-auto shrink-0">{formatBytes(asset.bytes)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset)}
                      disabled={disabled || deletingId === asset.id}
                      aria-label={`Delete ${asset.filename}`}
                      className="p-1 text-brutal-muted hover:text-brutal-red disabled:opacity-40 transition-colors"
                    >
                      {deletingId === asset.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
