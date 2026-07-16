import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'
import Input from '../components/ui/Input'
import Btn from '../components/ui/Button'
import Turnstile from '../components/Turnstile'

export default function SignupPage() {
  useEffect(() => { document.title = 'Create Account | Veloce' }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!turnstileToken) {
      setError('Please complete the security check.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.signup(email, password, workspaceName || undefined, turnstileToken)
      setAuth(data.token, data.workspaceId, data.email, data.role)
      navigate('/dashboard')
    } catch (err) {
      const apiErr = err?.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Signup failed. Try again.')
      setTurnstileToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brutal-fg/50">Get started</p>
          <h1 className="text-4xl sm:text-5xl font-heading tracking-tight leading-[0.9] uppercase">
            Create
            <span className="block text-brutal-muted mt-1">Account</span>
          </h1>
          <p className="text-sm text-brutal-fg/70 leading-relaxed">
            Start sending newsletters in under a minute. No credit card required.
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
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6+ characters"
              required
              minLength={6}
            />
            <Input
              label={<span>Workspace Name <span className="text-brutal-muted font-normal">(optional)</span></span>}
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Newsletter"
            />
          </div>

          <div className="flex justify-center">
            <Turnstile onVerify={setTurnstileToken} onExpire={function() { setTurnstileToken('') }} />
          </div>

          <Btn variant="primary" type="submit" disabled={loading || !turnstileToken} loading={loading} fullWidth size="lg">
            {loading ? 'Creating account...' : 'Create Account'}
          </Btn>
        </form>

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center">
          <Link to="/login" className="hover:text-brutal-fg transition">Already have an account? Sign in →</Link>
        </p>
      </div>
    </main>
  )
}
