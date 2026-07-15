import { useEffect, useRef } from 'react'

export default function CountUp({ value, suffix = '', duration = 1500 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const target = parseInt(value.replace(/[^0-9]/g, ''), 10)
    if (isNaN(target)) { el.textContent = value; return }
    const frame = (now) => {
      const pct = Math.min((now - start) / duration, 1)
      el.textContent = Math.floor(pct * target).toLocaleString() + suffix
      if (pct < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [value, duration, suffix])
  return <span ref={ref}>0</span>
}
