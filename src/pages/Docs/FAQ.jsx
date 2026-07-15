export default function FAQ() {
  const faqs = [
    {
      q: 'How much does Veloce cost?',
      a: 'Veloce is free to start. You only pay for your email provider (SendGrid or AWS SES). SendGrid free tier includes 100 emails/day. SES costs about $1 per 10,000 emails.',
    },
    {
      q: 'Do I need a credit card?',
      a: 'No. Sign up and start sending immediately without entering payment information.',
    },
    {
      q: 'Can I use my own email provider?',
      a: 'Yes. Veloce supports both SendGrid and Amazon SES. Bring your own API keys with no vendor lock-in.',
    },
    {
      q: 'How is this different from Mailchimp?',
      a: 'Veloce is simpler, calmer, and built for people who want to own their audience without the complexity of enterprise marketing tools. No sales funnels, no landing page builders — just newsletters.',
    },
    {
      q: 'Can I import my existing subscribers?',
      a: 'Yes. Go to Audience → Import CSV. Your CSV needs an email column. Optional columns include first_name, last_name, phone_number, city, region, and more.',
    },
    {
      q: 'How does geo-targeting work?',
      a: 'When someone signs up via a widget, their location (city, state, ZIP, lat/lng) is captured automatically. You can filter by location or draw a radius on the map when creating a campaign.',
    },
    {
      q: 'Can I send SMS messages too?',
      a: 'Yes. The SMS/RCS panel lets you send text messages to subscribers with phone consent. RCS is supported on Android with SMS fallback on iOS.',
    },
    {
      q: 'What happens to unsubscribes?',
      a: 'When someone clicks unsubscribe, they are immediately removed from your audience. No data is retained. Bounces are handled automatically.',
    },
    {
      q: 'Can I export my data?',
      a: 'Yes. Export your subscribers as CSV at any time. Campaign data and analytics are also accessible.',
    },
    {
      q: 'Is Veloce GDPR-compliant?',
      a: 'Veloce provides GDPR-compliant tools including data export, deletion, and consent tracking. See our Privacy Policy for details.',
    },
  ]

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">FAQ</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border-3 border-brutal-fg bg-white p-5">
            <h3 className="font-heading text-lg uppercase tracking-wide">{faq.q}</h3>
            <p className="text-sm text-brutal-fg/70 mt-2 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </article>
  )
}
