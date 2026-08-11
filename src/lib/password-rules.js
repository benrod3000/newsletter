/**
 * The client-side half of the password rule.
 *
 * Mirrors `newsletter-core/src/lib/password-policy.ts`. Two repos deploy
 * independently, so this cannot import from there - but the number was previously
 * written out four times across the two of them, all saying 6, which is exactly
 * how a raise gets half-applied and the form starts promising something the API
 * refuses.
 *
 * Length only. Composition rules push people toward `Password1!` and away from
 * the long passphrases that are genuinely stronger, and no input here sets
 * `maxLength`, which would truncate whatever a password manager generated.
 */
export const MIN_PASSWORD_LENGTH = 12

/** Why a password is unacceptable, or null when it is fine. */
export function passwordProblem(password) {
  if (!password) return 'Enter a password.'
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  return null
}

/**
 * Rough strength band, for guidance rather than gatekeeping.
 *
 * Deliberately crude: it rewards length, which is what actually matters, and
 * gives a small nudge for variety without ever blocking a submission.
 */
export function passwordStrength(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) return null

  const variety =
    (/[a-z]/.test(password) ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0)

  if (password.length >= 20 || (password.length >= 16 && variety >= 3)) return 'strong'
  if (password.length >= 14 || variety >= 3) return 'good'
  return 'fair'
}
