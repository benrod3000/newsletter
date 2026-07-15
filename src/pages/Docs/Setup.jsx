export default function Setup() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Setup Guide</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Configure your workspace and connect your email provider.</p>

      <Section title="SendGrid (Default)">
        <p>SendGrid is the default provider. The free tier includes 100 emails per day, which is plenty to start.</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Create a SendGrid account at <a href="https://sendgrid.com" className="text-brutal-green underline" target="_blank" rel="noopener">sendgrid.com</a></li>
          <li>Go to Settings → API Keys → Create API Key (Full Access)</li>
          <li>Copy the API key</li>
          <li>In Veloce, go to Settings → Email Provider → select SendGrid</li>
          <li>Paste your API key and save</li>
        </ol>
        <p className="text-sm text-brutal-fg/70 mt-2">Note: If you're using Veloce's free tier, your key is already configured.</p>
      </Section>

      <Section title="Amazon SES">
        <p>Amazon SES costs ~$1 per 10,000 emails sent. Requires an AWS account.</p>
        <ol className="text-sm text-brutal-fg/70 space-y-2 list-decimal list-inside">
          <li>Create an AWS account at <a href="https://aws.amazon.com" className="text-brutal-green underline" target="_blank" rel="noopener">aws.amazon.com</a></li>
          <li>Go to IAM → Users → Create a new user with Programmatic access</li>
          <li>Attach the policy <strong>AmazonSESFullAccess</strong></li>
          <li>Copy the Access Key ID and Secret Access Key</li>
          <li>Go to SES → Verified Identities → verify your sending email</li>
          <li>In Veloce, go to Settings → Email Provider → select Amazon SES</li>
          <li>Enter your AWS credentials, region, and verified from-email</li>
        </ol>
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
