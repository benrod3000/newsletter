import { useEffect } from 'react'

export default function Changelog() {
  useEffect(() => { document.title = 'Changelog | Veloce' }, [])
  const entries = [
    {
      date: 'July 19, 2026',
      items: [
        'Email provider abstraction: bulk sends now provider-agnostic. SendGrid and Resend both work for broadcasts via a shared EmailTransport interface. Per-workspace API keys supported.',
        'Sentry error monitoring added across both frontend and backend. Browser tracing, session replay on errors, server-side OTEL instrumentation, Vercel cron monitoring.',
        'Dashboard reframed from email platform to Audience OS: Messaging, People, Insights, Growth. Broadcasts replace Newsletters, Contacts replace Subscribers, Segments replace Lists, Capture Forms replace Widgets.',
        'Sidebar simplified: SMS/RCS beta panel removed from main nav, accessible via Broadcasts page when enabled.',
        'Widget builder: form fields (First Name, Last Name, Phone, ZIP) now properly save and render on public forms. Fields, styles, type, size, and location toggle all persist correctly.',
        'Smart tags "Run Now" fixed: subscriber_tags table created, events query batched to prevent URL overflow with large audiences.',
        'Login history: workspace_users now tracks last_login_at, last_login_ip, and last_login_user_agent. Audit log entries written on every login attempt.',
        'Analytics dashboard revamped: Live Pulse moved to top with auto-refresh every 60s, pulsing green dot shows real-time activity. Manual refresh button. Period selector in header. SMS stats collapsible. Heatmap and campaign performance side by side on desktop.',
      ],
    },
    {
      date: 'July 18, 2026',
      items: [
        'Security audit: 7 findings fixed - stored XSS prevention (escapeHtml on all subscriber merge fields), HMAC-signed admin headers for defense-in-depth, CORS scoped to allowed origins, PostCSS advisory patched, token reads centralized into getAuthToken(), migration files renumbered',
        'Dead code removed: legacy EmbedCodePanel and /embed route (System B) deleted - one widget system',
        'Widget builder: widget type now drives form behavior (coupon shows code after signup, feedback shows message textarea, lead magnet shows download link)',
        'Geolocation toggle: new "📍 Location" toggle in widget Fields to Collect - only renders the location button when enabled',
        'Dirty-state protection: Cancel/Back buttons show a confirm modal when unsaved changes exist',
        'GeoFilter map always visible when panel opens - click anywhere to place a pin via reverse geocoding',
        'All location markers are now draggable (not just the first one)',
        'Geo filter state persists across page refresh via localStorage',
        'User-Agent header added to all Nominatim API calls',
        'Demo login: dedicated endpoint with proper password verification, bypasses removed from main login route',
        'Google OAuth: redirect URI now uses production URL consistently - API_URL env var configured',
      ],
    },
    {
      date: 'July 17, 2026',
      items: [
        'Transactional email system: welcome emails on signup, password reset emails via SendGrid',
        'Provider status dashboard: live SendGrid key validation in Settings',
        'RCS preview with real image rendering and phone-style CTA buttons',
        'Auto-recover from stale code-split chunks after deployment',
        'SendGrid credential management in Settings with step-by-step setup guides',
        'CSV import visual template guide with downloadable template.csv',
        'Widget theme presets renamed: Veloce, Clean, Midnight',
        'Widget preview now respects size selection (small/medium/large)',
        'SMS preview auto-differentiates between RCS (rich) and plain SMS',
        'Location-triggered geo-filter wiring for SMS campaigns',
      ],
    },
    {
      date: 'July 16, 2026',
      items: [
        'Widget full style customization: 5 color tokens with live preview',
        'Widget embed: dynamic height calculation, View Live button, color picker',
        'Multi-ZIP GeoFilter with GSAP circle grow animations and subscriber counts',
        'SMS/RCS pipeline: Twilio credentials, test SMS send, cost estimates',
        'Email Provider setup: SendGrid and SES with guided instructions',
        'Inline form validation on login and signup pages',
        'Toast duration tuning: success 3s, error 6s, info 4s',
        'Centralized sentinel logger for critical routes',
        'CSS cleanup: removed dead classes, radar animations, redundant styles',
        'CSP fix: Turnstile frame-src and external API connect-src',
        'Saved audience segments: CRUD with workspace-scoped access',
      ],
    },
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
