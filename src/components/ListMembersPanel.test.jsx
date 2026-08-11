import { describe, it, expect } from 'vitest'
import { describeSource } from './list-member-source'

/**
 * "Where they came from" for a list member.
 *
 * `consent_source` already answers this - capture forms write
 * `widget:<slug>` - but in a shape written for code. These assert it reaches
 * the screen as something a person can read, and that an unrecognised value
 * survives rather than being swallowed.
 */

describe('describeSource', () => {
  it('names the capture form a contact signed up through', () => {
    expect(describeSource('widget:resume')).toBe('Capture form: resume')
  })

  it('explains the absence of a source rather than showing nothing', () => {
    // Imported contacts have no consent_source, which is not the same as
    // "unknown" - it means they did not come through a form.
    expect(describeSource(null)).toBe('Imported or added manually')
    expect(describeSource(undefined)).toBe('Imported or added manually')
  })

  it('reads a direct signup plainly', () => {
    expect(describeSource('signup')).toBe('Signed up directly')
  })

  it('passes through a value it does not recognise', () => {
    // Better to show an unfamiliar source than to hide it behind "unknown".
    expect(describeSource('api:partner-import')).toBe('api:partner-import')
  })

  it('handles a widget slug containing a colon', () => {
    expect(describeSource('widget:spring:2026')).toBe('Capture form: spring:2026')
  })
})
