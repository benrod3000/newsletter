import { useEffect } from 'react'

/**
 * Reports this page's rendered height to the host page that embedded it.
 *
 * The embed snippet produces a fixed-height iframe, with the height computed in
 * the dashboard at the moment the user copied the code. That number is a guess
 * frozen in time, and it is wrong in every direction:
 *
 *   - the widget is edited afterwards (a field added, the size changed) and the
 *     embed still reserves the old height
 *   - the host page is narrow, so labels and the headline wrap onto more lines
 *     and the content is taller than the frame - the clipping seen on
 *     brod3000.com
 *   - a validation message appears, or the form swaps to its success state, and
 *     the height changes after load
 *
 * None of that is knowable when the snippet is copied. It is knowable here, so
 * the page measures itself and tells the host.
 *
 * The host listener is five lines and ships with the snippet. Pages that embed
 * the old snippet keep working: without a listener these messages are simply
 * ignored, and the iframe keeps its static height.
 */
/**
 * The rendered height of a document, as the host should size its iframe.
 *
 * Exported and pure so the rule can be tested. It has already been wrong once:
 * the first version used `documentElement.scrollHeight`, which is floored at the
 * viewport height - inside a frame, the frame itself. That could grow a frame
 * but never shrink one, so a widget with 72px of content reported 502px and
 * matched whatever the host had already reserved.
 *
 * `body`'s bounding rect measures what was actually laid out. Body margins fall
 * outside that box, so they are added back rather than clipping the last few
 * pixels off a form.
 */
export function measureEmbedHeight(doc, win) {
  const body = doc?.body
  if (!body) return 0
  const style = win.getComputedStyle(body)
  const margins = (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0)
  return Math.ceil(body.getBoundingClientRect().height + margins)
}

export function useEmbedHeight(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    // Only meaningful inside a frame; top-level visits have nobody to tell.
    if (typeof window === 'undefined' || window.parent === window) return

    // Without this the measurement is circular and silently useless.
    //
    // index.css sets `#root { min-height: 100vh }`, and inside a frame 100vh is
    // the frame's own height. So the content always filled whatever box the host
    // had reserved, scrollHeight reported that same number back, the host set the
    // frame to it, and the value stabilised at whatever it started as. Measured:
    // a slim widget, roughly one row of controls, reported 502px.
    //
    // Marked on <html> rather than removed globally: a standalone visit to this
    // page still wants to fill the viewport, and every other route relies on the
    // rule. See the matching selector in index.css.
    document.documentElement.dataset.veloceEmbed = 'true'

    let last = 0

    const report = () => {
      // Measured from <body>, not documentElement.scrollHeight.
      //
      // documentElement.scrollHeight is floored at the viewport height, and in
      // a frame the viewport *is* the frame. So it can never report less than
      // the height the host already set, which means it can grow a frame but
      // never shrink one - the same "cannot get smaller" failure this hook was
      // written to remove, just moved. Measured: a slim widget whose content is
      // 72px tall reported 502px, matching the frame exactly.
      //
      // getBoundingClientRect on <body> measures what was actually laid out.
      // Body margins sit outside that box, so they are added back rather than
      // clipping the last few pixels.
      const height = measureEmbedHeight(document, window)

      if (!height || height === last) return
      last = height
      // targetOrigin '*' because the host is any customer site and we do not
      // know it. The payload carries no user data - it is one integer - so
      // there is nothing here to leak to a wrong recipient.
      window.parent.postMessage({ type: 'veloce:height', height }, '*')
    }

    report()

    // Fires on wrapping changes, validation messages, the success state, and
    // late-loading fonts or images, which is everything that moves the height.
    const observer = new ResizeObserver(report)
    observer.observe(document.body)

    // Belt and braces for image loads that do not change the observed box until
    // decode completes.
    window.addEventListener('load', report)

    return () => {
      observer.disconnect()
      window.removeEventListener('load', report)
      delete document.documentElement.dataset.veloceEmbed
    }
  }, [enabled])
}
