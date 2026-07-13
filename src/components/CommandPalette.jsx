import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Mail, Users, Layers, BarChart3, Settings, Globe } from 'lucide-react'

const COMMANDS = [
  { group: 'Navigate', items: [
    { id: 'dashboard', label: 'Overview', shortcut: 'g d', action: '/dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', shortcut: 'g c', action: '/dashboard/campaigns', icon: Mail },
    { id: 'subscribers', label: 'Subscribers', shortcut: 'g s', action: '/dashboard/subscribers', icon: Users },
    { id: 'lists', label: 'Segments', shortcut: 'g l', action: '/dashboard/lists', icon: Layers },
    { id: 'analytics', label: 'Analytics', shortcut: 'g a', action: '/dashboard/analytics', icon: BarChart3 },
    { id: 'widgets', label: 'Widgets', shortcut: 'g w', action: '/dashboard/widgets', icon: Globe },
    { id: 'settings', label: 'Settings', shortcut: 'g e', action: '/dashboard/settings', icon: Settings },
  ]},
  { group: 'Actions', items: [
    { id: 'new-campaign', label: 'New Campaign', shortcut: 'n c', action: 'create-campaign' },
    { id: 'add-subscriber', label: 'Add Subscriber', shortcut: 'n s', action: 'add-subscriber' },
    { id: 'new-list', label: 'New List', shortcut: 'n l', action: 'create-list' },
    { id: 'export', label: 'Export CSV', shortcut: 'e', action: 'export-csv' },
    { id: 'import', label: 'Import CSV', shortcut: 'i', action: 'import-csv' },
  ]},
]

export default function CommandPalette({ onAction }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigateTo = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.shortcut?.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0)
  }, [query])

  const allItems = useMemo(() => filtered.flatMap((g) => g.items), [filtered])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function execute(item) {
    setOpen(false)
    if (item.action?.startsWith('/')) {
      navigateTo(item.action)
    } else if (onAction) {
      onAction(item.action, item.id)
    }
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      execute(allItems[selectedIndex])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-brutal-fg/30" />
      <div
        className="relative w-full max-w-lg border-3 border-brutal-fg bg-brutal-bg shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-3 border-brutal-fg p-3 bg-white">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="What do you want to do?"
            className="w-full bg-transparent text-sm font-bold placeholder:text-brutal-muted focus:outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.map((group) => (
            <div key={group.group}>
              <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brutal-muted">
                {group.group}
              </p>
              {group.items.map((item) => {
                const itemIndex = allItems.indexOf(item)
                const isSelected = itemIndex === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm transition ${
                      isSelected
                        ? 'bg-brutal-yellow text-brutal-fg'
                        : 'text-brutal-fg hover:bg-brutal-surface'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-2">
                      {item.icon && <item.icon size={15} />}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
          {allItems.length === 0 && (
            <p className="px-3 py-4 text-sm text-brutal-muted text-center font-bold">
              No commands found
            </p>
          )}
        </div>
        <div className="border-t-3 border-brutal-fg p-2 flex gap-4 justify-center">
          <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">↑↓ navigate</span>
          <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">↵ select</span>
          <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">esc close</span>
        </div>
      </div>
    </div>
  )
}
