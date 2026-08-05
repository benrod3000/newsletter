import { describe, it, expect } from 'vitest'
import { canAdvance, contentFingerprint, describeFilters } from '../lib/send-flow-rules'

/**
 * The gating rules for sending to an audience.
 *
 * This is the highest-consequence logic in the product: a bug here means a
 * broadcast goes to real people when it should not have, and cannot be recalled.
 * It replaced a dialog whose recipient count, cost estimate and named provider
 * were all fabricated, so "it looked right on screen" has already proven to be
 * an insufficient standard for this particular screen.
 */

const ok = { testValid: true, estimate: { count: 10 }, estimateLoading: false, estimateError: null }

describe('canAdvance', () => {
  it('will not leave the test step until a test has been sent', () => {
    expect(canAdvance('test', { ...ok, testValid: false })).toBe(false)
    expect(canAdvance('test', ok)).toBe(true)
  })

  it('will not leave the recipients step while the count is still loading', () => {
    // Advancing here would show "Send to undefined" on the final step.
    expect(canAdvance('confirm', { ...ok, estimateLoading: true })).toBe(false)
  })

  it('will not leave the recipients step if the count could not be calculated', () => {
    // No fallback number: a wrong count is worse than no count when the whole
    // point of the step is that the figure can be trusted.
    expect(canAdvance('confirm', { ...ok, estimateError: 'boom', estimate: null })).toBe(false)
  })

  it('will not advance when the send would reach nobody', () => {
    expect(canAdvance('confirm', { ...ok, estimate: { count: 0 } })).toBe(false)
  })

  it('advances when the count is real and positive', () => {
    expect(canAdvance('confirm', ok)).toBe(true)
  })

  it('does not block the preview step, which is read-only', () => {
    expect(canAdvance('preview', { ...ok, testValid: false })).toBe(true)
  })

  it('treats a missing estimate as not advanceable rather than throwing', () => {
    expect(canAdvance('confirm', { ...ok, estimate: undefined })).toBe(false)
  })
})

describe('contentFingerprint', () => {
  it('changes when the subject changes, so a test stops counting', () => {
    const before = contentFingerprint({ subject: 'Hello', editor_html: '<p>Hi</p>' })
    const after = contentFingerprint({ subject: 'Hello there', editor_html: '<p>Hi</p>' })
    expect(after).not.toBe(before)
  })

  it('changes when the body changes', () => {
    const before = contentFingerprint({ subject: 'Hello', editor_html: '<p>Hi</p>' })
    const after = contentFingerprint({ subject: 'Hello', editor_html: '<p>Hi there</p>' })
    expect(after).not.toBe(before)
  })

  it('is stable when nothing that gets rendered changed', () => {
    const campaign = { subject: 'Hello', editor_html: '<p>Hi</p>' }
    expect(contentFingerprint(campaign)).toBe(contentFingerprint({ ...campaign }))
  })

  it('ignores the audience, which does not affect what the email looks like', () => {
    // Narrowing the recipient list should not force a re-test; the audience is
    // verified separately at the recipients step.
    const a = contentFingerprint({ subject: 'Hi', editor_html: '<p>x</p>', audience: 'confirmed' })
    const b = contentFingerprint({ subject: 'Hi', editor_html: '<p>x</p>', audience: 'all' })
    expect(a).toBe(b)
  })

  it('does not throw on an empty draft', () => {
    expect(() => contentFingerprint(null)).not.toThrow()
    expect(() => contentFingerprint({})).not.toThrow()
  })
})

describe('describeFilters', () => {
  it('explains a plain confirmed-subscriber send', () => {
    expect(describeFilters({ audience: 'confirmed', filters: {} })).toContain('Confirmed subscribers')
  })

  it('spells out each geographic narrowing so the number is checkable', () => {
    const line = describeFilters({
      audience: 'all',
      filters: { country: 'US', regions: ['California'], cities: ['Los Angeles'] },
    })
    expect(line).toContain('US')
    expect(line).toContain('California')
    expect(line).toContain('Los Angeles')
  })

  it('reports a radius in whole kilometres', () => {
    const line = describeFilters({ audience: 'all', filters: { radius_km: 16.09344 } })
    expect(line).toContain('16 km')
  })

  it('does not throw on a missing estimate', () => {
    expect(() => describeFilters(null)).not.toThrow()
    expect(() => describeFilters({})).not.toThrow()
  })
})
