export default function SubscriberDetailPanel({ subscriber, onClose, onRemove, onToggleList }) {
  if (!subscriber) return null

  const name = [subscriber.first_name, subscriber.last_name].filter(Boolean).join(' ')
  const location = [subscriber.city, subscriber.region, subscriber.country].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-brutal-fg/30" />
      <div
        className="relative w-full max-w-md bg-brutal-bg border-l-3 border-brutal-fg overflow-y-auto shadow-brutal animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-3 border-brutal-fg bg-brutal-yellow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1">Subscriber</p>
              <h2 className="font-heading text-2xl uppercase tracking-wide leading-none break-all">{subscriber.email}</h2>
              {name && <p className="text-sm font-bold mt-1">{name}</p>}
            </div>
            <button onClick={onClose} className="px-2 py-1 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-lg leading-none hover:opacity-80">×</button>
          </div>
          <span className={`inline-block mt-3 text-xs font-bold px-2 py-1 border border-brutal-fg ${
            subscriber.confirmed ? 'bg-brutal-green text-white' : 'bg-brutal-yellow text-brutal-fg'
          }`}>
            {subscriber.confirmed ? 'confirmed' : 'pending'}
          </span>
        </div>

        {/* Profile info */}
        <div className="p-6 space-y-5">
          <Section title="Profile">
            {subscriber.phone_number && <Row label="Phone" value={subscriber.phone_number} />}
            {subscriber.date_of_birth && <Row label="Date of Birth" value={subscriber.date_of_birth} />}
            {location && <Row label="Location" value={location} />}
            {subscriber.timezone && <Row label="Timezone" value={subscriber.timezone} />}
            <Row label="Joined" value={subscriber.created_at ? new Date(subscriber.created_at).toLocaleDateString() : '—'} />
          </Section>

          <Section title="Attribution">
            {subscriber.utm_source && <Row label="UTM Source" value={subscriber.utm_source} />}
            {subscriber.utm_medium && <Row label="UTM Medium" value={subscriber.utm_medium} />}
            {subscriber.utm_campaign && <Row label="UTM Campaign" value={subscriber.utm_campaign} />}
            {subscriber.referrer && <Row label="Referrer" value={subscriber.referrer} />}
            {!subscriber.utm_source && !subscriber.referrer && <p className="text-xs text-brutal-muted">No attribution data</p>}
          </Section>

          <Section title="Consent">
            <Row label="Email Marketing" value={subscriber.consent_email_marketing ? 'Yes' : 'No'} />
            <Row label="Analytics" value={subscriber.consent_analytics_tracking ? 'Yes' : 'No'} />
            {subscriber.suppressed && <Row label="Suppressed" value={subscriber.suppressed_reason || 'Yes'} />}
          </Section>
        </div>

        {/* Actions */}
        <div className="border-t-3 border-brutal-fg p-6 space-y-3 bg-white">
          <button
            onClick={() => onRemove(subscriber.id)}
            className="w-full px-4 py-3 border-3 border-brutal-fg bg-brutal-red text-white font-bold text-xs uppercase tracking-wider hover:opacity-80"
          >
            Remove Subscriber
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-2 border-b border-brutal-fg/20 pb-1">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-brutal-muted font-bold">{label}</span>
      <span className="text-brutal-fg font-bold">{value}</span>
    </div>
  )
}
