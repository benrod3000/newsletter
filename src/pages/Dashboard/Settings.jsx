import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { brandingAPI, automationsAPI } from '../../lib/api'

export default function SettingsPage() {
  const { workspaceId } = useAuthStore()
  const [activeTab, setActiveTab] = useState('branding')
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState({
    logo_url: '',
    brand_colors: { primary: '#f59e0b', secondary: '#18181b' },
    custom_domain: '',
    sender_name: '',
    sender_email: '',
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
      alert('Branding updated successfully!')
    } catch (error) {
      console.error('Failed to update branding:', error)
      alert('Failed to update branding')
    } finally {
      setLoading(false)
    }
  }

  async function createAutomation() {
    if (!newAutomation.name.trim()) {
      alert('Please enter automation name')
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
      alert('Automation created successfully!')
    } catch (error) {
      console.error('Failed to create automation:', error)
      alert('Failed to create automation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-zinc-800">
        {['branding', 'automations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'branding' ? '🎨 Branding' : '⚙️ Automations'}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-xl font-semibold mb-4">Workspace Branding</h3>

            {/* Logo URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={branding.logo_url || ''}
                onChange={(e) =>
                  setBranding({ ...branding, logo_url: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
              {branding.logo_url && (
                <img
                  src={branding.logo_url}
                  alt="Logo preview"
                  className="mt-2 h-16 rounded"
                  onError={() => console.error('Logo failed to load')}
                />
              )}
            </div>

            {/* Sender Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Sender Name (for emails)
              </label>
              <input
                type="text"
                value={branding.sender_name || ''}
                onChange={(e) =>
                  setBranding({ ...branding, sender_name: e.target.value })
                }
                placeholder="e.g., My Newsletter"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>

            {/* Sender Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Sender Email (from address)
              </label>
              <input
                type="email"
                value={branding.sender_email || ''}
                onChange={(e) =>
                  setBranding({ ...branding, sender_email: e.target.value })
                }
                placeholder="noreply@example.com"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>

            {/* Custom Domain */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={branding.custom_domain || ''}
                onChange={(e) =>
                  setBranding({ ...branding, custom_domain: e.target.value })
                }
                placeholder="newsletter.yourdomain.com"
                className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Configure DNS CNAME for white-label branding
              </p>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['primary', 'secondary'].map((color) => (
                <div key={color}>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                      className="w-12 h-10 rounded cursor-pointer"
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
                      className="flex-1 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveBranding}
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Workflow Automations</h3>
            <button
              onClick={() => setShowNewAutomation(!showNewAutomation)}
              className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-black font-medium rounded"
            >
              + New Automation
            </button>
          </div>

          {/* New Automation Form */}
          {showNewAutomation && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 mb-6">
              <h4 className="font-semibold mb-4">Create New Automation</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Automation Name
                  </label>
                  <input
                    type="text"
                    value={newAutomation.name}
                    onChange={(e) =>
                      setNewAutomation({ ...newAutomation, name: e.target.value })
                    }
                    placeholder="e.g., Welcome Email"
                    className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                      className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    >
                      <option value="subscriber_joined">Subscriber Joined</option>
                      <option value="lead_magnet_claimed">Lead Magnet Claimed</option>
                      <option value="location_change">Location Changed</option>
                      <option value="custom_webhook">Custom Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
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
                      className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                    >
                      <option value="send_email">Send Email</option>
                      <option value="add_to_list">Add to List</option>
                      <option value="send_notification">Send Notification</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={createAutomation}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Automation'}
                  </button>
                  <button
                    onClick={() => setShowNewAutomation(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Automations List */}
          <div className="space-y-3">
            {automations.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-400">
                No automations yet. Create one to get started!
              </div>
            ) : (
              automations.map((auto) => (
                <div
                  key={auto.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{auto.name}</h4>
                      <p className="text-sm text-zinc-400 mt-1">
                        {auto.trigger_type} → {auto.action_type}
                      </p>
                      {auto.description && (
                        <p className="text-sm text-zinc-500 mt-1">
                          {auto.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          auto.is_active
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
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
