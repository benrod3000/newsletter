import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

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

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-stretch overflow-hidden shadow-brutal animate-scale-in ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
              <span className="text-base shrink-0 font-bold">{TOAST_ICONS[toast.type]}</span>
              <span className="flex-1 text-xs font-bold uppercase tracking-wider leading-tight truncate">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="px-3 text-lg leading-none opacity-50 hover:opacity-100 font-bold shrink-0 hover:bg-brutal-fg/10 transition-colors"
              aria-label="Dismiss"
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
