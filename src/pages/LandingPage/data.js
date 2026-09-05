import { Users, ShieldCheck, Clock, Plug, Upload, Search, Send } from 'lucide-react'

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

/*
 * Replaced PILLARS (Target / Grow / Reach / Automate) on 2026-09-04.
 *
 * Those were four full-width sections, each with its own heading, visual, CTA
 * and annotation, and between them they said "understand your audience" three
 * times and "one audience, every channel" twice more than the rest of the page
 * already did. They are now two sections: the three questions below, and the
 * four steps further down.
 *
 * Every claim here maps to a real column on `subscribers` or a shipped table.
 * Check before adding: consent_text, consent_source, consent_version,
 * consented_at, confirmed, suppressed, suppressed_reason, health_score, the
 * utm_* / referrer / landing_path provenance fields, and the
 * /subscribers/:id/timeline endpoint.
 */
export const AUDIENCE_QUESTIONS = [
  {
    id: 'who',
    key: 'Who',
    icon: Users,
    question: 'Who is actually in my audience?',
    body: 'Not just an email address. Where they signed up, what they told you, where they are, which lists they belong to, and how they have engaged since.',
  },
  {
    id: 'why',
    key: 'Why',
    icon: ShieldCheck,
    question: 'Why am I allowed to contact them?',
    body: 'The wording they agreed to, where that agreement came from, and when. Kept on the record itself, so permission is something you can show rather than assume.',
  },
  {
    id: 'when',
    key: 'When',
    icon: Clock,
    question: 'When does it make sense to reach out?',
    body: 'Whether they have confirmed, how recently they engaged, and whether anything has happened since that should stop you sending.',
  },
]

/*
 * The three reachability states are computed from real columns, not invented
 * labels: `confirmed`, `consent_email_marketing`, and `suppressed` with its
 * `suppressed_reason`. Keep them in sync with the send pipeline, which
 * re-checks consent at dispatch rather than trusting the list.
 */
export const REACHABILITY_STATES = [
  {
    id: 'reachable',
    label: 'Reachable',
    tone: 'green',
    detail: 'Confirmed, consented, and not suppressed. Safe to send to today.',
  },
  {
    id: 'pending',
    label: 'Not yet confirmed',
    tone: 'yellow',
    detail: 'They signed up but have not confirmed. In the audience, not in the send.',
  },
  {
    id: 'blocked',
    label: 'Unreachable',
    tone: 'red',
    detail: 'Unsubscribed, bounced, or suppressed. The reason and the date stay on the record.',
  },
]

export const HOW_IT_WORKS = [
  { id: 'connect', number: '01', icon: Plug, title: 'Connect', body: 'Add your own Resend, SES or SendGrid key. Your sending reputation, your bill.' },
  { id: 'import', number: '02', icon: Upload, title: 'Import', body: 'Bring a CSV, or put a capture form on your site. Consent is recorded as it arrives.' },
  { id: 'understand', number: '03', icon: Search, title: 'Understand', body: 'See who you can reach, why, and what has happened with them before.' },
  { id: 'send', number: '04', icon: Send, title: 'Send', body: 'Choose an audience, see the real recipient count, then send.' },
]

/*
 * Only providers with shipped code. Zapier, WordPress, Shopify, a custom API and
 * webhooks were listed here until 2026-09-04 and none of them exists in either
 * repo - `webhook_configs` is a table with nothing delivering to it. The row
 * also claimed "More integrations shipping every month", which nothing
 * supported. Do not add a logo here before the integration exists.
 */
export const PROVIDERS = [
  { label: 'Resend', note: 'Email' },
  { label: 'Amazon SES', note: 'Email' },
  { label: 'SendGrid', note: 'Email' },
  { label: 'CSV import and export', note: 'Data' },
]

/*
 * SMS and RCS are built but switched off: SMS_ENABLED is false and the backend
 * returns 503 FEATURE_DISABLED. The send path does not share the email queue's
 * durability, so it is off until it does. Shown as planned, never as available.
 */
export const PLANNED_CHANNELS = ['SMS', 'RCS']

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
