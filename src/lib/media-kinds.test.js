import { describe, it, expect } from 'vitest'
import { describeMime, formatBytes, MEDIA_KINDS } from './media-kinds'

/**
 * How the library describes a file.
 *
 * The raw MIME type is the truth and not the answer: nobody scanning their
 * uploads wants to read
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 */

describe('describeMime', () => {
  it('names the types the bucket accepts', () => {
    expect(describeMime('application/pdf')).toEqual({ kind: 'document', label: 'PDF' })
    expect(describeMime('audio/mpeg')).toEqual({ kind: 'audio', label: 'MP3' })
    expect(describeMime('image/png')).toEqual({ kind: 'image', label: 'PNG' })
    expect(describeMime('application/zip')).toEqual({ kind: 'archive', label: 'ZIP' })
  })

  it('shortens the unreadable one', () => {
    const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    expect(describeMime(docx).label).toBe('Word')
  })

  it('groups an unlisted type by its prefix rather than dumping it in other', () => {
    // So a type added to the allowlist later still sorts sensibly before
    // anybody remembers to update the lookup table.
    expect(describeMime('image/avif').kind).toBe('image')
    expect(describeMime('audio/ogg').kind).toBe('audio')
    expect(describeMime('text/markdown').kind).toBe('document')
  })

  it('falls back rather than throwing on a missing or odd type', () => {
    expect(describeMime(undefined).kind).toBe('other')
    expect(describeMime(null).kind).toBe('other')
    expect(describeMime('').kind).toBe('other')
  })

  it('only ever returns a kind the filter chips know about', () => {
    // The chips iterate MEDIA_KINDS, so a kind outside that list would be
    // counted and then never offered as a filter.
    for (const mime of ['application/pdf', 'audio/mpeg', 'image/png', 'application/zip', 'application/x-unknown', '']) {
      expect(MEDIA_KINDS).toContain(describeMime(mime).kind)
    }
  })
})

describe('formatBytes', () => {
  it('reads in KB below a megabyte and MB above', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(500 * 1024)).toBe('500 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
    expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB')
  })

  it('never reports a real file as 0 KB', () => {
    // A 300-byte file rounds to zero, which reads as "empty" rather than "small".
    expect(formatBytes(300)).toBe('1 KB')
  })

  it('handles nothing gracefully', () => {
    expect(formatBytes(0)).toBe('0 KB')
    expect(formatBytes(null)).toBe('0 KB')
    expect(formatBytes(undefined)).toBe('0 KB')
  })
})
