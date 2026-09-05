import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from './LandingPage'

/**
 * A render test, not a snapshot.
 *
 * The build catches syntax and missing imports; it does not catch a page that
 * throws on mount, and this page has no other automated coverage. The content
 * assertions below are deliberately about the two rules this page keeps
 * breaking rather than about wording:
 *
 *   1. It must not advertise capabilities that do not exist. Zapier, WordPress,
 *      Shopify, a custom API and webhooks were all listed as integrations with
 *      zero code behind them in either repo.
 *   2. SMS and RCS are built but switched off (SMS_ENABLED is false, the backend
 *      returns 503), so they may appear as roadmap and never as available.
 *
 * Both were shipped claims at one point, alongside fabricated metrics and
 * testimonials that had to be removed. See the notes in ./LandingPage/data.js.
 */

function renderPage() {
  return render(<MemoryRouter><LandingPage /></MemoryRouter>)
}

describe('LandingPage', () => {
  it('mounts and renders the headline', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('states the product thesis above the fold', () => {
    renderPage()
    expect(
      screen.getByText(/know who you can reach, why you can reach them, and when to talk to them/i)
    ).toBeInTheDocument()
  })

  it('asks the who, why and when questions', () => {
    renderPage()
    expect(screen.getByText(/who is actually in my audience/i)).toBeInTheDocument()
    expect(screen.getByText(/why am i allowed to contact them/i)).toBeInTheDocument()
    expect(screen.getByText(/when does it make sense to reach out/i)).toBeInTheDocument()
  })

  it('shows all three reachability states', () => {
    renderPage()
    // "Reachable" also labels rows in the hero mockup and the evidence card,
    // which is the point: the state shown in the product is the one explained here.
    expect(screen.getAllByText('Reachable').length).toBeGreaterThan(0)
    expect(screen.getByText(/not yet confirmed/i)).toBeInTheDocument()
    expect(screen.getByText('Unreachable')).toBeInTheDocument()
    expect(screen.getByText(/confirmed, consented, and not suppressed/i)).toBeInTheDocument()
  })

  it('lists only providers that exist', () => {
    renderPage()
    for (const real of ['Resend', 'Amazon SES', 'SendGrid']) {
      expect(screen.getByText(real)).toBeInTheDocument()
    }
  })

  it('does not advertise integrations that have no implementation', () => {
    const { container } = renderPage()
    const text = container.textContent
    for (const fake of ['Zapier', 'WordPress', 'Shopify', 'Custom API', 'Webhook']) {
      expect(text).not.toMatch(new RegExp(fake, 'i'))
    }
  })

  it('presents SMS and RCS as roadmap, never as available', () => {
    const { container } = renderPage()
    expect(container.textContent).toMatch(/next on the roadmap/i)
    // The only SMS/RCS mentions must sit inside the roadmap block.
    const roadmap = screen.getByText(/next on the roadmap/i).parentElement
    expect(roadmap.textContent).toMatch(/SMS/)
    expect(roadmap.textContent).toMatch(/RCS/)
    const outside = container.textContent.replace(roadmap.textContent, '')
    expect(outside).not.toMatch(/\bSMS\b/)
    expect(outside).not.toMatch(/\bRCS\b/)
  })

  it('offers one primary call to action, repeated rather than competing', () => {
    renderPage()
    const signup = screen.getAllByRole('button', { name: /create free account/i })
    expect(signup.length).toBeGreaterThan(0)
    expect(signup.length).toBeLessThanOrEqual(3)
  })

  it('keeps the capture form reachable and labelled', () => {
    renderPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument()
  })
})
