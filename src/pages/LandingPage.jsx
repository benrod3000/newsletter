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
            The control layer for
            <span className="block text-brutal-muted">newsletters that matter.</span>
          </h1>

          <div className="h-2 w-24 bg-brutal-yellow border-2 border-brutal-fg" />

          <p className="text-lg sm:text-xl text-brutal-fg/60 leading-relaxed max-w-xl">
            Create campaigns, understand your audience, and automate your workflow
            without the noise of traditional marketing platforms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/demo" className="px-8 py-4 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition">
              Launch Demo →
            </Link>
            <Link to="/login" className="px-8 py-4 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 active:shadow-none transition">
              Sign In
            </Link>
          </div>

          {/* Product Preview */}
          <div className="border-3 border-brutal-fg bg-white shadow-brutal overflow-hidden">
            <div className="border-b-3 border-brutal-fg bg-brutal-fg text-white px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-60">Veloce</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Campaign Overview</span>
              </div>
              <span className="h-2 w-2 bg-brutal-green" />
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider">Summer Launch</p>
                  <Badge variant="green">Active</Badge>
                </div>
                <div className="h-3 bg-brutal-surface border border-brutal-fg">
                  <div className="h-full bg-brutal-yellow border-r border-brutal-fg" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '48%', label: 'Open Rate' },
                  { value: '12,492', label: 'Subscribers' },
                  { value: '$8,420', label: 'Revenue' },
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

      {/* ======== WHY VELOCE ======== */}
      <Section className="border-t-3 border-brutal-fg bg-stripes">
        <div className="space-y-10">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">Why Veloce</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Finally understand <span className="text-brutal-green">your audience</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '▲', title: 'Campaigns', body: 'Create and send newsletters without the bloat. Plain text or rich HTML — your call.' },
              { icon: '●', title: 'Audience', body: 'Import, segment, and understand who reads. Location, behavior, and consent built in.' },
              { icon: '⚡', title: 'Health Scores', body: 'Every subscriber gets a real-time health score. Know who\'s engaged, at risk, or cold — updated daily.' },
            ].map((r) => (
              <div key={r.title} className="reason-card border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition">
                <p className="text-xl mb-4 text-brutal-fg/20">{r.icon}</p>
                <h3 className="font-heading text-xl uppercase tracking-wide mb-2">{r.title}</h3>
                <p className="text-xs leading-relaxed text-brutal-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ======== AUTOMATIONS PREVIEW ======== */}
      <Section className="border-t-3 border-brutal-fg bg-stripes">
        <div className="space-y-10">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">Automations</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Set it, forget it, <span className="text-brutal-green">watch it work</span>
            </h2>
            <p className="text-sm text-brutal-muted leading-relaxed max-w-lg">
              Toggle on pre-built automations. No config, no code, no cron jobs to manage. They run daily and keep your list healthy.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: '📬', title: 'Confirm & Remind', desc: 'Auto-follows up on unconfirmed subscribers. Cleans up after 7 days.' },
              { icon: '🧹', title: 'Auto-Clean', desc: 'Removes cold subscribers at 90 days. Keeps your sender reputation strong.' },
              { icon: '🏷️', title: 'Smart Tags', desc: 'Labels engaged, clicker, slipping, mobile. Builds segments automatically.' },
            ].map((a) => (
              <div key={a.title} className="reason-card border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition">
                <p className="text-xl mb-4">{a.icon}</p>
                <h3 className="font-heading text-lg uppercase tracking-wide mb-2">{a.title}</h3>
                <p className="text-xs leading-relaxed text-brutal-muted">{a.desc}</p>
              </div>
            ))}
          </div>

          <Link to="/demo" className="inline-block px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">
            See all automations in the demo →
          </Link>
        </div>
      </Section>

      {/* ======== ARCHITECTURE ======== */}
      <Section>
        <div className="max-w-2xl space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/40">Architecture</p>
            <h2 className="text-4xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Multi-tenant by <span className="text-brutal-green">design</span>
            </h2>
            <p className="text-sm text-brutal-muted leading-relaxed max-w-lg">
              Every workspace is isolated. Bring your own AWS SES keys. No per-contact pricing. No platform lock-in.
            </p>
          </div>

          <div className="border-3 border-brutal-fg bg-white p-6 space-y-3">
            {[
              { label: 'Workspace isolation', detail: 'Each client gets their own data boundary' },
              { label: 'BYO email provider', detail: 'Plugs into SendGrid or your own AWS SES account' },
              { label: 'No platform fees', detail: 'You pay AWS directly. We don\'t take a cut.' },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b-2 border-brutal-fg/10 last:border-0">
                <span className="text-brutal-green font-bold mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{a.label}</p>
                  <p className="text-[10px] text-brutal-muted">{a.detail}</p>
                </div>
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