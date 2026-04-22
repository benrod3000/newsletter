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
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] text-white">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800 bg-gradient-to-b from-zinc-950/98 to-zinc-950/95 px-3 py-3 sm:px-6 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
              <span className="text-sm font-bold text-black">📬</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Newsletter</p>
              <p className="font-semibold text-white">Elite Hub</p>
            </div>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/40"
          >
            Back to site
          </Link>
        </div>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 pt-28">
        <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-black/30">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300">Client Access</div>
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-xs text-amber-300">Secure Login</div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">Authentication</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Newsletter Elite</h1>
            <p className="mt-1 text-sm text-zinc-400">Log in to your client portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Workspace ID (optional)
              </label>
              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="Leave empty for default workspace"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-2 font-bold text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-zinc-800 pt-5 text-center text-sm text-zinc-400">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/" className="text-amber-400 hover:underline">
                Contact your administrator
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
