export default function DocsIntro() {
  return (
    <article className="space-y-6">
      <h1 className="text-4xl font-heading uppercase tracking-tight leading-none">Documentation</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70 leading-relaxed">
        Veloce is a simple newsletter platform for creators, communities, and small businesses who want to build an audience they own.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 pt-4">
        {[
          { title: 'Quickstart', desc: 'Send your first newsletter in under 10 minutes.', to: '/docs/quickstart' },
          { title: 'Setup Guide', desc: 'Connect your email provider and configure your workspace.', to: '/docs/setup' },
          { title: 'Security & Privacy', desc: 'How we protect your data and your subscribers.', to: '/docs/security' },
          { title: 'FAQ', desc: 'Common questions about Veloce.', to: '/docs/faq' },
        ].map((card) => (
          <a key={card.to} href={card.to} className="border-3 border-brutal-fg bg-white p-5 hover:shadow-brutal hover:-translate-y-0.5 transition block">
            <h2 className="font-heading text-lg uppercase tracking-wide">{card.title}</h2>
            <p className="text-xs text-brutal-muted mt-1 leading-relaxed">{card.desc}</p>
          </a>
        ))}
      </div>

      <Section title="What is Veloce?">
        <p className="text-sm text-brutal-fg/70 leading-relaxed">
          Veloce helps you write newsletters, manage your audience, and send to the people who actually matter. 
          Every subscriber includes location data automatically, so your campaigns reach the right people without extra work.
        </p>
      </Section>

      <Section title="Key Features">
        <ul className="text-sm text-brutal-fg/70 space-y-2">
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Newsletter Editor</strong> — Rich text editor with TipTap. Draft, preview, and schedule.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Audience Management</strong> — Import, export, tag, and search your subscribers.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Geo Targeting</strong> — Send by city, ZIP code, or radius. Know exactly who you're reaching.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Automations</strong> — Welcome drips, re-engagement, smart tagging. Simple if/then flows.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>SMS / RCS</strong> — Reach subscribers with phone consent via SMS or rich RCS messages.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Analytics</strong> — Opens, clicks, growth. See how your audience responds.</span></li>
          <li className="flex items-start gap-2"><span className="text-brutal-green mt-0.5">→</span> <span><strong>Newsletter Archive</strong> — Auto-publish sent newsletters to a public, SEO-friendly URL.</span></li>
        </ul>
      </Section>

      <Section title="Bring Your Own Provider">
        <p className="text-sm text-brutal-fg/70 leading-relaxed">
          Veloce works with your existing SendGrid or Amazon SES account. No vendor lock-in, no platform fees.
          You pay only for what your provider charges.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 pt-2">
      <h2 className="font-heading text-2xl uppercase tracking-wide">{title}</h2>
      <div className="h-px bg-brutal-fg/10" />
      {children}
    </div>
  )
}
