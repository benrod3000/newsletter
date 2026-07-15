import { Share2, Target, Mail, Zap, MapPin } from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Demo', href: '/demo' },
]

export const STATS = [
  { value: '$1', label: 'Starts at $1/month', desc: 'Pay only for what you use. BYO SendGrid or AWS SES.' },
  { value: 'BYO', label: 'Bring Your Own Keys', desc: 'Use your existing SendGrid or SES account. No vendor lock-in.' },
  { value: '∞', label: 'Unlimited Workspaces', desc: 'Separate brands, one account. Each workspace keeps its own subscribers.' },
  { value: '0%', label: 'Zero Monthly Fees', desc: 'No platform fee, no hidden costs, no minimum commit.' },
]

export const TRUST_METRICS = [
  { value: '12,453', label: 'Demo Subscribers' },
  { value: '847', label: 'Campaigns Sent' },
  { value: '47%', label: 'Avg Open Rate' },
  { value: '6', label: 'Automations' },
]

export const TESTIMONIALS = [
  {
    quote: 'We went from exporting CSVs every week to sending geo-targeted campaigns in one click. Veloce saved us hours.',
    author: 'Alex Chen',
    role: 'Event Organizer, Austin Music Fest',
  },
  {
    quote: 'I was spending $80/month on platforms I barely used. Now I pay a fraction of that through Veloce. Same reach, 95% less cost.',
    author: 'Maria Santos',
    role: 'Owner, Corner Coffee Roasters',
  },
]

export const PILLARS = [
  {
    id: 'grow',
    number: '01',
    icon: Share2,
    title: 'Collect Subscribers Anywhere',
    body: 'Embed a widget on any website. Every signup automatically includes location data: city, state, ZIP, lat/lng. No extra fields, no CSV uploads. Campaigns get smarter from day one.',
    cta: { label: 'See the form in action', to: '/demo' },
    annotation: 'embed one line — geo-enriched subscriber on submit',
  },
  {
    id: 'target',
    number: '02',
    icon: Target,
    title: 'Only Email People Near Your Event',
    body: 'Target subscribers by city or ZIP code without exporting spreadsheets. Our radius filter shows exactly who lives within 1, 5, 10, or 100 miles of any location. No mailers to the wrong coast.',
    cta: { label: 'Try the geo filter', to: '/demo' },
    annotation: 'Haversine radius · ZIP resolution · live subscriber map',
  },
  {
    id: 'send',
    number: '03',
    icon: Mail,
    title: 'One Campaign. Thousands of Personalized Emails.',
    body: 'Use merge tags to personalize every send: first name, last name, location, even dynamic content blocks. Built-in editor with TipTap. Track opens, clicks, bounces per subscriber.',
    cta: { label: 'Open the editor', to: '/demo' },
    annotation: 'TipTap rich editor · {{merge_tags}} · open/click tracking',
  },
  {
    id: 'automate',
    number: '04',
    icon: Zap,
    title: 'Automations That Never Forget',
    body: 'Welcome drips, birthday emails, re-engagement campaigns, smart auto-tagging, and auto-clean for cold subscribers. Toggle on. They run daily. No cron jobs, no config.',
    cta: { label: 'See all 6 automations', to: '/demo' },
    annotation: 'welcome drip · smart-tag batching · auto-clean cold subs',
  },
]

export const FOOTER_LINKS = [
  { heading: 'Product', links: [
    { label: 'Features', href: '/#features' },
    { label: 'Demo', href: '/demo' },
    { label: 'Pricing', href: '/#pricing' },
  ]},
  { heading: 'Resources', links: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/docs/api/overview' },
    { label: 'Widget Embed', href: '/docs/quickstart' },
  ]},
  { heading: 'Company', links: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Support', href: 'mailto:support@veloce.app' },
  ]},
]
