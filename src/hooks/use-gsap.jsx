import { useLayoutEffect, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * These hooks animate content in from opacity 0, which means the content is
 * INVISIBLE until the animation runs. Anything that stops it running leaves a
 * blank page — observed on the landing hero, where the headline and call to
 * action failed to appear at all on some loads.
 *
 * Two safeguards, both of which favour "visible but unanimated" over "hidden":
 *   - prefersReducedMotion skips the animation entirely and leaves content as-is
 *     (also the correct behaviour for users who ask for reduced motion).
 *   - revealNow() force-clears the inline properties if an animation has not
 *     completed in time, so a stalled tween cannot hide content permanently.
 *
 * ScrollTrigger is also refreshed once webfonts land: Bebas Neue is loaded from
 * a stylesheet @import, and the layout shift when it arrives invalidates the
 * trigger positions cached at first paint.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Longest an element may stay hidden waiting for its reveal. */
const REVEAL_SAFETY_MS = 2000

function revealNow(elements) {
  gsap.set(elements, { clearProps: 'opacity,transform' })
}

if (typeof document !== 'undefined' && document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
}

export function useReveal(ref, { stagger = 0.1, y = 20, opacity = 0, duration = 0.5, delay = 0.05, ease = 'power2.out' } = {}) {
  useEffect(() => {
    if (!ref.current) return
    const children = Array.from(ref.current.children)
    if (!children.length) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(children, { opacity, y }, { opacity: 1, y: 0, duration, stagger, delay, ease })
    }, ref)

    const safety = setTimeout(() => revealNow(children), REVEAL_SAFETY_MS)

    return () => {
      clearTimeout(safety)
      ctx.revert()
    }
  }, [ref, stagger, y, opacity, duration, delay, ease])
}

export function useScrollReveal(selector, { y = 30, opacity = 0, duration = 0.6, stagger = 0.1, start = 'top 88%', ease = 'power2.out' } = {}) {
  useLayoutEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(elements, { opacity, y }, { opacity: 1, y: 0, duration, stagger, ease, scrollTrigger: { trigger: elements[0], start, toggleActions: 'play none none none', once: true, invalidateOnRefresh: true } })
    })

    const safety = setTimeout(() => revealNow(elements), REVEAL_SAFETY_MS)

    return () => {
      clearTimeout(safety)
      ctx.revert()
    }
  }, [selector, y, opacity, duration, stagger, start, ease])
}

export function useTerminalReveal(selector, { start = 'top 88%', stagger = 0.06, opacity = 0, x = -8, duration = 0.4, ease = 'power2.out' } = {}) {
  useLayoutEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(elements, { opacity, x }, { opacity: 1, x: 0, duration, stagger, ease, scrollTrigger: { trigger: elements[0], start, toggleActions: 'play none none none', once: true, invalidateOnRefresh: true } })
      gsap.utils.toArray('.term-cursor').forEach(el => {
        gsap.to(el, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'power1.inOut' })
      })
    })

    const safety = setTimeout(() => revealNow(elements), REVEAL_SAFETY_MS)

    return () => {
      clearTimeout(safety)
      ctx.revert()
    }
  }, [selector, start, stagger, opacity, x, duration, ease])
}


