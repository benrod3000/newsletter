import qrcode from 'qrcode-generator'

/**
 * Render text as a QR code, in this browser.
 *
 * The 2FA setup screen used to build an `<img>` pointing at
 * `api.qrserver.com/v1/create-qr-code/?data=<otpauth uri>`. That URI contains the
 * shared TOTP secret, so enabling two-factor authentication sent the second factor
 * to a third party in a query string - where it lands in their access logs, and in
 * any intermediary's. A stranger holding that secret can generate the user's codes
 * indefinitely, which is the entire thing 2FA is meant to prevent.
 *
 * Generated locally instead, so the secret never leaves the page. `qrcode-generator`
 * is used rather than the more common `qrcode` package because it has no
 * dependencies at all, where `qrcode` pulls in a `yargs` tree for its CLI - a poor
 * trade when the same commit removes an unused CDN from the CSP for supply-chain
 * reasons.
 *
 * Returns a `data:` URL, allowed by `img-src 'self' data:` in vercel.json, or null
 * if encoding fails - the caller must keep offering manual entry of the key either
 * way, because a QR code is unusable to anyone entering it by hand.
 */
export function toQrDataUrl(text, { cellSize = 5, margin = 2 } = {}) {
  if (!text) return null

  try {
    // 0 lets the library pick the smallest version that fits. 'M' is the error
    // correction level authenticator apps expect.
    const qr = qrcode(0, 'M')
    // Byte mode explicitly: an otpauth:// URI is mixed case with punctuation, and
    // the alphanumeric mode this would otherwise select cannot represent it.
    qr.addData(text, 'Byte')
    qr.make()
    return qr.createDataURL(cellSize, margin)
  } catch {
    return null
  }
}
