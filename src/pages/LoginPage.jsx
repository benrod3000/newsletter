import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      setError(err.response?.data?.error || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-brutal-bg text-brutal-fg flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">
            Veloce
          </p>

          <h1 className="text-4xl sm:text-5xl font-heading tracking-tight leading-[0.9] uppercase">
            Access
            <span className="block text-brutal-muted mt-1">Workspace</span>
          </h1>

          <p className="text-sm text-brutal-fg/70 leading-relaxed">
            Login to manage subscribers, campaigns, automations, and branding.
          </p>
        </div>

        <div className="h-1 w-16 bg-brutal-fg" />

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-xs font-bold uppercase border-brutal border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-brutal border-brutal-fg px-4 py-2.5 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-brutal border-brutal-fg px-4 py-2.5 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60">Workspace ID</label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full bg-white border-brutal border-brutal-fg px-4 py-2.5 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted"
              placeholder="optional"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border-brutal border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold py-3 text-sm uppercase tracking-wider hover:opacity-80 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider">
          Minimal system interface. No marketing gloss.
        </p>
      </div>
    </main>
  )
}