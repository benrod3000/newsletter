/**
 * SMS segment counting, for the composer.
 *
 * This is a deliberate second implementation of `smsSegments` in newsletter-core
 * (`src/lib/sms/segments.ts`). Two copies is a drift risk and this project has
 * been bitten by drift more than once, so the reasoning matters:
 *
 *   - The composer needs the count on every keystroke. A round trip per
 *     character is not an option.
 *   - The server is the authority. It recomputes and REFUSES an over-limit body,
 *     so a bug here can mislead the operator but cannot send something the
 *     backend would reject.
 *   - Both copies are pinned by tests asserting the same boundaries, which is
 *     what keeps them honest. If you change one, change the other.
 *
 * Why any of this exists: carriers bill per segment. A body is 160 characters in
 * one segment while every character is in the GSM-7 alphabet, and 70 the moment
 * one is not. So a single curly apostrophe pasted from a word processor can
 * nearly triple the cost of a send to ten thousand people, invisibly.
 */

const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'

/** Reachable only via an escape sequence, so each costs two of the 160. */
const GSM7_EXTENDED = '^{}\\[~]|€'

const BASIC = new Set(GSM7_BASIC)
const EXTENDED = new Set(GSM7_EXTENDED)

const GSM7_SINGLE = 160
const GSM7_CONCATENATED = 153
const UCS2_SINGLE = 70
const UCS2_CONCATENATED = 67

/** Matches MAX_SMS_SEGMENTS in the backend. Keep them in step. */
export const MAX_SMS_SEGMENTS = 10

export function smsSegments(body) {
  const text = typeof body === 'string' ? body : ''

  // Iterate by code point. Indexing would hand back half a surrogate pair for
  // most emoji and misjudge both the encoding and the length.
  const nonGsm = []
  const seen = new Set()
  let septets = 0

  for (const char of text) {
    if (BASIC.has(char)) septets += 1
    else if (EXTENDED.has(char)) septets += 2
    else if (!seen.has(char)) { seen.add(char); nonGsm.push(char) }
  }

  if (nonGsm.length === 0) {
    return build('GSM-7', septets, GSM7_SINGLE, GSM7_CONCATENATED, nonGsm)
  }

  // UCS-2 counts 16-bit code units, so an astral character costs two. `.length`
  // already counts code units, which is right here and wrong above.
  return build('UCS-2', text.length, UCS2_SINGLE, UCS2_CONCATENATED, nonGsm)
}

function build(encoding, encodedLength, single, concatenated, nonGsmCharacters) {
  if (encodedLength <= single) {
    return {
      encoding,
      segments: 1,
      encodedLength,
      remainingInSegment: single - encodedLength,
      nonGsmCharacters,
    }
  }
  const segments = Math.ceil(encodedLength / concatenated)
  return {
    encoding,
    segments,
    encodedLength,
    remainingInSegment: segments * concatenated - encodedLength,
    nonGsmCharacters,
  }
}

/**
 * Per-recipient price, in dollars.
 *
 * The composer previously multiplied the recipient count by a flat per-message
 * rate, which understates every multi-segment message. A two-segment body over
 * ten thousand people was quoted at half its real cost.
 *
 * Still an estimate: carrier surcharges and per-destination rates vary, and the
 * real number is on the Twilio invoice. Labelled as such in the UI.
 */
export const TWILIO_PER_SEGMENT_USD = 0.0079

/**
 * The body with every non-GSM-7 character removed.
 *
 * Used to show what the message would cost if the offending characters were
 * replaced. Written here rather than as a regex at the call site because the
 * GSM-7 alphabet is the thing that defines "offending", and a regex
 * approximating it (matching non-ASCII, say) would call out characters that are
 * perfectly cheap - the alphabet includes accented vowels and a pound sign.
 */
export function withoutNonGsm(body) {
  if (typeof body !== 'string') return ''
  let out = ''
  for (const char of body) {
    if (BASIC.has(char) || EXTENDED.has(char)) out += char
  }
  return out
}

export function estimateSmsCost(recipientCount, body) {
  const { segments } = smsSegments(body)
  return recipientCount * segments * TWILIO_PER_SEGMENT_USD
}
