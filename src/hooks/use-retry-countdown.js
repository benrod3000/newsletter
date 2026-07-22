import { useEffect, useState } from 'react'

/**
 * Counts down the seconds left on a rate limit.
 *
 * Signup allows 3 attempts per minute per IP and returns Retry-After, but the
 * forms ignored it: a user who mistyped twice hit a request that failed with no
 * visible reason and no idea when to try again. Surfacing the number turns a
 * dead form into a wait.
 *
 * @param {?number} seconds Initial seconds from the server, or null when not rate limited.
 * @returns {number} Seconds remaining; 0 once the limit has cleared.
 */
export function useRetryCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds ?? 0)
  const [lastSeconds, setLastSeconds] = useState(seconds)

  // Restart whenever the server hands us a new limit. Adjusting during render
  // is React's documented way to reset state on a changed input; doing it in an
  // effect would render the stale count first, then immediately re-render.
  if (seconds !== lastSeconds) {
    setLastSeconds(seconds)
    setRemaining(seconds ?? 0)
  }

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining])

  return remaining
}
