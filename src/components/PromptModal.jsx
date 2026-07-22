import { useEffect, useRef, useState } from 'react'
import Btn from './ui/Button'

/**
 * Single-field input dialog — the replacement for window.prompt.
 *
 * Beyond the styling and thread-blocking problems native prompts have, they
 * cannot validate before accepting: the caller gets whatever was typed and has
 * to re-open the dialog to complain. Here `validate` runs before submit and the
 * error is shown in place.
 */
export default function PromptModal({
  open,
  title,
  message,
  label,
  placeholder = '',
  initialValue = '',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  type = 'text',
  validate,
  onSubmit,
  onCancel,
}) {
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const restoreFocusTo = useRef(null)
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')

  // Reset the field each time the dialog opens, matching prompt() semantics.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return
    setValue(initialValue)
    setError('')
    restoreFocusTo.current = document.activeElement
    // Select existing text so typing replaces it, matching prompt() behaviour.
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [open, initialValue])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
        return
      }
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

  const submit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    const problem = validate?.(trimmed)
    if (problem) {
      setError(problem)
      inputRef.current?.focus()
      return
    }
    onSubmit?.(trimmed)
  }

  const errorId = error ? 'prompt-modal-error' : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-brutal-fg/40" />
      <form
        ref={panelRef}
        onSubmit={submit}
        className="relative border-3 border-brutal-fg bg-white shadow-brutal p-6 max-w-sm w-full mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{title}</h3>
        {message && <p className="text-xs text-brutal-fg/70 leading-relaxed mb-4">{message}</p>}

        <label className="block text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1.5" htmlFor="prompt-modal-input">
          {label}
        </label>
        <input
          id="prompt-modal-input"
          ref={inputRef}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className="w-full bg-white border-3 border-brutal-fg px-3 py-2 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
        />
        {error && (
          <p id={errorId} role="alert" className="text-[10px] font-bold uppercase tracking-wider text-brutal-red mt-1.5">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end mt-5">
          <Btn variant="secondary" size="md" type="button" onClick={onCancel}>
            {cancelLabel}
          </Btn>
          <Btn variant="primary" size="md" type="submit">
            {confirmLabel}
          </Btn>
        </div>
      </form>
    </div>
  )
}
