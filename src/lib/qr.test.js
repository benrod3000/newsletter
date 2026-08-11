import { describe, it, expect } from 'vitest'
import { toQrDataUrl } from './qr'

/**
 * The 2FA QR code used to be an <img> pointing at api.qrserver.com with the
 * otpauth URI - and therefore the shared TOTP secret - in the query string. Every
 * 2FA enrolment handed the second factor to a third party, where it sits in access
 * logs. Whoever has it can generate that user's codes indefinitely.
 *
 * The property under test is that encoding happens here and produces something an
 * <img> can render without a network request at all.
 */

const OTPAUTH =
  'otpauth://totp/Veloce:ben@brod3000.com?secret=JBSWY3DPEHPK3PXP&issuer=Veloce&algorithm=SHA1&digits=6&period=30'

describe('toQrDataUrl', () => {
  it('returns a self-contained data URL, so nothing is fetched', () => {
    const url = toQrDataUrl(OTPAUTH)
    expect(url).toMatch(/^data:image\//)
    // The whole point: no third-party host anywhere in the output.
    expect(url).not.toContain('qrserver')
    expect(url).not.toContain('http')
  })

  it('does not leak the secret in readable form', () => {
    // Encoded as image bytes, not embedded as text. Base64 of the URI would still
    // be trivially recoverable by anyone who saw the markup.
    const url = toQrDataUrl(OTPAUTH)
    expect(url).not.toContain('JBSWY3DPEHPK3PXP')
    expect(url).not.toContain('otpauth')
  })

  it('encodes a full otpauth URI without throwing', () => {
    // Byte mode matters here: an otpauth URI is mixed case with punctuation, which
    // alphanumeric mode cannot represent. A throw would leave the setup screen
    // blank.
    expect(() => toQrDataUrl(OTPAUTH)).not.toThrow()
    expect(toQrDataUrl(OTPAUTH).length).toBeGreaterThan(100)
  })

  it('produces different output for different secrets', () => {
    // Guards against returning a fixed placeholder image, which would look fine
    // and enrol everyone against the wrong secret.
    const a = toQrDataUrl(OTPAUTH)
    const b = toQrDataUrl(OTPAUTH.replace('JBSWY3DPEHPK3PXP', 'MFRGGZDFMZTWQ2LK'))
    expect(a).not.toBe(b)
  })

  it('returns null for empty input rather than an empty code', () => {
    // The URI arrives asynchronously, so the first render has nothing. The caller
    // shows the manual entry key in that case.
    expect(toQrDataUrl('')).toBeNull()
    expect(toQrDataUrl(null)).toBeNull()
    expect(toQrDataUrl(undefined)).toBeNull()
  })

  it('returns null rather than throwing when the payload cannot be encoded', () => {
    // QR has a hard capacity limit. Failing soft keeps manual entry available
    // instead of breaking the whole settings page.
    expect(toQrDataUrl('x'.repeat(50000))).toBeNull()
  })
})
