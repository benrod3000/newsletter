import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Btn from '../components/ui/Button'

export default function TermsPage() {
  useEffect(() => { document.title = 'Terms of Service | Veloce' }, [])
  const navigate = useNavigate()
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
          <p>Veloce is an email newsletter platform that provides subscriber management, campaign creation, geo-targeting, and analytics. You bring your own email sending provider (SendGrid or AWS SES). This platform is operated from California, USA.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">2. Eligibility</h2>
          <p>You must be at least 18 years old to use Veloce. By creating an account, you represent that you meet this requirement and that all information you provide is accurate.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">3. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You must notify us immediately of any unauthorized use.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">4. Your Obligations</h2>
          <p>When sending through Veloce, you agree to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Obtain proper consent from every email subscriber</li>
            <li>Obtain prior express written consent from SMS subscribers per TCPA requirements</li>
            <li>Include a working unsubscribe link in every email</li>
            <li>Include clear opt-out instructions ("Reply STOP to unsubscribe") in every SMS</li>
            <li>Identify yourself as the sender in all communications</li>
            <li>Comply with CAN-SPAM, TCPA, CTIA guidelines, California B&P Code § 17529, and all applicable laws</li>
            <li>Maintain your own sending infrastructure // SendGrid or SES for email, Twilio for SMS</li>
          </ul>

          <h2 className="font-heading text-2xl uppercase mt-8">5. Acceptable Use</h2>
          <p>You may not use Veloce for spam, phishing, fraud, harassment, hate speech, unsolicited SMS, malware distribution, or any illegal activity. We reserve the right to suspend or terminate accounts that violate these terms.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">5. SMS/MMS/RCS & 10DLC Compliance</h2>
          <p>Veloce provides the platform for SMS and RCS campaigns. You are responsible for registering your brand and campaign with The Campaign Registry (TCR) through your Twilio account. You must comply with all CTIA messaging guidelines, 10DLC requirements, and carrier regulations. Veloce is not responsible for carrier filtering, message blocking, or delivery failures due to non-compliance.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">6. Data Processing</h2>
          <p>Veloce acts as a data processor for subscriber information you collect. You are the data controller. We process data only in accordance with your instructions as the controller. By using Veloce, you enter into this Data Processing Agreement. You are responsible for providing your own privacy notice to your subscribers.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">7. Intellectual Property</h2>
          <p>You retain all rights to your content (newsletters, subscriber data, branding). Veloce retains rights to the platform software, design, and trademarks. You may not copy, modify, or reverse-engineer the platform.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">8. DMCA Notice</h2>
          <p>If you believe content on Veloce infringes your copyright, send a DMCA notice to: support@veloce.app. Include identification of the copyrighted work, the infringing material, your contact information, and a statement of good faith belief.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by California law, Veloce and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including but not limited to deliverability failures, data loss, or third-party service outages. Our total liability is limited to the amount you have paid us in the 12 months preceding the claim.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">10. Indemnification</h2>
          <p>You agree to indemnify and hold Veloce harmless from any claims, damages, or expenses arising from your use of the platform, your content, or your violation of these terms.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">11. Termination</h2>
          <p>You may delete your account at any time. We may terminate or suspend access for violations of these terms or extended inactivity. Upon termination, your data will be deleted within 30 days.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">12. Governing Law & Dispute Resolution</h2>
          <p>These terms are governed by the laws of the State of California and the United States. Any disputes shall be resolved through binding arbitration in California before a single arbitrator. Each party bears its own costs. You may opt out of this arbitration clause within 30 days of accepting these terms by emailing support@veloce.app.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">13. Changes to Terms</h2>
          <p>We may update these terms at any time. Material changes will be notified via email. Continued use after changes take effect constitutes acceptance.</p>

          <h2 className="font-heading text-2xl uppercase mt-8">14. Contact</h2>
          <p>For legal inquiries: support@veloce.app. Veloce is operated in California.</p>
        </div>
        <Btn variant="primary" size="lg" onClick={() => navigate('/')}>← Back to Home</Btn>
      </div>
    </div>
  )
}
