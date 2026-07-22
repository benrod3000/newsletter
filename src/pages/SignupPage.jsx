import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { authAPI, oauthUrl } from '../lib/api'
import { normalizeAuthError, requiresNewSecurityCheck } from '../lib/authErrors'
import { useRetryCountdown } from '../hooks/use-retry-countdown'
import Input from '../components/ui/Input'
import Btn from '../components/ui/Button'
import Turnstile from '../components/Turnstile'

/** Matches the server's own rule in /api/auth/signup. */
const MIN_PASSWORD_LENGTH = 6

export default function SignupPage() {
  useEffect(() => { document.title = 'Create Account | Veloce' }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileError, setTurnstileError] = useState('')

  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const retryIn = useRetryCountdown(error?.retryAfter)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const fe = {}
    if (!email.includes('@')) fe.email = 'Enter a valid email'
    if (password.length < MIN_PASSWORD_LENGTH) fe.password = `At least ${MIN_PASSWORD_LENGTH} characters`
    if (Object.keys(fe).length) { setFieldErrors(fe); return }

    setLoading(true)
    try {
      const { data } = await authAPI.signup(email, password, workspaceName || undefined, turnstileToken)
      setAuth({
        token: data.token,
        workspaceId: data.workspaceId,
        email: data.email,
        role: data.role,
        workspaceName: data.workspace_name,
      })
      navigate('/dashboard')
    } catch (err) {
      const normalized = normalizeAuthError(err, { fallback: 'Signup failed. Try again.' })

      // Route the server's message to the input it belongs to, so the fix is
      // where the user is looking rather than in a banner above the form.
      if (normalized.field) {
        setFieldErrors({ [normalized.field]: normalized.message })
      }
      setError(normalized)

      // A used or rejected token can't be replayed. Anything else — a duplicate
      // email, a rate limit — leaves the solved challenge valid, and clearing it
      // would force a pointless re-solve on the retry.
      if (requiresNewSecurityCheck(err)) setTurnstileToken('')
    } finally {
      setLoading(false)
    }
  }

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH
  const rateLimited = retryIn > 0

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
          {/* Field-level failures already render on the input itself; repeating
              them in the banner would say the same thing twice. */}
          {error && !error.field && (
            <div id="signup-error" role="alert" className="border-3 border-brutal-fg bg-brutal-yellow p-3 text-brutal-fg space-y-1">
              <p className="text-xs font-bold uppercase">{error.message}</p>
              {rateLimited && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg/70">
                  Try again in {retryIn}s
                </p>
              )}
            </div>
          )}

          {/* The 409 case: this person already has an account, so the useful
              next step is signing in, not rewording their email. */}
          {error?.action && (
            <div className="border-3 border-brutal-fg bg-brutal-surface p-3">
              <Link
                to={error.action.to}
                state={{ email }}
                className="text-xs font-bold uppercase tracking-wider text-brutal-green underline underline-offset-2 hover:text-brutal-fg transition"
              >
                {error.action.label} →
              </Link>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({}) }}
              placeholder="you@example.com"
              required
              autoFocus
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({}) }}
              placeholder={`${MIN_PASSWORD_LENGTH}+ characters`}
              required
              minLength={MIN_PASSWORD_LENGTH}
              error={fieldErrors.password}
              helperText={
                password.length === 0
                  ? `At least ${MIN_PASSWORD_LENGTH} characters`
                  : passwordLongEnough
                    ? '✓ Long enough'
                    : `${MIN_PASSWORD_LENGTH - password.length} more character${MIN_PASSWORD_LENGTH - password.length === 1 ? '' : 's'}`
              }
            />
            <Input
              label={<span>Workspace Name <span className="text-brutal-muted font-normal">(optional)</span></span>}
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Newsletter"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <Turnstile
                onVerify={(t) => { setTurnstileToken(t); setTurnstileError('') }}
                onExpire={() => setTurnstileToken('')}
                onError={setTurnstileError}
              />
            </div>
            {/* Submit stays disabled until the challenge settles. Without this
                the button just sits greyed out and the user has no idea why. */}
            {!turnstileToken && (
              turnstileError ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-fg text-center" role="status">
                  {turnstileError}
                </p>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted-on-light text-center" role="status">
                  Waiting for security check…
                </p>
              )
            )}
          </div>

          <Btn
            variant="primary"
            type="submit"
            disabled={loading || rateLimited || (!turnstileToken && !turnstileError)}
            loading={loading}
            fullWidth
            size="lg"
          >
            {loading ? 'Creating account...' : rateLimited ? `Try again in ${retryIn}s` : 'Create Account'}
          </Btn>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-brutal-fg/15" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted">or sign up with</span>
            <span className="flex-1 h-px bg-brutal-fg/15" />
          </div>
          <div className="flex gap-3">
            <a href={oauthUrl('google')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-3 border-brutal-fg bg-white text-xs font-bold uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </a>
            <a href={oauthUrl('github')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-3 border-brutal-fg bg-white text-xs font-bold uppercase tracking-wider hover:shadow-brutal hover:-translate-y-0.5 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
        </div>

        <p className="text-xs font-bold text-brutal-muted uppercase tracking-wider text-center">
          <Link to="/login" className="hover:text-brutal-fg transition">Already have an account? Sign in →</Link>
        </p>
      </div>
    </main>
  )
}
