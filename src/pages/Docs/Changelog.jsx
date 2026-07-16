import { useEffect } from 'react'

export default function Changelog() {
  useEffect(() => { document.title = 'Changelog | Veloce' }, [])
  const entries = [
    {
      date: 'July 15, 2026',
      items: [
        'Email queue architecture: campaign_jobs tracking, Promise.allSettled for partial failure handling, per-batch progress updates',
        'Newsletter Archive: publish sent newsletters to public SEO-friendly URLs',
        'Sending limits enforcement: monthly cap checked before every send',
        'Brand voice rollout: newsletter-first language across app, warmer toasts, human empty states',
        'Homepage messaging: simplified positioning, clearer audience targeting',
        'Subscriber server-side search with debounce + pagination controls',
      ],
    },
    {
      date: 'July 14, 2026',
      items: [
        'UI Component Library: Button (5 variants, 3 sizes), Card (accent/hover/padding), Input (label/error/icon/password)',
        'File splitting: LandingPage, Campaigns, Subscribers constants extracted',
        'Save as Template: backend route + frontend prompt in campaign editor',
        'Test Email Provider: verify SendGrid or SES credentials from Settings',
        'JSON-LD structured data (SoftwareApplication + Organization schema)',
        'Meta tags, OG tags, sitemap.xml, robots.txt for SEO',
      ],
    },
    {
      date: 'July 13, 2026',
      items: [
        'SMS/RCS panel with preview, two-channel (email + SMS), RCS carousel images',
        'Location-triggered SMS campaigns',
        'SMS webhook: HELP/STOP keyword handling',
        'Phone import hint in CSV import UI',
        'Analytics page with charting',
        'Onboarding checklist in dashboard',
        'Next-best-action panels on dashboard home',
      ],
    },
    {
      date: 'July 12, 2026',
      items: [
        'Geo filter with map (Census Bureau geocoder fallback)',
        'Campaign calendar view',
        'Subject line suggestions',
        'Inline campaign rename',
        'Multi-tenant security fix: random 8-char slug suffix, removed default workspace fallback',
        'Landing page V3 redesign',
      ],
    },
  ]

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Changelog</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Small improvements every week. Cleaner features. A smoother experience.</p>

      <div className="space-y-8">
        {entries.map((entry) => (
          <div key={entry.date}>
            <h2 className="font-heading text-xl uppercase tracking-wide text-brutal-green">{entry.date}</h2>
            <ul className="mt-3 space-y-2">
              {entry.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-brutal-fg/70">
                  <span className="text-brutal-green mt-1 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  )
}
