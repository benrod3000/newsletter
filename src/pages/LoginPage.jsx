import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(email, password, workspaceId)
      const { token, workspaceId: wId, email: userEmail, role } = response.data

      setAuth(token, wId, userEmail, role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="editorial-shell bg-[#0d0d0d] text-white">
      <div className="editorial-column">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
          Client Portal
        </p>

        <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
          Access{' '}
          <span className="text-amber-400">→</span>{' '}
          Workspace
        </h1>

        <p className="editorial-copy mt-5 text-lg leading-relaxed text-zinc-400">
          Log in to manage subscribers, campaigns, branding, and automations.
          <br />
          Built for agencies and high-performance teams.
        </p>

        <div className="my-8 h-px w-16 bg-zinc-700" />

        <form onSubmit={handleSubmit} className="editorial-form space-y-3">
          {error && (
            <p className="editorial-error">
              {error}
            </p>
          )}

          <label htmlFor="email" className="editorial-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="editorial-input"
            required
          />

          <label htmlFor="password" className="editorial-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="editorial-input"
            required
          />

          <label htmlFor="workspaceId" className="editorial-label">
            Workspace ID
          </label>
          <input
            id="workspaceId"
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="Optional"
            className="editorial-input"
          />

          <button
            type="submit"
            disabled={loading}
            className="editorial-button"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-xs text-zinc-600">
          Need access?{' '}
          <Link to="/" className="editorial-text-link">
            Contact your administrator
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
