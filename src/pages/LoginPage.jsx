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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
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

      <main className="min-h-screen px-4 py-10 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">Authentication</p>
              <h1 className="mt-2 text-4xl font-bold text-white">Client Login</h1>
              <p className="mt-1 text-sm text-zinc-400">Access your workspace dashboard and campaign tools</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-10 lg:items-start">
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/30">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">Sign in</h2>

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

                <div className="mt-6 border-t border-zinc-800 pt-5 text-sm text-zinc-400">
                  <p>
                    Don&apos;t have an account?{' '}
                    <Link to="/" className="text-amber-400 hover:underline">
                      Contact your administrator
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 xl:col-span-5">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">What you can do here</h3>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">✉️ Build and send campaigns</li>
                  <li className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">👥 Manage subscribers and lists</li>
                  <li className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">📊 Review open/click performance</li>
                  <li className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">🎨 Update workspace branding</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-16 border-t border-zinc-800 pt-8 text-center">
            <p className="text-xs text-zinc-600">Elite newsletter platform • Built for agencies and high-performance teams</p>
          </div>
        </div>
      </main>
    </div>
  )
}
