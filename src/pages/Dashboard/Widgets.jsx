import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { widgetsAPI, listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'

const EMBED_BASE = 'https://newsletter.brod3000.com/w'

const DEFAULT_FORM = {
  name: '',
  slug: '',
  list_id: '',
  type: 'lead_magnet',
  size: 'medium',
  headline: 'Get the Free Download',
  description: 'Enter your email and we\'ll send you the download link.',
  download_url: '',
  button_text: 'Send Me the Link',
  success_message: 'Check your inbox! The download link is on its way.',
  placeholder: 'you@example.com',
  fields: { email: { required: true } },
  styles: { primary_color: '#f5e642', font_size: 'medium' },
}

const WIDGET_TYPES = [
  { value: 'lead_magnet', label: 'Lead Magnet', desc: 'Collects emails, sends a download link' },
  { value: 'newsletter', label: 'Newsletter Signup', desc: 'Simple email collection for newsletters' },
  { value: 'event_rsvp', label: 'Event RSVP', desc: 'Collects name + email for event registration' },
  { value: 'coupon', label: 'Coupon Code', desc: 'Displays a coupon code after signup' },
  { value: 'feedback', label: 'Feedback Form', desc: 'Collects email + brief message' },
]

export default function WidgetsPage() {
  const { workspaceId } = useAuthStore()
  const toast = useToast()
  const [widgets, setWidgets] = useState([])
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0) // 0=list, 1=details, 2=content
  const [editingId, setEditingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showEmbed, setShowEmbed] = useState(null) // widget id whose embed modal is open
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (workspaceId) {
    document.title = 'Widgets — Veloce'
      loadWidgets()
      loadLists()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadWidgets() {
    setLoading(true)
    try {
      const { data } = await widgetsAPI.list(workspaceId)
      setWidgets(data.widgets || [])
    } catch (err) {
      console.error('Failed to load widgets:', err)
    } finally { setLoading(false) }
  }

  async function loadLists() {
    try {
      const { data } = await listsAPI.list(workspaceId)
      setLists(data.lists || [])
    } catch (err) {
      console.error('Failed to load lists:', err)
    }
  }

  function resetForm() {
    setForm({ ...DEFAULT_FORM })
    setEditingId(null)
    setErrors({})
    setStep(1)
  }

  function openNew() {
    resetForm()
  }

  function openEdit(w) {
    setForm({
      name: w.name || '',
      slug: w.slug || '',
      list_id: w.list_id || '',
      type: w.type || 'lead_magnet',
      size: w.size || 'medium',
      headline: w.headline || 'Get the Free Download',
      description: w.description || '',
      download_url: w.download_url || '',
      button_text: w.button_text || 'Send Me the Link',
      success_message: w.success_message || 'Check your inbox!',
      placeholder: w.placeholder || 'you@example.com',
      fields: w.fields || { email: { required: true } },
      styles: w.styles || { primary_color: '#f5e642', font_size: 'medium' },
    })
    setEditingId(w.id)
    setErrors({})
    setStep(1)
  }

  function validateStep(stepNum) {
    const errs = {}
    if (stepNum === 1) {
      if (!form.name.trim()) errs.name = 'Required'
      if (!form.slug.trim()) errs.slug = 'Required'
      if (!form.list_id) errs.list_id = 'Select a list'
      if (!form.download_url.trim()) errs.download_url = 'Required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function nextStep() {
    if (validateStep(1)) setStep(2)
  }

  async function saveWidget(e) {
    e?.preventDefault()
    if (!validateStep(1)) return
    setSaving(true)
    try {
      if (editingId) {
        await widgetsAPI.update(workspaceId, editingId, form)
        toast.addToast('Widget updated', 'success')
      } else {
        await widgetsAPI.create(workspaceId, form)
        toast.addToast('Widget created. Grab your embed code!', 'success')
      }
      setStep(0)
      resetForm()
      await loadWidgets()
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to save widget', 'error')
    } finally { setSaving(false) }
  }

  async function removeWidget(id) {
    setRemovingId(id)
    try {
      await widgetsAPI.remove(workspaceId, id)
      setWidgets(prev => prev.filter(w => w.id !== id))
      toast.addToast('Widget deleted', 'success')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      toast.addToast(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Failed to delete', 'error')
    } finally { setRemovingId(null) }
  }

  function copyEmbed(slug) {
    const heights = { small: 280, medium: 420, large: 600 }
    const h = heights[form.size] || 420
    const code = `<iframe src="${EMBED_BASE}/${slug}"\n  width="100%" height="${h}"\n  frameborder="0"\n  style="border:3px solid #0a0a0a">\n</iframe>`
    navigator.clipboard.writeText(code)
    setCopiedId(slug)
    toast.addToast('Embed code copied!', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function updateName(name) {
    const slug = editingId ? form.slug : generateSlug(name)
    setForm(prev => ({ ...prev, name, slug }))
    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const listName = (id) => lists.find(l => l.id === id)?.name || 'Unknown'

  // Live preview of the widget form
  const formPreview = useMemo(() => form, [form])

  if (loading) return <LoadingState />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
          <span className="text-brutal-green">Widg</span>ets
        </h2>
        {step === 0 && (
          <button
            onClick={openNew}
            className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-sm uppercase tracking-wider hover:shadow-brutal transition"
          >
            + New Widget
          </button>
        )}
      </div>

      {/* ======== WIZARD: Step 1 — Widget Details ======== */}
      {step === 1 && (
        <div className="border-3 border-brutal-fg bg-white">
          {/* Wizard progress bar */}
          <div className="flex border-b-3 border-brutal-fg">
            <div className="flex-1 px-5 py-3 bg-brutal-yellow">
              <span className="text-xs font-bold uppercase tracking-wider">Step 1</span>
              <p className="font-heading text-lg uppercase leading-none">Widget Details</p>
            </div>
            <div className="flex-1 px-5 py-3 bg-brutal-surface">
              <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Step 2</span>
              <p className="font-heading text-lg text-brutal-muted uppercase leading-none">Form Content</p>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                  Widget Name
                </label>
                <input
                  value={form.name}
                  onChange={e => updateName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white border-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted ${errors.name ? 'border-brutal-red' : 'border-brutal-fg'}`}
                  placeholder="My Free Guide"
                />
                {errors.name && <p className="text-xs font-bold text-brutal-red mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                  URL Slug
                </label>
                <input
                  value={form.slug}
                  onChange={e => updateField('slug', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-brutal-surface border-3 text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted ${errors.slug ? 'border-brutal-red' : 'border-brutal-fg'}`}
                  placeholder="my-free-guide"
                  disabled={!!editingId}
                />
                <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1">
                  {EMBED_BASE}/{form.slug || '...'}
                </p>
                {errors.slug && <p className="text-xs font-bold text-brutal-red mt-1">{errors.slug}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                  Target List
                </label>
                <select
                  value={form.list_id}
                  onChange={e => updateField('list_id', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white border-3 text-sm focus:outline-none ${errors.list_id ? 'border-brutal-red' : 'border-brutal-fg'}`}
                >
                  <option value="">Select a list...</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                {errors.list_id && <p className="text-xs font-bold text-brutal-red mt-1">{errors.list_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                  Download URL
                </label>
                <input
                  value={form.download_url}
                  onChange={e => updateField('download_url', e.target.value)}
                  className={`w-full px-4 py-2.5 bg-white border-3 text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted ${errors.download_url ? 'border-brutal-red' : 'border-brutal-fg'}`}
                  placeholder="https://example.com/my-guide.pdf"
                />
                {errors.download_url && <p className="text-xs font-bold text-brutal-red mt-1">{errors.download_url}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Widget Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WIDGET_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateField('type', t.value)}
                    className={`text-left px-3 py-2.5 border-3 text-xs transition ${form.type === t.value ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg' : 'border-brutal-fg/20 bg-white text-brutal-muted hover:border-brutal-fg'}`}
                  >
                    <span className="font-bold block">{t.label}</span>
                    <span className="text-[9px] block mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Fields to Collect</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'email', label: 'Email', required: true },
                  { key: 'first_name', label: 'First Name' },
                  { key: 'last_name', label: 'Last Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'postal_code', label: 'ZIP Code' },
                ].map((f) => {
                  const enabled = form.fields?.[f.key]?.required === true || (f.key !== 'email' && form.fields?.[f.key]?.required !== undefined)
                  return (
                    <button
                      key={f.key}
                      type="button"
                      disabled={f.required}
                      onClick={() => {
                        const newFields = { ...form.fields }
                        if (newFields[f.key]?.required) {
                          delete newFields[f.key]
                        } else {
                          newFields[f.key] = { required: true }
                        }
                        updateField('fields', newFields)
                      }}
                      className={`px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition ${f.required || (form.fields?.[f.key]?.required) ? 'border-brutal-fg bg-brutal-green text-white' : 'border-brutal-fg/20 bg-white text-brutal-muted hover:border-brutal-fg'}`}
                    >
                      {f.label}{f.required ? ' *' : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Widget Size</label>
              <div className="flex border-3 border-brutal-fg overflow-hidden">
                {[
                  { value: 'small', label: 'Small', desc: 'Compact inline' },
                  { value: 'medium', label: 'Medium', desc: 'Standard card' },
                  { value: 'large', label: 'Large', desc: 'Full hero' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('size', opt.value)}
                    className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition ${form.size === opt.value ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={nextStep}
                className="px-6 py-2.5 border-3 border-brutal-fg bg-brutal-fg text-white font-bold text-sm uppercase tracking-wider hover:shadow-brutal transition"
              >
                Next → Form Content
              </button>
              <button
                type="button"
                onClick={() => { setStep(0); resetForm() }}
                className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== WIZARD: Step 2 — Form Content + Preview ======== */}
      {step === 2 && (
        <div className="border-3 border-brutal-fg bg-white">
          <div className="flex border-b-3 border-brutal-fg">
            <div className="flex-1 px-5 py-3 bg-brutal-surface">
              <span className="text-xs font-bold text-brutal-muted uppercase tracking-wider">Step 1 ✓</span>
              <p className="font-heading text-lg text-brutal-muted uppercase leading-none">Widget Details</p>
            </div>
            <div className="flex-1 px-5 py-3 bg-brutal-yellow">
              <span className="text-xs font-bold uppercase tracking-wider">Step 2</span>
              <p className="font-heading text-lg uppercase leading-none">Form Content</p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Content fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Headline</label>
                  <input
                    value={form.headline}
                    onChange={e => updateField('headline', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Button Text</label>
                    <input
                      value={form.button_text}
                      onChange={e => updateField('button_text', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Placeholder</label>
                    <input
                      value={form.placeholder}
                      onChange={e => updateField('placeholder', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Success Message</label>
                  <input
                    value={form.success_message}
                    onChange={e => updateField('success_message', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.styles?.primary_color || '#f5e642'}
                      onChange={e => updateField('styles', { ...form.styles, primary_color: e.target.value })}
                      className="w-12 h-10 border-3 border-brutal-fg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.styles?.primary_color || '#f5e642'}
                      onChange={e => updateField('styles', { ...form.styles, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-white border-3 border-brutal-fg text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveWidget}
                    disabled={saving}
                    className="px-6 py-2.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-sm uppercase tracking-wider hover:shadow-brutal disabled:opacity-50 transition"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Widget' : 'Create Widget'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:bg-brutal-yellow transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(0); resetForm() }}
                    className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-muted font-bold text-sm uppercase tracking-wider hover:text-brutal-red transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-3">Live Preview</p>
                <div className="border-3 border-brutal-fg shadow-brutal">
                  <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-5 py-3">
                    <p className="font-heading text-lg uppercase leading-none">{formPreview.headline || 'Your Headline'}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-brutal-fg/70 leading-relaxed">
                      {formPreview.description || 'Your description here.'}
                    </p>
                    <div className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-xs text-brutal-muted">
                      {formPreview.placeholder || 'you@example.com'}
                    </div>
                    <div className="w-full border-3 border-brutal-fg bg-brutal-fg text-white font-bold py-3 text-xs uppercase tracking-wider text-center">
                      {formPreview.button_text || 'Button'}
                    </div>
                  </div>
                  <div className="border-t-3 border-brutal-fg px-5 py-2.5">
                    <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider text-center">
                      No spam. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======== WIDGET LIST ======== */}
      {step === 0 && (
        <>
          {widgets.length === 0 ? (
            <EmptyState
              title="No widgets yet"
              description="Create an embeddable signup form to collect emails in exchange for a download."
              action={{ label: 'Create Widget', onClick: openNew }}
            />
          ) : (
            <div className="space-y-4">
              {widgets.map(w => (
                <div key={w.id} className="border-3 border-brutal-fg bg-white hover:shadow-brutal transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl uppercase tracking-wide truncate">{w.name}</h3>
                          <span className="shrink-0 px-2 py-0.5 border-2 border-brutal-fg bg-brutal-yellow text-[10px] font-mono font-bold uppercase">
                            /w/{w.slug}
                          </span>
                        </div>
                        <p className="text-sm text-brutal-fg/60 mb-1">{w.headline}</p>
                        <p className="text-xs text-brutal-muted uppercase tracking-wider">
                          List: {listName(w.list_id)} · Submissions: {w.submission_count || 0}
                        </p>
                        <p className="text-[10px] font-bold text-brutal-green uppercase tracking-wider mt-1">
                          📍 Location data collected for geo-targeting
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setShowEmbed(w.id)}
                          className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-fg text-white font-bold text-xs uppercase tracking-wider hover:bg-brutal-fg/80 transition"
                        >
                          Embed
                        </button>
                        <button
                          onClick={() => openEdit(w)}
                          className="px-3 py-1.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:bg-brutal-yellow transition"
                        >
                          Edit
                        </button>
                        {removingId === w.id ? (
                          <span className="text-xs font-bold text-brutal-red uppercase tracking-wider whitespace-nowrap">
                            Sure?{' '}
                            <button onClick={() => removeWidget(w.id)} className="underline hover:text-brutal-fg">Yes</button>
                            {' / '}
                            <button onClick={() => setRemovingId(null)} className="underline hover:text-brutal-fg">No</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setRemovingId(w.id)}
                            className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-red text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Embed code panel (inline expand) */}
                  {showEmbed === w.id && (
                    <div className="border-t-3 border-brutal-fg bg-brutal-surface p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider">Embed Code</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyEmbed(w.slug)}
                            className="px-3 py-1 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition"
                          >
                            {copiedId === w.slug ? 'Copied!' : 'Copy Code'}
                          </button>
                          <button
                            onClick={() => setShowEmbed(null)}
                            className="px-3 py-1 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wider hover:opacity-80 transition"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      <pre className="bg-brutal-fg text-brutal-yellow p-4 text-xs font-mono overflow-x-auto whitespace-pre select-all">
{`<iframe
  src="${EMBED_BASE}/${w.slug}"
  width="100%"
  height="420"
  frameborder="0"
  style="border:3px solid #0a0a0a">
</iframe>`}
                      </pre>
                      <p className="text-[10px] font-bold text-brutal-muted uppercase">
                        Paste this anywhere on your site. The form auto-resizes.
                      </p>
                      <p className="text-[10px] font-bold text-brutal-green uppercase">
                        📍 This widget collects location data so you can target campaigns by radius.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
