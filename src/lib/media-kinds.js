/**
 * How a stored file is described and grouped in the library.
 *
 * The raw MIME type is the truth but not the answer: nobody scanning their
 * files wants to read
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 * Kept here as data so the label, the grouping and the filter chips cannot
 * disagree about what a file is.
 */

/** Ordered, because this drives the filter chips and the order should be stable. */
export const MEDIA_KINDS = ['image', 'audio', 'document', 'archive', 'other']

const BY_MIME = {
  'application/pdf': { kind: 'document', label: 'PDF' },
  'image/png': { kind: 'image', label: 'PNG' },
  'image/jpeg': { kind: 'image', label: 'JPEG' },
  'image/gif': { kind: 'image', label: 'GIF' },
  'image/webp': { kind: 'image', label: 'WebP' },
  'application/epub+zip': { kind: 'document', label: 'EPUB' },
  'application/zip': { kind: 'archive', label: 'ZIP' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { kind: 'document', label: 'Word' },
  'audio/mpeg': { kind: 'audio', label: 'MP3' },
  'text/plain': { kind: 'document', label: 'Text' },
  'text/csv': { kind: 'document', label: 'CSV' },
}

/**
 * The kind and short label for a stored file.
 *
 * Falls back by MIME prefix before giving up, so a type the allowlist gains
 * later still groups sensibly instead of landing in "other" until someone
 * remembers to update this table.
 */
export function describeMime(mime) {
  const known = BY_MIME[mime]
  if (known) return known

  const type = String(mime ?? '')
  if (type.startsWith('image/')) return { kind: 'image', label: 'Image' }
  if (type.startsWith('audio/')) return { kind: 'audio', label: 'Audio' }
  if (type.startsWith('text/')) return { kind: 'document', label: 'Text' }

  return { kind: 'other', label: 'File' }
}

/** Human file size. Whole KB below a megabyte, one decimal until it stops helping. */
export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return '0 KB'
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  const mb = n / (1024 * 1024)
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}
