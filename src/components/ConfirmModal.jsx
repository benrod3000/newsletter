import { useEffect, useRef } from 'react'
import Btn from './ui/Button'

/**
 * Confirmation dialog. Use this for every destructive action rather than
 * window.confirm — native dialogs block the main thread, cannot be styled, and
 * are suppressed outright in some embedded and in-app-browser contexts, which
 * would silently skip the confirmation step altogether.
 */
export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }) {
  const confirmRef = useRef(null)
  const panelRef = useRef(null)
  const restoreFocusTo = useRef(null)

  useEffect(() => {
    if (!open) return

    restoreFocusTo.current = document.activeElement
    confirmRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
        return
      }
      // Keep focus inside the dialog: otherwise Tab walks into the page behind
      // the overlay, which is invisible but still reachable.
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusTo.current?.focus?.()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-brutal-fg/40" />
      <div ref={panelRef} className="relative border-3 border-brutal-fg bg-white shadow-brutal p-6 max-w-sm w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-xs text-brutal-fg/70 leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <Btn variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Btn>
          <Btn ref={confirmRef} variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  )
}
