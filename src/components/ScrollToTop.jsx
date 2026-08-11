import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset scroll position when the route changes.
 *
 * A single-page app does not reload the document, so the browser keeps the
 * previous scroll offset. Navigating from halfway down the long landing page into
 * /demo or /docs therefore opened the new page already scrolled - most visibly on
 * the demo, which appeared to start partway through.
 *
 * Two deliberate exceptions:
 *
 * - **A hash is left alone.** The nav links to `/#features`, and the handlers
 *   there scroll that element into view. Jumping to the top first would fight
 *   them.
 * - **Only the pathname is watched.** Search-param changes (filters, tabs,
 *   pagination) are the same page, and yanking someone back to the top when they
 *   tick a filter is worse than leaving them where they were.
 *
 * `instant` rather than smooth: this is a page change, not a gesture, and
 * animating it means the new page visibly slides.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
