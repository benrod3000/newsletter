import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import LoadingState from '../components/ux/LoadingState'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function WidgetFormPage() {
  const { slug } = useParams()
  const [widget, setWidget] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setSubmitting(true)
    try {
      await axios.post(`${API_URL}/api/public/forms/${slug}/submit`, { email: email.trim() })
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
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-6">
      <div className={`w-full ${sizeCls}`}>
        <div className="border-3 border-brutal-fg bg-white shadow-brutal">
          {/* Header */}
          <div className="border-b-3 border-brutal-fg bg-brutal-yellow px-6 py-4">
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
                <p className="text-sm text-brutal-fg/70 leading-relaxed">
                  {widget.description}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {error && (
                    <p className="text-[10px] font-bold text-brutal-red uppercase tracking-wider">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full border-3 border-brutal-fg bg-brutal-fg text-white font-bold py-3 text-sm uppercase tracking-wider hover:bg-brutal-fg/80 hover:shadow-brutal disabled:opacity-50 transition active:translate-y-0.5"
                  >
                    {submitting ? 'Sending...' : widget.button_text}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-3 border-brutal-fg px-6 py-3">
            <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider text-center">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
