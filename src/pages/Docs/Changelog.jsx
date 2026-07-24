import { useEffect } from 'react'

export default function Changelog() {
  useEffect(() => { document.title = 'Changelog | Veloce' }, [])
  const entries = [
    {
      date: 'July 23, 2026',
      items: [
        'Amazon SES sending wired end-to-end: SES is now a working send provider alongside Resend and SendGrid. Emails go out as raw MIME so one-click List-Unsubscribe (RFC 8058) headers are preserved, with automatic fallback to your backup provider on transient errors.',
        'Bring-your-own-provider now names every option where you look for it: the homepage, share previews, integrations, and docs present Resend (fastest to set up, 3,000 emails/month free), Amazon SES (cheapest at volume, ~$1 per 10,000), and SendGrid side by side — flexibility, not homework.',
        'Brand typography restored: a theme-token mismatch was silently rendering every section heading and the Veloce wordmark in the body font. Headings now display in Bebas Neue across the entire site.',
        'Accessibility: the "Explore Live Demo" button and keyboard focus rings are now visible on dark sections, and the "Skip to content" link now lands on the main content instead of nowhere.',
        'Clearer calls to action: the hero\'s "Watch Demo" is now "See Live Demo" — it opens an interactive product tour, not a video.',
        'New sample newsletter: a conversational, two-voice template (chat-bubble layout, alternating speakers, geo-personalized greeting) you can preview and adapt for event announcements.',
      ],
    },
    {
      date: 'July 22, 2026',
      items: [
        'Campaign sends are now durable: broadcasts run through a per-recipient queue in Postgres, so an interrupted send resumes exactly where it left off — no dropped recipients, no duplicate emails.',
        'Campaign-recovery cron moved to a daily cadence so scheduled recovery no longer collides with deploys.',
        'Signup failures are now actionable: instead of a generic yellow banner, each error points to the field or the next step (for example, "this email already has an account → sign in").',
        'Stability and accessibility fixes: modal focus handling corrected, a color-palette crash resolved, and a stale brand green updated so secondary text meets contrast targets.',
      ],
    },
    {
      date: 'July 21, 2026',
      items: [
        'Deliverability Center: new dashboard page for monitoring email health. DNS record checker validates SPF, DKIM, DMARC, and MX records in real-time against your configured provider.',
        'Deliverability scoring: transparent 0–100 health score calculated from DNS configuration (40%), bounce rate (30%), and complaint rate (30%). Color-coded status: Healthy (80+), Needs Attention (50–79), At Risk (<50).',
        'DNS checker: uses Node.js built-in DNS resolution — zero third-party dependencies. Auto-detects DKIM selectors by provider (SendGrid s1/s2, Resend resend._domainkey). SPF validation checks for provider-specific include mechanisms.',
        'Custom domain checker: check DNS for any domain directly from the Deliverability page. Useful for verifying tracking domains and additional sender domains.',
        'Actionable recommendations: prioritized list of fixes sorted by severity. Each failing DNS record shows the exact value to add. Bounce and complaint threshold warnings with links to relevant settings.',
        'TypeScript foundation: api.js and authStore.js converted to TypeScript with full type annotations. Shared types.ts for ApiResponse, Campaign, Subscriber, and new deliverability types. Zero tsc errors.',
        'Frontend types expanded: DeliverabilityOverview, DnsHealthReport, DnsCheckResult, Recommendation, and DnsCheckResponse types for full deliverability type safety.',
        'Deliverability API: two new admin endpoints — /api/admin/deliverability/overview (health score + DNS + bounce/complaint rates + recommendations) and /api/admin/deliverability/dns?domain= (custom domain checking).',
      ],
    },
    {
      date: 'July 20, 2026',
      items: [
        'Provider registry: email providers register via register()/resolve() pattern. No hardcoded conditionals. Adding a new provider is 3 lines.',
        'Email dispatcher: single canonical send path. Primary-fallback provider chain with automatic failover on transient errors. Every email in the system goes through dispatchEmail().',
        'Retry system: exponential backoff (0s, 2s, 8s) with 3 retries for transient failures. Time-budget protection stops sends gracefully before Vercel timeout.',
        'Campaign activity log: every broadcast generates a GitHub-style timeline. Events capture queuing, sending, retries, provider selection, and completion.',
        'Sandbox mode: test broadcasts without sending real emails. Synthetic open/click events populate analytics automatically. Enable per workspace.',
        'Database optimization: 12 performance indexes on hot query paths, 2 materialized views for analytics (auto-refreshed by cron).',
        'Seed system: replaced 392-line route + hundreds of REST calls with single PostgreSQL function. Demo generates 208 contacts, 7 broadcasts, and realistic engagement events.',
        'API standardization: consistent { data } / { error: { code, message } } response shapes. Standardized helpers for all common responses. CORS applied automatically.',
        'Rate limiting: tracking endpoints protected (100/s opens, 50/s clicks). Demo seed endpoint rate limited. Standardized middleware ready for all routes.',
        'Staff engineer code review: 10 critical issues identified and resolved. Credential key mismatch fixed, admin auth added to seed, send queue time-budget protection.',
      ],
    },
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
        'Code hygiene: removed unused imports, dead code (PageTransition), no-op useMemo, empty App.css. Extracted duplicate parseGeoFilter/haversineDistanceKm into shared geo-utils. Added logging to empty catch blocks in tracking routes. Removed unused dependencies (grapesjs, grapesjs-preset-newsletter, ua-parser-js).',
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
