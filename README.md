# Veloce

A brutalist, multi-tenant newsletter platform. Built to be fast, look distinct, and make segmentation effortless.

[https://newsletter.brod3000.com](https://newsletter.brod3000.com)

---

## What is this?

I built this to manage email newsletters across multiple workspaces. Each workspace gets its own isolated subscribers, campaigns, automations, and branding — all separated at the database level.

The design is intentionally brutalist. No rounded corners, no gradients, no fluff. 3px borders everywhere. Bebas Neue for headings, Inter for body. Yellow for actions, green for success, red for danger. It's a system someone can navigate in their sleep.

---

## What can you do with it?

**For subscribers:**
- Add, import CSV, or collect via embeddable widget forms
- Filter by status, health score, date range, or search across all records
- Each subscriber gets a 🟢🟡🔴 health score (active / at risk / cold) — recalculated daily
- Inline edit names, add notes, apply tags from the detail panel
- Bulk select, bulk delete, export CSV

**For campaigns:**
- Create drafts with a TipTap rich text editor
- Merge tags, link embedding, image support
- "Suggest" button generates subject lines from your content
- Send test emails, then send to your audience with a confirmation prompt
- Schedule for the future — cron picks it up
- Track opens and clicks per campaign

**For automations:**
- Toggle on/off — no configuration needed for non-technical users:
  - 📬 Confirm & Remind — follow up on unconfirmed subscribers
  - 🧹 Auto-Clean — remove cold subscribers after 90 days
  - 🏷️ Smart Tags — auto-label engaged, clicker, slipping, mobile, weekend
  - (More coming: Welcome Drip, Re-Engagement, Weekly Reports)

**For segmentation:**
- Subscriber lists with opt-in types
- Health score filtering
- Date range filtering
- Smart auto-tagging builds segments without lifting a finger

**For branding:**
- Per-workspace sender name, email, colors, domains
- SendGrid or SES provider configuration
- SES keys masked with show/hide toggles

**For widgets:**
- Embeddable signup forms (iframe)
- Configurable: headline, description, button text, success message
- Three sizes: Small (sidebar), Medium (card), Large (hero)
- Collects leads into a subscriber list

**UX touches:**
- Cmd+K command palette (⌘K or Ctrl+K)
- `?` keyboard shortcuts panel
- Page titles on every tab
- Relative time display ("3h ago" instead of raw dates)
- Persistent sticky bulk action bar
- Empty states with contextual CTAs
- Clickable dashboard stat cards
- Mobile hamburger drawer with backdrop overlay
- Responsive tables — columns hide progressively at smaller breakpoints

---

## Tech

- React 19 + Vite 8
- Tailwind CSS v4 with `@theme` for brutalist design tokens
- Zustand for auth state (persisted in localStorage)
- Axios with JWT interceptor
- React Router v7 with nested dashboard routes
- TipTap rich text editor
- GSAP + ScrollTrigger for page transitions
- Lucide React icons
- Vercel deployment

---

## Project structure

```
src/
├── lib/               # API client + relative time utility
├── stores/            # Zustand auth store
├── pages/
│   ├── LandingPage    # Public landing page
│   ├── LoginPage      # Login form
│   ├── SignupPage     # Registration
│   ├── Demo.jsx       # Interactive demo
│   ├── WidgetForm.jsx # Public widget signup form
│   └── Dashboard/
│       ├── Home.jsx        # Dashboard with metrics + activity feed
│       ├── Subscribers.jsx # Subscriber table with filters + bulk actions
│       ├── Campaigns.jsx   # Campaign CRUD + TipTap editor + test send
│       ├── Lists.jsx       # Subscriber lists / segments
│       ├── Analytics.jsx   # Charts + growth + campaign performance
│       ├── Settings.jsx    # Branding + automations toggle cards
│       └── Widgets.jsx     # Widget wizard + embed codes
├── components/
│   ├── EmailEditor.jsx         # TipTap editor with toolbar + merge tags
│   ├── SubscriberDetailPanel.jsx # Slide-in panel with notes, tags, edit
│   ├── CommandPalette.jsx      # Cmd+K modal
│   ├── CommandActionContext.jsx # Lightweight action dispatcher
│   ├── KeyboardShortcuts.jsx   # ? overlay
│   ├── Toast.jsx               # Toast notification system (queue + cap)
│   ├── ErrorBoundary.jsx       # Route-level crash catcher
│   └── ui/                     # MetricCard, Panel, Badge
│   └── ux/                     # EmptyState, LoadingState
└── layouts/
    └── DashboardLayout.jsx  # Sidebar + mobile drawer + top bar
```

---

## Running locally

```bash
npm install
npm run dev
```

Set `VITE_API_URL` in `.env` to point at the backend (default: `http://localhost:3000`).

---

## Deploy

```bash
npm run build
npx vercel --prod
```

Deployed at [newsletter.brod3000.com](https://newsletter.brod3000.com).

---

## Related

- **Backend API:** [newsletter-core](../newsletter-core)
- **Demo account:** demo@veloce.app / demo123456
