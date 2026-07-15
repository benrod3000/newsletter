import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/ui/Button'

const API_URL = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, password })
      setDone(true)
    } catch (err) {
      const apiErr = err?.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Reset failed. The link may have expired.')
    } finally { setLoading(false) }
  }

  if (!token) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="border-3 border-brutal-fg bg-brutal-yellow p-6">
            <p className="text-xs font-bold uppercase tracking-wider">No reset token provided.</p>
          </div>
          <Link to="/login" className="text-xs font-bold uppercase tracking-wider hover:text-brutal-fg transition">← Back to sign in</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">Set New Password</p>
          <h1 className="text-4xl sm:text-5xl font-heading tracking-tight leading-[0.9] uppercase">New<span className="block text-brutal-muted mt-1">Password</span></h1>
        </div>
        <div className="h-1 w-16 bg-brutal-fg" />
        {done ? (
          <div className="space-y-4">
            <div className="border-3 border-brutal-fg bg-brutal-green/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brutal-green">✓ Password reset successfully</p>
            </div>
            <Button variant="primary" fullWidth size="lg" onClick={() => window.location.href = '/login'}>Sign In</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-xs font-bold uppercase border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg">{error}</div>}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                placeholder="6+ characters" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full border-3 border-brutal-fg bg-brutal-green text-white font-bold py-3 text-sm uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 disabled:opacity-40 transition">
              {loading ? 'Resetting...' : 'Reset Password'}
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
