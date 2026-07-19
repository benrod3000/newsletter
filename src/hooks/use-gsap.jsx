import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useReveal(ref, { stagger = 0.1, y = 20, opacity = 0, duration = 0.5, delay = 0.05, ease = 'power2.out' } = {}) {
  useEffect(() => {
    if (!ref.current) return
    const children = Array.from(ref.current.children)
    if (!children.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(children, { opacity, y }, { opacity: 1, y: 0, duration, stagger, delay, ease })
    }, ref)
    return () => ctx.revert()
  }, [ref, stagger, y, opacity, duration, delay, ease])
}

export function useScrollReveal(selector, { y = 30, opacity = 0, duration = 0.6, stagger = 0.1, start = 'top 88%', ease = 'power2.out' } = {}) {
  useLayoutEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(elements, { opacity, y }, { opacity: 1, y: 0, duration, stagger, ease, scrollTrigger: { trigger: elements[0], start, toggleActions: 'play none none none' } })
    })
    return () => ctx.revert()
  }, [selector, y, opacity, duration, stagger, start, ease])
}

export function useTerminalReveal(selector, { start = 'top 88%', stagger = 0.06, opacity = 0, x = -8, duration = 0.4, ease = 'power2.out' } = {}) {
  useLayoutEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(elements, { opacity, x }, { opacity: 1, x: 0, duration, stagger, ease, scrollTrigger: { trigger: elements[0], start, toggleActions: 'play none none none' } })
      gsap.utils.toArray('.term-cursor').forEach(el => {
        gsap.to(el, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'power1.inOut' })
      })
    })
    return () => ctx.revert()
  }, [selector, start, stagger, opacity, x, duration, ease])
}


