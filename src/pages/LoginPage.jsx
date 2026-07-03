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
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Veloce
          </p>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Access
            <span className="block text-zinc-400">Workspace</span>
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Login to manage subscribers, campaigns, automations, and branding.
          </p>
        </div>

        <div className="h-px w-16 bg-zinc-800" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-xs border border-zinc-800 p-2 text-zinc-400">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-white"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-white"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">Workspace ID</label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-white"
              placeholder="optional"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-zinc-700 py-2 text-sm uppercase tracking-wide hover:border-white transition"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-xs text-zinc-600">
          Minimal system interface. No marketing gloss.
        </p>
      </div>
    </main>
  )
}