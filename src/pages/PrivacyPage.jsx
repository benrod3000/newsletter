import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      <div className="border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <Link to="/" className="font-heading text-2xl uppercase tracking-wider hover:text-brutal-green">Veloce</Link>
        </div>
      </div>
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-6">
        <h1 className="text-4xl font-heading uppercase tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-brutal-muted">Last updated: July 2026</p>
        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="font-heading text-2xl uppercase mt-8">1. Data We Collect</h2>
          <p>When you sign up for a newsletter through Veloce, we collect your email address and, with your consent, location data derived from your IP address (city, region, postal code). If you provide it, we also collect your first name, last name, and phone number.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">2. How We Use Your Data</h2>
          <p>Your data is used solely for the purpose of delivering the newsletter you subscribed to. Location data helps senders target campaigns geographically. We do not sell, rent, or share your personal information with third parties.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">3. Your Rights</h2>
          <p>You can unsubscribe at any time using the link in every email. You may request a full export or deletion of your data by contacting the newsletter sender directly. Veloce acts as a data processor on behalf of the newsletter operator (the data controller).</p>

          <h2 className="font-heading text-2xl uppercase mt-8">4. Cookies & Tracking</h2>
          <p>We use standard email tracking (opens and clicks) to help senders understand engagement. No third-party cookies are placed on your device. Widget forms use a single session cookie for spam prevention.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">5. Contact</h2>
          <p>For privacy inquiries, contact the newsletter operator directly. Veloce provides GDPR-compliant export and deletion tools to all workspace operators.</p>
        </div>
        <Link to="/" className="inline-block mt-8 px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase">← Back to Home</Link>
      </div>
    </div>
  )
}
