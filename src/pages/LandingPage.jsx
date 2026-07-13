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
  return <section className={`py-20 sm:py-28 ${className}`}>{children}</section>
}

export default function LandingPage() {
  const heroRef = useRef(null)
  const statRef = useRef(null)

  useReveal(heroRef, { stagger: 0.12, y: 30 })
  useReveal(statRef, { stagger: 0.06, y: 20, delay: 0.25 })
  useScrollReveal('.reason-card', { stagger: 0.1, y: 40 })

  return (
    <div className="-my-20">
      {/* ======== HERO ======== */}
      <Section className="bg-dots-light">
        <div ref={heroRef} className="space-y-8 max-w-3xl">
          <Badge variant="yellow">Control Layer</Badge>

          <h1 className="text-display">
            Know <span className="text-brutal-green">who's nearby</span>.
            <span className="block text-brutal-muted">Send to the right people.</span>
          </h1>

          <div className="h-2 w-24 bg-brutal-yellow border-2 border-brutal-fg" />

          <p className="text-lg sm:text-xl text-brutal-fg/60 leading-relaxed max-w-xl">
            Collect leads with embeddable forms. Target campaigns by radius around any ZIP code.
            Automate the rest. No code, no monthly fees.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/demo" className="px-8 py-4 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition">
              Launch Demo →
            </Link>
            <Link to="/login" className="px-8 py-4 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition">
              Sign In
            </Link>
          </div>

          {/* Geo-targeting preview */}
          <div className="border-3 border-brutal-fg bg-white shadow-brutal overflow-hidden">
            <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-5 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider">📍 Radius filter</span>
              <span className="h-2 w-2 bg-brutal-green" />
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
              {/* Radar */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                <div className="absolute inset-[15%] rounded-full border border-dashed border-brutal-fg/20" />
                <div className="absolute inset-[35%] rounded-full border border-dashed border-brutal-fg/25" />
                <div className="absolute inset-[55%] rounded-full border border-dashed border-brutal-fg/30" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                <div className="absolute inset-0 rounded-full border-3 border-brutal-green/20 animate-radar-3" />
                <div className="relative z-10 w-4 h-4 bg-brutal-green rounded-full border-2 border-brutal-fg" />
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 flex-1">
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
            <div key={s.label} className="border-3 border-brutal-fg bg-white p-5 text-center hover:shadow-brutal transition">
              <p className="text-stat text-brutal-green leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ======== HOW IT WORKS ======== */}
      <Section className="border-t-3 border-brutal-fg bg-stripes">
        <div className="space-y-10">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Three steps to <span className="text-brutal-green">smarter sends</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Embed a widget', body: 'Drop a form on your site. Collects emails + location automatically. Takes 30 seconds.', icon: '📋' },
              { step: '02', title: 'Target by radius', body: 'Pick a ZIP code, set a radius. See exactly who\'s nearby. Send campaigns that reach the right people.', icon: '📍' },
              { step: '03', title: 'Set it and forget it', body: 'Toggle on automations. Confirmation reminders, list cleaning, smart tagging. They run daily.', icon: '🤖' },
            ].map((r) => (
              <div key={r.step} className="reason-card border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition">
                <p className="text-3xl font-heading text-brutal-fg/10 mb-3 leading-none">{r.step}</p>
                <p className="text-xl mb-2">{r.icon}</p>
                <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{r.title}</h3>
                <p className="text-xs leading-relaxed text-brutal-muted">{r.body}</p>
              </div>
            ))}
          </div>

          <Link to="/demo" className="inline-block px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
            Try it in the demo →
          </Link>
        </div>
      </Section>

      {/* ======== SEE IT IN ACTION ======== */}
      <Section>
        <div className="space-y-10">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">See it in action</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Real features. <span className="text-brutal-green">No fluff.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Health Score Badges */}
            <div className="border-3 border-brutal-fg bg-white overflow-hidden">
              <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Health Scores</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1.5 border-2 border-brutal-fg bg-brutal-green text-white">🟢 Active</span>
                  <span className="text-xs font-bold text-brutal-muted">Opened in last 30 days</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1.5 border-2 border-brutal-fg bg-brutal-yellow text-brutal-fg">🟡 At Risk</span>
                  <span className="text-xs font-bold text-brutal-muted">30-60 days no engagement</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1.5 border-2 border-brutal-fg bg-brutal-red text-white">🔴 Cold</span>
                  <span className="text-xs font-bold text-brutal-muted">60+ days inactive</span>
                </div>
                <p className="text-[10px] font-bold text-brutal-fg/60 uppercase tracking-wider pt-2 border-t border-brutal-fg/20">Recalculated daily · 1,234 active</p>
              </div>
            </div>

            {/* Automation Toggle Cards */}
            <div className="border-3 border-brutal-fg bg-white overflow-hidden">
              <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Pre-Built Automations</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: '📬', label: 'Confirm & Remind', badge: '✅ Active' },
                  { icon: '🧹', label: 'Auto-Clean Cold', badge: '✅ Active' },
                  { icon: '🏷️', label: 'Smart Auto-Tagging', badge: '✅ Active' },
                  { icon: '👋', label: 'Welcome Drip', badge: '⏸ Paused' },
                ].map((a) => (
                  <div key={a.label} className="flex items-center justify-between py-2 border-b-2 border-brutal-fg/10 last:border-0">
                    <span className="text-xs font-bold">{a.icon} {a.label}</span>
                    <span className="text-[10px] font-bold text-brutal-green uppercase tracking-wider">{a.badge}</span>
                  </div>
                ))}
                <p className="text-[10px] font-bold text-brutal-fg/60 uppercase tracking-wider pt-2 border-t border-brutal-fg/20">Toggle on. They run daily.</p>
              </div>
            </div>

            {/* Geo Radar */}
            <div className="border-3 border-brutal-fg bg-white overflow-hidden">
              <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider">Geo-Radius Targeting</p>
              </div>
              <div className="p-5 flex flex-col items-center gap-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                  <div className="absolute inset-[15%] rounded-full border border-dashed border-brutal-fg/20" />
                  <div className="absolute inset-[35%] rounded-full border border-dashed border-brutal-fg/25" />
                  <div className="absolute inset-[55%] rounded-full border border-dashed border-brutal-fg/30" />
                  <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                  <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                  <div className="absolute inset-0 rounded-full border-3 border-brutal-green/20 animate-radar-3" />
                  <div className="relative z-10 w-3.5 h-3.5 bg-brutal-green rounded-full border-2 border-brutal-fg" />
                </div>
                <p className="text-xs font-bold text-center">347 subscribers within 10 mi of Austin, TX</p>
                <p className="text-[10px] font-bold text-brutal-fg/60 uppercase tracking-wider">Send campaigns to people nearby</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======== WHY VELOCE ======== */}
      <Section>
        <div className="space-y-10">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">Why Veloce</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Built different <span className="text-brutal-green">on purpose</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '📍', title: 'Geo-targeted', body: 'The only newsletter platform with built-in radius targeting. Embed a form, collect location, send to people nearby.' },
              { icon: '🤖', title: 'Auto-pilot', body: 'Confirm & Remind, Auto-Clean, Smart Tags, Welcome Drips. Toggle on and they run daily. No config needed.' },
              { icon: '🔑', title: 'You own the keys', body: 'Bring your own AWS SES account. Pay Amazon directly at $1 per 10K emails. We never take a cut.' },
            ].map((r) => (
              <div key={r.title} className="reason-card border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition">
                <p className="text-xl mb-4">{r.icon}</p>
                <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{r.title}</h3>
                <p className="text-xs leading-relaxed text-brutal-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== CTA ======== */}
      <Section className="border-t-3 border-brutal-fg bg-brutal-fg text-brutal-bg">
        <div className="text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Ready to <span className="text-brutal-yellow">take control</span>?
          </h2>
          <p className="text-sm opacity-60 max-w-md mx-auto">
            No monthly fees. No platform lock-in. Just a control layer for newsletters that actually matter.
          </p>
          <div className="flex justify-center gap-4">
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