/**
 * Normalizes auth API failures into something a form can render.
 *
 * Every auth page used to do its own `err.response.data.error` unwrapping and
 * drop the result into a single banner. That threw away everything the server
 * actually told us: which field was wrong, whether the user already has an
 * account, how long a rate limit lasts. Signup and login also drifted apart,
 * because the logic lived in two catch blocks instead of one place.
 *
 * The server currently identifies failures by status code plus a human message.
 * If it ever grows machine-readable codes, `code` is read first and the
 * status/message matching below becomes the fallback — callers don't change.
 */

/**
 * @typedef {Object} AuthError
 * @property {string}  message   Text to show the user.
 * @property {?string} field     Field to attach the message to, if any.
 * @property {?Object} action    Optional follow-up link: { label, to }.
 * @property {?number} retryAfter Seconds until a rate limit clears.
 */

/** Unwraps the server's error payload, which is sometimes a string, sometimes { message }. */
function readMessage(data) {
  const err = data?.error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') return err.message || null
  return null
}

/** Rate limit responses carry Retry-After in seconds; treat anything unparseable as absent. */
function readRetryAfter(response) {
  const raw = response?.headers?.['retry-after']
  const seconds = Number.parseInt(raw, 10)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

/**
 * @param {unknown} err        The rejected axios error.
 * @param {Object}  [options]
 * @param {string}  [options.fallback] Message when nothing better is available.
 * @returns {AuthError}
 */
export function normalizeAuthError(err, { fallback = 'Something went wrong. Try again.' } = {}) {
  const response = err?.response
  const status = response?.status
  const serverMessage = readMessage(response?.data)

  // No response at all: the request never landed. Distinguishing this matters —
  // "check your connection" is actionable, "signup failed" is not.
  if (!response) {
    return {
      message: 'Could not reach the server. Check your connection and try again.',
      field: null,
      action: null,
      retryAfter: null,
    }
  }

  if (status === 409) {
    return {
      message: 'An account with this email already exists.',
      field: 'email',
      action: { label: 'Sign in instead', to: '/login' },
      retryAfter: null,
    }
  }

  if (status === 429) {
    return {
      message: serverMessage || 'Too many attempts. Please wait before trying again.',
      field: null,
      action: null,
      retryAfter: readRetryAfter(response),
    }
  }

  // 400s are the server's own validation. It already phrases these well, so the
  // job here is routing them to the right input rather than rewriting them.
  if (status === 400 && serverMessage) {
    return {
      message: serverMessage,
      field: fieldForMessage(serverMessage),
      action: null,
      retryAfter: null,
    }
  }

  return {
    message: serverMessage || fallback,
    field: null,
    action: null,
    retryAfter: null,
  }
}

/**
 * Maps a server validation message to the input it belongs to.
 *
 * Matching on prose is fragile, which is the point of keeping it in one small
 * function: when the server grows real error codes, only this goes away.
 */
function fieldForMessage(message) {
  const m = message.toLowerCase()
  if (m.includes('email')) return 'email'
  if (m.includes('password')) return 'password'
  return null
}

/** Whether a failure means the Turnstile token must be discarded and re-solved. */
export function requiresNewSecurityCheck(err) {
  const status = err?.response?.status
  if (status !== 400) return false
  const message = readMessage(err?.response?.data) || ''
  return message.toLowerCase().includes('security check')
}
