import { useEffect } from 'react'

export default function Security() {
  useEffect(() => { document.title = 'Security | Veloce' }, [])
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Security & Privacy</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />

      <Section title="Data Protection">
        <ul className="text-sm text-brutal-fg/70 space-y-2">
          <li><strong>Encryption at rest</strong>: All subscriber data is stored in a Supabase PostgreSQL database with encryption at rest.</li>
          <li><strong>Encryption in transit</strong>: All API traffic uses TLS 1.3. No plaintext HTTP.</li>
          <li><strong>Password security</strong>: Passwords are hashed with PBKDF2 before storage. We never see or store raw passwords.</li>
          <li><strong>JWT authentication</strong>: All API requests are authenticated with signed JWTs. Tokens expire after 30 days.</li>
        </ul>
      </Section>

      <Section title="Multi-Tenant Isolation">
        <p className="text-sm text-brutal-fg/70">Every database query is scoped to the authenticated workspace. A workspace can never access another workspace's subscribers, campaigns, or settings. This is verified at the application layer on every request.</p>
      </Section>

      <Section title="Rate Limiting">
        <p className="text-sm text-brutal-fg/70">Authentication endpoints are rate-limited to prevent abuse:</p>
        <ul className="text-sm text-brutal-fg/70 space-y-1 list-disc list-inside">
          <li>Login: 5 attempts per minute per IP</li>
          <li>Signup: 3 attempts per minute per IP</li>
          <li>Password reset: 3 attempts per minute per IP</li>
        </ul>
      </Section>

      <Section title="Sending Limits">
        <p className="text-sm text-brutal-fg/70">Workspaces have configurable monthly sending limits to prevent abuse. Contact us to adjust your limits.</p>
      </Section>

      <Section title="Email Compliance">
        <p className="text-sm text-brutal-fg/70">Every email includes:</p>
        <ul className="text-sm text-brutal-fg/70 space-y-1 list-disc list-inside">
          <li><strong>One-click unsubscribe</strong>: RFC 8058 compliant List-Unsubscribe header</li>
          <li><strong>Unsubscribe link</strong>: Token-based, works without authentication</li>
          <li><strong>Sender identification</strong>: Clear from name and address</li>
          <li><strong>Physical address</strong>: Configured per workspace</li>
        </ul>
      </Section>

      <Section title="GDPR & Privacy">
        <p className="text-sm text-brutal-fg/70">Subscribers can request data export or deletion at any time. Workspace operators have GDPR-compliant tools to manage subscriber data. See our <a href="/privacy" className="text-brutal-green underline">Privacy Policy</a> for details.</p>
      </Section>

      <Section title="Audit Logging">
        <p className="text-sm text-brutal-fg/70">All subscriber data exports and deletions are logged with timestamps, admin identity, and action details for compliance purposes.</p>
      </Section>
    </article>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-2xl uppercase tracking-wide">{title}</h2>
      <div className="h-px bg-brutal-fg/10" />
      {children}
    </div>
  )
}
