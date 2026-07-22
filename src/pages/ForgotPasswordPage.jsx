import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Btn from '../components/ui/Button'
import Input from '../components/ui/Input'
import Turnstile from '../components/Turnstile'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function ForgotPasswordPage() {
  useEffect(() => { document.title = 'Forgot Password | Veloce' }, [])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileError, setTurnstileError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    // A failed widget must not lock the user out; the server still verifies.
    if (!turnstileToken && !turnstileError) { setError('Please complete the security check.'); return }
    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email })
      setSent(true)
    } catch (err) {
      const apiErr = err?.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">Account Recovery</p>
          <h1 className="text-4xl sm:text-5xl font-heading tracking-tight leading-[0.9] uppercase">
            Reset
            <span className="block text-brutal-muted mt-1">Password</span>
          </h1>
          <p className="text-sm text-brutal-fg/70 leading-relaxed">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="h-1 w-16 bg-brutal-fg" />

        {sent ? (
          <div className="space-y-4">
            <div className="border-3 border-brutal-fg bg-brutal-green/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-green">✓ Reset link sent</p>
              <p className="text-xs text-brutal-fg/70 mt-1">Check your email. The link expires in 1 hour.</p>
            </div>
            <Btn variant="primary" fullWidth size="lg" onClick={() => window.location.href = '/login'}>
              Back to Sign In
            </Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-xs font-bold uppercase border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg">{error}</div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            {!sent && <div className="flex justify-center">
            <Turnstile
              onVerify={(t) => { setTurnstileToken(t); setTurnstileError('') }}
              onExpire={() => setTurnstileToken('')}
              onError={setTurnstileError}
            />
          </div>}

          <Btn variant="primary" fullWidth type="submit" disabled={loading || (!sent && !turnstileToken && !turnstileError)} loading={loading} size="lg">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Btn>
          </form>
        )}

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center">
          <Link to="/login" className="hover:text-brutal-fg transition">← Back to sign in</Link>
        </p>
      </div>
    </main>
  )
}
