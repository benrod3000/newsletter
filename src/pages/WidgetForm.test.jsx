import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import WidgetForm from './WidgetForm'

/**
 * The embedded capture form, actually rendered.
 *
 * Nothing rendered this component before, which let a real defect through: a hook
 * was placed above the `useState` that produced the value it reads. That is a
 * temporal dead zone error - it throws the moment the component mounts - and both
 * `npm run build` and the rest of the suite stayed green, because a bundler does
 * not evaluate the function body and no test had ever called it.
 *
 * These tests are deliberately shallow. Their value is that the component mounts at
 * all, and that its loading state stays small: the placeholder is what the embed
 * host measures itself against, and an oversized one made the iframe balloon and
 * then collapse on every load.
 */

vi.mock('axios', () => ({
  default: {
    // Never resolves, so the component stays in its loading state.
    get: () => new Promise(() => {}),
    post: vi.fn(),
  },
}))

function renderWidget() {
  return render(
    <MemoryRouter initialEntries={['/w/abc']}>
      <Routes>
        <Route path="/w/:id" element={<WidgetForm />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('WidgetForm', () => {
  it('mounts without throwing', () => {
    // The regression this file exists for. A hook reading `loading` before its
    // declaration threw "Cannot access 'loading' before initialization" here.
    expect(() => renderWidget()).not.toThrow()
  })

  it('shows a loading state that announces itself', () => {
    renderWidget()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Loading form')).toBeTruthy()
  })

  it('keeps the loading placeholder small', () => {
    // The host iframe measures this. The shared dashboard LoadingState that used to
    // be here rendered six skeleton bars in a p-8 card - roughly 400px - so the
    // frame grew to fit it and snapped back once the widget arrived. Two skeleton
    // bars, one row: smaller than any real widget, so the frame only ever grows.
    const { container } = renderWidget()
    expect(container.querySelectorAll('.skeleton')).toHaveLength(2)
    expect(container.textContent).not.toContain('Loading widget')
  })
})
