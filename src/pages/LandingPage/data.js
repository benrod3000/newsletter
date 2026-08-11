import { Share2, Target, Zap, Globe } from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'Demo', href: '/demo' },
]

/*
 * Removed 2026-08-10: STATS, TRUST_METRICS and TESTIMONIALS.
 *
 * They were presented as real and none of them was. The metrics claimed 12,453
 * subscribers, 847 campaigns sent, a 47% average open rate captioned "Real
 * people. Real engagement.", 2,847 emails sent today and 147 businesses. At the
 * time of removal production held zero sent campaigns, zero engagement events of
 * any kind, and three workspaces - so there was no open rate to average.
 *
 * The three testimonials were attributed to named people at named businesses who
 * had not said these things. Inventing endorsements is not a placeholder problem
 * that better copy fixes later; the FTC treats fabricated testimonials as
 * deceptive regardless of intent, and one of the three used the founder's own
 * name, which is how they were spotted.
 *
 * Nothing replaced them. The interactive demo is the honest version of the same
 * argument: it shows the product working rather than asserting that others like
 * it. Do not reintroduce a metrics band until the numbers can be read from the
 * database and are worth showing.
 */

export const PILLARS = [
  {
    id: 'target',
    number: '01',
    icon: Target,
    title: 'Target',
    subtitle: 'Know exactly where your audience lives.',
    body: 'Send to subscribers within 1, 5, 10, or 100 miles of any ZIP code. Perfect for restaurants, events, retail, and local marketing.',
    cta: { label: 'Try the radius filter', to: '/demo' },
    annotation: '📍 Radius targeting · live subscriber map · ZIP resolution',
  },
  {
    id: 'grow',
    number: '02',
    icon: Share2,
    title: 'Grow',
    subtitle: 'Collect subscribers with location data built in.',
    body: 'Embed a widget on any website. Every signup includes city, state, ZIP, and lat/lng. No extra fields. No CSV uploads.',
    cta: { label: 'See the form in action', to: '/demo' },
    annotation: 'Embed one line · auto-enriched location · no CSV',
  },
  {
    id: 'reach',
    number: '03',
    icon: Globe,
    title: 'Reach',
    subtitle: 'Email, SMS, RCS - every channel, one audience.',
    body: 'Email, SMS, RCS, and soon social audience matching. One audience. Many destinations. Every channel respects subscriber consent.',
    cta: { label: 'See all channels', to: '/demo' },
    annotation: 'Email · SMS · RCS · Social matching (coming soon)',
  },
  {
    id: 'automate',
    number: '04',
    icon: Zap,
    title: 'Automate',
    subtitle: 'Relationships that run on their own.',
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
    { label: 'Support', href: 'mailto:support@brod3000.com' },
  ]},
]
