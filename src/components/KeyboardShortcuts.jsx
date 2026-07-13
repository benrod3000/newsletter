import { useEffect, useState } from 'react'

const SHORTCUTS = [
  {
    group: 'Global',
    items: [
      { keys: ['⌘', 'K'], label: 'Command palette' },
      { keys: ['?'], label: 'Show this panel' },
      { keys: ['Esc'], label: 'Close panels / modals' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: ['G', 'D'], label: 'Go to Dashboard' },
      { keys: ['G', 'C'], label: 'Go to Campaigns' },
      { keys: ['G', 'S'], label: 'Go to Subscribers' },
      { keys: ['G', 'L'], label: 'Go to Lists' },
      { keys: ['G', 'A'], label: 'Go to Analytics' },
      { keys: ['G', 'W'], label: 'Go to Widgets' },
      { keys: ['G', 'E'], label: 'Go to Settings' },
    ],
  },
  {
    group: 'Actions',
    items: [
      { keys: ['N', 'C'], label: 'New Campaign' },
      { keys: ['N', 'S'], label: 'Add Subscriber' },
      { keys: ['N', 'L'], label: 'New List' },
      { keys: ['E'], label: 'Export CSV' },
      { keys: ['I'], label: 'Import CSV' },
    ],
  },
]

function KeyBadge({ children }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 border-2 border-brutal-fg bg-white text-[11px] font-mono font-bold leading-none">
      {children}
    </span>
  )
}

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-brutal-fg/40" />
      <div
        className="relative w-full max-w-lg bg-brutal-bg border-3 border-brutal-fg shadow-brutal max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wide">Keyboard Shortcuts</h2>
          <button
            onClick={() => setOpen(false)}
            className="px-2 py-1 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm hover:opacity-80"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brutal-muted mb-3">{group.group}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-bold text-brutal-fg">{item.label}</span>
                    <span className="flex gap-1">
                      {item.keys.map((k, i) => (
                        <KeyBadge key={i}>{k}</KeyBadge>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-3 border-brutal-fg px-6 py-3 bg-brutal-surface text-center">
          <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider">Press <KeyBadge>?</KeyBadge> anytime to toggle this panel</p>
        </div>
      </div>
    </div>
  )
}
