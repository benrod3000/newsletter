import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, ArrowRight } from 'lucide-react'

const PAGE_HELP = {
  '/dashboard': {
    title: 'Your Dashboard',
    what: 'This is your home base. See subscriber counts, recent campaigns, and a live activity feed at a glance.',
    actions: [
      { label: 'View your subscribers', path: '/dashboard/subscribers' },
      { label: 'Create a campaign', path: '/dashboard/campaigns' },
    ],
    next: 'Start by adding subscribers or embedding a signup widget on your site.',
  },
  '/dashboard/subscribers': {
    title: 'Your Subscribers',
    what: 'This is where your audience lives. Each subscriber has an email, name, location, and engagement tracking so you can target them effectively.',
    actions: [
      { label: 'Add a subscriber manually', tip: 'Click + Add Subscriber' },
      { label: 'Import from CSV', tip: 'Click Import CSV or press I' },
      { label: 'Find people near a location', tip: 'Click 📍 Radius filter, enter a ZIP code' },
      { label: 'Search by email or name', tip: 'Type in the search box above the table' },
    ],
    next: 'After you have subscribers, create your first campaign.',
    nextPath: '/dashboard/campaigns',
  },
  '/dashboard/campaigns': {
    title: 'Your Campaigns',
    what: 'Create and send emails to your subscribers. Each campaign tracks opens and clicks automatically.',
    actions: [
      { label: 'Start a new campaign', tip: 'Click + New Campaign' },
      { label: 'Send a test email', tip: 'Click 🧪 on any draft to preview before sending' },
      { label: 'Write in the editor', tip: 'Use the toolbar to format text, add links, and insert merge tags like {{first_name}}' },
    ],
    next: 'Campaigns send through your own email provider. Configure it in Settings.',
    nextPath: '/dashboard/settings',
  },
  '/dashboard/lists': {
    title: 'Segments (Lists)',
    what: 'Group subscribers into lists for targeted sends. Send different campaigns to different groups.',
    actions: [
      { label: 'Create a new list', tip: 'Click + New List' },
      { label: 'Add subscribers to a list', tip: 'Click a subscriber, use the detail panel' },
    ],
    next: 'Lists make your campaigns more relevant. Try creating a list for new subscribers.',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    what: 'Track how your campaigns perform. See open rates, click rates, and subscriber growth over time.',
    actions: [
      { label: 'Change date range', tip: 'Use the 7d / 14d / 30d / 90d buttons' },
      { label: 'See top campaigns', tip: 'Scroll down for your best-performing sends' },
    ],
    next: 'Analytics get better with more data. Send a few campaigns to build up your history.',
  },
  '/dashboard/widgets': {
    title: 'Widgets · Your Signup Forms',
    what: 'Embed a form on your website to collect subscribers. Each widget has its own link and embed code.',
    actions: [
      { label: 'Create a widget', tip: 'Click + New Widget, fill in the details' },
      { label: 'Get embed code', tip: 'After creating, click Embed to copy the HTML' },
      { label: 'Paste on your site', tip: 'The embed code works on any website. WordPress, Squarespace, custom HTML' },
    ],
    next: 'Widgets are the fastest way to grow your audience. Put one on your homepage.',
  },
  '/dashboard/settings': {
    title: 'Settings',
    what: 'Configure your workspace. Set up your email provider, toggle automations, and manage branding.',
    actions: [
      { label: 'Set up automations', tip: 'Toggle on Smart Tags, Auto-Clean, and more. They run daily' },
      { label: 'Add your email provider', tip: 'Use SendGrid (free tier) or bring your own Amazon SES keys for $1/10K emails' },
      { label: 'Update branding', tip: 'Set your sender name and email address' },
    ],
    next: 'Automations keep your list healthy without manual work. Toggle them on and forget about it.',
  },
}

export default function HelpPanel() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Match the current path to help config (longest prefix match)
  const help = Object.entries(PAGE_HELP).find(([path]) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
  )?.[1] || PAGE_HELP['/dashboard']

  useEffect(() => {
    const handler = () => setOpen((prev) => !prev)
    window.addEventListener('toggle-help-panel', handler)
    return () => window.removeEventListener('toggle-help-panel', handler)
  }, [])

  useEffect(() => {
    if (open) setOpen(false)
  }, [location.pathname])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-brutal-fg/20" />
      <div
        className="relative w-full max-w-md border-3 border-brutal-fg bg-white shadow-brutal animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} />
            <h2 className="font-heading text-xl uppercase tracking-wide">Help</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-brutal-fg font-bold text-lg leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* What this page does */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-1">{help.title}</h3>
            <p className="text-sm leading-relaxed">{help.what}</p>
          </div>

          {/* Common actions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-2">Common actions</h3>
            <div className="space-y-2">
              {help.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-brutal-green font-bold mt-0.5">+</span>
                  <div>
                    <p className="text-sm font-bold">{a.label}</p>
                    {a.tip && <p className="text-[10px] text-brutal-muted uppercase tracking-wider">{a.tip}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What to do next */}
          <div className="border-t-3 border-brutal-fg pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-1">What next</h3>
            <p className="text-sm leading-relaxed mb-2">{help.next}</p>
            {help.nextPath && (
              <button
                onClick={() => { setOpen(false); navigate(help.nextPath) }}
                className="inline-flex items-center gap-1.5 px-4 py-2 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition"
              >
                Go to {PAGE_HELP[help.nextPath]?.title || 'next page'} <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider text-center pt-2 border-t border-brutal-fg/20">
            Press ? for keyboard shortcuts &nbsp;·&nbsp; Cmd+K to search
          </p>
        </div>
      </div>
    </div>
  )
}
