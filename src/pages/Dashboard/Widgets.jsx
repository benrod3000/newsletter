import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { widgetsAPI, listsAPI } from '../../lib/api'
import { EmptyState, LoadingState } from '../../components/ux'
import { useToast } from '../../components/Toast'
import Btn from '../../components/ui/Button'
import ConfirmModal from '../../components/ConfirmModal'

const EMBED_BASE = 'https://newsletter.brod3000.com/w'

/** WCAG contrast utilities ported from legacy EmbedCodePanel */
function hexToRgb(hex) {
  const val = hex.replace('#', '')
  if (val.length === 3) return { r: parseInt(val[0] + val[0], 16), g: parseInt(val[1] + val[1], 16), b: parseInt(val[2] + val[2], 16) }
  if (val.length === 6) return { r: parseInt(val.slice(0, 2), 16), g: parseInt(val.slice(2, 4), 16), b: parseInt(val.slice(4, 6), 16) }
  return { r: 0, g: 0, b: 0 }
}

function relativeLuminance({ r, g, b }) {
  const [R, G, B] = [r / 255, g / 255, b / 255].map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function getContrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1))
  const l2 = relativeLuminance(hexToRgb(hex2))
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function contrastBadge(fg, bg) {
  const ratio = getContrastRatio(fg, bg)
  if (ratio >= 7) return { pass: 'AAA', color: '#2b7657' }
  if (ratio >= 4.5) return { pass: 'AA', color: '#2b7657' }
  if (ratio >= 3) return { pass: 'AA-large', color: '#f5e642' }
  return { pass: 'FAIL', color: '#e03131' }
}

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
  styles: { primary_color: '#f5e642', bg_color: '#f5f5f0', text_color: '#0a0a0a', border_color: '#0a0a0a', button_text_color: '#0a0a0a' },
  collect_location: true,
  // Off by default: delivering a file someone asked for and signing them up for
  // future mail are different things, and the second is not implied by the first.
  subscribe_to_list: false,
  // Blank means "use the built-in wording" - see the note by the inputs.
  email_subject: '',
  email_heading: '',
  email_body: '',
  /*
   * `feedback_message` was here and has been removed.
   *
   * There is no such column on `widgets` and no backend reference to it, so the
   * whole-form PUT sent it and the route's allowlist dropped it. It also had no
   * input: it existed only in this initial state and in the edit loader, so
   * nothing ever set it to anything and nothing ever displayed it.
   *
   * Not replaced with a column, because a field with no UI and no reader is not a
   * feature that was broken - it is one that was never built. A Feedback widget
   * already has `description` and `placeholder`, both of which are rendered to the
   * visitor, if a prompt above the message box is wanted.
   */
}

const WIDGET_TYPES = [
  { value: 'lead_magnet', label: 'Lead Magnet', desc: 'Collects emails, sends a download link' },
  { value: 'newsletter', label: 'Newsletter Signup', desc: 'Simple email collection for newsletters' },
  { value: 'event_rsvp', label: 'Event RSVP', desc: 'Collects name + email for event registration' },
  { value: 'coupon', label: 'Coupon Code', desc: 'Displays a coupon code after signup' },
  { value: 'feedback', label: 'Feedback Form', desc: 'Collects email + brief message' },
  // PROVISIONAL LABEL. This was "SMS-Only List / Collects phone numbers, SMS
  // opt-in by default", which the product cannot do: `subscribers` has a NOT
  // NULL email and is keyed UNIQUE (workspace_id, email), so there is nowhere to
  // put a phone-only contact, and the public submit endpoint rejects a
  // submission with no address before doing anything else. Renamed so the
  // picker stops promising it. Whether this type earns its place at all, or
  // waits for phone-first identity, is still open.
  { value: 'sms_list', label: 'SMS List', desc: 'Collects a phone number alongside the email' },
]

/**
 * The fields each type implies, applied when the type is chosen.
 *
 * Choosing a type used to set `type` and nothing else, so every description
 * above was a promise the picker did not keep: Event RSVP said "name + email"
 * and enabled neither name field, and SMS said "phone numbers" and did not
 * enable the phone field. The only way to get the advertised form was to know
 * to configure it by hand underneath.
 *
 * Email is in every preset because it is not optional anywhere: `subscribers`
 * has a NOT NULL email with UNIQUE (workspace_id, email), so an address is what
 * identifies a contact, and the public submit endpoint rejects a submission
 * without one before doing anything else. That is why SMS collects a phone
 * number *as well as* an address rather than instead of one.
 */
const TYPE_FIELD_PRESETS = {
  lead_magnet: { email: { required: true } },
  newsletter: { email: { required: true } },
  event_rsvp: { email: { required: true }, first_name: { required: true }, last_name: { required: true } },
  coupon: { email: { required: true } },
  feedback: { email: { required: true } },
  sms_list: { email: { required: true }, phone: { required: true } },
}

/** Types that exchange something for the address, and so need download_url set. */
const TYPES_WITH_DOWNLOAD = ['lead_magnet', 'coupon']

/** Per-type wording for the one input that means different things. */
const DOWNLOAD_FIELD_COPY = {
  lead_magnet: {
    label: 'Link to your file',
    placeholder: 'https://example.com/my-guide.pdf',
    help: 'Emailed to visitors after they sign up',
  },
  coupon: {
    label: 'Coupon code',
    placeholder: 'SAVE20',
    help: 'Shown on screen once the form is submitted',
  },
}

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
  const [isDirty, setIsDirty] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(null) // 'cancel' or 'back'

  useEffect(() => {
    if (workspaceId) {
    document.title = 'Capture Forms | Veloce'
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
    setIsDirty(false)
    setStep(0)
  }

  function openNew() {
    setForm({ ...DEFAULT_FORM })
    setEditingId(null)
    setErrors({})
    setIsDirty(false)
    setStep(1)
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
      styles: w.styles || { primary_color: '#f5e642', bg_color: '#f5f5f0', text_color: '#0a0a0a', border_color: '#0a0a0a', button_text_color: '#0a0a0a' },
      collect_location: w.collect_location !== false,
      subscribe_to_list: w.subscribe_to_list === true,
      email_subject: w.email_subject || '',
      email_heading: w.email_heading || '',
      email_body: w.email_body || '',
    })
    setEditingId(w.id)
    setErrors({})
    setIsDirty(false)
    setStep(1)
  }

  /**
   * Choosing a type applies that type's fields.
   *
   * It overwrites whatever is in "Fields to Collect" rather than merging,
   * because the type buttons describe a form ("name + email") and picking one
   * should produce that form. Anything extra is still a click away underneath,
   * and the picker sits above that section so the order reads as choose-then-
   * adjust.
   */
  function selectType(value) {
    setForm(prev => ({
      ...prev,
      type: value,
      fields: { ...(TYPE_FIELD_PRESETS[value] || { email: { required: true } }) },
      // The column is shared but the meaning is not - a file URL left over from
      // Lead Magnet is not a coupon code, and showing it under the new label
      // would present stale input as if it had been entered for this type.
      download_url: TYPES_WITH_DOWNLOAD.includes(value) ? prev.download_url : '',
    }))
    setIsDirty(true)
    setErrors(prev => ({ ...prev, download_url: undefined }))
  }

  /**
   * The inputs the public form will render, in its order.
   *
   * Kept as data so the preview stays a rendering of configuration rather than
   * a second opinion about it. Email is unconditional here because it is
   * unconditional in WidgetForm.jsx - see the note on TYPE_FIELD_PRESETS.
   */
  const previewFields = [
    form.fields?.first_name?.required && { key: 'first_name', text: 'First name' },
    form.fields?.last_name?.required && { key: 'last_name', text: 'Last name' },
    { key: 'email', text: form.placeholder || 'you@example.com' },
    form.fields?.phone?.required && { key: 'phone', text: 'Phone number' },
    form.fields?.postal_code?.required && { key: 'postal_code', text: 'ZIP code' },
  ].filter(Boolean)

  function validateStep(stepNum) {
    const errs = {}
    if (stepNum === 1) {
      if (!form.name.trim()) errs.name = 'Required'
      if (!form.slug.trim()) errs.slug = 'Required'
      if (!form.list_id) errs.list_id = 'Select a list'
      if (TYPES_WITH_DOWNLOAD.includes(form.type) && !form.download_url.trim()) {
        errs.download_url = 'Required'
      }
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

  // Keyed by widget id, not slug. Slug is unique per workspace
  // (widgets_workspace_id_slug_key), so it cannot identify a widget from a
  // public URL - two customers naming a form the same thing would collide.
  function copyEmbed(widgetId, widgetSize, fieldCount) {
    navigator.clipboard.writeText(buildEmbedCode(widgetId, widgetSize, fieldCount))
    setCopiedId(widgetId)
    toast.addToast('Embed code copied!', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  /**
   * The embed snippet. One definition, used by both the copy button and the
   * code shown on screen.
   *
   * Those were separate before, and had drifted: the displayed version used a
   * different heights map with no `slim` entry, so a slim widget was shown one
   * number and given another when copied.
   */
  function buildEmbedCode(widgetId, widgetSize, fieldCount) {
    const fieldH = Math.max(1, fieldCount || 1) * 60 + 200
    // Slim is one row of controls plus its border, and grows only if extra
    // fields are configured - it must not inherit the card sizes' floor, which
    // is what made "compact" reserve 280px for about 100px of content.
    const heights = {
      slim: 64 + Math.max(0, (fieldCount || 1) - 1) * 52,
      small: Math.max(fieldH, 280),
      medium: Math.max(fieldH, 360),
      large: Math.max(fieldH, 500),
    }
    // Now only the starting height, so the form looks right for the moment
    // before the first message arrives rather than collapsing from zero.
    const h = heights[widgetSize] || heights.medium

    // allow="geolocation" is required for the form to ask for coordinates at
    // all: cross-origin iframes are denied that API by default, so without it
    // the request fails as PERMISSION_DENIED before the visitor sees a prompt.
    //
    // The script is what makes the frame fit its contents. Without it the height
    // above is frozen at the moment this code was copied, so editing the widget
    // later, or a narrow screen wrapping the text onto more lines, clips the
    // form or leaves dead space beneath it.
    //
    // e.source === frame.contentWindow is the check that matters: it accepts
    // messages only from this iframe, so another frame on the host page cannot
    // resize it. The message carries a single integer and no user data.
    // No border on the iframe. The widget draws its own inside the frame, so a
    // border here produced two concentric ones on a real embed - and it could not
    // follow the widget's own border colour, since it is written into the host
    // page once and never updated when the widget is restyled.
    const code = [
      `<iframe id="veloce-${widgetId}" src="${EMBED_BASE}/${widgetId}"`,
      `  width="100%" height="${h}" frameborder="0" allow="geolocation"`,
      `  style="border:0; width:100%; max-width:100%; display:block"></iframe>`,
      `<script>`,
      `  (function () {`,
      `    var frame = document.getElementById("veloce-${widgetId}");`,
      `    window.addEventListener("message", function (e) {`,
      `      if (e.source !== frame.contentWindow) return;`,
      `      if (!e.data || e.data.type !== "veloce:height") return;`,
      `      frame.style.height = e.data.height + "px";`,
      `    });`,
      `  })();`,
      `</script>`,
    ].join('\n')

    return code
  }

  function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function updateName(name) {
    const slug = editingId ? form.slug : generateSlug(name)
    setForm(prev => ({ ...prev, name, slug }))
    setIsDirty(true)
    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const listName = (id) => lists.find(l => l.id === id)?.name || 'Unknown'

  if (loading) return <LoadingState />

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-heading uppercase tracking-tight leading-none">
          <span className="text-brutal-green">Capture</span> Forms
        </h2>
        {step === 0 && (
          <Btn
            variant="primary"
            size="md"
            onClick={openNew}
          >
            + New Widget
          </Btn>
        )}
      </div>

      {/* ======== WIZARD: Step 1 // Widget Details ======== */}
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

          <div className="p-8 space-y-6">
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
                  Form URL
                </label>
                <p className="text-[10px] font-bold text-brutal-muted mb-1.5">
                  {editingId
                    ? `${EMBED_BASE}/${editingId}`
                    : 'Generated once the widget is saved'}
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
              {/*
                Shown for Coupon as well as Lead Magnet. Both store their value
                in download_url - the lead magnet links to it, the coupon prints
                it as the code - but the input rendered only for lead magnets,
                so a Coupon widget had no way to set the code the success screen
                displays. The label changes because "Link to your file" is the
                wrong prompt for "SAVE20".
              */}
              {TYPES_WITH_DOWNLOAD.includes(form.type) && (
                <div>
                  <label htmlFor="wb-download" className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    {DOWNLOAD_FIELD_COPY[form.type].label}
                  </label>
                  <input
                    id="wb-download"
                    value={form.download_url}
                    onChange={e => updateField('download_url', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border-3 text-sm font-mono focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted ${errors.download_url ? 'border-brutal-red' : 'border-brutal-fg'}`}
                    placeholder={DOWNLOAD_FIELD_COPY[form.type].placeholder}
                  />
                  {errors.download_url && <p className="text-xs font-bold text-brutal-red mt-1">{errors.download_url}</p>}
                  <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1">{DOWNLOAD_FIELD_COPY[form.type].help}</p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-3 border-3 border-brutal-fg bg-white p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.subscribe_to_list}
                onChange={e => updateField('subscribe_to_list', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brutal-green"
              />
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider">
                  Also add them to the list
                </span>
                <span className="block text-[10px] font-bold text-brutal-muted uppercase mt-1 leading-relaxed">
                  Off means this form delivers the file and nothing else. Turn it on only if
                  the form tells people they are subscribing.
                </span>
              </span>
            </label>

            {/*
              The delivery email. Its wording used to be hardcoded, so every widget
              in every workspace sent the same message - the one thing a capture
              form actually says to a subscriber was the one thing its owner could
              not edit. Blank means "use the built-in wording", so an existing
              widget is unaffected and a new one does not have today's copy frozen
              into it.
            */}
            {form.type === 'lead_magnet' && (
              <div className="border-3 border-brutal-fg bg-brutal-bg p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">The email we send</p>
                  <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1">
                    Leave blank to use the default wording
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    Subject
                  </label>
                  <input
                    value={form.email_subject}
                    onChange={e => updateField('email_subject', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                    placeholder="Here's your download"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    Headline
                  </label>
                  <input
                    value={form.email_heading}
                    onChange={e => updateField('email_heading', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                    placeholder="Thanks for your interest."
                  />
                  <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1">
                    The large type at the top of the email
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={form.email_body}
                    onChange={e => updateField('email_body', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
                    placeholder={"Thanks for asking! Here is the file I promised.\n\n{{download_link}}"}
                  />
                  <p className="text-[10px] font-bold text-brutal-muted uppercase mt-1">
                    Put <code className="bg-brutal-surface px-1 normal-case">{'{{download_link}}'}</code> where the download button should go. Leave it out and the button is added at the end.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Widget Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WIDGET_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className={`text-left px-3 py-2.5 border-3 text-xs transition ${form.type === t.value ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg' : 'border-brutal-fg/20 bg-white text-brutal-muted hover:border-brutal-fg'}`}
                  >
                    <span className="font-bold block">{t.label}</span>
                    <span className="text-[9px] block mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Fields to Collect</label>                <p className="text-[9px] text-brutal-muted font-bold uppercase tracking-wider mb-2">Choose what info to collect from visitors</p>              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'email', label: 'Email', required: true },
                  { key: 'first_name', label: 'First Name' },
                  { key: 'last_name', label: 'Last Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'postal_code', label: 'ZIP Code' },
                  { key: 'collect_location', label: '📍 Location', toggle: true },
                ].map((f) => {
                  const isLocationToggle = f.key === 'collect_location'
                  const enabled = isLocationToggle
                    ? form.collect_location
                    : form.fields?.[f.key]?.required === true || (f.key !== 'email' && form.fields?.[f.key]?.required !== undefined)
                  return (
                    <button
                      key={f.key}
                      type="button"
                      disabled={f.required}
                      // Email is not a preference. A contact is identified by
                      // address (subscribers.email is NOT NULL and unique per
                      // workspace), so this stays on for every type - said out
                      // loud here because a permanently greyed-out button with
                      // no explanation reads as broken.
                      title={f.required ? 'Every contact is identified by email address, so this cannot be turned off' : undefined}
                      onClick={() => {
                        if (isLocationToggle) {
                          updateField('collect_location', !form.collect_location)
                        } else {
                          const newFields = { ...form.fields }
                          if (newFields[f.key]?.required) {
                            delete newFields[f.key]
                          } else {
                            newFields[f.key] = { required: true }
                          }
                          updateField('fields', newFields)
                        }
                      }}
                      className={`px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition ${f.required || enabled ? 'border-brutal-fg bg-brutal-green text-white' : 'border-brutal-fg/20 bg-white text-brutal-muted hover:border-brutal-fg'}`}
                    >
                      {f.label}{f.required ? ' *' : ''}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Form Size</label>
              <div className="flex border-3 border-brutal-fg overflow-x-auto">
                {[
                  { value: 'slim', label: 'Slim', desc: 'One row: field and button side by side. Inline strip.' },
                  { value: 'small', label: 'Compact', desc: 'Email only, no headline. Fits tight spaces.' },
                  { value: 'medium', label: 'Standard', desc: 'Full form with headline and description.' },
                  { value: 'large', label: 'Large', desc: 'Bigger text and padding. Great for landing pages.' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField('size', opt.value)}
                    className={`flex-1 min-w-[7rem] px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-r border-brutal-fg last:border-r-0 transition leading-tight ${form.size === opt.value ? 'bg-brutal-yellow text-brutal-fg' : 'bg-white text-brutal-muted hover:text-brutal-fg'}`}
                  >
                    {opt.label}
                    <p className="text-[9px] font-bold normal-case mt-0.5 opacity-70">{opt.desc}</p>
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
                onClick={() => { if (isDirty) setConfirmDiscard('cancel'); else { setStep(0); resetForm() } }}
                className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:opacity-80 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== WIZARD: Step 2 // Form Content + Preview ======== */}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                    Primary Color
                    {contrastBadge(form.styles?.button_text_color || '#0a0a0a', form.styles?.primary_color || '#f5e642').pass !== 'AAA' && (
                      <span className="ml-2 text-[9px]" style={{ color: contrastBadge(form.styles?.button_text_color || '#0a0a0a', form.styles?.primary_color || '#f5e642').color }}>
                        {contrastBadge(form.styles?.button_text_color || '#0a0a0a', form.styles?.primary_color || '#f5e642').pass}
                      </span>
                    )}
                  </label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      Background
                      <span className="ml-2 text-[9px]" style={{ color: contrastBadge(form.styles?.text_color || '#0a0a0a', form.styles?.bg_color || '#f5f5f0').color }}>
                        {contrastBadge(form.styles?.text_color || '#0a0a0a', form.styles?.bg_color || '#f5f5f0').pass}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input type="color" value={form.styles?.bg_color || '#f5f5f0'}
                        onChange={e => updateField('styles', { ...form.styles, bg_color: e.target.value })}
                        className="w-10 h-9 border-3 border-brutal-fg cursor-pointer" />
                      <input type="text" value={form.styles?.bg_color || '#f5f5f0'}
                        onChange={e => updateField('styles', { ...form.styles, bg_color: e.target.value })}
                        className="flex-1 px-2 py-2 bg-white border-3 border-brutal-fg text-[10px] font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      Text Color
                      <span className="ml-2 text-[9px]" style={{ color: contrastBadge(form.styles?.text_color || '#0a0a0a', form.styles?.bg_color || '#f5f5f0').color }}>
                        {contrastBadge(form.styles?.text_color || '#0a0a0a', form.styles?.bg_color || '#f5f5f0').pass}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input type="color" value={form.styles?.text_color || '#0a0a0a'}
                        onChange={e => updateField('styles', { ...form.styles, text_color: e.target.value })}
                        className="w-10 h-9 border-3 border-brutal-fg cursor-pointer" />
                      <input type="text" value={form.styles?.text_color || '#0a0a0a'}
                        onChange={e => updateField('styles', { ...form.styles, text_color: e.target.value })}
                        className="flex-1 px-2 py-2 bg-white border-3 border-brutal-fg text-[10px] font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">
                      Button Text
                      <span className="ml-2 text-[9px]" style={{ color: contrastBadge(form.styles?.button_text_color || '#ffffff', form.styles?.primary_color || '#f5e642').color }}>
                        {contrastBadge(form.styles?.button_text_color || '#ffffff', form.styles?.primary_color || '#f5e642').pass}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input type="color" value={form.styles?.button_text_color || '#ffffff'}
                        onChange={e => updateField('styles', { ...form.styles, button_text_color: e.target.value })}
                        className="w-10 h-9 border-3 border-brutal-fg cursor-pointer" />
                      <input type="text" value={form.styles?.button_text_color || '#ffffff'}
                        onChange={e => updateField('styles', { ...form.styles, button_text_color: e.target.value })}
                        className="flex-1 px-2 py-2 bg-white border-3 border-brutal-fg text-[10px] font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Border Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.styles?.border_color || '#0a0a0a'}
                        onChange={e => updateField('styles', { ...form.styles, border_color: e.target.value })}
                        className="w-10 h-9 border-3 border-brutal-fg cursor-pointer" />
                      <input type="text" value={form.styles?.border_color || '#0a0a0a'}
                        onChange={e => updateField('styles', { ...form.styles, border_color: e.target.value })}
                        className="flex-1 px-2 py-2 bg-white border-3 border-brutal-fg text-[10px] font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Button Text</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.styles?.button_text_color || '#ffffff'}
                        onChange={e => updateField('styles', { ...form.styles, button_text_color: e.target.value })}
                        className="w-10 h-9 border-3 border-brutal-fg cursor-pointer" />
                      <input type="text" value={form.styles?.button_text_color || '#ffffff'}
                        onChange={e => updateField('styles', { ...form.styles, button_text_color: e.target.value })}
                        className="flex-1 px-2 py-2 bg-white border-3 border-brutal-fg text-[10px] font-mono focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Theme Presets */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Quick Themes</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '🎨 Veloce', s: { primary_color: '#f5e642', bg_color: '#f5f5f0', text_color: '#0a0a0a', border_color: '#0a0a0a', button_text_color: '#0a0a0a' } },
                      { label: '☀️ Clean', s: { primary_color: '#2563eb', bg_color: '#ffffff', text_color: '#1a1a1a', border_color: '#e5e7eb', button_text_color: '#ffffff' } },
                      { label: '🌙 Midnight', s: { primary_color: '#6366f1', bg_color: '#1a1a1a', text_color: '#f5f5f5', border_color: '#333333', button_text_color: '#ffffff' } },
                    ].map(t => (
                      <button key={t.label} type="button"
                        onClick={() => updateField('styles', t.s)}
                        className="px-3 py-1.5 border-2 border-brutal-fg text-[10px] font-bold uppercase tracking-wider bg-white hover:bg-brutal-yellow/20 transition">
                        {t.label}
                      </button>
                    ))}
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
                    onClick={() => { if (isDirty) setConfirmDiscard('back'); else setStep(1) }}
                    className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wider hover:bg-brutal-yellow transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (isDirty) setConfirmDiscard('cancel'); else { setStep(0); resetForm() } }}
                    className="px-4 py-2.5 border-3 border-brutal-fg bg-white text-brutal-muted font-bold text-sm uppercase tracking-wider hover:text-brutal-red transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brutal-muted mb-3">Live Preview · <span className="text-brutal-green">{form.size === 'small' ? 'Compact' : form.size === 'large' ? 'Large' : 'Standard'}</span></p>
                <div className={`border-3 shadow-brutal transition-all duration-200 ${form.size === 'small' ? 'max-w-xs' : form.size === 'large' ? 'max-w-xl' : 'max-w-md'}`} style={{ borderColor: form.styles?.border_color || '#0a0a0a' }}>
                  {form.size !== 'small' && (
                    <div className="border-b-3 px-5 py-3" style={{ backgroundColor: form.styles?.primary_color || '#f5e642', borderColor: form.styles?.border_color || '#0a0a0a' }}>
                      <p className={`font-heading uppercase leading-none ${form.size === 'large' ? 'text-2xl' : 'text-lg'}`} style={{ color: form.styles?.text_color || '#0a0a0a' }}>{form.headline || 'Your Headline'}</p>
                    </div>
                  )}
                  <div className={`${form.size === 'small' ? 'p-3 space-y-2' : 'p-5 space-y-4'}`} style={{ backgroundColor: '#fff' }}>
                    {form.size !== 'small' && (
                      <p className="text-xs leading-relaxed" style={{ color: form.styles?.text_color || 'inherit' }}>
                        {form.description || 'Your description here.'}
                      </p>
                    )}
                    {/*
                      The fields this form will actually render.

                      This was a single hardcoded email box that ignored both
                      `type` and `fields`, so every widget type previewed
                      identically and toggling Phone or ZIP below changed
                      nothing on screen. A preview that cannot show the
                      difference between a Feedback form and a Lead Magnet is
                      what made the type picker look like it did nothing.

                      Order and conditions mirror WidgetForm.jsx, which is what
                      visitors get; if that order changes, change it here too.
                    */}
                    {previewFields.map(f => (
                      <div
                        key={f.key}
                        className="w-full bg-white border-3 text-xs text-brutal-muted"
                        style={{ borderColor: form.styles?.border_color || '#0a0a0a', padding: form.size === 'small' ? '6px 12px' : '12px 16px' }}
                      >
                        {f.text}
                      </div>
                    ))}
                    {form.type === 'feedback' && (
                      <div
                        className="w-full bg-white border-3 text-xs text-brutal-muted"
                        style={{ borderColor: form.styles?.border_color || '#0a0a0a', padding: form.size === 'small' ? '6px 12px' : '12px 16px', minHeight: form.size === 'small' ? '2.5rem' : '4rem' }}
                      >
                        Your feedback...
                      </div>
                    )}
                    {form.fields?.phone?.required && form.type !== 'sms_list' && (
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: form.styles?.text_color || '#a8a49a' }}>
                        📱 Text me about events &amp; offers
                      </p>
                    )}
                    <div className="w-full border-3 font-bold text-xs uppercase tracking-wider text-center"
                      style={{ backgroundColor: form.styles?.primary_color || '#0a0a0a', borderColor: form.styles?.border_color || '#0a0a0a', color: form.styles?.button_text_color || '#ffffff', padding: form.size === 'small' ? '6px 12px' : '12px 16px' }}>
                      {form.button_text || 'Button'}
                    </div>
                  </div>
                  {form.size !== 'small' && (
                    <div className="border-t-3 px-5 py-2.5 text-center" style={{ borderColor: form.styles?.border_color || '#0a0a0a' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: form.styles?.text_color || '#a8a49a' }}>
                        No spam. Unsubscribe anytime.
                      </p>
                    </div>
                  )}
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
              description="Create an embeddable signup form to collect emails. Add it to your site in under a minute."
              action={{ label: 'Create Widget', onClick: openNew }}
            />
          ) : (
            <div className="space-y-4">
              {widgets.map(w => (
                <div key={w.id} className="border-3 border-brutal-fg bg-white hover:shadow-brutal transition">
                  <div className="p-6">
                    {/*
                      Stacks on mobile. The action row is four buttons at
                      roughly 380px and was `shrink-0`, so on a phone it held
                      its width, squeezed this column to almost nothing - the
                      name wrapped one word per line - and still ran off the
                      right edge. Side by side only once there is room for it.
                    */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-xl uppercase tracking-wide truncate">{w.name}</h3>
                          {/* The slug names the widget within the workspace; it is not
                              the public address, which is /w/{id}. Showing the slug as
                              a path implied a URL that does not resolve. */}
                          <span className="shrink-0 px-2 py-0.5 border-2 border-brutal-fg bg-brutal-yellow text-[10px] font-mono font-bold uppercase">
                            {w.slug}
                          </span>
                        </div>
                        <p className="text-sm text-brutal-fg/60 mb-1">{w.headline}</p>
                        <p className="text-xs text-brutal-muted uppercase tracking-wider">
                          List: {listName(w.list_id)} · Submissions: {w.submission_count || 0} · {WIDGET_TYPES.find(t => t.value === w.type)?.label || w.type}
                        </p>
                        {w.collect_location !== false && (
                          <p className="text-[10px] font-bold text-brutal-green uppercase tracking-wider mt-1">
                            📍 Location data collected for geo-targeting
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
                        <a href={`/w/${w.id}`} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition inline-block">
                          View Live
                        </a>
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
                            onClick={() => {
                              const fields = w.fields || { email: { required: true } }
                              const count = Object.keys(fields).length
                              copyEmbed(w.id, w.size, count)
                            }}
                            className="px-3 py-1 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition"
                          >
                            {copiedId === w.id ? 'Copied!' : 'Copy Code'}
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
{buildEmbedCode(w.id, w.size, Object.keys(w.fields || { email: {} }).length)}
                      </pre>
                      <p className="text-[10px] font-bold text-brutal-muted uppercase">
                        Paste this anywhere on your site. The frame resizes itself to fit the form.
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

      {/* Confirm discard when dirty */}
      <ConfirmModal
        open={confirmDiscard !== null}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          if (confirmDiscard === 'back') { setStep(1); resetForm() }
          else { setStep(0); resetForm() }
          setConfirmDiscard(null)
        }}
        onCancel={() => setConfirmDiscard(null)}
        danger
      />
    </div>
  )
}
