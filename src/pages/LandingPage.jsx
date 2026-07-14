import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReveal, useScrollReveal } from '../App'
import Badge from '../components/ui/Badge'

const stats = [
  { value: '$1', label: 'Per 10K emails' },
  { value: 'BYO', label: 'AWS SES Keys' },
  { value: '∞', label: 'Workspaces' },
  { value: '0%', label: 'Monthly fees' },
]

function Section({ children, className = '' }) {
  return <section className={`py-16 sm:py-28 ${className}`}>{children}</section>
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const statRef = useRef(null)

  useReveal(heroRef, { stagger: 0.12, y: 24 })
  useReveal(statRef, { stagger: 0.06, y: 16, delay: 0.2 })
  useScrollReveal('.pillar-card', { stagger: 0.1, y: 30 })

  return (
    <div className="-my-20">
      {/* ======== HERO ======== */}
      <Section className="bg-dots-light">
        <div ref={heroRef} className="space-y-6 sm:space-y-8 max-w-3xl">
          <Badge variant="yellow">Control Layer</Badge>

          <h1 className="text-display">
            Know <span className="text-brutal-green">who's nearby</span>.
            <span className="block text-brutal-muted">Send to the right people.</span>
          </h1>

          <div className="h-2 w-24 bg-brutal-yellow border-2 border-brutal-fg" />

          <p className="text-base sm:text-lg text-brutal-fg/60 leading-relaxed max-w-xl">
            Collect leads with embeddable forms. Target campaigns by radius around any ZIP code.
            Automate the rest. No code, no monthly fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/demo" className="px-8 py-4 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition text-center">
              Launch Demo →
            </Link>
            <Link to="/login" className="px-8 py-4 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition text-center">
              Sign In
            </Link>
          </div>

          {/* Radar preview */}
          <div className="border-3 border-brutal-fg bg-white shadow-brutal overflow-hidden">
            <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">📍 Geo-targeting built in</span>
              <span className="h-2 w-2 bg-brutal-green" />
            </div>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                <div className="absolute inset-[15%] rounded-full border border-dashed border-brutal-fg/20" />
                <div className="absolute inset-[35%] rounded-full border border-dashed border-brutal-fg/25" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/20 animate-radar-3" />
                <div className="relative z-10 w-4 h-4 bg-brutal-green rounded-full border-2 border-brutal-fg" />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 flex-1 text-center sm:text-left">
                {[
                  { value: 'Austin, TX', label: 'Center' },
                  { value: '347', label: 'Within 10 mi' },
                  { value: '1,892', label: 'Total leads' },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <p className="text-lg sm:text-xl font-heading uppercase leading-none text-brutal-green">{m.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== STAT STRIP ======== */}
      <Section>
        <div ref={statRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="border-3 border-brutal-fg bg-white p-4 sm:p-5 text-center hover:shadow-brutal transition">
              <p className="text-stat text-brutal-green leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ======== GROW: Widgets ======== */}
      <Section className="border-t-3 border-brutal-fg bg-stripes">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
            <div className="flex-1 space-y-4 sm:space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">01 — Grow</p>
              <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
                Embed a form.<br />
                <span className="text-brutal-green">Collect leads.</span>
              </h2>
              <p className="text-sm text-brutal-muted leading-relaxed max-w-md">
                Drop a widget on any website. It collects email and location automatically. Every signup becomes a subscriber you can target by radius. Takes 30 seconds.
              </p>
              <Link to="/demo" className="inline-block px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
                See it in the demo →
              </Link>
            </div>
            <div className="flex-1 w-full max-w-sm pillar-card">
              <form onSubmit={async (e) => {
                e.preventDefault()
                const email = e.target.email.value.trim()
                if (!email) return
                try {
                  await fetch('https://newsletter-core.vercel.app/api/subscribe', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, client_slug: 'demo' })
                  })
                  e.target.email.value = ''
                  e.target.querySelector('button').textContent = '✓ Sent!'
                  setTimeout(() => { e.target.querySelector('button').textContent = 'Send Me the Link' }, 3000)
                } catch {}
              }} className="border-3 border-brutal-fg bg-white shadow-brutal">
                <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-4 py-3">
                  <p className="font-heading text-lg sm:text-xl uppercase">Get the Free Download</p>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs">Enter your email and we'll send you the download link.</p>
                  <input name="email" type="email" required placeholder="you@example.com" className="w-full px-3 py-2 border-3 border-brutal-fg bg-white text-sm focus:outline-none focus:bg-brutal-yellow/10" />
                  <button type="submit" className="w-full border-3 border-brutal-fg bg-brutal-fg text-white font-bold py-2 text-xs uppercase hover:bg-brutal-green transition">Send Me the Link</button>
                </div>
                <div className="border-t-3 border-brutal-fg px-4 py-2">
                  <p className="text-[10px] font-bold text-brutal-muted uppercase text-center">No spam. Unsubscribe anytime.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== UNDERSTAND: Health + Geo ======== */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-16 items-center">
            <div className="flex-1 space-y-4 sm:space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">02 — Understand</p>
              <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
                Know <span className="text-brutal-green">who's engaged</span>.
                <span className="block text-brutal-muted">Target by location.</span>
              </h2>
              <p className="text-sm text-brutal-muted leading-relaxed max-w-md">
                Every subscriber gets a health score. Active? At risk? Cold? You'll know instantly. Plus, our radius filter shows exactly who's near any ZIP code.
              </p>
            </div>
            <div className="flex-1 w-full max-w-sm space-y-4 pillar-card">
              <div className="border-3 border-brutal-fg bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold px-3 py-1.5 border-2 border-brutal-fg bg-brutal-green text-white">🟢 Active</span>
                  <span className="text-xs font-bold px-3 py-1.5 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg">🟡 At Risk</span>
                  <span className="text-xs font-bold px-3 py-1.5 border-2 border-brutal-fg bg-brutal-red text-white">🔴 Cold</span>
                </div>
              </div>
              <div className="border-3 border-brutal-fg bg-white p-4 flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                  <div className="absolute inset-[20%] rounded-full border border-dashed border-brutal-fg/20" />
                  <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                  <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                  <div className="relative z-10 w-3 h-3 bg-brutal-green rounded-full border-2 border-brutal-fg" />
                </div>
                <div>
                  <p className="text-xs font-bold">347 subscribers</p>
                  <p className="text-[10px] text-brutal-muted uppercase">within 10 mi of Austin, TX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== SEND: Campaigns ======== */}
      <Section className="border-t-3 border-brutal-fg bg-stripes">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
            <div className="flex-1 space-y-4 sm:space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">03 — Send</p>
              <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
                Write once.
                <span className="block text-brutal-green">Personalize for everyone.</span>
              </h2>
              <p className="text-sm text-brutal-muted leading-relaxed max-w-md">
                Use merge tags like {'{{first_name}}'} to personalize every email. Track opens and clicks automatically. Send through your own AWS account at $1 per 10K emails.
              </p>
            </div>
            <div className="flex-1 w-full max-w-sm pillar-card">
              <div className="border-3 border-brutal-fg bg-white">
                <div className="border-b-3 border-brutal-fg bg-brutal-bg px-3 py-2 flex flex-wrap gap-1">
                  {['B','I','H1','H2','• List','🔗','🖼'].map((b,i) => (
                    <span key={i} className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-brutal-fg bg-white">{b}</span>
                  ))}
                  <span className="ml-auto px-2 py-1 text-[10px] font-bold uppercase border-2 border-brutal-fg bg-brutal-green text-white">{'{ }'} Tags</span>
                </div>
                <div className="p-4 min-h-[120px]">
                  <p className="text-2xl font-bold">Hey {'{{first_name}}'}!</p>
                  <p className="text-sm text-brutal-muted mt-2">Thanks for joining. We're excited to have you.</p>
                  <p className="text-[10px] text-brutal-green font-bold mt-3">✓ Each recipient sees their own name</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== AUTOMATE ======== */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-16 items-center">
            <div className="flex-1 space-y-4 sm:space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">04 — Automate</p>
              <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
                Toggle on.
                <span className="block text-brutal-green">They run daily.</span>
              </h2>
              <p className="text-sm text-brutal-muted leading-relaxed max-w-md">
                Pre-built automations handle the busywork. Confirm reminders, auto-clean cold subscribers, smart tags. No config, no cron jobs — just toggle and forget.
              </p>
              <Link to="/demo" className="inline-block px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
                See all 6 automations →
              </Link>
            </div>
            <div className="flex-1 w-full max-w-sm space-y-3 pillar-card">
              {[
                { icon: '📬', label: 'Confirm & Remind', badge: '✅ Active, runs daily' },
                { icon: '🧹', label: 'Auto-Clean Cold', badge: '✅ Active, runs daily' },
                { icon: '🏷️', label: 'Smart Tags', badge: '✅ Active, runs daily' },
              ].map((a) => (
                <div key={a.label} className="border-3 border-brutal-fg bg-white p-3 flex items-center justify-between">
                  <span className="text-xs font-bold">{a.icon} {a.label}</span>
                  <span className="text-[9px] font-bold text-brutal-green uppercase">{a.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ======== CTA ======== */}
      <Section className="border-t-3 border-brutal-fg bg-brutal-fg text-brutal-bg">
        <div className="text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Ready to <span className="text-brutal-yellow">take control</span>?
          </h2>
          <p className="text-sm opacity-60 max-w-md mx-auto">
            No monthly fees. No platform lock-in. Just a control layer for newsletters that actually matter.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/demo" className="px-8 py-4 border-3 border-brutal-yellow bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-[4px_4px_0px_#f5e642] active:translate-y-0.5 transition">
              Launch Demo →
            </Link>
            <Link to="/login" className="px-8 py-4 border-3 border-brutal-bg/20 text-brutal-bg font-bold text-sm uppercase tracking-wider hover:border-brutal-bg/60 transition">
              Sign In
            </Link>
          </div>
        </div>
      </Section>
    </div>
  )
}