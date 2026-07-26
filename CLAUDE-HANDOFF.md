# Veloce — Claude Handoff Notes

_Last updated: 2026-07-26. This file is the pickup point for continuing work in a new Claude Code session (e.g. VS Code)._

> **Target architecture and roadmap: [`newsletter-core/ARCHITECTURE.md`](../newsletter-core/ARCHITECTURE.md).**
> Read it before any structural change. This file covers current working state; that
> file covers where things are going and which decisions are irreversible.

## Two repos (both deploy to Vercel on push to `main`)
- **Frontend** — `/Users/benrodriguez/Websites/newsletter` — Vite + React 19 + Tailwind v4 + React Router. Neobrutalist design system. Live at `https://newsletter.brod3000.com`.
- **Backend** — `/Users/benrodriguez/Websites/newsletter-core` — Next.js 16 (App Router) + Supabase. API at `https://newsletter-core.vercel.app`. NOTE: `AGENTS.md` warns this is a newer Next than training data — read `node_modules/next/dist/docs/` before touching Next APIs.

Dev server (frontend): `.claude/launch.json` has `newsletter-dev` (port 5173) and `newsletter-core-api` (port 3000). The public `/demo` route needs no auth and is the best place to eyeball changes; it uses `VITE_API_URL` (defaults to the prod API).

## Sign-in issue — DIAGNOSED, not a bug in our code
User reported "I can't sign in." Traced end-to-end against production:
- Site + auth service up; Turnstile widget works; the real site key is `0x4AAAAAAD23X8AsPUCySDiU` (not the test key).
- **Decisive test:** generated a real Turnstile token, POSTed it to `/api/auth/token` with a deliberately wrong password → got **`401 INVALID_CREDENTIALS`**, NOT `SECURITY_CHECK_FAILED`. So the auth pipeline is healthy and the token is accepted server-side.
- **Conclusion:** it's a credentials problem for that user, not an outage or a regression. Most likely: account was created via Google/GitHub OAuth (no password), or wrong password/email. Forgot-password endpoint is healthy (`200 {ok:true}`). Recovery: use the Google/GitHub buttons, or `/forgot-password`.
- Do NOT ask for or type the user's password.

## What has shipped (committed + pushed + deployed)
Frontend `main` (newest first):
- `feaace6` Make analytics interactive and comparative
- `b99c1ae` Make the radius filter discoverable and rewarding to use
- `b4b366e` Link the sample newsletter from the demo page
- `c558a9d` Changelog + "See Live Demo" CTA + conversational newsletter sample
- `07ed77a` Font-heading fix, Resend across marketing/docs, a11y fixes

Backend `main`:
- `1721a36` Analytics API: prior-period comparison and period/timezone-aware heatmap
- `ec2ef08` Wire Amazon SES email transport

### Recently completed features
1. **Landing/marketing** — fixed the `font-heading` token (was silently rendering headings in Inter; theme uses `--font-*` not `--font-family-*`), named **Resend** everywhere (was "SendGrid or SES" only), a11y fixes (ghostOnDark CTA, skip link, focus rings on dark), OG metadata.
2. **SES email transport** (`newsletter-core/src/lib/email/ses.ts`) — was selectable in Settings but never wired; now sends via raw MIME (preserves RFC 8058 List-Unsubscribe). 13 tests in `src/lib/__tests__/ses-transport.test.ts`. Registered in `src/lib/email/registry.ts`.
3. **Sample newsletter** — `newsletter/public/samples/conversation-newsletter.html` (chat-bubble format, self-contained), linked from `/demo`.
4. **Radius filter** (`newsletter/src/components/GeoFilter.jsx`) — rewritten: city/ZIP search w/ suggestions dropdown, "Near me" geolocation, animated hero in-range count, taller map, filled slider. Demo seeded with `DEMO_GEO_SUBSCRIBERS` around Austin (`src/pages/Demo.jsx`). Also fixed a real `resolveZip` cache bug in `src/lib/geo.js` (cacheKey was scoped to one try block).
5. **Analytics** (`newsletter/src/pages/Dashboard/Analytics.jsx` + backend `app/api/clients/[workspaceId]/analytics/route.ts` and `.../analytics/heatmap/route.ts`):
   - Fixed a silent envelope bug (page read fields off the raw body but route returns `{ data }`) — unwrap `data.data ?? data`.
   - Prior-period deltas on the 4 stat cards.
   - Campaign bars: one 0–100% scale with a "your average" marker (`RateBar`).
   - Cross-filtering: click a campaign to focus, with a clearable chip.
   - Sortable + keyboard-accessible broadcasts table (`aria-sort`, buttons not row onClick).
   - Heatmap: dropped height+opacity double-encoding; passes `days` + `tzOffset` so it matches the period and reads in local time; "best time to send" recommendation.

## Analytics — VERIFY + REMAINING (start here)
- ⚠️ **Not visually verified against real data.** The real Analytics page is behind auth (couldn't sign in to test); the `/demo` Analytics tab uses SEPARATE mock markup, not this component. First job: sign in and confirm the real page renders — stat deltas, the sortable table, the cross-filter chip, and the period/timezone-correct heatmap.
- Lint items in `Analytics.jsx` (quality, not crashes): 2× "setState synchronously within an effect" (pre-existing `AnimatedStatCard` count-up + `LivePulse`), 1× empty catch (~line 438). Clean up if touching those areas.
- Possibly-still-open from the original review: dead `AbortController` in the overview effect (created + aborted but never passed to the request); persistent (non-hover-only) chart readouts; confirm growth-chart weekly bucketing at 90d looks right.
- Backend deltas: `analytics/route.ts` now returns prior-period figures — confirm the shape the frontend expects matches (`avg_open_rate`, prior equivalents). Grep both sides.

## Next planned work (user wants "all of it")
- **Analytics** — finish + verify the above, then richer interactions: brush a date range, click a heatmap hour to filter, per-metric "vs your average" everywhere.
- The user's north star for both radius filter and analytics: **let users interact with the data to understand what works for them.** Favor direct manipulation + comparison over static numbers.

## How to verify changes
- `cd newsletter && npm run build` (Vite; fast). `npx eslint <file>` for `no-undef` (Vite won't catch undefined vars).
- `cd newsletter-core && npx tsc --noEmit -p tsconfig.json` and `npx vitest run`.
- Browser-test the `/demo` route (no auth). Ship = commit + push `main` (auto-deploys). Only push when the user says so.
