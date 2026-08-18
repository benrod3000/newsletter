# Veloce - handoff and audit

_Last updated: 2026-08-17. Written for someone picking this up cold, human or agent._

> **Target architecture and roadmap: [`newsletter-core/ARCHITECTURE.md`](../newsletter-core/ARCHITECTURE.md).**
> Read it before any structural change. This file is current state and known problems;
> that file is where things are going and which decisions are hard to reverse.

---

## 1. The shape of the thing

Veloce is a newsletter platform. Two repos on Vercel.

**Only `newsletter-core` auto-deploys on push to `main`.** The frontend does not, despite
`vercel git connect` reporting the repo as connected: a push to `newsletter` creates no
deployment record at all, and every production deployment on that project is a CLI upload
(5-7s duration, no git metadata under `vercel inspect`). Verified 2026-08-18 - a push
that deployed the backend automatically produced nothing on the frontend until
`npx vercel --prod --yes` was run from the repo. **Deploying the frontend is a manual
step.** Root cause not yet established; check the project's Git settings before assuming
a push shipped anything.

| | Path | Stack | Live |
| --- | --- | --- | --- |
| Frontend | `Websites/newsletter` | Vite, React 19, Tailwind v4, React Router | `newsletter.brod3000.com` |
| Backend | `Websites/newsletter-core` | Next.js 16 App Router, Supabase | `newsletter-core.vercel.app` |

One Supabase project, `jdmtvkytidxpcyhnhgdo`. **It is production. There is no staging.**
See `newsletter-core/AGENTS.md` before running any Supabase CLI command.

**Verifying a change**

```bash
# backend
npx tsc --noEmit && npx vitest run && npm run build && npm run lint:ci

# frontend
npm test && npm run build && npm run lint:ci
```

Lint uses a capped baseline: pre-existing violations are warnings, and CI fails if the
count grows. Backend cap 80 (currently 60), frontend cap 26 (currently 26). Lower them as
debt is paid; never raise them.

`/demo` needs no auth and is the quickest way to eyeball frontend changes, but it does not
exercise anything behind login.

---

## 2. State of the repos

```
newsletter-core   main @ 0891aea   5 uncommitted   0 unpushed
newsletter        main @ f0ffde0   5 uncommitted   0 unpushed
```

**The uncommitted work in both repos is the send-scheduling change (2026-08-17) and is
not deployed.** Migrations 069 and 070 have already been applied to production, so the
database is ahead of the deployed code - harmless in this direction (069 widens a CHECK,
070 adds a cron that calls an endpoint which already exists), but do not assume the two
are in step.

Migrations 055-070 are applied and verified present in the database, not just committed.
All feature branches are merged; nothing is stranded.

---

## 3. What actually works

Worth stating explicitly, because a lot of this codebase *looks* wired and is not. These
were each traced to a real implementation:

- **Campaign sending.** Queue, provider dispatch, tracking, unsubscribe links, merge tags.
  Read this narrowly: the *pipeline* works. Until 2026-08-17 the dashboard had no route
  that invoked it - "Send" only set `status = 'scheduled'` and left the work to a daily
  cron - so the pipeline being sound was never the same thing as the product sending.
- **SMS.** Genuinely calls the Twilio API with the workspace's own credentials.
- **Capture form widgets.** Public form, submission handling, event recording.
- **Auth.** Login, OAuth (Google/GitHub), TOTP, sessions, Turnstile.
- **Tenant isolation.** Real RLS with per-request scoped tokens, not convention.
- **Rate limiting.** Live, via Upstash.
- **Imports and exports.** CSV both directions, role-gated, audited.

---

## 4. What does not work, and what is unfinished

### Blocked on Ben (cannot be fixed in code)

**Platform email does not send.** Password resets and signup welcome emails have never
been delivered. The code is now correct but needs two secrets:

```
RESEND_API_KEY            a Resend key, sending access is enough
TRANSACTIONAL_FROM_EMAIL  noreply@brod3000.com
```

Set both in Vercel on `newsletter-core`, all environments. `brod3000.com` must be verified
in Resend. Until then the app warns at startup and records `password_reset_failed` in the
audit log instead of failing silently.

### Known unfinished, deliberately

- **No A/B testing.** `campaign_variants` exists and nothing references it.
- **No webhooks.** `webhook_configs` exists and nothing delivers to it.
- **No custom domains.** The column exists; the Settings input was removed because nothing
  read it.

All three are documented as unwired in the database itself (migration 060) with what each
would need. Do not assume they work because the schema looks complete.

- **Credentials are stored in plaintext**, protected by column-level privilege rather than
  encryption (`ses_secret_key`, `twilio_auth_token`, `sendgrid_api_key`, `resend_api_key`,
  and SES access key). Fine while there are no real customers. Worth doing as one change
  across all five columns before there are.
- **No staging database.** The largest operational risk once real data exists.
- **Dashboard is not brand-themed.** Brand colours reach sent email and public pages only.

### Not verified by a human

- The staged send flow end to end. Still **zero** sent campaigns in production as of
  2026-08-17. Engagement is no longer zero: 20 `campaign_events` and 194 `widget_events`
  exist, all of it capture-form activity with no campaign attached - which is exactly why
  analytics reported zeros until the lead-magnet figures were added on 2026-08-16.
- The mobile tab-row fix. The rows are behind auth so `/demo` cannot exercise them.

---

## 5. The traps

Every one of these has caused a real bug here. They are not hypothetical.

**PostgREST caps every response at 1,000 rows.** Not an error, not a warning - a short
answer. `?limit=10000` returns 1,000. This silently broke exports, subscriber tagging,
analytics and the heatmap. Use `fetchAllRows()` from `src/lib/paginate.ts` for anything
that must be complete; it clamps page size for exactly this reason.

**supabase-js does not throw on error.** It resolves `{ data, error }`. So
`const { data } = await supabase...` swallows failures and degrades to defaults. Always
destructure and check `error`. A missing table or column reaches you this way, not as an
exception.

**Generated types are the safety net.** `npm run types:generate` in `newsletter-core`
regenerates `src/lib/database.types.ts` from the live schema. **Run it after every
migration.** Turning it on found four shipped bugs immediately, including a query against
a column renamed months earlier. Nothing else in the toolchain sees SQL.

**Vercel is on the Hobby plan: crons run at most once daily.** A more frequent expression
fails config validation *before a deployment record is created*, so nothing appears as an
error in `vercel ls` and every subsequent push silently stops deploying. `npx vercel --prod`
surfaces the real error.

Do not try to solve a scheduling problem by editing `vercel.json`. **Scheduled campaign
processing moved to Supabase `pg_cron` on 2026-08-17** (migration 070, job
`process-due-campaigns`, every 5 minutes) because a daily processor cannot honour a
user-chosen send time - a campaign scheduled at 04:14 UTC waited until the next 00:00.
The job calls `/api/admin/campaigns/process` through `pg_net` using a Vault secret,
`campaign_processor_secret`. **Rotating `CRON_SECRET` now means updating Vercel *and*
that Vault secret**, or the processor 401s every five minutes and nothing sends.

Hobby also caps a project at 2 cron jobs while `vercel.json` declares 7. Which ones
Vercel actually registered is **unverified** - the crons API returns 404 on this plan.
`automation_logs` and `campaign_jobs` are both empty, which is consistent with some of
them never having run, but is equally consistent with there being no work for them. The
same pg_cron treatment is the fix if they are dead; campaign *recovery* is the one that
matters most, since it is what finishes a partial send.

**`vercel ls` is unreliable.** Ages and statuses have been repeatedly wrong. Verify a
deploy by fetching a built asset and grepping for a string you just added, or by hitting an
endpoint whose behaviour changed.

**The Supabase MCP reports timeouts on statements that still commit.** Treat a timeout as
"unknown, go verify", never as "failed". It has left partial state twice.

**Stored functions are invisible to the type system.** Nothing in tsc, lint, tests or build
executes SQL. Before claiming a Postgres function works, run it:
`BEGIN; SELECT fn(...); ROLLBACK;` is non-destructive and takes seconds.

---

## 6. The recurring bug class

Roughly two thirds of everything fixed here was one shape:

> A control exists, appears to work, returns success, and the value is silently discarded,
> never read, or never executed.

Fourteen confirmed instances. A representative few:

| Symptom | Cause |
| --- | --- |
| Send button did not send | Marked the campaign scheduled; no route invoked the pipeline |
| Provider API key would not save | Backend allowlist dropped it, still returned 200 |
| Brand colours did nothing | Stored, returned, rendered nowhere |
| Automations never ran | Full CRUD API, no scheduled executor |
| Notes panel always empty | The table did not exist |
| Radius search always failed | Called a Postgres function that did not exist |
| Password reset never arrived | Required env vars that have never existed |
| Health scores covered 29% | One HTTP request per subscriber; timed out nightly |

**If you are looking for bugs, look for a reader.** Take a settings field or a table and
search for something that consumes it. The absence of a consumer is the bug, and it is
invisible from the UI. That method found seven of the thirteen.

---

## 7. Things that look wrong and are not

Please do not "fix" these:

**`forgot-password` always returns `{ ok: true }`.** For a known address, an unknown
address, and a failed send. Differing responses would make it an account enumeration
oracle. The operator sees failures in Security Activity; the requester must not. Seven
tests pin this (`forgot-password-enumeration.test.ts`), verified by mutation.

**`auto-clean` refuses to delete unless a workspace is ≥95% scored and has engagement
history.** This is not over-caution. `cold` is the *default* health score for anyone with
no engagement events, so a workspace that has never sent a campaign scores everyone cold
once they pass 30 days - and `auto-clean` deletes cold subscribers. The guard is the only
thing between a scoring change and mass deletion, on a timer, with no human involved.

**Empty secret fields mean "leave unchanged", not "clear".** The Settings form initialises
every secret input to `""` and PUTs the whole object, so treating blank as "clear" would
wipe sending credentials every time someone opened Settings and pressed Save. An explicit
`null` clears.

**Campaign audience lives in SQL, not TypeScript.** `campaign_audience()` is read by both
`count_campaign_recipients()` (what the user is shown) and `enqueue_campaign_recipients()`
(who is actually mailed). Reimplementing either in application code guarantees they drift.

---

## 8. Where to start

If the goal is to get to a first customer:

1. **Set the two email env vars.** Account recovery does not work without them.
2. **Send a real campaign end to end.** Nothing has ever been sent. Until it has, the send
   path, tracking, and unsubscribe are unproven in production.
3. **Encrypt the five credential columns.** Before real customer data, not before launch.
4. **Create a staging Supabase project.** Same timing.

If the goal is to keep hardening: use the "look for a reader" method in section 6. The
areas nobody has swept are the admin surface (`newsletter-core/app/admin/`), the SMS
campaign path beyond "it calls Twilio", and the OAuth callbacks.

---

## 9. Historical note: the sign-in report

A "cannot sign in" report was traced end to end and is **not a bug**. A real Turnstile
token POSTed to `/api/auth/token` with a deliberately wrong password returned
`401 INVALID_CREDENTIALS`, not `SECURITY_CHECK_FAILED`, so the auth pipeline is healthy and
the token is accepted server-side. Most likely the account was created via Google/GitHub
OAuth and has no password. Recovery is the OAuth buttons.

Note that `/forgot-password` returning `200 {ok:true}` was cited at the time as evidence it
was healthy. It was not - see section 4. It returns that regardless.
