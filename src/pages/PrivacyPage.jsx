import { Link } from 'react-router-dom'
import Btn from '../components/ui/Button'

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
          <h2 className="font-heading text-2xl uppercase mt-8">1. Who We Are</h2>
          <p>Veloce is an email newsletter platform operated in California. This policy explains how we handle personal information when you use our platform, whether you are a workspace operator or a newsletter subscriber.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">2. Information We Collect</h2>
          <p><strong>Account information:</strong> When you create an account, we collect your email address and workspace name. Passwords are hashed and never stored in plain text.</p>
          <p><strong>Subscriber information:</strong> When someone subscribes to a newsletter, we collect their email address and, with consent, approximate location (city, region, postal code derived from IP address). Optional fields include first name, last name, and phone number.</p>
          <p><strong>Usage data:</strong> Email opens, link clicks, and campaign engagement metrics.</p>
          <p><strong>Device data:</strong> IP address, browser type, and operating system for analytics and abuse prevention.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">3. How We Use Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Deliver newsletters and manage subscriptions</li>
            <li>Enable geo-targeted campaigns based on subscriber location</li>
            <li>Provide analytics to workspace operators</li>
            <li>Prevent abuse and enforce our terms</li>
            <li>Improve the platform</li>
          </ul>
          <p>We do not sell, rent, or share personal information with third parties for their own marketing purposes.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">4. California Privacy Rights (CCPA/CPRA)</h2>
          <p>If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Right to Know:</strong> Request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
            <li><strong>Right to Delete:</strong> Request deletion of personal information we have collected, subject to certain exceptions.</li>
            <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
            <li><strong>Right to Opt-Out:</strong> We do not sell personal information, but you have the right to opt out of any future sale.</li>
            <li><strong>Right to Limit Use:</strong> We do not use sensitive personal information for purposes beyond those authorized.</li>
            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of these rights.</li>
          </ul>
          <p>To exercise your California privacy rights, contact us at support@veloce.app. We will verify your identity before processing your request. You may also designate an authorized agent to make a request on your behalf.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">5. Data Retention</h2>
          <p>We retain subscriber data until the subscriber unsubscribes or the workspace operator deletes it. Account data is retained until the account is deleted. Deleted data is permanently removed within 30 days.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">6. Data Sharing</h2>
          <p>We share data only with:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Supabase</strong> (database hosting) — our infrastructure provider</li>
            <li><strong>SendGrid or AWS SES</strong> — your chosen email delivery provider</li>
            <li><strong>Vercel</strong> — hosting provider</li>
          </ul>
          <p>We require all third parties to maintain appropriate data protection standards.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">7. Cookies & Tracking</h2>
          <p>We use email tracking pixels (opens and clicks) to provide analytics to workspace operators. Widget forms use a single session cookie for spam prevention. We do not use third-party tracking cookies, advertising cookies, or cross-site tracking.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">8. Security</h2>
          <p>We implement reasonable security measures including encryption in transit (TLS 1.3), encryption at rest, PBKDF2 password hashing, JWT authentication, and rate limiting. No method of transmission over the internet is 100% secure.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">9. Your Choices</h2>
          <p>Subscribers can unsubscribe at any time using the link in every email. Workspace operators can export or delete subscriber data from the dashboard. You may request full account deletion by emailing support@veloce.app.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">10. Changes to This Policy</h2>
          <p>We will notify workspace operators of material changes via email. Subscribers will be notified via the newsletter operator. Continued use after changes constitutes acceptance.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">11. Contact</h2>
          <p>Privacy inquiries: support@veloce.app<br />Veloce is operated in California, USA.<br />Response time: within 45 days as required by California law.</p>
        </div>
        <Btn variant="primary" size="lg" onClick={() => window.location.href = '/'}>← Back to Home</Btn>
      </div>
    </div>
  )
}
