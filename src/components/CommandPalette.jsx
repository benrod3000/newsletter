import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Send, Users, PieChart, BarChart3, Settings, Globe, Shield } from 'lucide-react'
import { useCommandAction } from './useCommandAction'

const COMMANDS = [
  { group: 'Navigate', items: [
    { id: 'dashboard', label: 'Dashboard', description: 'Your home base. See subscriber counts and recent activity.', keywords: ['home', 'overview', 'stats', 'numbers'], shortcut: 'g d', action: '/dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Broadcasts', description: 'Create and send broadcasts to your audience.', keywords: ['send', 'email', 'newsletter', 'write', 'broadcast', 'message', 'campaign'], shortcut: 'g c', action: '/dashboard/campaigns', icon: Send },
    { id: 'subscribers', label: 'Contacts', description: 'View and manage your audience. See who opened and clicked.', keywords: ['people', 'who', 'list', 'audience', 'subscribers', 'where are', 'import', 'add person', 'email list', 'contacts'], shortcut: 'g s', action: '/dashboard/subscribers', icon: Users },
    { id: 'lists', label: 'Segments', description: 'Group contacts into segments for targeted sends.', keywords: ['group', 'segment', 'filter', 'organize', 'list'], shortcut: 'g l', action: '/dashboard/lists', icon: PieChart },
    { id: 'analytics', label: 'Analytics', description: 'Track opens, clicks, and subscriber growth over time.', keywords: ['stats', 'open rate', 'click rate', 'growth', 'chart', 'see who opened', 'report'], shortcut: 'g a', action: '/dashboard/analytics', icon: BarChart3 },
    { id: 'deliverability', label: 'Deliverability', description: 'Check DNS health, bounce rates, and email reputation.', keywords: ['dns', 'spf', 'dkim', 'dmarc', 'bounce', 'spam', 'complaint', 'reputation', 'health', 'delivery'], shortcut: 'g v', action: '/dashboard/deliverability', icon: Shield },
    { id: 'widgets', label: 'Capture Forms', description: 'Embed a signup form on your website to grow your audience.', keywords: ['form', 'website', 'sign up', 'lead magnet', 'embed', 'collect', 'form on website', 'widget'], shortcut: 'g w', action: '/dashboard/widgets', icon: Globe },
    { id: 'settings', label: 'Settings', description: 'Manage your account, automations, email provider, and team.', keywords: ['account', 'password', 'automation', 'branding', 'change', 'configure', 'team', 'provider', 'sandbox'], shortcut: 'g e', action: '/dashboard/settings', icon: Settings },
  ]},
  { group: 'Actions', items: [
    { id: 'new-campaign', label: 'New Broadcast', description: 'Start writing a new broadcast to send.', keywords: ['create campaign', 'write email', 'draft', 'new campaign', 'new newsletter'], shortcut: 'n c', action: 'create-campaign' },
    { id: 'add-subscriber', label: 'Add Contact', description: 'Manually add someone to your audience.', keywords: ['new person', 'add email', 'add contact', 'add subscriber'], shortcut: 'n s', action: 'add-subscriber' },
    { id: 'new-list', label: 'New Segment', description: 'Create a segment to organize your contacts.', keywords: ['new segment', 'create group', 'new list'], shortcut: 'n l', action: 'create-list' },
    { id: 'export', label: 'Export CSV', description: 'Download your contacts as a spreadsheet.', keywords: ['download', 'save', 'spreadsheet', 'excel'], shortcut: 'e', action: 'export-csv' },
    { id: 'import', label: 'Import CSV', description: 'Upload contacts from a spreadsheet file.', keywords: ['upload', 'from file', 'spreadsheet', 'excel', 'bulk add'], shortcut: 'i', action: 'import-csv' },
    { id: 'radius-filter', label: 'Radius Filter', description: 'Find contacts near a ZIP code.', keywords: ['location', 'nearby', 'zip code', 'map', 'distance', 'near me'], action: 'navigate-subscribers' },
    { id: 'sandbox', label: 'Sandbox Mode', description: 'Test broadcasts without sending real emails.', keywords: ['test', 'simulate', 'fake', 'no email', 'safe mode', 'dry run'], action: '/dashboard/settings' },
    { id: 'automations', label: 'Automations', description: 'Set up auto-tagging, confirm reminders, and more.', keywords: ['auto', 'automatic', 'tag', 'clean', 'remind', 'schedule'], action: '/dashboard/settings' },
  ]},
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigateTo = useNavigate()
  const { dispatch } = useCommandAction()

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS
    const q = query.toLowerCase()

    // Check if query looks like an email or name search
    const looksLikeSearch = q.includes('@') || q.length >= 3

    let results = COMMANDS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.some(k => k.toLowerCase().includes(q)) ||
          item.shortcut?.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0)

    // Add a "Search subscribers for..." item if query looks like a real search
    if (looksLikeSearch && results.length === 0) {
      results = [
        { group: 'Search', items: [
          { id: 'search-subscribers', label: `Find "${query}" in subscribers`, description: 'Search your subscriber list for this email or name', keywords: [], action: 'navigate-subscribers', icon: Users },
          { id: 'search-campaigns', label: `Find "${query}" in newsletters`, description: 'Search your newsletters for this name', keywords: [], action: '/dashboard/campaigns', icon: Mail },
        ]},
      ]
    }

    return results
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
    const togglePalette = () => { setOpen((prev) => !prev); setQuery(''); setSelectedIndex(0) }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggle-command-palette', togglePalette)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggle-command-palette', togglePalette)
    }
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset selection when query changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0)
  }, [query])

  function execute(item) {
    setOpen(false)
    if (item.action?.startsWith('/')) {
      navigateTo(item.action)
    } else if (item.action) {
      dispatch(item.action)
      // Navigate to the appropriate page based on action
      if (item.action === 'create-campaign') navigateTo('/dashboard/campaigns')
      else if (item.action === 'add-subscriber') navigateTo('/dashboard/subscribers')
      else if (item.action === 'create-list') navigateTo('/dashboard/lists')
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
                    className={`w-full text-left px-3 py-2 transition ${
                      isSelected
                        ? 'bg-brutal-yellow text-brutal-fg'
                        : 'text-brutal-fg hover:bg-brutal-surface'
                    }`}
                  >
                    <span className="font-bold text-sm flex items-center gap-2">
                      {item.icon && <item.icon size={15} />}
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="block text-[10px] text-brutal-muted mt-0.5 ml-7">{item.description}</span>
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
