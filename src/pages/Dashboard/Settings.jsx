import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { brandingAPI, automationsAPI } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('branding')
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState({
    logo_url: '',
    brand_colors: { primary: '#f59e0b', secondary: '#18181b' },
    custom_domain: '',
    sender_name: '',
    sender_email: '',
    email_provider: 'sendgrid',
    ses_region: 'us-east-1',
    ses_access_key: '',
    ses_secret_key: '',
    ses_from_email: '',
  })
  const [automations, setAutomations] = useState([])
  const [showNewAutomation, setShowNewAutomation] = useState(false)
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger_type: 'subscriber_joined',
    action_type: 'send_email',
  })
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  // Smart tag history
  const [smartTags, setSmartTags] = useState([])
  const [smartTagsLoading, setSmartTagsLoading] = useState(false)
  const [smartTagsRunning, setSmartTagsRunning] = useState(false)

  // Auto-clean activity log
  const [activityLog, setActivityLog] = useState([])
  const [activityLogLoading, setActivityLogLoading] = useState(false)

  useEffect(() => {
    if (workspaceId) {
    document.title = 'Settings | Veloce'
      loadBranding()
      loadAutomations()
      loadSmartTagHistory()
      loadActivityLog()
    }
  }, [workspaceId])

  async function loadSmartTagHistory() {
    setSmartTagsLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/automations/smart-tags/history`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}` }
      })
      const data = await res.json()
      setSmartTags(data.tags || [])
    } catch { setSmartTags([]) }
    finally { setSmartTagsLoading(false) }
  }

  async function runSmartTagsNow() {
    setSmartTagsRunning(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/admin/automations/smart-tags/run`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}` }
      })
      const data = await res.json()
      toast.addToast(`Smart tags evaluated: ${data.evaluated || 0} subscribers, ${data.tagged || 0} tagged`, 'success')
      loadSmartTagHistory()
    } catch { toast.addToast('Failed to run smart tags', 'error') }
    finally { setSmartTagsRunning(false) }
  }

  async function loadActivityLog() {
    setActivityLogLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'}/api/clients/${workspaceId}/automations/activity-log`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token}` }
      })
      const data = await res.json()
      setActivityLog(data.runs || [])
    } catch { setActivityLog([]) }
    finally { setActivityLogLoading(false) }
  }

  async function loadBranding() {
    try {
      const { data } = await brandingAPI.get(workspaceId)
      setBranding(data)
    } catch (error) {
      console.error('Failed to load branding:', error)
    }
  }

  async function loadAutomations() {
    try {
      const { data } = await automationsAPI.list(workspaceId)
      setAutomations(data.automations || [])
    } catch (error) {
      console.error('Failed to load automations:', error)
    }
  }

  async function saveBranding() {
    setLoading(true)
    try {
      const { data } = await brandingAPI.update(workspaceId, branding)
      setBranding(data)
      toast.addToast('Branding updated successfully!', 'success')
    } catch (error) {
      console.error('Failed to update branding:', error)
      toast.addToast('Failed to update branding', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createAutomation() {
    if (!newAutomation.name.trim()) {
      toast.addToast('Please enter automation name', 'warning')
      return
    }
    setLoading(true)
    try {
      await automationsAPI.create(workspaceId, {
        ...newAutomation,
        trigger_config: {},
        action_config: {},
      })
      setNewAutomation({
        name: '',
        trigger_type: 'subscriber_joined',
        action_type: 'send_email',
      })
      setShowNewAutomation(false)
      await loadAutomations()
      toast.addToast('Automation created successfully!', 'success')
    } catch (error) {
      console.error('Failed to create automation:', error)
      toast.addToast('Failed to create automation', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-4xl font-heading uppercase tracking-tight leading-none mb-8">
        <span className="text-brutal-green">Sett</span>ings
      </h2>

      {/* Tabs */}
      <div className="flex border-3 border-brutal-fg overflow-hidden mb-8">
        {['branding', 'automations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${
              activeTab === tab
                ? 'bg-brutal-yellow text-brutal-fg'
                : 'bg-white text-brutal-muted hover:text-brutal-fg'
            }`}
          >
            {tab === 'branding' ? 'Branding' : 'Automations'}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-8">
          <div className="border-3 border-brutal-fg bg-white p-8">
            <h3 className="font-heading text-2xl uppercase tracking-wide mb-6">Workspace Branding</h3>

            {/* Logo URL */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                value={branding.logo_url || ''}
                onChange={(e) =>
                  setBranding({ ...branding, logo_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
              {branding.logo_url && (
                <img
                  src={branding.logo_url}
                  alt="Logo preview"
                  className="mt-2 h-16 border border-brutal-fg"
                  onError={() => console.error('Logo failed to load')}
                />
              )}
            </div>

            {/* Sender Name */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                Sender Name (for emails)
              </label>
              <input
                type="text"
                value={branding.sender_name || ''}
                onChange={(e) =>
                  setBranding({ ...branding, sender_name: e.target.value })
                }
                placeholder="e.g., My Newsletter"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>

            {/* Sender Email */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                Sender Email (from address)
              </label>
              <input
                type="email"
                value={branding.sender_email || ''}
                onChange={(e) =>
                  setBranding({ ...branding, sender_email: e.target.value })
                }
                placeholder="noreply@example.com"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
            </div>

            {/* Custom Domain */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                Custom Domain
              </label>
              <input
                type="text"
                value={branding.custom_domain || ''}
                onChange={(e) =>
                  setBranding({ ...branding, custom_domain: e.target.value })
                }
                placeholder="newsletter.yourdomain.com"
                className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              />
              <p className="text-xs font-bold text-brutal-muted mt-1.5 uppercase tracking-wider">
                Configure DNS CNAME for white-label branding
              </p>
            </div>

            {/* Email Provider */}
            <div className="mb-6 border-t border-brutal-fg pt-6">
              <h4 className="font-heading text-lg uppercase tracking-wide mb-4">Email Provider</h4>

              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                  Provider
                </label>
                <select
                  value={branding.email_provider || 'sendgrid'}
                  onChange={(e) =>
                    setBranding({ ...branding, email_provider: e.target.value })
                  }
                  className="w-full sm:w-64 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
                >
                  <option value="sendgrid">SendGrid (default)</option>
                  <option value="ses">Amazon SES ($1/10K emails)</option>
                </select>
                <p className="text-xs font-bold text-brutal-muted mt-1.5 uppercase tracking-wider">
                  {branding.email_provider === 'ses'
                    ? 'Amazon SES costs ~$1 per 10,000 emails sent'
                    : 'SendGrid free tier: 100 emails/day'}
                </p>
              </div>

              {branding.email_provider === 'ses' && (
                <>
                  {/* AWS Setup Instructions */}
                  <div className="border border-brutal-fg bg-brutal-yellow/20 p-4 mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2">
                      📋 AWS Setup Instructions (takes ~10 minutes)
                    </p>
                    <ol className="text-sm text-brutal-fg/80 space-y-1 list-decimal list-inside">
                      <li>Create an AWS account at <a href="https://aws.amazon.com" target="_blank" rel="noopener" className="underline font-bold">aws.amazon.com</a></li>
                      <li>Go to IAM → Users → Create a new user with <strong>Programmatic access</strong></li>
                      <li>Attach the policy <strong>AmazonSESFullAccess</strong></li>
                      <li>Copy the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong></li>
                      <li>Go to SES → Verified Identities → verify your sending email</li>
                      <li>Paste the keys below and save</li>
                    </ol>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                        AWS Access Key ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showAccessKey ? 'text' : 'password'}
                          value={branding.ses_access_key || ''}
                          onChange={(e) =>
                            setBranding({ ...branding, ses_access_key: e.target.value })
                          }
                          placeholder="AKIA..."
                          className="flex-1 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccessKey(!showAccessKey)}
                          className="px-3 border-3 border-brutal-fg bg-white hover:bg-brutal-yellow transition"
                          aria-label={showAccessKey ? 'Hide key' : 'Show key'}
                        >
                          {showAccessKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                        AWS Secret Access Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type={showSecretKey ? 'text' : 'password'}
                          value={branding.ses_secret_key || ''}
                          onChange={(e) =>
                            setBranding({ ...branding, ses_secret_key: e.target.value })
                          }
                          placeholder="••••••••"
                          className="flex-1 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="px-3 border-3 border-brutal-fg bg-white hover:bg-brutal-yellow transition"
                          aria-label={showSecretKey ? 'Hide key' : 'Show key'}
                        >
                          {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                        SES Region
                      </label>
                      <select
                        value={branding.ses_region || 'us-east-1'}
                        onChange={(e) =>
                          setBranding({ ...branding, ses_region: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">EU (Ireland)</option>
                        <option value="eu-central-1">EU (Frankfurt)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                        SES Verified From Email
                      </label>
                      <input
                        type="email"
                        value={branding.ses_from_email || ''}
                        onChange={(e) =>
                          setBranding({ ...branding, ses_from_email: e.target.value })
                        }
                        placeholder="noreply@yourdomain.com"
                        className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                      />
                      <p className="text-xs font-bold text-brutal-muted mt-1">
                        Must be verified in AWS SES console
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              {['primary', 'secondary'].map((color) => (
                <div key={color}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    {color === 'primary' ? 'Primary Color' : 'Secondary Color'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={branding.brand_colors[color]}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          brand_colors: {
                            ...branding.brand_colors,
                            [color]: e.target.value,
                          },
                        })
                      }
                      className="w-12 h-10 border-3 border-brutal-fg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.brand_colors[color]}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          brand_colors: {
                            ...branding.brand_colors,
                            [color]: e.target.value,
                          },
                        })
                      }
                      className="flex-1 px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg font-mono text-sm focus:outline-none focus:bg-brutal-yellow/10"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveBranding}
              disabled={loading}
              className="px-6 py-3 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-2xl uppercase tracking-wide mb-1">Smart Automations</h3>
            <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Toggle on. They just work. Toggle off anytime.</p>
          </div>

          {/* Pre-built automation toggle cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                id: 'confirm-remind',
                icon: '📬',
                title: 'Confirm & Remind',
                desc: 'Reminds unconfirmed subscribers after 48 hours. Removes them after 7 days.',
                status: 'Keeps your list clean automatically.',
              },
              {
                id: 'auto-clean',
                icon: '🧹',
                title: 'Auto-Clean Cold Subs',
                desc: 'Moves cold subscribers (60+ days) to a Cold Leads list. Removes after 90 days.',
                status: 'Improves deliverability by removing dead addresses.',
              },
              {
                id: 'smart-tags',
                icon: '🏷️',
                title: 'Smart Auto-Tagging',
                desc: 'Labels subscribers as engaged, clicker, slipping, mobile, weekend-reader.',
                status: 'Builds segments without lifting a finger.',
              },
              {
                id: 'welcome-drip',
                icon: '👋',
                title: 'Welcome Drip',
                desc: 'Sends 3 emails over 7 days to new subscribers. Pre-written, ready to go.',
                status: '3× higher open rates than regular campaigns.',
              },
              {
                id: 'weekly-report',
                icon: '📊',
                title: 'Weekly List Health Report',
                desc: 'Every Monday at 8am, get a summary of list health + actionable tips.',
                status: 'Catch problems before they hurt your deliverability.',
              },
              {
                id: 're-engagement',
                icon: '🔄',
                title: 'Re-Engagement Rescue',
                desc: 'When subscribers go quiet, sends win-back emails to bring them back.',
                status: 'Coming soon.',
                disabled: true,
              },
            ].map((auto) => (
              <div key={auto.id} className={`border-3 border-brutal-fg bg-white p-5 flex flex-col ${auto.disabled ? 'opacity-50' : 'hover:shadow-brutal transition'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl shrink-0">{auto.icon}</span>
                  <div>
                    <h4 className="font-heading text-lg uppercase tracking-wide leading-none">{auto.title}</h4>
                    <p className="text-xs text-brutal-muted mt-1 leading-relaxed">{auto.desc}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-brutal-fg/60 uppercase tracking-wider mb-3">{auto.status}</p>
                <div className="mt-auto pt-3 border-t border-brutal-fg/20 flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${auto.disabled ? 'text-brutal-muted' : 'text-brutal-green'}`}>
                    {auto.disabled ? '⏳ Coming Soon' : '✅ Active, runs daily'}
                  </span>
                  {auto.id === 'smart-tags' && (
                    <button
                      onClick={runSmartTagsNow}
                      disabled={smartTagsRunning}
                      className="px-2 py-1 border-2 border-brutal-fg bg-brutal-yellow text-[10px] font-bold uppercase tracking-wider hover:shadow-brutal transition disabled:opacity-50"
                    >
                      {smartTagsRunning ? 'Running...' : 'Run Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Smart Tags History */}
          <div className="border-3 border-brutal-fg bg-white p-5">
            <h4 className="font-heading text-lg uppercase tracking-wide mb-3">🏷️ Auto-Tags Applied</h4>
            {smartTagsLoading ? (
              <p className="text-xs text-brutal-muted font-bold">Loading tags...</p>
            ) : smartTags.length === 0 ? (
              <p className="text-xs text-brutal-muted font-bold">No auto-tags applied yet. Tags appear after smart tagging runs.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {smartTags.map((t) => (
                  <div key={t.tag} className="px-3 py-1.5 border-2 border-brutal-fg bg-brutal-yellow/20 text-xs font-bold flex items-center gap-2">
                    <span>{t.tag}</span>
                    <span className="text-brutal-muted text-[10px]">×{t.count}</span>
                    {t.lastApplied && <span className="text-brutal-muted text-[9px]">last {new Date(t.lastApplied).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Clean Activity Log */}
          <div className="border-3 border-brutal-fg bg-white p-5">
            <h4 className="font-heading text-lg uppercase tracking-wide mb-3">🧹 Auto-Clean Activity</h4>
            {activityLogLoading ? (
              <p className="text-xs text-brutal-muted font-bold">Loading activity...</p>
            ) : activityLog.length === 0 ? (
              <p className="text-xs text-brutal-muted font-bold">No auto-clean activity yet. Runs daily at 2am.</p>
            ) : (
              <div className="space-y-3">
                {activityLog.map((run, i) => (
                  <div key={i} className="border-l-3 border-brutal-fg pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold">{new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-brutal-green font-bold">🗑️ {run.deleted} deleted</span>
                    </div>
                    {run.details?.length > 0 && (
                      <p className="text-[10px] text-brutal-muted mt-0.5">{run.details.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t-3 border-brutal-fg pt-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-2xl uppercase tracking-wide">Custom Automations</h3>
              <button
                onClick={() => setShowNewAutomation(!showNewAutomation)}
                className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
              >
                + New Automation
              </button>
            </div>

          {/* New Automation Form */}
          {showNewAutomation && (
            <div className="border-3 border-brutal-fg bg-white p-8 mb-8">
              <h4 className="font-heading text-xl uppercase tracking-wide mb-6">Create New Automation</h4>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    value={newAutomation.name}
                    onChange={(e) =>
                      setNewAutomation({ ...newAutomation, name: e.target.value })
                    }
                    placeholder="e.g., Welcome Email"
                    className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      When should this run?
                    </label>
                    <select
                      value={newAutomation.trigger_type}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          trigger_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
                    >
                      <option value="subscriber_joined">When someone subscribes</option>
                      <option value="lead_magnet_claimed">When a lead magnet is downloaded</option>
                      <option value="location_change">When a subscriber moves locations</option>
                      <option value="custom_webhook">When an external app notifies us</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      What should happen?
                    </label>
                    <select
                      value={newAutomation.action_type}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          action_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-brutal-bg border-3 border-brutal-fg text-sm font-bold focus:outline-none"
                    >
                      <option value="send_email">Send an email</option>
                      <option value="add_to_list">Add to a list</option>
                      <option value="send_notification">Send a notification</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={createAutomation}
                    disabled={loading}
                    className="px-5 py-2.5 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Automation'}
                  </button>
                  <button
                    onClick={() => setShowNewAutomation(false)}
                    className="px-5 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Automations List */}
          <div className="space-y-4">
            {automations.length === 0 ? (
              <div className="border-3 border-brutal-fg bg-white p-8 text-center">
                <p className="font-bold text-brutal-muted uppercase tracking-wider text-sm">No automations yet. Create one to get started!</p>
              </div>
            ) : (
              automations.map((auto) => (
                <div
                  key={auto.id}
                  className="border-3 border-brutal-fg bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading text-lg uppercase tracking-wide">{auto.name}</h4>
                      <p className="text-sm text-brutal-muted mt-1">
                        {auto.trigger_type} → {auto.action_type}
                      </p>
                      {auto.description && (
                        <p className="text-sm text-brutal-muted mt-1">
                          {auto.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 border border-brutal-fg ${
                          auto.is_active
                            ? 'bg-brutal-green text-white'
                            : 'bg-brutal-bg text-brutal-muted'
                        }`}
                      >
                        {auto.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
