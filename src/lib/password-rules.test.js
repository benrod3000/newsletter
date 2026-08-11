import { describe, it, expect } from 'vitest'
import { MIN_PASSWORD_LENGTH, passwordProblem, passwordStrength } from './password-rules'

/**
 * Mirror of `newsletter-core/src/lib/__tests__/password-policy.test.ts`.
 *
 * The two repos deploy independently and cannot import from each other, so the
 * minimum is duplicated. It was previously duplicated at 6 in four places, which
 * is how a form ends up promising a password the API will refuse. If one of these
 * two test files fails after a change, the halves have drifted.
 */

describe('password rules', () => {
  it('requires at least 12 characters, matching the API', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12)
  })

  it('rejects a password one character short', () => {
    expect(passwordProblem('a'.repeat(11))).toMatch(/at least 12/i)
  })

  it('accepts a password at exactly the minimum', () => {
    expect(passwordProblem('a'.repeat(12))).toBeNull()
  })

  it('accepts a long passphrase with no digits or symbols', () => {
    expect(passwordProblem('correct horse battery staple')).toBeNull()
  })

  it('reports a missing password as missing rather than short', () => {
    expect(passwordProblem('')).toMatch(/enter a password/i)
    expect(passwordProblem(undefined)).toMatch(/enter a password/i)
  })
})

describe('passwordStrength', () => {
  it('says nothing until the password is long enough to be acceptable', () => {
    // Guidance, not gatekeeping: below the minimum the form already shows how
    // many characters remain, and a second verdict there would just be noise.
    expect(passwordStrength('short')).toBeNull()
    expect(passwordStrength('a'.repeat(11))).toBeNull()
  })

  it('rewards length over character variety', () => {
    expect(passwordStrength('a'.repeat(20))).toBe('strong')
    expect(passwordStrength('a'.repeat(14))).toBe('good')
    // Exactly at the minimum, all one class: acceptable but not impressive.
    expect(passwordStrength('a'.repeat(12))).toBe('fair')
  })

  it('gives credit for variety at shorter lengths', () => {
    expect(passwordStrength('Abcdef123!xyz')).toBe('good')
  })

  it('never withholds a verdict from an acceptable password', () => {
    // Every acceptable password gets one of the three bands, so the helper text
    // cannot render "Strength: null".
    for (const pw of ['a'.repeat(12), 'Abcdef123!xyz', 'a'.repeat(50)]) {
      expect(['fair', 'good', 'strong']).toContain(passwordStrength(pw))
    }
  })
})
