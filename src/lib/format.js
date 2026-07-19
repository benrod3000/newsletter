/**
 * Shared formatting helpers used across dashboard pages.
 */

export const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '--')

export const fmtPct = (n) => (typeof n === 'number' ? `${n.toFixed(1)}%` : '--')
