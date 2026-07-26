import { useEffect } from 'react'

export default function Changelog() {
  useEffect(() => { document.title = 'Changelog | Veloce' }, [])
  const entries = [
    {
      date: 'July 25, 2026',
      items: [
        {
          title: 'Deeper analytics, faster answers',
          body: 'Click an hour on the activity heatmap to filter the day-by-day breakdown down to just that hour. Drag across the growth chart to compare any range against the period overall, and an always-visible average line makes trends easier to spot at a glance.',
        },
        {
          title: 'Start from a template',
          body: 'New broadcasts now offer a starting point instead of a blank editor — pick the built-in two-voice template or any of your own saved templates.',
        },
      ],
    },
    {
      date: 'July 23, 2026',
      items: [
        {
          title: 'More ways to send',
          body: 'Amazon SES now works alongside Resend and SendGrid, sending raw MIME so one-click unsubscribe headers are preserved, with automatic fallback to your backup provider on transient errors. Every option is named clearly wherever you look — the homepage, previews, and docs — so choosing is about your audience, not guesswork.',
        },
        {
          title: 'Better brand consistency',
          body: 'Fixed a theme mismatch that was silently rendering headings and the Veloce wordmark in the wrong font. Everything now displays in Bebas Neue across the site.',
        },
        {
          title: 'Improved accessibility',
          body: 'Focus rings and the demo button are now visible on dark sections, and the "Skip to content" link lands on the main content instead of nowhere.',
        },
        {
          title: 'A clearer demo experience',
          body: '"Watch Demo" is now "See Live Demo" — it opens an interactive product tour, not a video.',
        },
        {
          title: 'New newsletter example',
          body: 'Added a conversational, two-voice sample template with alternating speakers and a geo-personalized greeting, ready to preview and adapt for event announcements.',
        },
      ],
    },
    {
      date: 'July 22, 2026',
      items: [
        {
          title: 'More reliable campaigns',
          body: 'Campaign sending now runs through a durable per-recipient queue. If something interrupts a send, Veloce picks up where it left off instead of starting over.',
        },
        {
          title: 'Better error messages',
          body: 'Signup issues now tell you exactly what happened and what to do next, instead of a generic error banner.',
        },
        {
          title: 'Stability improvements',
          body: 'Fixed modal focus handling, a color-palette crash, and a contrast issue affecting secondary text.',
        },
      ],
    },
    {
      date: 'July 21, 2026',
      items: [
        {
          title: 'Introducing Deliverability Center',
          body: 'A new dashboard for understanding and improving email health. Check your domain setup, monitor authentication, and get recommendations for improving deliverability.',
          list: [
            'SPF, DKIM, DMARC, and MX checks',
            'Deliverability health scoring',
            'Domain verification tools',
            'Actionable, prioritized recommendations',
          ],
        },
        {
          title: 'Stronger foundations',
          body: 'Expanded TypeScript coverage across the app and improved API reliability.',
        },
      ],
    },
    {
      date: 'July 20, 2026',
      items: [
        {
          title: 'A stronger sending foundation',
          body: 'Rebuilt the email infrastructure to make providers interchangeable, with automatic fallback when one fails, smarter retry handling, and clearer send activity tracking.',
        },
        {
          title: 'Better testing tools',
          body: 'Added Sandbox Mode so you can test campaigns without sending real emails — preview engagement, analytics, and campaign behavior before going live.',
        },
        {
          title: 'Faster platform performance',
          body: 'Improved database performance, API consistency, and demo setup.',
        },
      ],
    },
    {
      date: 'July 19, 2026',
      items: [
        {
          title: 'Veloce becomes Audience OS',
          body: 'The product is shifting from a newsletter tool into a complete audience ownership platform. Updated language and navigation across the app:',
          list: [
            'Newsletters → Broadcasts',
            'Subscribers → Contacts',
            'Lists → Segments',
            'Widgets → Capture Forms',
          ],
        },
        {
          title: 'Better visibility',
          body: 'Added error monitoring, improved analytics, login tracking, and cleaner audience insights.',
        },
        {
          title: 'Cleaner experience',
          body: 'Removed unused systems, simplified navigation, and improved overall stability.',
        },
      ],
    },
    {
      date: 'July 18, 2026',
      items: [
        {
          title: 'Stronger security',
          body: 'Completed a security pass across the platform, including better protection for user data, safer authentication flows, improved API security, and updated dependencies.',
        },
        {
          title: 'Smarter capture forms',
          body: 'Forms now adapt based on what you are collecting — coupons reveal coupon codes, feedback forms collect responses, and lead magnets deliver downloads.',
        },
        {
          title: 'Better location tools',
          body: 'Improved geo-targeting with draggable map markers, saved location settings, and better location accuracy.',
        },
      ],
    },
    {
      date: 'July 17, 2026',
      items: [
        {
          title: 'Better onboarding',
          body: 'Added transactional emails for account creation and password resets.',
        },
        {
          title: 'Improved messaging tools',
          body: 'Added RCS previews, SMS improvements, location-based campaigns, and provider setup guidance.',
        },
        {
          title: 'Better imports',
          body: 'CSV imports now include clearer templates and guidance.',
        },
      ],
    },
    {
      date: 'July 16, 2026',
      items: [
        {
          title: 'More control over capture forms',
          body: 'Added full styling customization for widgets — colors, appearance, size, and embed behavior.',
        },
        {
          title: 'Audience targeting improvements',
          body: 'Added multi-location targeting, saved segments, and subscriber counts by area.',
        },
        {
          title: 'SMS and RCS foundations',
          body: 'Built the infrastructure for richer messaging beyond email.',
        },
      ],
    },
    {
      date: 'July 15, 2026',
      items: [
        {
          title: 'Better campaign infrastructure',
          body: 'Reworked campaign sending for reliability and scale, with improved queue handling, progress tracking, and better failure recovery.',
        },
        {
          title: 'Own your archive',
          body: 'Sent newsletters can now live as public pages, giving your content a longer life beyond the inbox.',
        },
        {
          title: 'Stronger positioning',
          body: 'Updated the product experience around audience ownership instead of just newsletters.',
        },
      ],
    },
    {
      date: 'July 14, 2026',
      items: [
        {
          title: 'Building the foundation',
          body: 'Added reusable UI components, improved SEO, and strengthened campaign workflows.',
          list: [
            'Component library',
            'Template saving',
            'Provider testing',
            'Structured metadata',
            'Improved search',
          ],
        },
      ],
    },
    {
      date: 'July 13, 2026',
      items: [
        {
          title: 'Email + SMS together',
          body: 'Veloce now supports multi-channel communication.',
          list: [
            'Email campaigns',
            'SMS campaigns',
            'RCS previews',
            'Location-based messaging',
            'Campaign analytics',
          ],
        },
      ],
    },
    {
      date: 'July 12, 2026',
      items: [
        {
          title: 'Better audience targeting',
          body: 'Added geographic filters, a campaign calendar, subject line suggestions, and subscriber search. Also improved workspace security and launched Landing Page V3.',
        },
      ],
    },
  ]

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Changelog</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Small improvements every week. Cleaner features. A smoother experience.</p>

      <div className="space-y-10">
        {entries.map((entry) => (
          <div key={entry.date}>
            <h2 className="font-heading text-xl uppercase tracking-wide text-brutal-green">{entry.date}</h2>
            <div className="mt-3 space-y-4">
              {entry.items.map((item, i) => (
                <div key={i}>
                  <h3 className="text-sm font-heading uppercase tracking-wide text-brutal-fg">{item.title}</h3>
                  <p className="mt-1 text-sm text-brutal-fg/70">{item.body}</p>
                  {item.list && (
                    <ul className="mt-2 space-y-1">
                      {item.list.map((li, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-brutal-fg/70">
                          <span className="text-brutal-green mt-1 shrink-0">→</span>
                          {li}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
