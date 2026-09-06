/**
 * Shared formatting helpers used across dashboard pages.
 *
 * Two placeholders, not one, because "we have no value" and "this was never
 * measured" are different claims and the second is the one that used to get
 * stated wrongly. An open rate for a period with no sends is not 0%, and it is
 * not "None" either - both read as a measured result of zero. It is unknown,
 * and saying so is the whole point of not printing a number.
 *
 * Neither may be a dash character, and that includes the ASCII double hyphen
 * these both used to be.
 */

/** A value that is absent: no phone number, no location, no date recorded. */
export const NO_VALUE = 'None'

/** A figure that could not be calculated, rather than one that came out zero. */
export const NOT_MEASURED = 'Not measured'

export const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : NO_VALUE)

export const fmtPct = (n) => (typeof n === 'number' ? `${n.toFixed(1)}%` : NOT_MEASURED)
