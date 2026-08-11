import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { withSentryReactRouterV7Routing } from '@sentry/react'
import { useAuthStore } from './stores/authStore'
import { lazy, Suspense, useEffect } from 'react'
import { ToastProvider } from './components/Toast'

import CommandPalette from './components/CommandPalette'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import HelpPanel from './components/HelpPanel'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import { CommandActionProvider } from './components/CommandActionContext'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { isChunkErrorMessage } from './lib/chunk-error'

// Reports navigations under their route pattern rather than the resolved URL.
// Without it every subscriber or campaign detail page is a separate transaction
// name in Sentry, which makes per-route timings meaningless.
const SentryRoutes = withSentryReactRouterV7Routing(Routes)

// Pages // code-split dashboard for faster initial load
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DemoPage = lazy(() => import('./pages/Demo'))
const WidgetFormPage = lazy(() => import('./pages/WidgetForm'))
const PublicNewsletterPage = lazy(() => import('./pages/PublicNewsletterPage'))
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/Dashboard/Home'))
const SubscribersPage = lazy(() => import('./pages/Dashboard/Subscribers'))
const CampaignsPage = lazy(() => import('./pages/Dashboard/Campaigns'))
const ListsPage = lazy(() => import('./pages/Dashboard/Lists'))
const AnalyticsPage = lazy(() => import('./pages/Dashboard/Analytics'))
const DeliverabilityPage = lazy(() => import('./pages/Dashboard/Deliverability'))
const SettingsPage = lazy(() => import('./pages/Dashboard/Settings'))
const WidgetsPage = lazy(() => import('./pages/Dashboard/Widgets'))
const DocsLayout = lazy(() => import('./pages/Docs/DocsLayout'))
const DocsIntro = lazy(() => import('./pages/Docs/DocsIntro'))
const Quickstart = lazy(() => import('./pages/Docs/Quickstart'))
const Setup = lazy(() => import('./pages/Docs/Setup'))
const Security = lazy(() => import('./pages/Docs/Security'))
const FAQ = lazy(() => import('./pages/Docs/FAQ'))
const Changelog = lazy(() => import('./pages/Docs/Changelog'))

// Fallback spinner for lazy-loaded routes
function PageLoader() { return <div className="min-h-screen bg-brutal-bg flex items-center justify-center"><div className="h-4 w-4 bg-brutal-fg animate-pulse" /></div> }

// =============================================
// Layouts
// =============================================

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      {/* Top nav // matching landing page style */}
      <div className="sticky top-0 z-50 border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl uppercase tracking-wider leading-none hover:text-brutal-green transition-colors" aria-label="Veloce home">Veloce</Link>
          <div className="flex items-center gap-6" role="navigation" aria-label="Public navigation">
            <Link to="/" className="hidden sm:block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors">Home</Link>
            <Link to="/demo" className="hidden sm:block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors">Demo</Link>
            <span className="hidden sm:block w-px h-5 bg-brutal-fg/15" aria-hidden="true" />
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">Sign In</Link>
            <Link to="/signup" className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">Get Started</Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20" tabIndex={-1}>
        {children}
      </div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    // So the login page can send them back where they were headed instead of
    // always dropping them on the dashboard.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }

  return children
}

function App() {
  // Identify who an error happened to, and which workspace they were in.
  // Without this every event is anonymous, so there is no way to tell one
  // customer hitting a bug repeatedly from many customers hitting it once, and
  // no way to filter a tenant-specific problem.
  //
  // Only the operator's own account is sent - never subscriber data, which is
  // the personal information this product is responsible for.
  const sentryEmail = useAuthStore((state) => state.email)
  const sentryWorkspaceId = useAuthStore((state) => state.workspaceId)
  const sentryRole = useAuthStore((state) => state.role)

  useEffect(() => {
    if (sentryWorkspaceId || sentryEmail) {
      Sentry.setUser({ id: sentryWorkspaceId ?? undefined, email: sentryEmail ?? undefined })
      Sentry.setTag('workspace_id', sentryWorkspaceId ?? undefined)
      Sentry.setTag('role', sentryRole ?? undefined)
    } else {
      // Signed out: stop attributing later events to the previous session.
      Sentry.setUser(null)
      Sentry.setTag('workspace_id', undefined)
      Sentry.setTag('role', undefined)
    }
  }, [sentryEmail, sentryWorkspaceId, sentryRole])

  // Auto-recover from stale code-split chunks after deployment
  useEffect(() => {
    function handleChunkError(e) {
      // Check script/link error events
      const srcMatch = e.target?.src?.includes('/assets/')
      // Check unhandled rejections (e.reason may be string or Error) and error
      // event messages (e.g. script error on fallback paths)
      if (srcMatch || isChunkErrorMessage(e.reason) || isChunkErrorMessage(e.message)) {
        window.location.reload()
      }
    }
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', handleChunkError)
    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleChunkError)
    }
  }, [])

  return (
    <ToastProvider>
      <SpeedInsights />
      <Analytics />
      <BrowserRouter>
        <ScrollToTop />
        <CommandActionProvider>
        <ErrorBoundary>
        <CommandPalette />
        <KeyboardShortcuts />
        <HelpPanel />
        <Suspense fallback={<PageLoader />}>
        <SentryRoutes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <ErrorBoundary><LandingPage /></ErrorBoundary>
            }
          />

          <Route
            path="/privacy"
            element={
              <ErrorBoundary><PrivacyPage /></ErrorBoundary>
            }
          />

          <Route
            path="/terms"
            element={
              <ErrorBoundary><TermsPage /></ErrorBoundary>
            }
          />

          <Route
            path="/login"
            element={
              <PublicLayout>
                <ErrorBoundary><LoginPage /></ErrorBoundary>
              </PublicLayout>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicLayout>
                <ErrorBoundary><SignupPage /></ErrorBoundary>
              </PublicLayout>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicLayout>
                <ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>
              </PublicLayout>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicLayout>
                <ErrorBoundary><ResetPasswordPage /></ErrorBoundary>
              </PublicLayout>
            }
          />

          <Route
            path="/demo"
            element={
              <PublicLayout>
                <ErrorBoundary><DemoPage /></ErrorBoundary>
              </PublicLayout>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ErrorBoundary><DashboardLayout /></ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<ErrorBoundary><DashboardHome /></ErrorBoundary>} />
            <Route path="subscribers" element={<ErrorBoundary><SubscribersPage /></ErrorBoundary>} />
            <Route path="campaigns" element={<ErrorBoundary><CampaignsPage /></ErrorBoundary>} />
            <Route path="lists" element={<ErrorBoundary><ListsPage /></ErrorBoundary>} />
            <Route path="analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
            <Route path="deliverability" element={<ErrorBoundary><DeliverabilityPage /></ErrorBoundary>} />
            <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="widgets" element={<ErrorBoundary><WidgetsPage /></ErrorBoundary>} />
          </Route>

          {/* Public widget form // no layout wrapper */}
          <Route path="/w/:id" element={<ErrorBoundary><WidgetFormPage /></ErrorBoundary>} />

          {/* Public newsletter archive // no layout wrapper */}
          <Route path="/newsletter/:slug" element={<ErrorBoundary><PublicNewsletterPage /></ErrorBoundary>} />
          <Route path="/oauth/callback" element={<ErrorBoundary><OAuthCallbackPage /></ErrorBoundary>} />

          {/* Documentation */}
          <Route path="/docs" element={<ErrorBoundary><DocsLayout /></ErrorBoundary>}>
            <Route index element={<DocsIntro />} />
            <Route path="quickstart" element={<Quickstart />} />
            <Route path="setup" element={<Setup />} />
            <Route path="security" element={<Security />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="changelog" element={<Changelog />} />
            {/*
              Thirteen placeholder routes stood here, each rendering <DocsIntro />
              or <Setup /> for a page that was never written - all seven
              features/*, all three api/*, and the three integrations/*. They made
              the sidebar look complete while answering nothing, and two of them
              advertised things that do not exist at all: a Templates feature that
              was removed, and an API that was never built.

              Removed along with their sidebar entries, so these now fall through
              to the 404 below. A wrong answer is worse than an honest miss.
            */}
          </Route>

          {/* 404 catch-all // must be last */}
          <Route path="*" element={
            <main className="min-h-[80vh] flex items-center justify-center">
              <div className="text-center space-y-4 max-w-sm">
                <div className="h-1 w-12 bg-brutal-red mx-auto" />
                <h1 className="text-6xl font-heading uppercase tracking-tight leading-none">404</h1>
                <p className="text-sm text-brutal-muted">This page doesn't exist.</p>
                <Link to="/" className="inline-block px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">← Back to Veloce</Link>
              </div>
            </main>
          } />
        </SentryRoutes>
        </Suspense>
        </ErrorBoundary>
        </CommandActionProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App