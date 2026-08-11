import { useEffect } from 'react'

export default function Setup() {
  useEffect(() => { document.title = 'Setup Guide | Veloce' }, [])
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Setup Guide</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Configure your workspace and connect your email provider - Resend, SendGrid, or Amazon SES. You bring your own keys; Veloce never marks up your sending.</p>

      <Section title="Resend (Fastest to set up)">
        <p>Resend is the quickest way to start sending. The free tier includes 3,000 emails per month, then $0.001 per email.</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Create an account at <a href="https://resend.com" className="text-brutal-green underline" target="_blank" rel="noopener">resend.com</a> (free tier: 3,000 emails/month)</li>
          <li>Add and verify your sending domain in the Resend dashboard</li>
          <li>Create an API key with <strong>Sending access</strong> only (it starts with <strong>re_</strong>)</li>
          <li>In Veloce, go to Settings → Email Provider → select Resend</li>
          <li>Paste your API key and save</li>
        </ol>
        <p className="text-sm text-brutal-fg/70 mt-2">
          A Sending-access key cannot read your contacts or change your account, which is all Veloce needs it to do.
        </p>
      </Section>

      <Section title="SendGrid">
        <p>The SendGrid free tier includes 100 emails per day, which is plenty to start. You will need your own key - Veloce does not send on a shared SendGrid account.</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Create a SendGrid account at <a href="https://sendgrid.com" className="text-brutal-green underline" target="_blank" rel="noopener">sendgrid.com</a></li>
          <li>Go to Settings → API Keys → Create API Key</li>
          <li>Choose <strong>Restricted Access</strong> and enable only <strong>Mail Send</strong>. Leave every other permission off.</li>
          <li>Copy the API key (it starts with <strong>SG.</strong>)</li>
          <li>In Veloce, go to Settings → Email Provider → select SendGrid</li>
          <li>Paste your API key and save</li>
        </ol>
        <p className="text-sm text-brutal-fg/70 mt-2">
          Do not use a Full Access key. Full Access can read your contacts, alter your account and billing, and create further keys - none of which is needed to send a campaign. Restricted Access with Mail Send is the whole job.
        </p>
      </Section>

      <Section title="Amazon SES (Cheapest at volume)">
        <p>Amazon SES costs ~$1 per 10,000 emails sent - the cheapest option once you're sending at scale. Requires an AWS account.</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Create an AWS account at <a href="https://aws.amazon.com" className="text-brutal-green underline" target="_blank" rel="noopener">aws.amazon.com</a></li>
          <li>Go to IAM → Users → Create a new user with Programmatic access</li>
          <li>Attach an inline policy allowing only sending, rather than <strong>AmazonSESFullAccess</strong>:</li>
        </ol>
        <pre className="mt-2 overflow-x-auto border-3 border-brutal-fg bg-brutal-surface-dark/40 p-3 text-[11px] leading-relaxed">
{`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ses:SendEmail", "ses:SendRawEmail"],
    "Resource": "*"
  }]
}`}
        </pre>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside mt-2" start={4}>
          <li>Copy the Access Key ID and Secret Access Key</li>
          <li>Go to SES → Verified Identities → verify your sending email</li>
          <li>In Veloce, go to Settings → Email Provider → select Amazon SES</li>
          <li>Enter your AWS credentials, region, and verified from-email</li>
        </ol>
        <p className="text-sm text-brutal-fg/70 mt-2">
          <strong>AmazonSESFullAccess</strong> additionally allows deleting verified identities, changing your sending configuration, and reading your send statistics. Veloce only ever calls the two send actions above.
        </p>
      </Section>

      <Section title="Custom Domain">
        <p>You can configure a custom sender name and email address in Settings. This changes the "From" name your recipients see.</p>
      </Section>

      <Section title="Widget Setup">
        <p>To collect subscribers from your website:</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Go to <strong>Widgets → + New Widget</strong></li>
          <li>Choose a widget type (newsletter signup, lead magnet, event RSVP, etc.)</li>
          <li>Customize the fields and styling</li>
          <li>Copy the embed code and paste it on your website</li>
        </ol>
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
