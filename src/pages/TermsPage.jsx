import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      <div className="border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3">
          <Link to="/" className="font-heading text-2xl uppercase tracking-wider hover:text-brutal-green">Veloce</Link>
        </div>
      </div>
      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-6">
        <h1 className="text-4xl font-heading uppercase tracking-tight">Terms of Service</h1>
        <p className="text-sm text-brutal-muted">Last updated: July 2026</p>
        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="font-heading text-2xl uppercase mt-8">1. Service Description</h2>
          <p>Veloce is an email marketing platform that provides widget-based subscriber collection, campaign management, and location-aware audience targeting. You bring your own email sending provider (SendGrid or AWS SES).</p>

          <h2 className="font-heading text-2xl uppercase mt-8">2. Your Responsibilities</h2>
          <p>You are responsible for obtaining proper consent from your subscribers, complying with CAN-SPAM, GDPR, and other applicable regulations, and maintaining your own sending infrastructure. Veloce does not send emails on your behalf using our infrastructure — you connect your own.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">3. Acceptable Use</h2>
          <p>You may not use Veloce for spam, phishing, hate speech, harassment, or any illegal activity. We reserve the right to suspend accounts that violate these terms.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">4. Limitation of Liability</h2>
          <p>Veloce is provided "as is" without warranty. We are not liable for damages arising from use of the platform, including but not limited to deliverability issues, data loss, or third-party service outages.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">5. Termination</h2>
          <p>You may stop using Veloce at any time. We may terminate or suspend access for violations of these terms or extended inactivity.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => window.location.href = '/'}>← Back to Home</Button>
      </div>
    </div>
  )
}
