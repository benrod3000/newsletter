import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useReveal, useScrollReveal, useTerminalReveal } from '../hooks/use-gsap.jsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Badge from '../components/ui/Badge'
import Btn from '../components/ui/Button'
import { Annotation, Section, CountUp } from '../components/ux'
import {
  NAV_ITEMS, FOOTER_LINKS,
  AUDIENCE_QUESTIONS, REACHABILITY_STATES, HOW_IT_WORKS, PROVIDERS, PLANNED_CHANNELS,
} from './LandingPage/data'
import {
  Mail, Users, BarChart3, Menu, X, ArrowRight, Share2, Activity,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const heroRef = useRef(null)
  const dashboardRef = useRef(null)

  useReveal(heroRef, { stagger: 0.08, y: 20 })
  // One ScrollTrigger per group. useScrollReveal keys its trigger off the
  // first matched element, so a single shared class meant eleven elements
  // spread down the page all animated from one trigger far above them.
  useScrollReveal('.reveal-q', { stagger: 0.08, y: 24, start: 'top 90%' })
  useScrollReveal('.reveal-state', { stagger: 0.08, y: 24, start: 'top 90%' })
  useScrollReveal('.reveal-step', { stagger: 0.06, y: 20, start: 'top 92%' })
  useTerminalReveal('.annotation', { stagger: 0.08 })

  useEffect(() => {
    if (dashboardRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(dashboardRef.current,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.35, ease: 'power3.out' }
        )
      }, dashboardRef)
      return () => ctx.revert()
    }
  }, [])

  return (
    <>
      {/* ═══ STICKY NAV ═══ */}
      <nav className="sticky top-0 z-50 border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl uppercase tracking-wider leading-none hover:text-brutal-green transition-colors" aria-label="Veloce home">
            Veloce
            <span className="inline-block w-2 h-2 bg-brutal-green rounded-full animate-pulse ml-1.5 align-middle" title="Live" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6" role="menubar">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} to={item.href} onClick={(e) => { if (item.href.startsWith('/#')) { e.preventDefault(); document.getElementById(item.href.slice(2))?.scrollIntoView({ behavior: 'smooth' }) } }} className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors" role="menuitem">{item.label}</Link>
            ))}
            <span className="w-px h-5 bg-brutal-fg/15" aria-hidden="true" />
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors" role="menuitem">Sign In</Link>
            <Btn variant="primary" size="md" onClick={() => navigate('/signup')} role="menuitem">Create Free Account</Btn>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 border-3 border-brutal-fg focus:outline-none focus:bg-brutal-yellow/20" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile nav drawer. Capped and scrollable: it is a child of the sticky
            nav, so an uncapped drawer on a short landscape viewport pushed its
            own last item off screen with no way to reach it. */}
        {mobileOpen && (
          <div className="md:hidden border-t-3 border-brutal-fg bg-brutal-bg px-4 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} to={item.href} onClick={(e) => { setMobileOpen(false); if (item.href.startsWith('/#')) { e.preventDefault(); document.getElementById(item.href.slice(2))?.scrollIntoView({ behavior: 'smooth' }) } }} className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/70 hover:text-brutal-fg">{item.label}</Link>
            ))}
            <hr className="border-brutal-fg/15" />
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg">Sign In</Link>
            <Btn variant="primary" size="md" fullWidth onClick={() => { navigate('/signup'); setMobileOpen(false) }}>Create Free Account</Btn>
          </div>
        )}
      </nav>

      <main id="main-content" tabIndex={-1} className="focus:outline-none">

      {/* ═══ 1. HERO ═══════════════════════════════════════
          The product visual lives in this section rather than below it, so the
          app is on screen without scrolling past two argument sections first.
          It used to hang off the next section on a negative margin. */}
      <Section padding="pt-28 sm:pt-32 pb-20 sm:pb-28" className="bg-dots-light">
        <div ref={heroRef} className="max-w-4xl mx-auto space-y-7">
          <Badge variant="muted">Audience platform · Email</Badge>

          <h1 className="text-display leading-[0.85]">
            Stop Renting{' '}
            <span className="text-brutal-green">Your Audience.</span>
          </h1>

          <p className="text-xl sm:text-2xl font-bold leading-tight max-w-2xl">
            Know who you can reach, why you can reach them, and when to talk to them.
          </p>

          <p className="text-base sm:text-lg text-brutal-fg/70 leading-relaxed max-w-2xl">
            Bring your audience into one place, with the evidence behind every name:
            where they came from, what they agreed to, and what has happened since.
            When you are ready to send, use the provider you already trust.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-1">
            <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
              Create Free Account
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => navigate('/demo')}>
              See the live demo
            </Btn>
          </div>

          <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">
            No credit card · No per-contact fees · You pay your provider directly
          </p>
        </div>

        {/* Product visual */}
        <div ref={dashboardRef} className="mt-14 sm:mt-20 max-w-6xl mx-auto">
          <div className="border-3 border-brutal-fg bg-white shadow-brutal overflow-hidden">
            {/* Window chrome */}
            <div className="border-b-3 border-brutal-fg bg-brutal-surface px-4 py-2 flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-red" />
                <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-yellow" />
                <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-green" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/40 flex-1 text-center">Veloce · Audience</span>
              <span className="text-[10px] font-mono text-brutal-muted hidden sm:inline">brod3000</span>
            </div>

            <div className="flex flex-col sm:flex-row min-h-[340px] sm:min-h-[440px]">
              {/* Sidebar */}
              <div className="w-full sm:w-52 shrink-0 border-b-3 sm:border-b-0 sm:border-r-3 border-brutal-fg bg-brutal-fg text-white p-4 flex sm:block gap-1 overflow-x-auto">
                {[
                  { icon: BarChart3, label: 'Analytics' },
                  { icon: Users, label: 'Audience' },
                  { icon: Mail, label: 'Broadcasts' },
                  { icon: Share2, label: 'Capture forms' },
                  { icon: Activity, label: 'Automations' },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${item.label === 'Audience' ? 'bg-brutal-yellow/20 border-l-3 border-brutal-yellow' : 'opacity-60'}`}>
                    <item.icon size={14} aria-hidden="true" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content: the reachability view, because that is the thesis */}
              <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: 'In audience', short: 'Audience', value: 10310, tone: 'text-brutal-fg' },
                    { label: 'Reachable now', short: 'Reachable', value: 8642, tone: 'text-brutal-green' },
                    { label: 'Needs confirming', short: 'Confirming', value: 1204, tone: 'text-brutal-yellow-text' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="border-2 border-brutal-fg p-2 sm:p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">
                        <span className="sm:hidden">{kpi.short}</span>
                        <span className="hidden sm:inline">{kpi.label}</span>
                      </p>
                      <p className={`text-xl sm:text-2xl font-heading ${kpi.tone}`}><CountUp value={kpi.value} /></p>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-brutal-fg">
                  <div className="border-b-2 border-brutal-fg bg-brutal-surface px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Audience</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted truncate">Consent source</span>
                  </div>
                  {[
                    { name: 'ben@example.com', where: 'Austin, TX', state: 'Reachable', src: 'Capture form · 12 Mar', tone: 'text-brutal-green' },
                    { name: 'dana@example.com', where: 'Portland, OR', state: 'Reachable', src: 'CSV import · 04 Jan', tone: 'text-brutal-green' },
                    { name: 'sam@example.com', where: 'Denver, CO', state: 'Unconfirmed', src: 'Capture form · 28 Aug', tone: 'text-brutal-yellow-text' },
                    { name: 'rae@example.com', where: 'Austin, TX', state: 'Unsubscribed', src: 'Unsubscribed · 02 Sep', tone: 'text-brutal-red' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-brutal-fg/20 last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{row.name}</p>
                        <p className="text-[9px] text-brutal-muted truncate">{row.where}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${row.tone}`}>{row.state}</p>
                        <p className="text-[9px] text-brutal-muted hidden sm:block">{row.src}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 2. THE PROBLEM ════════════════════════════════
          Short by design. It exists to say why the product exists, then move on. */}
      <Section padding="py-14 sm:py-20" className="border-t-3 border-brutal-fg">
        <div className="max-w-2xl mx-auto space-y-5 text-center">
          <Badge variant="muted">The problem</Badge>
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Your audience is{' '}
            <span className="text-brutal-green">scattered.</span>
          </h2>
          <p className="text-base sm:text-lg text-brutal-fg/75 leading-relaxed">
            Names in one platform. Email addresses in another. Phone numbers in a
            spreadsheet. Consent somewhere else, if it was written down at all.
          </p>
          <p className="text-base sm:text-lg font-bold leading-relaxed">
            Veloce keeps the evidence together, so who you can contact stops being a guess.
          </p>
        </div>
      </Section>

      {/* ═══ 3. WHO / WHY / WHEN ═══════════════════════════
          The centre of the page. Deliberately unboxed: three ideas with room
          around them, rather than three more bordered cards. */}
      <Section id="features" className="bg-brutal-surface/40 border-t-3 border-brutal-fg">
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
          <div className="max-w-2xl space-y-5">
            <Badge variant="muted">What Veloce answers</Badge>
            <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Three questions,{' '}
              <span className="text-brutal-green">answered per person.</span>
            </h2>
          </div>

          <div className="grid gap-10 sm:gap-8 sm:grid-cols-3">
            {AUDIENCE_QUESTIONS.map((q) => (
              <div key={q.id} className="reveal-q space-y-3">
                <div className="flex items-center gap-2.5">
                  <q.icon size={20} className="text-brutal-green shrink-0" aria-hidden="true" />
                  <p className="font-heading text-3xl uppercase tracking-tight leading-none">{q.key}</p>
                </div>
                <div className="h-1 w-12 bg-brutal-yellow" aria-hidden="true" />
                <h3 className="text-base font-bold leading-snug">{q.question}</h3>
                <p className="text-sm text-brutal-fg/75 leading-relaxed">{q.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 4. REACHABILITY ═══════════════════════════════
          One of two dark sections on the page. Used here because this is the
          differentiated idea and deserves the strongest visual break. */}
      <Section className="bg-brutal-fg text-brutal-bg border-t-3 border-brutal-fg">
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          <div className="max-w-2xl space-y-5">
            <Badge variant="default">Reachability</Badge>
            <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              A list of 10,000 is not{' '}
              <span className="text-brutal-yellow">10,000 people you can email.</span>
            </h2>
            <p className="text-sm sm:text-base opacity-70 leading-relaxed">
              Being in your database is not the same as being contactable. Veloce works out
              who you can actually email today, and keeps the reason attached to each person.
              Consent is checked again when a broadcast goes out, so the number you see before
              you send is the number that gets sent to.
            </p>
          </div>

          <div className="grid gap-px sm:grid-cols-3 bg-brutal-bg/20 border-3 border-brutal-bg/20">
            {REACHABILITY_STATES.map((state) => (
              <div key={state.id} className="reveal-state bg-brutal-fg p-6 space-y-2.5">
                <span
                  className={`inline-block h-2.5 w-10 ${
                    state.tone === 'green' ? 'bg-brutal-green' : state.tone === 'yellow' ? 'bg-brutal-yellow' : 'bg-brutal-red'
                  }`}
                  aria-hidden="true"
                />
                <p className="font-heading text-2xl uppercase tracking-tight leading-none">{state.label}</p>
                <p className="text-xs opacity-70 leading-relaxed">{state.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 5. EVIDENCE ═══════════════════════════════════
          Outcome first. The feature is a consent ledger and a timeline; the
          promise is that you never have to guess why you may contact someone. */}
      <Section className="border-t-3 border-brutal-fg">
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">
          <div className="max-w-2xl space-y-5">
            <Badge variant="muted">Evidence</Badge>
            <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
              Never wonder why you have{' '}
              <span className="text-brutal-green">permission to contact someone.</span>
            </h2>
            <p className="text-base text-brutal-fg/70 leading-relaxed">
              Most tools store a yes. Veloce stores what they said yes to, where it happened
              and when, and everything that has happened since. If you are ever asked to prove
              it, the answer is already on the record.
            </p>
          </div>

          {/* One large product visual rather than several small ones */}
          <div className="border-3 border-brutal-fg bg-white shadow-brutal">
            <div className="border-b-3 border-brutal-fg bg-brutal-surface px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 border-2 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-heading text-lg uppercase shrink-0">B</div>
                <div className="min-w-0">
                  <p className="font-heading text-lg uppercase leading-none truncate">Ben Rodriguez</p>
                  <p className="text-[10px] text-brutal-muted uppercase tracking-wider truncate">ben@example.com</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-green border-2 border-brutal-green px-2 py-1 shrink-0">Reachable</span>
            </div>

            <div className="grid lg:grid-cols-2">
              {/* Consent */}
              <div className="p-5 sm:p-7 space-y-4 border-b-3 lg:border-b-0 lg:border-r-3 border-brutal-fg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Why you may contact them</p>
                <div className="border-l-3 border-brutal-green pl-4 space-y-1">
                  <p className="text-sm leading-relaxed">
                    &ldquo;Yes, email me about events and offers from South Congress Coffee.&rdquo;
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Agreed 12 March 2026</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs pt-1">
                  {[
                    ['Source', 'Capture form, footer'],
                    ['Confirmed', 'Yes, 12 March'],
                    ['Consent version', 'v2'],
                    ['Location', 'Austin, TX'],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">{k}</dt>
                      <dd className="font-bold truncate">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Timeline */}
              <div className="p-5 sm:p-7 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">Everything that has happened since</p>
                <ol className="space-y-0">
                  {[
                    { when: '12 Mar', what: 'Signed up through the footer capture form' },
                    { when: '12 Mar', what: 'Confirmed their email address' },
                    { when: '02 Apr', what: 'Opened "Spring hours are changing"' },
                    { when: '02 Apr', what: 'Clicked through to the opening times page' },
                    { when: '19 Aug', what: 'Added to the Austin list' },
                  ].map((ev, i, arr) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <span className="w-2.5 h-2.5 bg-brutal-green mt-1.5" aria-hidden="true" />
                        {i < arr.length - 1 && <span className="w-px flex-1 bg-brutal-fg/20" aria-hidden="true" />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-xs font-bold leading-snug">{ev.what}</p>
                        <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">{ev.when}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ 6. CHANNELS AND PROVIDERS ═════════════════════ */}
      <Section padding="py-16 sm:py-20" className="bg-brutal-surface/40 border-t-3 border-brutal-fg">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="max-w-2xl space-y-5">
            <Badge variant="muted">Providers</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none">
              Your audience.{' '}
              <span className="text-brutal-green">Your sending account.</span>
            </h2>
            <p className="text-base text-brutal-fg/70 leading-relaxed">
              Veloce does not resell email and does not hold your sending hostage. Connect the
              provider you already use, and keep both your audience and your sending account
              on the day you decide to leave.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {PROVIDERS.map((p) => (
              <div key={p.label} className="border-2 border-brutal-fg bg-white px-4 py-2.5">
                <p className="text-xs font-bold uppercase tracking-wider">{p.label}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">{p.note}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t-2 border-brutal-fg/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted pt-3">Next on the roadmap</span>
            {PLANNED_CHANNELS.map((c) => (
              <span key={c} className="mt-3 border-2 border-dashed border-brutal-fg/40 text-brutal-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                {c}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ 7. HOW IT WORKS ═══════════════════════════════ */}
      <Section padding="py-16 sm:py-20" className="border-t-3 border-brutal-fg">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-5">
            <Badge variant="muted">Getting started</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none max-w-xl">
              How it{' '}
              <span className="text-brutal-green">works.</span>
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.id} className="reveal-step space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/55">{step.number}</p>
                <div className="flex items-center gap-2">
                  <step.icon size={18} className="text-brutal-green shrink-0" aria-hidden="true" />
                  <h3 className="font-heading text-2xl uppercase tracking-tight leading-none">{step.title}</h3>
                </div>
                <p className="text-sm text-brutal-fg/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

        </div>
      </Section>

      {/* ═══ 8. FINAL CTA ══════════════════════════════════ */}
      <Section padding="py-20 sm:py-24" className="border-t-3 border-brutal-fg bg-brutal-fg text-brutal-bg">
        <div className="text-center space-y-7 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Own the list.{' '}
            <span className="text-brutal-yellow">Know why you can use it.</span>
          </h2>
          <p className="text-sm sm:text-base opacity-70 leading-relaxed max-w-lg mx-auto">
            Free to start. You connect your own provider and pay them directly for what you send.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 items-stretch sm:items-center">
            <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
              Create Free Account
            </Btn>
            <Btn variant="ghostOnDark" size="lg" onClick={() => navigate('/demo')}>
              See the live demo
            </Btn>
          </div>
          <Annotation className="justify-center !text-brutal-bg/50">no credit card · no monthly fees · bring your own Resend, SES or SendGrid</Annotation>
        </div>
      </Section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t-3 border-brutal-fg bg-brutal-surface-dark/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="font-heading text-xl uppercase tracking-wider hover:text-brutal-green transition-colors">Veloce</Link>
              <p className="text-[10px] text-brutal-muted mt-2 leading-relaxed max-w-[180px]">
                The platform for businesses that want to own their audience instead of renting it.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="https://github.com/benrod3000" target="_blank" rel="noopener noreferrer" className="text-brutal-muted hover:text-brutal-fg transition-colors" aria-label="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href="https://twitter.com/benrod3000" target="_blank" rel="noopener noreferrer" className="text-brutal-muted hover:text-brutal-fg transition-colors" aria-label="Twitter">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {FOOTER_LINKS.map((group) => (
              <div key={group.heading}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/40 mb-3">{group.heading}</p>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('http') ? (
                        <a href={link.href} target="_blank" rel="noopener" className="text-xs font-bold text-brutal-muted hover:text-brutal-fg transition-colors flex items-center gap-1.5">
                          {link.label}
                        </a>
                      ) : link.href.startsWith('#') ? (
                        <a href={link.href} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg transition-colors flex items-center gap-1.5">
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.href} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg transition-colors flex items-center gap-1.5">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t-2 border-brutal-fg/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">
              &copy; {new Date().getFullYear()} Veloce. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
