import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import LoadingState from '../components/ux/LoadingState'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function WidgetFormPage() {
  useEffect(() => { document.title = 'Subscribe | Veloce' }, [])
  const { slug } = useParams()
  const [widget, setWidget] = useState(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [postal, setPostal] = useState('')
  const [geoCoords, setGeoCoords] = useState(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  const fields = widget?.fields || { email: { required: true } }
  const styles = widget?.styles || {}
  const widgetType = widget?.type || 'lead_magnet'

  const loadWidget = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/public/forms/${slug}`)
      setWidget(data.widget)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadWidget() }, [loadWidget])

  function requestGeolocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
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
      if (geoCoords) {
        payload.browser_latitude = geoCoords.latitude;
        payload.browser_longitude = geoCoords.longitude;
      }
      await axios.post(`${API_URL}/api/public/forms/${slug}/submit`, payload)
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
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <LoadingState label="Loading widget" />
      </div>
    )
  }

  if (notFound || !widget) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-6">
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

  const sizeClasses = {
    small: 'max-w-xs',
    medium: 'max-w-md',
    large: 'max-w-lg',
  }
  const sizeCls = sizeClasses[widget.size] || 'max-w-md'

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: styles.bg_color || '#f5f5f0' }}>
      <div className={`w-full ${sizeCls}`}>
        <div className="border-3 shadow-brutal" style={{ borderColor: styles.border_color || '#0a0a0a', backgroundColor: '#fff' }}>
          {/* Header */}
          <div className="border-b-3 px-6 py-4" style={{ backgroundColor: styles.primary_color || '#f5e642', borderColor: styles.border_color || '#0a0a0a' }}>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-tight leading-none">
              {widget.headline}
            </h1>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {submitted ? (
              <div className="space-y-3">
                <div className="h-1 w-12 bg-brutal-green" />
                <p className="text-sm font-bold uppercase tracking-wider text-brutal-green">
                  {widget.success_message}
                </p>
                <p className="text-[10px] text-brutal-muted font-bold uppercase tracking-wider">
                  Didn't get it? Check your spam folder.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed" style={{ color: styles.text_color || 'inherit' }}>
                  {widget.description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {fields.first_name?.required && (
                    <div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                      />
                    </div>
                  )}
                  {fields.last_name?.required && (
                    <div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder={widget.placeholder || 'you@example.com'}
                      className={`w-full px-4 py-3 bg-white border-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition ${error ? 'border-brutal-red' : 'border-brutal-fg'}`}
                      required
                      autoFocus
                    />
                  </div>
                  {fields.phone?.required && (
                    <div className="space-y-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Phone number"
                        className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                      />
                      {phone.length > 0 && phone.length < 10 && (
                        <p className="text-[9px] text-brutal-muted font-bold">Enter 10-digit number e.g. 5125550199</p>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConsent}
                          onChange={e => setSmsConsent(e.target.checked)}
                          className="w-4 h-4 border-3 border-brutal-fg accent-brutal-green"
                        />
                        <span className="text-[10px] font-bold text-brutal-fg/70 uppercase tracking-wider">📱 Text me about events & offers</span>
                      </label>
                    </div>
                  )}
                  {fields.postal_code?.required && (
                    <div>
                      <input
                        type="text"
                        value={postal}
                        onChange={e => setPostal(e.target.value)}
                        placeholder="ZIP code"
                        className="w-full px-4 py-3 bg-white border-3 border-brutal-fg text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                      />
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={requestGeolocation}
                      disabled={geoLoading || !!geoCoords}
                      className={`w-full border-3 text-xs font-bold uppercase tracking-wider py-2.5 transition ${
                        geoCoords
                          ? 'border-brutal-green bg-brutal-green text-white'
                          : 'border-brutal-fg bg-white text-brutal-fg hover:bg-brutal-yellow/20'
                      } disabled:opacity-50`}
                    >
                      {geoLoading ? '📍 Locating...' : geoCoords ? '📍 Location shared' : '📍 Use my location'}
                    </button>
                    <p className="text-[9px] text-brutal-muted font-bold uppercase tracking-wider mt-1 text-center">
                      {geoCoords ? 'Content will be personalized near you' : 'Optional: personalize content near you'}
                    </p>
                  </div>

                  {error && (
                    <p className="text-[10px] font-bold text-brutal-red uppercase tracking-wider">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full border-3 text-white font-bold py-3 text-sm uppercase tracking-wider hover:shadow-brutal disabled:opacity-50 transition active:translate-y-0.5"
                    style={{ backgroundColor: styles.primary_color || '#0a0a0a', borderColor: styles.border_color || '#0a0a0a', color: styles.button_text_color || '#ffffff' }}
                  >
                    {submitting ? 'Sending...' : widget.button_text}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t-3" style={{ borderColor: styles.border_color || '#0a0a0a' }}>
            <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider text-center">
              No spam. Unsubscribe anytime. &nbsp;·&nbsp; 📍 Location data may be collected for personalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
