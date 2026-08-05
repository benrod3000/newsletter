import { describe, it, expect } from 'vitest'
import { measureEmbedHeight } from './use-embed-height'

/**
 * How tall the embedded capture form tells its host to be.
 *
 * This rule has already been wrong once in a way that looked right: the first
 * version used `documentElement.scrollHeight`, which is floored at the viewport
 * height - and inside an iframe the viewport *is* the frame. So it could grow a
 * frame and never shrink one, and a widget with 72px of content reported 502px,
 * exactly matching whatever the host had already reserved. It only surfaced by
 * embedding the real widget and reading the number back.
 *
 * These use a fake document rather than jsdom layout, because jsdom does not do
 * layout at all - getBoundingClientRect returns zeroes there, so a "real" DOM
 * test would assert nothing.
 */

function fakeDoc({ height, marginTop = '0px', marginBottom = '0px', noBody = false }) {
  const body = { getBoundingClientRect: () => ({ height }) }
  return {
    doc: noBody ? {} : { body },
    win: { getComputedStyle: () => ({ marginTop, marginBottom }) },
  }
}

describe('measureEmbedHeight', () => {
  it('reports the laid-out height of the body', () => {
    const { doc, win } = fakeDoc({ height: 72 })
    expect(measureEmbedHeight(doc, win)).toBe(72)
  })

  it('reports content height regardless of how tall the frame is', () => {
    // The regression that matters: a small form inside a 502px frame must say
    // 72, not 502, or it can never shrink.
    const { doc, win } = fakeDoc({ height: 72 })
    expect(measureEmbedHeight(doc, win)).toBeLessThan(502)
  })

  it('adds body margins, which fall outside the bounding box', () => {
    // Without this the last few pixels of a form are clipped.
    const { doc, win } = fakeDoc({ height: 100, marginTop: '8px', marginBottom: '12px' })
    expect(measureEmbedHeight(doc, win)).toBe(120)
  })

  it('rounds up, so a fractional height never clips', () => {
    const { doc, win } = fakeDoc({ height: 99.2 })
    expect(measureEmbedHeight(doc, win)).toBe(100)
  })

  it('treats unparseable margins as zero rather than producing NaN', () => {
    // A NaN height would be posted to the host and set as a CSS value, which
    // silently does nothing - the frame would keep its stale height.
    const { doc, win } = fakeDoc({ height: 50, marginTop: 'auto', marginBottom: '' })
    expect(measureEmbedHeight(doc, win)).toBe(50)
  })

  it('returns 0 rather than throwing before the body exists', () => {
    const { doc, win } = fakeDoc({ height: 0, noBody: true })
    expect(measureEmbedHeight(doc, win)).toBe(0)
  })
})
