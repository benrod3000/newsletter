/**
 * Detects a stale code-split chunk after a deploy: the browser has an old
 * index.html referencing an asset hash that no longer exists, so the host's
 * SPA fallback serves index.html (200, text/html) in its place. Depending on
 * the browser that surfaces as a fetch failure, a MIME-type rejection, or a
 * webpack-style "Loading chunk" message - matched here since App.jsx and
 * ErrorBoundary previously kept two independently drifting copies of this
 * list, and each was missing patterns the other had.
 */
export function isChunkErrorMessage(message) {
  const msg = typeof message === 'string' ? message : message?.message || ''
  return msg.includes('Failed to fetch dynamically imported module')
    || msg.includes('Importing a module script failed')
    || msg.includes('Loading chunk')
    || msg.includes('Failed to load module script')
    || msg.includes('is not a valid JavaScript MIME type')
    || msg.includes('MIME type')
}
