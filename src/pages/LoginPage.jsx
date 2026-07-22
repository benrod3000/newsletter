import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../lib/api'
import axios from 'axios'
import Btn from '../components/ui/Button'
import Turnstile from '../components/Turnstile'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [totpRequired, setTotpRequired] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [partialToken, setPartialToken] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileError, setTurnstileError] = useState('')
  const [showWorkspaceField, setShowWorkspaceField] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => { document.title = 'Sign In | Veloce' }, [])

  // Declared after the state it sets — previously these effects sat above the
  // useState calls and referenced the setters before declaration.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', ''))
    if (params.get('requires_totp') === 'true') {
      setTotpRequired(true)
      setPartialToken(params.get('partial_token') || '')
    }
    // Set by the api client's 401 interceptor so an expired session explains
    // itself instead of silently dumping the user at a login form.
    if (new URLSearchParams(window.location.search).get('expired') === '1') {
      setError('Your session expired. Please sign in again.')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const fe = {}
    if (!email.includes('@')) fe.email = 'Enter a valid email'
    if (password.length < 6) fe.password = 'At least 6 characters'
    if (Object.keys(fe).length) { setFieldErrors(fe); return }

    // Only block when the widget is working but unfinished. If it failed to
    // load, let the request through — the server verifies the token anyway,
    // and a broken widget must not be an unrecoverable lockout.
    if (!turnstileToken && !turnstileError) {
      setError('Please complete the security check.')
      return
    }

    setLoading(true)

    try {
      // Use demo-specific endpoint for demo account
      const apiUrl = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'
      const url = email.toLowerCase().trim() === 'demo@veloce.app'
        ? `${apiUrl}/api/auth/demo-login`
        : `${apiUrl}/api/auth/token`
      const response = await axios.post(url, {
        email, password,
        workspaceId: workspaceId || undefined,
        turnstile_token: turnstileToken,
      })
      const data = response.data

      if (data.requires_totp) {
        setTotpRequired(true)
        setPartialToken(data.partial_token)
        setLoading(false)
        return
      }

      setAuth(data.token, data.workspaceId, data.email, data.role)
      navigate('/dashboard')
    } catch (err) {
      const apiErr = err.response?.data?.error
      setError(typeof apiErr === 'object' ? apiErr?.message : apiErr || 'Login failed. Try again.')
      setTurnstileToken('')
    } finally {
      setLoading(false)
    }
  }

  const handleTotpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'
      const res = await fetch(`${API_BASE}/api/auth/totp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partial_token: partialToken, code: totpCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || 'Invalid code')
        return
      }

      setAuth(data.token, data.workspaceId, data.email, data.role)
      navigate('/dashboard')
    } catch {
      setError('Verification failed. Try again.')
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

        <form onSubmit={totpRequired ? handleTotpSubmit : handleSubmit} className="space-y-5">
          {error && (
            <div id="login-error" className="text-xs font-bold uppercase border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg" role="alert">
              {error}
            </div>
          )}

          {!totpRequired ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}) }}
                  className={`w-full bg-white border-3 px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition ${fieldErrors.email ? 'border-brutal-red' : 'border-brutal-fg'}`}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  aria-describedby={error ? 'login-error' : undefined}
                />
                {fieldErrors.email && <p className="mt-1 text-[9px] font-bold text-brutal-red uppercase tracking-wider">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({}) }}
                  className={`w-full bg-white border-3 px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition ${fieldErrors.password ? 'border-brutal-red' : 'border-brutal-fg'}`}
                  placeholder="••••••••"
                  required
                />
                {fieldErrors.password && <p className="mt-1 text-[9px] font-bold text-brutal-red uppercase tracking-wider">{fieldErrors.password}</p>}
                <div className="mt-2">
                  <Link to="/forgot-password" className="text-xs font-bold text-brutal-green underline underline-offset-2 hover:text-brutal-fg transition">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Advanced: almost nobody needs this, and sitting between the
                  password and the submit button it pushed the primary action
                  below the fold on mobile while asking self-serve users for an
                  id they have never been given. */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowWorkspaceField((v) => !v)}
                  className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted hover:text-brutal-fg underline underline-offset-2 transition"
                  aria-expanded={showWorkspaceField}
                  aria-controls="login-workspace"
                >
                  {showWorkspaceField ? '− Use default workspace' : '+ Sign in to a specific workspace'}
                </button>
              </div>

              <div className={showWorkspaceField ? '' : 'hidden'}>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5" htmlFor="login-workspace">Workspace ID</label>
                <input
                  type="text"
                  id="login-workspace"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm focus:outline-none focus:bg-brutal-yellow/10 placeholder:text-brutal-muted transition"
                  placeholder="Leave blank for default"
                  aria-describedby={error ? 'login-error' : undefined}
              />
              <p className="text-xs font-bold text-brutal-muted mt-1.5 uppercase tracking-wider">
                Provided by your account manager
              </p>
            </div>
          </div>
          ) : (
            <div className="space-y-4">
              <div className="border-3 border-brutal-fg bg-brutal-surface p-4 flex items-center gap-3">
                <ShieldCheck size={20} className="text-brutal-green shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Two-factor authentication required</p>
                  <p className="text-[10px] text-brutal-muted mt-0.5">Enter the code from your authenticator app or a recovery code.</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 mb-1.5" htmlFor="totp-code">Authentication Code</label>
                <input
                  id="totp-code"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full bg-white border-3 border-brutal-fg px-4 py-3 text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:bg-brutal-yellow/10 transition"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>
          )}

          {!totpRequired && !turnstileToken && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <Turnstile
                  onVerify={(t) => { setTurnstileToken(t); setTurnstileError('') }}
                  onExpire={() => setTurnstileToken('')}
                  onError={setTurnstileError}
                />
              </div>
              {turnstileError ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg text-center" role="status">
                  {turnstileError}
                </p>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted-on-light text-center" role="status">
                  Waiting for security check…
                </p>
              )}
            </div>
          )}

          <Btn
            variant="primary"
            fullWidth
            type="submit"
            disabled={loading || (!totpRequired && !turnstileToken && !turnstileError)}
            loading={loading}
            size="lg"
          >
            {totpRequired ? (loading ? 'Verifying...' : 'Verify Code') : (loading ? 'Authenticating...' : 'Login')}
          </Btn>
        </form>

        {!totpRequired && <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-brutal-fg/15" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">or continue with</span>
            <span className="flex-1 h-px bg-brutal-fg/15" />
          </div>
          <div className="flex gap-3">
            <a href="https://newsletter-core.vercel.app/api/auth/oauth/google"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-3 border-brutal-fg bg-white text-xs font-bold uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
            <a href="https://newsletter-core.vercel.app/api/auth/oauth/github"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-3 border-brutal-fg bg-white text-xs font-bold uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>}

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center pt-2">
          <Link to="/" className="hover:text-brutal-fg transition">← Back to home</Link>
          <span className="mx-3">·</span>
          <Link to="/signup" className="hover:text-brutal-fg transition">Create account</Link>
        </p>
      </div>
    </main>
  )
}