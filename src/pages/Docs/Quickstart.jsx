import { useEffect } from 'react'

export default function Quickstart() {
  useEffect(() => { document.title = 'Quickstart | Veloce' }, [])
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Quickstart</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Send your first newsletter in under 10 minutes.</p>

      <Step number={1} title="Create an account">
        <p>Sign up at <a href="/signup" className="text-brutal-green underline">newsletter.brod3000.com/signup</a>. No credit card required. You'll get a free workspace immediately.</p>
      </Step>

      <Step number={2} title="Connect your email provider">
        <p>Go to <strong>Settings → Email Provider</strong>. Choose Resend, SendGrid, or Amazon SES. Enter your API key or SES credentials. Save and click "Test Provider" to verify everything works.</p>
      </Step>

      <Step number={3} title="Add subscribers">
        <p>Three ways to build your audience:</p>
        <ul className="text-sm text-brutal-fg/70 space-y-1 list-disc list-inside">
          <li><strong>Import CSV</strong>: Upload a spreadsheet with email addresses</li>
          <li><strong>Widget</strong>: Embed a signup form on any website</li>
          <li><strong>Add manually</strong>: Enter an email address directly</li>
        </ul>
      </Step>

      <Step number={4} title="Write your first newsletter">
        <p>Go to <strong>Newsletters → + New Newsletter</strong>. Write your subject line, choose your audience, and compose your message using the built-in editor. Add merge tags like <code className="bg-brutal-surface px-1 text-[11px]">{'{{first_name}}'}</code> for personalization.</p>
      </Step>

      <Step number={5} title="Send">
        <p>Click <strong>Write & Send</strong>. Your newsletter will be delivered to your audience. Track opens and clicks from the analytics page.</p>
      </Step>
    </article>
  )
}

function Step({ number, title, children }) {
  return (
    <div className="border-l-3 border-brutal-fg pl-5 space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 border-2 border-brutal-fg bg-brutal-yellow flex items-center justify-center font-heading text-sm shrink-0">{number}</span>
        <h2 className="font-heading text-xl uppercase tracking-wide">{title}</h2>
      </div>
      <div className="text-sm text-brutal-fg/70 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}
