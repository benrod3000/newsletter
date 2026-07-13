import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email })
      setSent(true)
      if (data.reset_url) setResetLink(data.reset_url)
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
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-green">✓ Reset link generated</p>
            </div>
            {resetLink && (
              <div className="border-3 border-brutal-fg bg-brutal-yellow/20 p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">
                  Reset link (in production this would be emailed):
                </p>
                <a href={resetLink} className="block text-xs font-bold text-brutal-green underline break-all">
                  {resetLink}
                </a>
              </div>
            )}
            <Link to="/login" className="block w-full border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold py-3 text-sm uppercase tracking-wider text-center hover:shadow-brutal transition">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-xs font-bold uppercase border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg">{error}</div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold py-3 text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 disabled:opacity-40 transition">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center">
          <Link to="/login" className="hover:text-brutal-fg transition">← Back to sign in</Link>
        </p>
      </div>
    </main>
  )
}
