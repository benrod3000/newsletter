import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

const MAX_VISIBLE = 3

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const TOAST_STYLES = {
  success: 'bg-brutal-green text-white border-3 border-brutal-fg',
  error: 'bg-brutal-red text-white border-3 border-brutal-fg',
  warning: 'bg-brutal-yellow text-brutal-fg border-3 border-brutal-fg',
  info: 'bg-white text-brutal-fg border-3 border-brutal-fg',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const queue = useRef([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const next = prev.filter((t) => t.id !== id)
      // Dequeue if we have room
      if (queue.current.length > 0 && next.length < MAX_VISIBLE) {
        const queued = queue.current.shift()
        return [...next, queued]
      }
      return next
    })
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextId.current++

    setToasts((prev) => {
      // Group identical toasts — increment counter on the last match
      const last = prev[prev.length - 1]
      if (last && last.message === message && last.type === type) {
        const count = (last.count || 1) + 1
        return [...prev.slice(0, -1), { ...last, count, id: last.id }]
      }

      const toast: any = { id, message, type, count: 1 }
      if (prev.length >= MAX_VISIBLE) {
        queue.current.push(toast)
        return prev
      }
      return [...prev, toast]
    })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const dismissAll = useCallback(() => {
    setToasts([])
    queue.current = []
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none" aria-live="polite">
        {toasts.length >= 2 && (
          <button
            onClick={dismissAll}
            className="pointer-events-auto self-end px-2 py-1 border-3 border-brutal-fg bg-brutal-fg text-white text-[9px] font-bold uppercase tracking-wider hover:bg-brutal-fg/80 transition"
            aria-label="Dismiss all notifications"
          >
            Clear all
          </button>
        )}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-stretch overflow-hidden shadow-brutal animate-scale-in ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
          >
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              <span className="text-base shrink-0 font-bold">{TOAST_ICONS[toast.type]}</span>
              <span className="flex-1 text-xs font-bold uppercase tracking-wider leading-tight truncate">
                {toast.message}{toast.count > 1 ? ` (×${toast.count})` : ''}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="px-3 text-lg leading-none opacity-50 hover:opacity-100 font-bold shrink-0 hover:bg-brutal-fg/10 transition-colors"
              aria-label={`Dismiss: ${toast.message}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
