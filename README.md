# Veloce

A newsletter platform. No rounding. No gradients. Just 3px borders and a yellow button that does what you want.

[https://newsletter.brod3000.com](https://newsletter.brod3000.com)

---

## Why this exists

I got tired of email tools that charge by subscriber, hide basic features behind plans, and make you fight the UI to send a simple email. So I built the opposite.

Every workspace is completely isolated // subscribers, campaigns, automations, branding. Nothing leaks between them.

---

## What you can do

**Manage subscribers** // add them, import a CSV, or embed a signup form on your site. Filter by status, date, or search. Health scores (active / at risk / cold) recalculate daily. Bulk select, bulk delete, export // all there.

**Write and send campaigns** // TipTap editor with merge tags, link embedding, image support. Subject line suggestions. Test emails before you send. Schedule for later. Opens and clicks tracked automatically.

**Turn on automations** and forget about them // confirm-remind for unconfirmed subs, auto-clean for cold ones after 90 days, smart tags that label engaged vs slipping subscribers. More coming.

**Segment your audience** // lists, health scores, date ranges, smart tags. All without uploading spreadsheets.

**Brand per workspace** // sender name, email, colors, domain. Connect SendGrid or SES.

**Widget forms** you can embed anywhere. Pick a type (lead magnet, coupon, feedback, newsletter, event RSVP, SMS-only), choose fields to collect, toggle location collection. Three sizes. Customizable colors with live preview. Widget type actually changes what visitors see.

**Geo radius filter** // multi-ZIP radius targeting with a live map. Click to place pins, drag to adjust. Persists across page refresh. Counts subscribers in range. Preset radius chips.

**UX stuff that matters** // Cmd+K command palette, keyboard shortcuts (press `?`), page titles everywhere, relative timestamps, sticky bulk action bar, empty states that actually help, responsive tables that don't break on mobile, dirty-state confirm modals to prevent accidental data loss.

---

## Tech stack

React 19 + Vite 8. Tailwind CSS v4. Zustand for auth. Axios with JWT. React Router v7. TipTap editor. GSAP for animations. Lucide icons. Sentry for error monitoring. Deployed on Vercel.

---

## Project structure

```
src/
├── lib/               # API client + utilities
├── stores/            # Auth state
├── pages/
│   ├── LandingPage    # Public landing page
│   ├── LoginPage      # Sign in
│   ├── SignupPage     # Register
│   ├── Demo.jsx       # Interactive demo
│   ├── WidgetForm.jsx # Public embeddable form
│   └── Dashboard/
│       ├── Home.jsx        # Metrics + activity feed
│       ├── Subscribers.jsx # Table with filters + bulk actions
│       ├── Campaigns.jsx   # CRUD + editor + test + send
│       ├── Lists.jsx       # Segments
│       ├── Analytics.jsx   # Charts + growth
│       ├── Settings.jsx    # Branding + automations + SMS
│       └── Widgets.jsx     # Widget wizard
├── components/
│   ├── EmailEditor.jsx         # TipTap editor
│   ├── SubscriberDetailPanel.jsx
│   ├── CommandPalette.jsx
│   ├── Toast.jsx
│   ├── ErrorBoundary.jsx
│   └── ui/ + ux/              # Buttons, cards, empty states
└── layouts/
    └── DashboardLayout.jsx
```

---

## Running locally

```bash
npm install
npm run dev
```

Point `VITE_API_URL` at the backend (defaults to `http://localhost:3000`).

---

## Deploy

```bash
npm run build
npx vercel --prod
```

---

## Related

- **Backend API:** [newsletter-core](../newsletter-core)
- **Demo account:** demo@veloce.app / demo123456
- **Questions?** support@veloce.app
