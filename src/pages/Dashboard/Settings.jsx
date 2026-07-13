import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { brandingAPI, automationsAPI } from '../../lib/api'
import { useToast } from '../../components/Toast'

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

  useEffect(() => {
    if (workspaceId) {
      loadBranding()
      loadAutomations()
    }
  }, [workspaceId])

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
      <div className="flex border-brutal border-brutal-fg overflow-hidden mb-8">
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
          <div className="border-brutal border-brutal-fg bg-white p-8">
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
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
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
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
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
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
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
                className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
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
                  className="w-full sm:w-64 px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
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
                      <input
                        type="text"
                        value={branding.ses_access_key || ''}
                        onChange={(e) =>
                          setBranding({ ...branding, ses_access_key: e.target.value })
                        }
                        placeholder="AKIA..."
                        className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                        AWS Secret Access Key
                      </label>
                      <input
                        type="password"
                        value={branding.ses_secret_key || ''}
                        onChange={(e) =>
                          setBranding({ ...branding, ses_secret_key: e.target.value })
                        }
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                      />
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
                        className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
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
                        className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
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
                      className="w-12 h-10 border-brutal border-brutal-fg cursor-pointer"
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
                      className="flex-1 px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg font-mono text-sm focus:outline-none focus:bg-brutal-yellow/10"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveBranding}
              disabled={loading}
              className="px-6 py-3 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-2xl uppercase tracking-wide">Workflow Automations</h3>
            <button
              onClick={() => setShowNewAutomation(!showNewAutomation)}
              className="px-4 py-2 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
            >
              + New Automation
            </button>
          </div>

          {/* New Automation Form */}
          {showNewAutomation && (
            <div className="border-brutal border-brutal-fg bg-white p-8 mb-8">
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
                    className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      Trigger Type
                    </label>
                    <select
                      value={newAutomation.trigger_type}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          trigger_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
                    >
                      <option value="subscriber_joined">Subscriber Joined</option>
                      <option value="lead_magnet_claimed">Lead Magnet Claimed</option>
                      <option value="location_change">Location Changed</option>
                      <option value="custom_webhook">Custom Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      Action Type
                    </label>
                    <select
                      value={newAutomation.action_type}
                      onChange={(e) =>
                        setNewAutomation({
                          ...newAutomation,
                          action_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-brutal-bg border-brutal border-brutal-fg text-sm font-bold focus:outline-none"
                    >
                      <option value="send_email">Send Email</option>
                      <option value="add_to_list">Add to List</option>
                      <option value="send_notification">Send Notification</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={createAutomation}
                    disabled={loading}
                    className="px-5 py-2.5 border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Automation'}
                  </button>
                  <button
                    onClick={() => setShowNewAutomation(false)}
                    className="px-5 py-2.5 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80"
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
              <div className="border-brutal border-brutal-fg bg-white p-8 text-center">
                <p className="font-bold text-brutal-muted uppercase tracking-wider text-sm">No automations yet. Create one to get started!</p>
              </div>
            ) : (
              automations.map((auto) => (
                <div
                  key={auto.id}
                  className="border-brutal border-brutal-fg bg-white p-5"
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
      )}
    </div>
  )
}
