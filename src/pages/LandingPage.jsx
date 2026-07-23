import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useReveal, useScrollReveal, useTerminalReveal } from '../hooks/use-gsap.jsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Badge from '../components/ui/Badge'
import Btn from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import { Annotation, Section, CountUp } from '../components/ux'
import {
  NAV_ITEMS, STATS, TRUST_METRICS, TESTIMONIALS, PILLARS, FOOTER_LINKS,
} from './LandingPage/data'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

gsap.registerPlugin(ScrollTrigger)
import {
  MapPin, Mail, Zap, Target, Users, BarChart3,
  Menu, X, CheckCircle,
  Globe, ArrowRight,
  Share2, Activity, Radio, Smartphone, Clock,
  FileText, GitBranch, Monitor, UserCheck,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  useEffect(() => { document.title = 'Veloce · Own your audience. Reach them anywhere.' }, [])
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [liveStats, setLiveStats] = useState(null)
  const [ticker, setTicker] = useState(0)
  const heroRef = useRef(null)
  const statRef = useRef(null)
  const dashboardRef = useRef(null)
  const tickerRef = useRef(null)

  // Fetch live stats from public endpoint
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/public/stats`)
      const data = await res.json()
      setLiveStats(data)
      setTicker(prev => prev + 1)
      // GSAP pulse on the ticker
      if (tickerRef.current) {
        gsap.fromTo(tickerRef.current, { scale: 1 }, { scale: [1, 1.04, 1], duration: 0.3, ease: 'power2.inOut' })
      }
    } catch {} // silently fall back to static STATS
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const statsToShow = liveStats
    ? [
        { value: liveStats.total_subscribers, label: 'Subscribers', desc: 'Across email, SMS, and RCS channels.' },
        { value: liveStats.total_campaigns, label: 'Campaigns Sent', desc: `With ${liveStats.avg_open_rate}% average open rate.` },
        { value: `${liveStats.avg_open_rate}%`, label: 'Avg Open Rate', desc: 'Real people. Real engagement.' },
        { value: liveStats.automations_live, label: 'Automations Live', desc: 'Welcome drips, smart tags, auto-clean, and more.' },
      ]
    : STATS

  useReveal(heroRef, { stagger: 0.1, y: 20 })
  useReveal(statRef, { stagger: 0.06, y: 16, delay: 0.3 })
  useScrollReveal('.pillar-card', { stagger: 0.08, y: 30, start: 'top 90%' })
  useTerminalReveal('.annotation', { stagger: 0.08 })

  useEffect(() => {
    if (dashboardRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(dashboardRef.current,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: 'power3.out', scrollTrigger: { trigger: dashboardRef.current, start: 'top 92%', toggleActions: 'play none none none' } }
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

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t-3 border-brutal-fg bg-brutal-bg px-4 py-4 space-y-3 animate-fade-in">
            {NAV_ITEMS.map((item) => (
              <Link key={item.label} to={item.href} onClick={(e) => { setMobileOpen(false); if (item.href.startsWith('/#')) { e.preventDefault(); document.getElementById(item.href.slice(2))?.scrollIntoView({ behavior: 'smooth' }) } }} className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/70 hover:text-brutal-fg">{item.label}</Link>
            ))}
            <hr className="border-brutal-fg/15" />
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg">Sign In</Link>
            <Btn variant="primary" size="md" fullWidth onClick={() => { navigate('/signup'); setMobileOpen(false) }}>Create Free Account</Btn>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <Section className="bg-dots-light pt-28 sm:pt-36" id="main-content">
        <div ref={heroRef} className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          <Badge variant="yellow">Email + SMS + RCS + geo-targeting + automations</Badge>

          <h1 className="text-display leading-[0.85]">
            Stop Renting{' '}
            <span className="text-brutal-green">Your Audience.</span>
          </h1>

          <div className="h-2 w-24 bg-brutal-yellow border-2 border-brutal-fg" aria-hidden="true" />

          <p className="text-lg sm:text-xl text-brutal-fg/80 leading-relaxed max-w-2xl font-medium">
            Email, SMS, RCS, automation, geo-targeting, and subscriber intelligence // one platform.
          </p>

          <Annotation>audience ownership · byo email/SMS provider · free to start · no credit card</Annotation>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1 text-[10px] font-bold text-brutal-green uppercase tracking-wider"><CheckCircle size={12} aria-hidden="true" /> No per-contact fees</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-brutal-green uppercase tracking-wider"><CheckCircle size={12} aria-hidden="true" /> TLS 1.3 encrypted</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-brutal-green uppercase tracking-wider"><CheckCircle size={12} aria-hidden="true" /> Radius geo targeting</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
              Create Free Account
            </Btn>
            <Btn variant="secondary" size="lg" onClick={() => navigate('/demo')}>
              Watch Demo
            </Btn>
          </div>
          <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">No credit card required · No time limit · Bring your own SendGrid or SES</p>
        </div>
      </Section>

      {/* ═══ AUDIENCE OWNERSHIP ═══ */}
      <Section className="bg-brutal-fg text-brutal-bg">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
          <Badge variant="yellow">Your audience. Your data. Your rules.</Badge>
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Your audience{' '}
            <span className="text-brutal-yellow">belongs to you.</span>
          </h2>
          <p className="text-sm sm:text-base opacity-60 max-w-xl mx-auto leading-relaxed">
            Stop rebuilding your business every time an algorithm changes. Collect once. Reach everywhere. Never rent again.
          </p>

          {/* Flow diagram */}
          <div className="border-3 border-brutal-yellow bg-brutal-bg text-brutal-fg p-6 sm:p-8 max-w-xl mx-auto">
            {/* Social platforms row */}
            <div className="flex justify-center gap-4 sm:gap-6 flex-wrap">
              {['Facebook', 'Instagram', 'TikTok', 'YouTube'].map((p) => (
                <div key={p} className="border-2 border-brutal-fg px-3 py-2 text-[9px] font-bold uppercase tracking-wider">{p}</div>
              ))}
            </div>
            {/* Down arrows */}
            <div className="flex justify-center gap-4 sm:gap-6 mt-3 text-brutal-muted">
              {[1,2,3,4].map(i => <span key={i} className="text-sm">↓</span>)}
            </div>
            {/* Veloce hub */}
            <div className="border-3 border-brutal-green bg-brutal-green/10 p-4 mt-3">
              <p className="font-heading text-2xl uppercase tracking-wider">Veloce</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mt-1">Your audience. Your data. No algorithms.</p>
            </div>
            {/* Out arrows */}
            <div className="flex justify-center gap-4 sm:gap-6 mt-3 text-brutal-green">
              {[1,2,3,4].map(i => <span key={i} className="text-sm">↓</span>)}
            </div>
            {/* Channels row */}
            <div className="flex justify-center gap-4 sm:gap-6 flex-wrap mt-3">
              {['Email', 'SMS', 'RCS', 'Website'].map((ch) => (
                <div key={ch} className="border-2 border-brutal-green bg-brutal-green/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider">{ch}</div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ PROBLEM ═══ */}
      <Section className="bg-brutal-surface/20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="red">The Problem</Badge>
          <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none">
            Most platforms rent you your audience.{' '}
            <span className="text-brutal-green">Veloce gives you the keys.</span>
          </h2>
          <p className="text-base text-brutal-fg/70 max-w-2xl mx-auto leading-relaxed">
            You don't own your followers. Algorithms decide who sees your posts. 
            Email tools charge per contact, lock you in, and trap your data behind paywalls.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            {[
              { icon: Globe, title: 'Algorithm Dependent', desc: 'Social platforms decide who sees your content. You don\'t.' },
              { icon: FileText, title: 'Charged Per Contact', desc: 'Pay for subscribers you can\'t even reach. Most platforms do this.' },
              { icon: Clock, title: 'Locked In', desc: 'Your list. Your templates. Your data. Trapped behind their paywall.' },
            ].map((p) => (
              <div key={p.title} className="border-3 border-brutal-fg bg-white p-5 hover:shadow-brutal transition">
                <p.icon size={20} className="text-brutal-green mb-2" />
                <h3 className="font-heading text-lg uppercase tracking-wide">{p.title}</h3>
                <p className="text-xs text-brutal-muted mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-base font-medium text-brutal-fg/80 max-w-xl mx-auto">
            Veloce changes that. Own your audience. Reach them on email, SMS, or RCS. Your data. Your rules.
          </p>
        </div>
      </Section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <div ref={dashboardRef} className="-mt-10 sm:-mt-16 mb-20 sm:mb-28 relative z-10 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="border-3 border-brutal-fg bg-white shadow-brutal overflow-hidden">
          {/* Window chrome */}
          <div className="border-b-3 border-brutal-fg bg-brutal-surface px-4 py-2 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-red" />
              <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-yellow" />
              <span className="w-3 h-3 border-2 border-brutal-fg bg-brutal-green" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/40 flex-1 text-center">Veloce · Dashboard</span>
            <span className="text-[10px] font-mono text-brutal-muted">brod3000</span>
          </div>

          {/* Dashboard mockup */}
          <div className="flex flex-col sm:flex-row min-h-[280px] sm:min-h-[360px]">
            {/* Sidebar */}
            <div className="w-full sm:w-48 border-b-3 sm:border-b-0 sm:border-r-3 border-brutal-fg bg-brutal-fg text-white p-4 space-y-1">
              {[
                { icon: BarChart3, label: 'Analytics' },
                { icon: Mail, label: 'Campaigns' },
                { icon: Users, label: 'Subscribers' },
                { icon: Share2, label: 'Widgets' },
                { icon: Activity, label: 'Automations' },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${item.label === 'Campaigns' ? 'bg-brutal-yellow/20 border-l-3 border-brutal-yellow' : 'opacity-60 hover:opacity-100'} transition`}>
                  <item.icon size={14} />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 sm:p-6 space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Subscribers', value: 1892, change: '+12%', color: 'text-brutal-green' },
                  { label: 'Open Rate', value: 47, suffix: '%', change: '+3%', color: 'text-brutal-green' },
                  { label: 'Active Campaigns', value: 3, change: '--', color: 'text-brutal-fg' },
                ].map((kpi) => (
                  <div key={kpi.label} className="border-2 border-brutal-fg p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted">{kpi.label}</p>
                    <p className={`text-xl font-heading ${kpi.color}`}>
                      {typeof kpi.value === 'number' ? <><CountUp value={kpi.value} />{kpi.suffix || ''}</> : kpi.value}
                    </p>
                    <p className="text-[9px] font-bold text-brutal-green">{kpi.change}</p>
                  </div>
                ))}
              </div>

              {/* Table mockup */}
              <div className="border-2 border-brutal-fg">
                <div className="border-b-2 border-brutal-fg bg-brutal-surface px-3 py-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Recent Campaigns</span>
                  <span className="text-[8px] font-bold text-brutal-green">📍 Geo-targeted</span>
                </div>
                {[
                  { name: 'South Congress Sale', sent: '847', status: 'Sent', geo: 'Austin, TX / 5mi' },
                  { name: 'East Side Workshop', sent: '312', status: 'Scheduled', geo: 'Portland, OR / 10mi' },
                  { name: 'Weekend Special', sent: '--', status: 'Draft', geo: '--' },
                ].map((row) => (
                  <div key={row.name} className="flex items-center justify-between px-3 py-2 border-b border-brutal-fg/20 last:border-0">
                    <div>
                      <p className="text-xs font-bold">{row.name}</p>
                      <p className="text-[9px] text-brutal-muted">{row.geo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{row.sent}</p>
                      <span className={`text-[8px] font-bold uppercase ${row.status === 'Sent' ? 'text-brutal-green' : row.status === 'Scheduled' ? 'text-brutal-yellow-dark' : 'text-brutal-muted'}`}>{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ AUTOMATION FLOW ═══ */}
      <Section className="bg-brutal-surface/20">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <Badge variant="green">Automations</Badge>
          <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none">
            Relationships that{' '}
            <span className="text-brutal-green">run on their own.</span>
          </h2>
          <p className="text-sm text-brutal-fg/70 max-w-lg mx-auto leading-relaxed">
            Set it once. Automations run daily. Build relationships while you sleep.
          </p>
          {/* Flow diagram */}
          <div className="border-3 border-brutal-fg bg-white p-4 sm:p-6 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center">
              <div className="border-2 border-brutal-green bg-brutal-green/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-center min-w-[120px]">
                <UserCheck size={14} className="mx-auto mb-1" />
                Subscriber Joins
              </div>
              <span className="text-brutal-muted hidden sm:inline">→</span>
              <span className="text-brutal-muted text-[10px] sm:hidden">↓</span>
              <div className="border-2 border-brutal-green bg-brutal-green/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-center min-w-[120px]">
                <Mail size={14} className="mx-auto mb-1" />
                Welcome Email
              </div>
              <span className="text-brutal-muted hidden sm:inline">→</span>
              <span className="text-brutal-muted text-[10px] sm:hidden">↓</span>
              <div className="border-2 border-brutal-yellow px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-center min-w-[120px]">
                <Clock size={14} className="mx-auto mb-1" />
                Wait 2 Days
              </div>
            </div>
            {/* Branch */}
            <div className="border-t-2 border-brutal-fg/20 mt-4 pt-4">
              <p className="text-[8px] font-bold uppercase tracking-wider text-brutal-muted mb-3">Clicked A Link?</p>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <div className="border-2 border-brutal-green bg-brutal-green/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-center min-w-[120px]">
                  <CheckCircle size={14} className="mx-auto mb-1" />
                  Tag as Engaged
                </div>
                <span className="text-brutal-muted text-[10px]">or</span>
                <div className="border-2 border-brutal-yellow px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-center min-w-[120px]">
                  <Mail size={14} className="mx-auto mb-1" />
                  Send Reminder
                </div>
              </div>
            </div>
          </div>
          <Btn variant="primary" size="lg" icon={<ArrowRight size={14} />} onClick={() => navigate('/demo')}>
            See Automations in Action
          </Btn>
        </div>
      </Section>

      {/* ═══ SMS / RCS PHONE MOCKUP ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="yellow">Reach them anywhere</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none mt-4">
              One audience.{' '}
              <span className="text-brutal-green">Every channel.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Email on left */}
            <div className="border-3 border-brutal-fg bg-white p-5">
              <div className="border-b-2 border-brutal-fg/20 pb-2 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-brutal-green" />
                <p className="text-[9px] font-bold uppercase tracking-wider">Email Newsletter</p>
              </div>
              <p className="text-lg font-heading uppercase">Big News</p>
              <p className="text-xs text-brutal-muted mt-1 leading-relaxed">Hey Ben, your event at South Congress is coming up. We've got 47 subscribers within 5 miles ready to hear about it.</p>
              <div className="mt-3 border-2 border-brutal-fg bg-brutal-yellow px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-center">Learn More</div>
            </div>
            {/* Phone on right */}
            <div className="border-3 border-brutal-fg bg-brutal-fg p-3">
              <div className="bg-brutal-bg rounded p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-brutal-green" />
                  <p className="text-[8px] font-bold uppercase tracking-wider text-brutal-muted">SMS Preview</p>
                </div>
                <div className="bg-white border-2 border-brutal-fg p-3 max-w-[200px] mx-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 border-2 border-brutal-fg bg-brutal-green flex items-center justify-center text-[8px] font-bold text-white">V</div>
                    <div>
                      <p className="text-[9px] font-bold">Veloce</p>
                      <p className="text-[7px] text-brutal-muted">Now</p>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed">Hey Ben! Your event South Congress starts tomorrow. 47 locals are invited. See you there!</p>
                </div>
                <div className="text-center">
                  <div className="inline-block border-2 border-brutal-fg bg-white px-4 py-1.5 text-[8px] font-bold uppercase tracking-wider">Tap to Reply</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ PROBLEM STATEMENT ═══ */}
      <Section className="bg-brutal-surface/40 -mt-12">
        <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
          <Badge variant="green">The Problem</Badge>
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Sending emails{' '}
            <span className="text-brutal-green">to the wrong people?</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            {[
              { icon: Globe, title: 'Wrong audience', desc: 'Sending emails to people hundreds of miles away who will never show up.' },
              { icon: FileText, title: 'CSV tedium', desc: 'Uploading spreadsheets every week because your tool has no geo awareness.' },
              { icon: Clock, title: 'Overpaying', desc: 'Paying for contacts you cannot actually reach. Most platforms charge per contact, not per send.' },
            ].map((p) => (
              <Card key={p.title} padding="p-5">
                <p.icon size={20} className="text-brutal-green mb-2" />
                <h3 className="font-heading text-lg uppercase tracking-wide">{p.title}</h3>
                <p className="text-xs text-brutal-muted mt-1 leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
          <p className="text-base sm:text-lg text-brutal-fg/70 max-w-xl mx-auto font-medium">
            Veloce organizes your audience by location automatically. Every newsletter reaches the people who actually matter, without extra work.
          </p>
          <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
            Create Free Account
          </Btn>
        </div>
      </Section>
      {/* ═══ SUBSCRIBER INTELLIGENCE ═══ */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="green">Know Your Audience</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading uppercase tracking-tight leading-none mt-4">
              Every subscriber.{' '}
              <span className="text-brutal-green">A full picture.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Profile card */}
            <div className="border-3 border-brutal-fg bg-white p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-heading text-lg font-bold uppercase">B</div>
                <div>
                  <p className="font-heading text-lg uppercase">Ben Rodriguez</p>
                  <p className="text-[9px] text-brutal-muted uppercase tracking-wider">ben@example.com</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Location</p>
                  <p className="font-bold mt-0.5">📍 Austin, TX</p>
                </div>
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Status</p>
                  <p className="text-brutal-green font-bold mt-0.5">🟢 Active</p>
                </div>
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Channels</p>
                  <p className="font-bold mt-0.5">Email + SMS</p>
                </div>
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Last Open</p>
                  <p className="font-bold mt-0.5">3 hours ago</p>
                </div>
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Tags</p>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    <span className="text-[7px] bg-brutal-green/10 border border-brutal-green px-1 py-0.5 font-bold uppercase">engaged</span>
                    <span className="text-[7px] bg-brutal-yellow/20 border border-brutal-yellow px-1 py-0.5 font-bold uppercase">mobile</span>
                  </div>
                </div>
                <div className="border border-brutal-fg/20 p-2">
                  <p className="font-bold uppercase tracking-wider text-brutal-muted">Open Rate</p>
                  <p className="text-brutal-green font-bold mt-0.5">42%</p>
                </div>
              </div>
            </div>
            {/* What this means */}
            <div className="flex flex-col justify-center space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">Data you can act on</p>
              <h3 className="text-2xl sm:text-3xl font-heading uppercase tracking-tight leading-none">
                Know who they are.{' '}
                <span className="text-brutal-green">Know what they want.</span>
              </h3>
              <p className="text-sm text-brutal-fg/70 leading-relaxed">
                Location, engagement, devices, tags, acquisition source. Every subscriber has a full profile so you can target with precision.
              </p>
              <Btn variant="primary" size="md" icon={<ArrowRight size={14} />} onClick={() => navigate('/demo')}>
                Explore Subscriber Data
              </Btn>
            </div>
          </div>
        </div>
      </Section>
      {/* ═══ STATS STRIP ═══ */}
      <Section>
        <div ref={statRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {statsToShow.map((s) => (
            <Card key={s.label} hover padding="p-5 sm:p-6" className="text-center">
              <p className="text-stat text-brutal-green leading-none"><CountUp value={s.value} /></p>
              <p className="text-xs font-bold uppercase tracking-wider mt-2">{s.label}</p>
              <p className="text-[10px] text-brutal-muted mt-1 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
        <div ref={tickerRef} className="text-center mt-4">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-brutal-muted uppercase tracking-wider">
            <span className="inline-block w-1.5 h-1.5 bg-brutal-green rounded-full animate-pulse" />
            Live · Updated just now
          </span>
        </div>
      </Section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <Section className="border-t-3 border-brutal-fg">
        <div className="max-w-5xl mx-auto text-center space-y-8 sm:space-y-10">
          <Badge variant="green">Growing Audiences</Badge>

          {/* Trust metrics // big numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRUST_METRICS.map((m) => (
              <Card key={m.label} hover padding="p-5">
                <p className="text-stat text-brutal-green leading-none">{m.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted mt-1">{m.label}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm font-bold uppercase tracking-wider text-brutal-fg/40">
            {['Coffee Shops', 'Bands', 'Festivals', 'Nonprofits', 'Creators', 'Restaurants'].map((t) => (
              <span key={t} className="hover:text-brutal-fg transition-colors">{t}</span>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 text-left">
            {TESTIMONIALS.map((t) => (
              <Card key={t.author} padding="p-5 sm:p-6" className="relative">
                <span className="text-4xl font-heading text-brutal-green/20 absolute top-2 right-4 leading-none">"</span>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">"{t.quote}"</p>
                <div className="mt-4 border-t-2 border-brutal-fg/10 pt-3 flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-bold text-xs">{t.author.charAt(0)}</div>
                  <div>
                    <p className="text-xs font-bold">{t.author}</p>
                    <p className="text-[9px] text-brutal-muted uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══ PILLAR SECTIONS ═══ */}
      <div id="features" className="space-y-0">
        {PILLARS.map((pillar, i) => {
          const isReversed = i % 2 === 1
          const bgClass = i % 2 === 0 ? 'bg-brutal-bg border-t-3 border-brutal-fg' : 'bg-stripes border-t-3 border-brutal-fg'
          const Icon = pillar.icon

          return (
            <Section key={pillar.id} className={bgClass}>
              <div className={`max-w-5xl mx-auto flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 lg:gap-20 items-center`}>
                {/* Text side */}
                <div className="flex-1 space-y-4 sm:space-y-5">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/30">{pillar.number}</p>
                  <div className="flex items-center gap-3">
                    <Icon size={24} className="text-brutal-green" />
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading uppercase tracking-tight leading-none">{pillar.title}</h2>
                  </div>
                  {pillar.subtitle && <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted">{pillar.subtitle}</p>}
                  <p className="text-sm text-brutal-fg/70 leading-relaxed max-w-md">{pillar.body}</p>
                  <Btn variant="primary" size="lg" icon={<ArrowRight size={14} />} onClick={() => navigate(pillar.cta.to)}>
                    {pillar.cta.label}
                  </Btn>
                  <Annotation>{pillar.annotation}</Annotation>
                </div>

                {/* Visual side */}
                <div className="flex-1 w-full max-w-sm pillar-card">
                  {pillar.id === 'grow' && (
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
                        const btn = e.target.querySelector('button')
                        btn.textContent = '✓ Sent!'
                        setTimeout(() => { btn.textContent = 'Subscribe →' }, 3000)
                      } catch {}
                    }} className="border-3 border-brutal-fg bg-white shadow-brutal">
                      <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-4 py-3 flex items-center gap-2">
                        <Mail size={16} />
                        <p className="font-heading text-lg sm:text-xl uppercase">Get notified</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brutal-muted" />
                          <input type="text" defaultValue="Austin, TX" className="w-full pl-8 pr-3 py-2 border-3 border-brutal-fg bg-white text-xs focus:outline-none" readOnly />
                        </div>
                        <Input name="email" type="email" required placeholder="you@example.com" />
                        <Btn variant="primary" fullWidth size="md" type="submit" icon={<ArrowRight size={14} />}>
                          Subscribe
                        </Btn>
                        <p className="text-[9px] font-bold text-brutal-muted uppercase text-center flex items-center justify-center gap-1">
                          <MapPin size={10} /> Location captured automatically
                        </p>
                      </div>
                    </form>
                  )}

                  {pillar.id === 'target' && (
                    <div className="border-3 border-brutal-fg bg-white p-4 sm:p-5 shadow-brutal space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <MapPin size={16} className="text-brutal-green" />
                        <span>Subscribers near <span className="text-brutal-green">Austin, TX</span></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
                          <div className="absolute inset-0 rounded-full border border-brutal-fg/15" />
                          <div className="absolute inset-[20%] rounded-full border border-dashed border-brutal-fg/20" />
                          <div className="absolute inset-0 rounded-full border-3 border-brutal-green/40 animate-radar-1" />
                          <div className="absolute inset-0 rounded-full border-3 border-brutal-green/30 animate-radar-2" />
                          <div className="relative z-10 w-3 h-3 bg-brutal-green rounded-full border-2 border-brutal-fg" />
                        </div>
                        <div className="flex-1 space-y-2">
                          {[
                            { label: 'Within 5 mi', value: '124', color: 'bg-brutal-green' },
                            { label: 'Within 10 mi', value: '347', color: 'bg-brutal-yellow' },
                            { label: 'Within 25 mi', value: '892', color: 'bg-brutal-surface' },
                          ].map((r) => (
                            <div key={r.label} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 ${r.color} border border-brutal-fg`} />
                              <span className="text-[10px] text-brutal-muted flex-1">{r.label}</span>
                              <span className="text-xs font-bold">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t-2 border-brutal-fg/10 pt-3 flex items-center justify-between text-[10px]">
                        <span className="text-brutal-muted">Radius: <strong className="text-brutal-fg">10 mi</strong></span>
                        <span className="text-brutal-green font-bold flex items-center gap-1"><Radio size={12} /> 3,200 total reachable</span>
                      </div>
                    </div>
                  )}

                  {pillar.id === 'send' && (
                    <div className="border-3 border-brutal-fg bg-white shadow-brutal">
                      <div className="border-b-3 border-brutal-fg bg-brutal-bg px-3 py-2 flex flex-wrap gap-1 items-center">
                        {['B', 'I', 'H1', 'H2', '• List', '🔗'].map((b) => (
                          <span key={b} className="px-2 py-1 text-[10px] font-bold uppercase border-2 border-brutal-fg bg-white">{b}</span>
                        ))}
                        <span className="ml-auto px-2 py-1 text-[10px] font-bold uppercase border-2 border-brutal-fg bg-brutal-green text-white flex items-center gap-1">
                          <Mail size={10} /> {'{ }'} Tags
                        </span>
                      </div>
                      <div className="p-4 sm:p-5 min-h-[130px]">
                        <p className="text-xl sm:text-2xl font-bold">Hey <span className="text-brutal-green" id="merge-demo">Ben</span>! 👋</p>
                        <p className="text-sm text-brutal-muted mt-2">Your event at <strong id="location-demo">South Congress</strong> is coming up. We've got <strong id="count-demo">47</strong> subscribers within 5 miles ready to hear about it.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold text-brutal-green border-2 border-brutal-green px-2 py-0.5 flex items-center gap-1"><CheckCircle size={10} /> {'{{first_name}}'}</span>
                          <span className="text-[10px] font-bold text-brutal-yellow-dark border-2 border-brutal-yellow-dark px-2 py-0.5 flex items-center gap-1"><MapPin size={10} /> {'{{city}}'}</span>
                          <span className="text-[10px] font-bold text-brutal-muted border-2 border-brutal-muted px-2 py-0.5 flex items-center gap-1"><BarChart3 size={10} /> {'{{unsubscribe_url}}'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {pillar.id === 'automate' && (
                    <div className="border-3 border-brutal-fg bg-white p-4 sm:p-5 shadow-brutal space-y-3">
                      {[
                        { icon: Mail, label: 'Welcome Drip', desc: '3 emails over 7 days', active: true },
                        { icon: Clock, label: 'Re-Engagement', desc: 'Win-back after 60 days', active: true },
                        { icon: Activity, label: 'Smart Tagging', desc: 'Auto-label engaged vs cold', active: true },
                        { icon: Zap, label: 'Birthday Email', desc: 'Auto-send on subscriber DOB', active: false },
                      ].map((a) => (
                        <div key={a.label} className={`flex items-center justify-between border-2 border-brutal-fg p-3 ${a.active ? 'bg-white' : 'opacity-40'}`}>
                          <div className="flex items-center gap-3">
                            <a.icon size={16} className="text-brutal-green shrink-0" />
                            <div>
                              <p className="text-xs font-bold">{a.label}</p>
                              <p className="text-[9px] text-brutal-muted">{a.desc}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border border-brutal-fg ${a.active ? 'bg-brutal-green text-white' : 'bg-brutal-surface text-brutal-muted'}`}>
                            {a.active ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      ))}
                      <div className="border-t-2 border-brutal-fg/10 pt-2 flex items-center justify-between text-[10px]">
                        <span className="text-brutal-muted">Runs daily at 2am</span>
                        <span className="text-brutal-green font-bold">Toggle on. They run.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )
        })}
      </div>

      {/* ═══ FINAL CTA ═══ */}
      <Section className="border-t-3 border-brutal-fg bg-brutal-fg text-brutal-bg">
        <div className="text-center space-y-6 sm:space-y-8 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-heading uppercase tracking-tight leading-none">
            Ready to <span className="text-brutal-yellow">own your audience</span>?
          </h2>
          <p className="text-sm sm:text-base opacity-60 max-w-lg mx-auto leading-relaxed">
            No monthly fees. No per-contact charges. No algorithms deciding who sees your content. Just your audience, your data, your rules.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Btn variant="primary" size="lg" icon={<ArrowRight size={16} />} onClick={() => navigate('/signup')}>
              Create Free Account
            </Btn>
            <Btn variant="ghost" size="lg" onClick={() => navigate('/demo')}>
              Explore Live Demo
            </Btn>
          </div>
          <Annotation className="justify-center !text-brutal-bg/50">no credit card · no time limit · BYO SendGrid or SES</Annotation>
        </div>
      </Section>

      {/* ═══ INTEGRATIONS ═══ */}
      <Section className="border-t-3 border-brutal-fg bg-brutal-surface/40">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <Badge variant="muted">Works with your stack</Badge>
          <h2 className="text-2xl sm:text-3xl font-heading uppercase tracking-tight leading-none">
            Connect your tools.{' '}
            <span className="text-brutal-green">Keep your data.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-xl mx-auto">
            {[
              { label: 'SendGrid', icon: Mail },
              { label: 'AWS SES', icon: Globe },
              { label: 'Twilio', icon: Smartphone },
              { label: 'Supabase', icon: BarChart3 },
              { label: 'CSV Import', icon: FileText },
              { label: 'Zapier', icon: Zap },
              { label: 'WordPress', icon: Monitor },
              { label: 'Shopify', icon: Share2 },
              { label: 'Custom API', icon: GitBranch },
            ].map((i) => (
              <div key={i.label} className="border-2 border-brutal-fg bg-white px-3 py-2 flex items-center gap-1.5 hover:shadow-brutal transition">
                <i.icon size={14} className="text-brutal-muted" />
                <span className="text-[9px] font-bold uppercase tracking-wider">{i.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">More integrations shipping every month · Custom API for anything else</p>
        </div>
      </Section>

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
                          {link.icon && <link.icon size={12} />}
                          {link.label}
                        </a>
                      ) : link.href.startsWith('#') ? (
                        <a href={link.href} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg transition-colors flex items-center gap-1.5">
                          {link.icon && <link.icon size={12} />}
                          {link.label}
                        </a>
                      ) : (
                        <Link to={link.href} className="text-xs font-bold text-brutal-muted hover:text-brutal-fg transition-colors flex items-center gap-1.5">
                          {link.icon && <link.icon size={12} />}
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