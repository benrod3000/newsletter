import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'
import Button from '../components/ui/Button'

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
      const apiErr = err.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">
            Welcome back
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
            <div className="text-xs font-bold uppercase border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5">Workspace ID</label>
              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                placeholder="Leave blank for default"
              />
              <p className="text-xs font-bold text-brutal-muted mt-1.5 uppercase tracking-wider">
                Provided by your account manager
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            type="submit"
            disabled={loading}
            loading={loading}
            size="lg"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </Button>
        </form>

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center pt-1">
          <Link to="/forgot-password" className="hover:text-brutal-fg transition">Forgot password?</Link>
        </p>

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center">
          <a href="/" className="hover:text-brutal-fg transition">← Back to home</a>
          {' · '}
          <Link to="/signup" className="hover:text-brutal-fg hover:underline transition">Create account</Link>
          {' · '}Minimal system. No marketing gloss.
        </p>
      </div>
    </main>
  )
}