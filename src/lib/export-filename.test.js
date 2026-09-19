import { describe, it, expect } from 'vitest'
import { slugifyName, listExportFilename } from './export-filename'

/**
 * A list name is operator input, and this turns it into a filename. Each case
 * below is a name somebody will eventually type.
 */

describe('listExportFilename', () => {
  it('names the file after the list', () => {
    // The point of the whole helper: a folder of exports should be readable.
    expect(listExportFilename('RESUME')).toBe('resume-contacts.csv')
    expect(listExportFilename('Spring 2026 Launch')).toBe('spring-2026-launch-contacts.csv')
  })

  it('cannot climb out of the downloads folder', () => {
    expect(listExportFilename('../../etc/passwd')).toBe('etc-passwd-contacts.csv')
    expect(listExportFilename('..')).toBe('list-contacts.csv')
  })

  it('falls back when nothing survives slugifying', () => {
    // An emoji-only or non-Latin name leaves no ASCII behind, and
    // "-contacts.csv" is a worse answer than a generic one.
    expect(listExportFilename('🎉🎉')).toBe('list-contacts.csv')
    expect(listExportFilename('')).toBe('list-contacts.csv')
    expect(listExportFilename(null)).toBe('list-contacts.csv')
    expect(listExportFilename(undefined)).toBe('list-contacts.csv')
  })

  it('does not leave punctuation stranded at either end', () => {
    expect(listExportFilename('!!! VIPs !!!')).toBe('vips-contacts.csv')
    expect(listExportFilename('  padded  ')).toBe('padded-contacts.csv')
  })

  it('collapses runs of separators rather than repeating hyphens', () => {
    expect(listExportFilename('a   ---   b')).toBe('a-b-contacts.csv')
  })

  it('caps a very long name', () => {
    const got = listExportFilename('word '.repeat(80))
    expect(got.length).toBeLessThanOrEqual(60 + '-contacts.csv'.length)
    expect(got.endsWith('-contacts.csv')).toBe(true)
    // The cap must not leave a dangling hyphen where it cut.
    expect(got).not.toContain('--contacts')
  })
})

describe('slugifyName', () => {
  it('reports null rather than an empty string when nothing is left', () => {
    // Callers branch on this, so "" and null must not both mean "no name".
    expect(slugifyName('###')).toBeNull()
    expect(slugifyName('ok')).toBe('ok')
  })
})
