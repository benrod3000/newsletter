import { describe, it, expect } from 'vitest'
import { describeAudit, SENSITIVE_ACTIONS } from './audit'

/**
 * Audit entries are the thing an account owner scans to decide whether
 * something needs attention, so the summary has to carry the detail that
 * decides it. "Credentials changed" without saying which, or "contacts
 * exported" without saying how many, is not useful.
 */

describe('describeAudit', () => {
  it('includes the number of contacts in an export', () => {
    const line = describeAudit({ action: 'subscriber_exported', details: { count: 10300 } })
    expect(line).toContain('10,300')
  })

  it('includes the number deleted, which is the number that matters most', () => {
    expect(describeAudit({ action: 'subscriber_deleted', details: { deleted: 42 } })).toContain('42')
  })

  it('names which credentials changed', () => {
    const line = describeAudit({
      action: 'credentials_changed',
      details: { credentials: ['resend_api_key'] },
    })
    expect(line.toLowerCase()).toContain('resend')
  })

  it('says when a credential was removed rather than replaced', () => {
    const line = describeAudit({
      action: 'credentials_changed',
      details: { credentials: ['resend_api_key'], cleared: ['resend_api_key'] },
    })
    expect(line.toLowerCase()).toContain('removed')
  })

  it('never leaks a secret value even if one somehow reached details', () => {
    // The backend records field names only. This asserts the UI would not
    // surface a value if that ever regressed.
    const line = describeAudit({
      action: 'credentials_changed',
      details: { credentials: ['resend_api_key'], value: 're_live_SECRET' },
    })
    expect(line).not.toContain('re_live_SECRET')
  })

  it('names who was invited and with what role', () => {
    const line = describeAudit({
      action: 'member_invited',
      details: { invited_email: 'sam@example.com', role: 'editor' },
    })
    expect(line).toContain('sam@example.com')
    expect(line).toContain('editor')
  })

  it('falls back to a readable label for an action it does not know', () => {
    // Actions are added backend-first, so the UI must not break on a new one.
    expect(describeAudit({ action: 'some_new_action' })).toBe('some new action')
  })

  it('does not throw on a malformed entry', () => {
    expect(() => describeAudit(null)).not.toThrow()
    expect(() => describeAudit({})).not.toThrow()
    expect(() => describeAudit({ action: 'subscriber_exported' })).not.toThrow()
  })

  it('omits the count when details are missing rather than printing undefined', () => {
    expect(describeAudit({ action: 'subscriber_exported' })).not.toMatch(/undefined|NaN/)
  })
})

describe('SENSITIVE_ACTIONS', () => {
  it('flags bulk data movement and credential changes', () => {
    for (const action of [
      'subscriber_exported',
      'subscriber_imported',
      'subscriber_deleted',
      'credentials_changed',
      'member_invited',
    ]) {
      expect(SENSITIVE_ACTIONS.has(action)).toBe(true)
    }
  })

  it('does not flag routine activity, because flagging everything flags nothing', () => {
    expect(SENSITIVE_ACTIONS.has('login')).toBe(false)
    expect(SENSITIVE_ACTIONS.has('settings_changed')).toBe(false)
  })
})
