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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-5 py-10 text-white sm:px-6">
      <div className="w-full max-w-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
          Client Portal
        </p>

        <h1 className="max-w-xs text-4xl font-bold leading-tight tracking-tight text-white">
          Access{' '}
          <span className="text-amber-400">→</span>{' '}
          Workspace
        </h1>

        <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400 sm:text-base">
          Log in to manage subscribers, campaigns, branding, and automations.
          <br />
          Built for agencies and high-performance teams.
        </p>

        <div className="my-8 h-px w-16 bg-zinc-700" />

        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/35 backdrop-blur-sm sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              required
            />

            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              required
            />

            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Workspace ID (optional)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 px-6 py-3 text-sm font-bold text-black transition hover:bg-amber-300 active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Need access?{' '}
          <Link to="/" className="text-amber-400 underline underline-offset-2 hover:text-amber-300">
            Contact your administrator
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
