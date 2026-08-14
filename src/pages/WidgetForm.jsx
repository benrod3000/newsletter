import { useState, useEffect, useCallback } from 'react'
import { useEmbedHeight } from '../hooks/use-embed-height'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import LoadingState from '../components/ux/LoadingState'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function WidgetFormPage() {
  useEffect(() => { document.title = 'Subscribe | Veloce' }, [])

  // Tells the embedding page how tall this render actually is, so the iframe
  // can stop relying on a height guessed when the snippet was copied.
  useEmbedHeight()
  // Keyed by widget id, not slug: slug is only unique within a workspace, so
  // two customers naming a form the same thing would otherwise resolve to
  // whichever was created most recently.
  const { id } = useParams()
  const [widget, setWidget] = useState(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [postal, setPostal] = useState('')
  const [message, setMessage] = useState('')
  const [geoCoords, setGeoCoords] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  // Ask at most once per visit, whether or not the answer was yes.
  const [geoRequested, setGeoRequested] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // The reward only exists after a successful submission. The config endpoint
  // withholds it on purpose, so it cannot be read without signing up - which is
  // also why the previous version rendered nothing here: it read download_url
  // off the config, where it is never present.
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const fields = widget?.fields || { email: { required: true } }
  const styles = widget?.styles || {}
  const widgetType = widget?.type || 'lead_magnet'
  const collectLocation = widget?.collect_location !== false

  const loadWidget = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/public/forms/${id}`)
      setWidget(data.widget)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadWidget() }, [loadWidget])

  /**
   * Ask the browser for coordinates without the visitor pressing anything.
   *
   * Fails quietly on purpose. Denial is the common case, and it is not an error
   * worth showing: the submit endpoint geolocates the request IP anyway, so a
   * refusal costs precision rather than the location itself. Nothing here can
   * block or fail a signup.
   *
   * Embedded widgets additionally need allow="geolocation" on the iframe -
   * cross-origin frames are denied this API by default - which the generated
   * embed snippet now includes.
   */
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation || geoCoords || geoRequested) return
    setGeoRequested(true)
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    )
  }, [geoCoords, geoRequested])

  /**
   * Called from the email field rather than from an effect.
   *
   * The prompt fires once the address looks real, so it appears when someone is
   * actually signing up rather than the instant the widget renders - asking on
   * mount trains people to dismiss it, and Chrome suppresses prompts it has
   * seen dismissed repeatedly. Driving it from the change handler also keeps it
   * out of an effect, which is where it belongs: this reacts to something the
   * visitor did, it does not synchronise state with anything.
   */
  function maybeRequestGeolocation(value) {
    if (!collectLocation) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return
    requestGeolocation()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setSubmitting(true)
    try {
      const payload = { email: email.trim() };
      if (firstName.trim()) payload.first_name = firstName.trim();
      if (lastName.trim()) payload.last_name = lastName.trim();
      if (phone.trim()) { payload.phone = phone.trim(); payload.sms_consent = smsConsent; }
      if (postal.trim()) payload.postal_code = postal.trim();
      if (message.trim()) payload.message = message.trim();
      if (widgetType === 'sms_list') payload.sms_consent = true;
      if (geoCoords) {
        payload.browser_latitude = geoCoords.latitude;
        payload.browser_longitude = geoCoords.longitude;
      }
      const { data } = await axios.post(`${API_URL}/api/public/forms/${id}/submit`, payload)
      setDownloadUrl(data?.download_url || null)
      // Whether the delivery email actually went out. Used to decide what the
      // success screen may claim - it used to say "check your inbox"
      // unconditionally, including when nothing had been sent.
      setEmailSent(data?.email_sent === true)
      setSubmitted(true)
    } catch (err) {
      const apiErr = err?.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-10 bg-brutal-bg flex items-center justify-center">
        <LoadingState label="Loading widget" />
      </div>
    )
  }

  if (notFound || !widget) {
    return (
      <div className="py-10 bg-brutal-bg flex items-center justify-center p-6">
        <div className="border-3 border-brutal-fg bg-white shadow-brutal p-8 text-center max-w-sm space-y-3">
          <div className="h-1 w-12 bg-brutal-red mx-auto" />
          <p className="font-heading text-2xl uppercase tracking-wide">Not Found</p>
          <p className="text-xs text-brutal-muted font-bold uppercase tracking-wider">
            This form doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  // 'slim' is a single strip: field and button on one row, no header,
  // description, chrome or footer. 'small' still renders as a card, just
  // without the headline block.
  const isSlim = widget.size === 'slim'
  const isSmall = widget.size === 'small'
  const isLarge = widget.size === 'large'
  const isCompact = isSlim || isSmall
  const sizeClasses = {
    slim: 'max-w-lg',
    small: 'max-w-xs',
    medium: 'max-w-md',
    large: 'max-w-lg',
  }
  const sizeCls = sizeClasses[widget.size] || 'max-w-md'
  const headerPad = isLarge ? 'px-8 py-6' : isCompact ? 'px-3 py-2' : 'px-6 py-4'
  const bodyPad = isSlim ? 'p-2' : isLarge ? 'p-8' : isSmall ? 'p-3' : 'p-6'
  const headlineSize = isLarge ? 'text-3xl sm:text-4xl' : isCompact ? 'text-sm' : 'text-2xl sm:text-3xl'
  const inputPad = isLarge ? 'px-4 py-3.5' : isCompact ? 'px-3 py-2' : 'px-4 py-3'
  const buttonPad = isLarge ? 'py-3.5 text-sm' : isCompact ? 'py-2 text-[11px]' : 'py-3 text-sm'
  const inputCls = `w-full ${isSlim ? 'px-3 py-2' : 'px-4 py-3'} bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition`

  // No min-h-screen, at any size.
  //
  // Inside an iframe 100vh resolves to the iframe's own height, so the content
  // always filled whatever box the host reserved. That produced dead space above
  // and below the form, and it made the page impossible to measure: scrollHeight
  // would equal the frame height no matter how little was rendered, so the
  // auto-resize could never shrink a frame, only grow it.
  //
  // This route exists only to be embedded, so sizing to content is right at
  // every size, not just for the slim strip that already did it.
  const pageCls = isSlim
    ? 'flex items-center justify-center p-1'
    : `flex items-center justify-center ${isSmall ? 'p-2' : 'p-6'}`

  return (
    <div className={`${pageCls} animate-fade-up`} style={{ backgroundColor: styles.bg_color || '#f5f5f0' }}>
      <div className={`w-full ${sizeCls}`}>
        <div className={isSlim ? 'border-3' : 'border-3 shadow-brutal'} style={{ borderColor: styles.border_color || '#0a0a0a', backgroundColor: '#fff' }}>
          {/* Header - hidden in compact mode */}
          {!isCompact && (
            <div className={`border-b-3 ${headerPad}`} style={{ backgroundColor: styles.primary_color || '#f5e642', borderColor: styles.border_color || '#0a0a0a' }}>
              <h1 className={`font-heading ${headlineSize} uppercase tracking-tight leading-none`}>
                {widget.headline}
              </h1>
            </div>
          )}

          {/* Body */}
          <div className={`${bodyPad} ${isSlim ? '' : `space-y-${isSmall ? '2' : '5'}`}`}>
            {submitted ? (
              <div className="space-y-3" role="status" aria-live="polite">
                <div className="h-1 w-12" style={{ backgroundColor: widgetType === 'coupon' ? '#f5e642' : '#2b7657' }} />
                {/*
                  The operator's own copy usually promises an inbox ("Check your
                  inbox! The download link is on its way."). Showing it when the
                  send failed would repeat the exact lie this screen had before,
                  in the operator's voice, so it is replaced rather than
                  supplemented in that case.
                */}
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: widgetType === 'coupon' ? '#b8860b' : '#2b7657' }}>
                  {widgetType === 'lead_magnet' && !emailSent && downloadUrl
                    ? "You're in. Your download is ready below."
                    : widget.success_message}
                </p>
                {widgetType === 'coupon' && downloadUrl && (
                  <div className="border-3 border-brutal-fg bg-brutal-yellow p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-1">Your Coupon Code</p>
                    <p className="font-heading text-2xl uppercase tracking-wide text-brutal-fg">{downloadUrl}</p>
                  </div>
                )}
                {/*
                  A lead magnet is withheld on purpose when the email went out.
                  Requiring the visitor to open their inbox is the point of the
                  exchange: it confirms the address is real and gives them a reason
                  to open the first email you ever send them. Handing the file over
                  here would make the address optional in practice.

                  The link appears only when the send failed. That is the case an
                  earlier version of this screen got wrong in the other direction -
                  it removed the button while no email was being sent at all, so
                  visitors were told to check an inbox that would never receive
                  anything. Withholding is right; withholding with no fallback is
                  how someone ends up with nothing.
                */}
                {widgetType === 'lead_magnet' && !emailSent && downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-3 border-brutal-fg bg-brutal-yellow px-4 py-3 text-center font-heading text-lg uppercase tracking-wide text-brutal-fg hover:shadow-brutal hover:-translate-y-0.5 transition"
                  >
                    Open your download
                  </a>
                )}
                <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">
                  {widgetType === 'feedback'
                    ? 'Thanks for your feedback!'
                    : emailSent
                      ? "Didn't get it? Check your spam folder."
                      : widgetType === 'lead_magnet' && downloadUrl
                        ? 'We could not send the email, so use the link above.'
                        : "Didn't get it? Check your spam folder."}
                </p>
              </div>
            ) : (
              <>
                {/* Description - hidden in compact mode */}
                {!isCompact && (
                  <p className="text-sm leading-relaxed" style={{ color: styles.text_color || 'inherit' }}>
                    {widget.description}
                  </p>
                )}

                <form onSubmit={handleSubmit} className={isSlim ? 'flex items-stretch gap-2' : `space-y-${isSmall ? '2' : '4'}`}>
                  {fields.first_name?.required && (
                    <div>
                      <label htmlFor="wf-first-name" className="sr-only">First name</label>
                      <input
                        id="wf-first-name"
                        type="text"
                        name="given-name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First name"
                        required
                        className={inputCls}
                      />
                    </div>
                  )}
                  {fields.last_name?.required && (
                    <div>
                      <label htmlFor="wf-last-name" className="sr-only">Last name</label>
                      <input
                        id="wf-last-name"
                        type="text"
                        name="family-name"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last name"
                        required
                        className={inputCls}
                      />
                    </div>
                  )}
                  {/*
                    `min-w-0` and `size={1}` are what let this shrink.

                    In the slim layout this sits in a flex row next to a `shrink-0`
                    button. A flex item defaults to `min-width:auto`, which refuses
                    to go below its content's intrinsic width, and an <input>'s
                    intrinsic width comes from its `size` attribute - 20 characters
                    by default. So the row could not fit its container and the field
                    was clipped mid-placeholder ("you@examp") on a real embed.

                    Both are needed: `min-w-0` frees the flex item, `size={1}` drops
                    the intrinsic floor the attribute imposes. `w-full` then fills
                    whatever space is actually left.
                  */}
                  <div className={isSlim ? 'flex-1 min-w-0' : ''}>
                    <label htmlFor="wf-email" className="sr-only">Email address</label>
                    <input
                      id="wf-email"
                      type="email"
                      name="email"
                      size={1}
                      autoComplete="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); maybeRequestGeolocation(e.target.value) }}
                      onBlur={e => maybeRequestGeolocation(e.target.value)}
                      placeholder={widget.placeholder || 'you@example.com'}
                      className={`w-full ${inputPad} bg-white border-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition ${error ? 'border-brutal-red' : 'border-brutal-fg'}`}
                      required
                      autoFocus
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'wf-error' : undefined}
                    />
                  </div>
                  {fields.phone?.required && (
                    <div className="space-y-2">
                      <label htmlFor="wf-phone" className="sr-only">Phone number</label>
                      <input
                        id="wf-phone"
                        type="tel"
                        name="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Phone number"
                        required
                        className={inputCls}
                      />
                      {phone.length > 0 && phone.length < 10 && (
                        <p className="text-[9px] text-brutal-muted font-bold">Enter 10-digit number e.g. 5125550199</p>
                      )}
                      {widgetType !== 'sms_list' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smsConsent}
                            onChange={e => setSmsConsent(e.target.checked)}
                            className="w-4 h-4 border-3 border-brutal-fg accent-brutal-green"
                          />
                          <span className="text-[10px] font-bold text-brutal-fg/70 uppercase tracking-wider">📱 Text me about events &amp; offers</span>
                        </label>
                      )}
                    </div>
                  )}
                  {fields.postal_code?.required && (
                    <div>
                      <label htmlFor="wf-postal" className="sr-only">ZIP or postal code</label>
                      <input
                        id="wf-postal"
                        type="text"
                        name="postal-code"
                        autoComplete="postal-code"
                        value={postal}
                        onChange={e => setPostal(e.target.value)}
                        placeholder="ZIP code"
                        required
                        className={inputCls}
                      />
                    </div>
                  )}
                  {widgetType === 'feedback' && (
                    <div>
                      <label htmlFor="wf-message" className="sr-only">Your feedback</label>
                      <textarea
                        id="wf-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Your feedback..."
                        rows={3}
                        maxLength={2000}
                        className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition resize-y"
                      />
                    </div>
                  )}
                  {/* No button: the browser is asked automatically once the
                      address looks valid. This is only a status line, and only
                      where there is room for one. */}
                  {collectLocation && !isSlim && (geoLoading || geoCoords) && (
                    <p className="text-[9px] text-brutal-muted font-bold uppercase tracking-wider text-center">
                      {geoLoading ? '📍 Locating...' : '📍 Content will be personalized near you'}
                    </p>
                  )}

                  {error && !isSlim && (
                    <p id="wf-error" role="alert" className="text-[10px] font-bold text-brutal-red uppercase tracking-wider">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`${isSlim ? 'shrink-0 px-4' : 'w-full'} border-3 text-white font-bold ${buttonPad} uppercase tracking-wider hover:shadow-brutal disabled:opacity-50 transition active:translate-y-0.5`}
                    style={{ backgroundColor: styles.primary_color || '#0a0a0a', borderColor: styles.border_color || '#0a0a0a', color: styles.button_text_color || '#ffffff' }}
                  >
                    {submitting ? 'Sending...' : widget.button_text}
                  </button>
                </form>
                {/* Slim has no room inline, so errors sit under the strip. */}
                {error && isSlim && (
                  <p id="wf-error" role="alert" className="mt-1 text-[10px] font-bold text-brutal-red uppercase tracking-wider">{error}</p>
                )}
              </>
            )}
          </div>

          {/* Footer - dropped entirely in slim, where it would roughly double
              the height of the strip. Location is no longer described as
              optional here because it is no longer a button the visitor picks;
              the browser's own permission prompt is the point of consent. */}
          {!isSlim && (
            <div className="px-6 py-3 border-t-3" style={{ borderColor: styles.border_color || '#0a0a0a' }}>
              <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider text-center">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
