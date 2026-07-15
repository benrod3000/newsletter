import Button from './ui/Button'

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger = false }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-brutal-fg/40" />
      <div className="relative border-3 border-brutal-fg bg-white shadow-brutal p-6 max-w-sm w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{title}</h3>
        <p className="text-xs text-brutal-fg/70 leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
