import { Share2, Target, Mail, Zap, MapPin, Radio, Smartphone, Globe } from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'Demo', href: '/demo' },
]

export const STATS = [
  { value: '100+', label: 'Businesses', desc: 'Using Veloce to own their audience.' },
  { value: '847', label: 'Campaigns Sent', desc: 'Across email, SMS, and RCS channels.' },
  { value: '47%', label: 'Avg Open Rate', desc: 'Real engagement from real subscribers.' },
  { value: '6', label: 'Automations', desc: 'Welcome drips, smart tags, auto-clean, and more.' },
]

export const TRUST_METRICS = [
  { value: '12,453', label: 'Subscribers' },
  { value: '847', label: 'Campaigns Sent' },
  { value: '47%', label: 'Avg Open Rate' },
  { value: '6', label: 'Automations Running' },
]

export const TESTIMONIALS = [
  {
    quote: 'We went from exporting CSVs every week to sending geo-targeted campaigns in one click. Veloce saved us hours of manual work every month.',
    author: 'Alex Chen',
    role: 'Event Organizer, Austin Music Fest',
  },
  {
    quote: 'I was spending $80/month on platforms I barely used. Now I pay a fraction of that through Veloce. Same reach, 95% less cost. And I actually own my list.',
    author: 'Maria Santos',
    role: 'Owner, Corner Coffee Roasters',
  },
  {
    quote: 'Radius targeting alone was worth switching. We used to mail the entire city. Now we only reach people within 5 miles of our shop.',
    author: 'Derek Park',
    role: 'Manager, East Side Bicycle Co.',
  },
]

export const PILLARS = [
  {
    id: 'target',
    number: '01',
    icon: Target,
    title: 'Target Your Neighborhood',
    body: 'Send to subscribers within 1, 5, 10, or 100 miles of any ZIP code. Perfect for restaurants, events, retail, and local marketing.',
    cta: { label: 'Try the radius filter', to: '/demo' },
    annotation: '📍 Radius targeting · live subscriber map · ZIP resolution',
  },
  {
    id: 'grow',
    number: '02',
    icon: Share2,
    title: 'Collect Subscribers Anywhere',
    body: 'Embed a widget on any website. Every signup includes location data: city, state, ZIP, lat/lng. No extra fields. No CSV uploads.',
    cta: { label: 'See the form in action', to: '/demo' },
    annotation: 'Embed one line · auto-enriched location · no CSV',
  },
  {
    id: 'reach',
    number: '03',
    icon: Globe,
    title: 'Reach Them Everywhere',
    body: 'Email, SMS, RCS, and soon social audience matching. One audience. Many destinations. Every channel respects subscriber consent.',
    cta: { label: 'See all channels', to: '/demo' },
    annotation: 'Email · SMS · RCS · Social matching (coming soon)',
  },
  {
    id: 'automate',
    number: '04',
    icon: Zap,
    title: 'Automations That Build Relationships',
    body: 'Welcome drips, re-engagement campaigns, smart auto-tagging, and auto-clean for cold subscribers. Toggle on. They run daily.',
    cta: { label: 'See automations', to: '/demo' },
    annotation: 'welcome drip · smart-tag batching · auto-clean cold subs',
  },
]

export const FOOTER_LINKS = [
  { heading: 'Product', links: [
    { label: 'Features', href: '/#features' },
    { label: 'Demo', href: '/demo' },
    { label: 'Radius Targeting', href: '/demo' },
  ]},
  { heading: 'Resources', links: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Quickstart', href: '/docs/quickstart' },
    { label: 'Changelog', href: '/docs/changelog' },
  ]},
  { heading: 'Company', links: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Support', href: 'mailto:support@veloce.app' },
  ]},
]
