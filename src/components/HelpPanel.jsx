import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HelpCircle, ArrowRight } from 'lucide-react'

const PAGE_HELP = {
  '/dashboard': {
    title: 'Your Dashboard',
    what: 'Your home base. See contact counts, recent broadcasts, and live activity at a glance.',
    actions: [
      { label: 'View your contacts', path: '/dashboard/subscribers' },
      { label: 'Create a broadcast', path: '/dashboard/campaigns' },
    ],
    next: 'Start by adding contacts or embedding a capture form on your site.',
  },
  '/dashboard/subscribers': {
    title: 'Contacts',
    what: 'Your audience lives here. Each contact has an email, name, location, and engagement data so you can target them effectively.',
    actions: [
      { label: 'Add a contact manually', tip: 'Click + Add Contact' },
      { label: 'Import from CSV', tip: 'Click Import CSV or press I' },
      { label: 'Find people near a location', tip: 'Click the Radius filter, enter a ZIP code' },
      { label: 'Search by email or name', tip: 'Type in the search box above the table' },
    ],
    next: 'After you have contacts, create your first broadcast.',
    nextPath: '/dashboard/campaigns',
  },
  '/dashboard/campaigns': {
    title: 'Broadcasts',
    what: 'Create and send broadcasts to your contacts. Open and click tracking is automatic. Retries with exponential backoff on transient failures.',
    actions: [
      { label: 'Start a new broadcast', tip: 'Click + New Broadcast' },
      { label: 'Send a test email', tip: 'Click the test button on any draft to preview before sending' },
      { label: 'Use merge tags', tip: 'Type {{first_name}} to personalize. Editor supports rich text, links, and images' },
    ],
    next: 'Broadcasts route through your email provider. Configure SendGrid or Resend in Settings.',
    nextPath: '/dashboard/settings',
  },
  '/dashboard/lists': {
    title: 'Segments',
    what: 'Group contacts into segments for targeted sends. Different broadcasts to different groups.',
    actions: [
      { label: 'Create a new segment', tip: 'Click + New Segment' },
      { label: 'Add contacts to a segment', tip: 'Click a contact, use the detail panel' },
    ],
    next: 'Segments make your broadcasts more relevant. Try creating one for new contacts.',
  },
  '/dashboard/analytics': {
    title: 'Analytics',
    what: 'Track broadcast performance. See open rates, click rates, and contact growth. Live Pulse shows real-time activity.',
    actions: [
      { label: 'Change date range', tip: 'Use the 7d / 14d / 30d / 90d buttons in the header' },
      { label: 'See live activity', tip: 'The Live Pulse section at the top shows opens and clicks as they happen' },
      { label: 'Best send times', tip: 'The heatmap shows when your contacts are most likely to open' },
    ],
    next: 'Analytics auto-refreshes every minute. Send more broadcasts to build up your history.',
  },
  '/dashboard/deliverability': {
    title: 'Deliverability',
    what: 'Monitor your email health. Check DNS records (SPF, DKIM, DMARC, MX), bounce rates, and spam complaint rates. Fix any issues to stay out of spam folders.',
    actions: [
      { label: 'View DNS health', tip: 'The DNS panel shows pass/warning/fail for each record type. Click to see the raw DNS value' },
      { label: 'Fix DNS issues', tip: 'Each failing record shows exactly what to add to your DNS. Copy the expected value and add it to your domain provider' },
      { label: 'Check bounce rate', tip: 'Keep bounce rate under 2%. Enable Auto-Clean in Settings to automatically suppress bounced addresses' },
      { label: 'Monitor complaints', tip: 'Google and Yahoo require complaint rates below 0.3%. Make your unsubscribe link easy to find' },
      { label: 'Check another domain', tip: 'Use the domain checker at the bottom to verify DNS for custom tracking domains or additional sender domains' },
    ],
    next: 'Good deliverability = more emails in inboxes. Check back here after making DNS changes to verify they took effect.',
  },
  '/dashboard/widgets': {
    title: 'Capture Forms',
    what: 'Embed a form on your website to grow your audience. Each form has its own link, embed code, and style settings.',
    actions: [
      { label: 'Create a form', tip: 'Click + to start. Choose a type: lead magnet, newsletter, event RSVP, coupon, or feedback' },
      { label: 'Pick fields to collect', tip: 'Toggle First Name, Last Name, Phone, ZIP, or browser location' },
      { label: 'Get embed code', tip: 'After creating, click the embed button to copy the HTML snippet' },
      { label: 'Paste on your site', tip: 'Works on WordPress, Squarespace, Webflow, or custom HTML' },
    ],
    next: 'Capture forms are the fastest way to grow your audience. Put one on your homepage.',
  },
  '/dashboard/settings': {
    title: 'Settings',
    what: 'Configure your workspace. Set up your email provider, toggle automations, manage your team, and enable sandbox mode for testing.',
    actions: [
      { label: 'Set up automations', tip: 'Toggle on Smart Tags, Auto-Clean, and Confirm Reminders. They run daily' },
      { label: 'Add email provider', tip: 'Use SendGrid (free tier), Resend, or bring your own SES keys' },
      { label: 'Configure fallback provider', tip: 'Add a backup provider. Broadcasts failover automatically if the primary is down' },
      { label: 'Sandbox mode', tip: 'Enable to test broadcasts without sending real emails. Analytics populate with synthetic data' },
      { label: 'Manage team', tip: 'Invite team members from the Team tab' },
      { label: 'Update branding', tip: 'Set your sender name and email in the Branding section' },
    ],
    next: 'Automations keep your audience healthy without manual work. Toggle them on and forget about it.',
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

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (open) setOpen(false)
  }, [location.pathname])
  /* eslint-enable */

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
