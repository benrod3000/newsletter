import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import Turnstile from './Turnstile'

/**
 * The signup lockout.
 *
 * The component already handled the script failing to load. What it did not
 * handle was the script loading fine, `render()` returning, and then the
 * challenge never producing a token and never firing an error - which is what an
 * interactive challenge nobody solves, or a sitekey whose hostname list omits
 * this domain, actually looks like.
 *
 * In that state neither `onVerify` nor `onError` ran, and every form here gates
 * its submit button on `!token && !error`. So the button stayed disabled forever
 * under "Waiting for security check...". These tests pin the escape hatch: some
 * callback always fires, so the button always becomes usable.
 */

const TOKEN_TIMEOUT_MS = 25000

/** A Turnstile stub that renders but never calls anything back. */
function silentTurnstile() {
  return { render: vi.fn(() => 'widget-1'), remove: vi.fn() }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete window.turnstile
})

describe('Turnstile', () => {
  it('reports an error when the widget renders but never produces a token', () => {
    // The exact hang. Without the token timeout this assertion never passes,
    // because nothing else in the component is watching.
    window.turnstile = silentTurnstile()
    const onError = vi.fn()
    const onVerify = vi.fn()

    render(<Turnstile onVerify={onVerify} onError={onError} onExpire={() => {}} />)

    expect(onError).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(TOKEN_TIMEOUT_MS) })

    expect(onError).toHaveBeenCalledTimes(1)
    // The wording matters: the caller enables submit on any error, so this must
    // read as "you can carry on", not as a rejection.
    expect(onError.mock.calls[0][0]).toMatch(/still try to continue/i)
    expect(onVerify).not.toHaveBeenCalled()
  })

  it('does not report an error once a token has arrived', () => {
    let verifyCallback
    window.turnstile = {
      render: vi.fn((_el, opts) => { verifyCallback = opts.callback; return 'widget-1' }),
      remove: vi.fn(),
    }
    const onError = vi.fn()
    const onVerify = vi.fn()

    render(<Turnstile onVerify={onVerify} onError={onError} onExpire={() => {}} />)

    act(() => { verifyCallback('token-abc') })
    expect(onVerify).toHaveBeenCalledWith('token-abc')

    // A solved challenge must not later be told it timed out.
    act(() => { vi.advanceTimersByTime(TOKEN_TIMEOUT_MS * 2) })
    expect(onError).not.toHaveBeenCalled()
  })

  it("passes through Turnstile's own error callback immediately", () => {
    let errorCallback
    window.turnstile = {
      render: vi.fn((_el, opts) => { errorCallback = opts['error-callback']; return 'widget-1' }),
      remove: vi.fn(),
    }
    const onError = vi.fn()

    render(<Turnstile onVerify={() => {}} onError={onError} onExpire={() => {}} />)

    act(() => { errorCallback() })
    expect(onError).toHaveBeenCalledTimes(1)

    // And the pending timeout must not fire a second, contradictory message.
    act(() => { vi.advanceTimersByTime(TOKEN_TIMEOUT_MS * 2) })
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('restarts the wait after expiry rather than erroring straight away', () => {
    // Expiry is normal: the widget refreshes and issues another token. Treating
    // it as failure would flash an error at someone who did nothing wrong.
    let opts
    window.turnstile = {
      render: vi.fn((_el, o) => { opts = o; return 'widget-1' }),
      remove: vi.fn(),
    }
    const onError = vi.fn()
    const onExpire = vi.fn()

    render(<Turnstile onVerify={() => {}} onError={onError} onExpire={onExpire} />)

    act(() => { opts.callback('token-abc') })
    act(() => { opts['expired-callback']() })

    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()

    // If the refresh then produces nothing, the fallback still arrives.
    act(() => { vi.advanceTimersByTime(TOKEN_TIMEOUT_MS) })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toMatch(/still try to continue/i)
  })

  it('reports an error when render() throws', () => {
    window.turnstile = {
      render: vi.fn(() => { throw new Error('bad sitekey') }),
      remove: vi.fn(),
    }
    const onError = vi.fn()

    render(<Turnstile onVerify={() => {}} onError={onError} onExpire={() => {}} />)

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('clears the pending timeout on unmount', () => {
    window.turnstile = silentTurnstile()
    const onError = vi.fn()

    const { unmount } = render(<Turnstile onVerify={() => {}} onError={onError} onExpire={() => {}} />)
    unmount()

    // A component that has gone away must not call back into a dead tree.
    act(() => { vi.advanceTimersByTime(TOKEN_TIMEOUT_MS * 2) })
    expect(onError).not.toHaveBeenCalled()
  })
})
