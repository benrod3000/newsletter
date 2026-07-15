import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { lazy, Suspense } from 'react'
import { ToastProvider } from './components/Toast'

import CommandPalette from './components/CommandPalette'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import HelpPanel from './components/HelpPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { CommandActionProvider } from './components/CommandActionContext'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './App.css'

// Pages — code-split dashboard for faster initial load
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
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const DashboardHome = lazy(() => import('./pages/Dashboard/Home'))
const SubscribersPage = lazy(() => import('./pages/Dashboard/Subscribers'))
const CampaignsPage = lazy(() => import('./pages/Dashboard/Campaigns'))
const ListsPage = lazy(() => import('./pages/Dashboard/Lists'))
const AnalyticsPage = lazy(() => import('./pages/Dashboard/Analytics'))
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

// Re-export GSAP hooks for backward compatibility
export { useReveal, useScrollReveal, useTerminalReveal, PageTransition } from './hooks/use-gsap'

// =============================================
// Layouts
// =============================================

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      {/* Top nav — matching landing page style */}
      <div className="sticky top-0 z-50 border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl uppercase tracking-wider leading-none hover:text-brutal-green transition-colors">Veloce</Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="hidden sm:block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors">Home</Link>
            <Link to="/demo" className="hidden sm:block text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors">Demo</Link>
            <span className="hidden sm:block w-px h-5 bg-brutal-fg/15" />
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">Sign In</Link>
            <Button variant="primary" size="md" onClick={() => window.location.href = '/signup'}>Get Started</Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        {children}
      </div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <ToastProvider>
      <SpeedInsights />
      <Analytics />
      <BrowserRouter>
        <CommandActionProvider>
        <ErrorBoundary>
        <CommandPalette />
        <KeyboardShortcuts />
        <HelpPanel />
        <Suspense fallback={<PageLoader />}>
        <Routes>
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
              <PrivacyPage />
            }
          />

          <Route
            path="/terms"
            element={
              <TermsPage />
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
            <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="widgets" element={<ErrorBoundary><WidgetsPage /></ErrorBoundary>} />
          </Route>

          {/* Public widget form — no layout wrapper */}
          <Route path="/w/:slug" element={<ErrorBoundary><WidgetFormPage /></ErrorBoundary>} />

          {/* Public newsletter archive — no layout wrapper */}
          <Route path="/newsletter/:slug" element={<ErrorBoundary><PublicNewsletterPage /></ErrorBoundary>} />

          {/* Documentation */}
          <Route path="/docs" element={<ErrorBoundary><DocsLayout /></ErrorBoundary>}>
            <Route index element={<DocsIntro />} />
            <Route path="quickstart" element={<Quickstart />} />
            <Route path="setup" element={<Setup />} />
            <Route path="security" element={<Security />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="changelog" element={<Changelog />} />
            <Route path="features/newsletters" element={<DocsIntro />} />
            <Route path="features/subscribers" element={<DocsIntro />} />
            <Route path="features/widgets" element={<DocsIntro />} />
            <Route path="features/automations" element={<DocsIntro />} />
            <Route path="features/analytics" element={<DocsIntro />} />
            <Route path="features/sms" element={<DocsIntro />} />
            <Route path="features/templates" element={<DocsIntro />} />
            <Route path="integrations/sendgrid" element={<Setup />} />
            <Route path="integrations/ses" element={<Setup />} />
            <Route path="api/overview" element={<DocsIntro />} />
            <Route path="api/subscribers" element={<DocsIntro />} />
            <Route path="api/campaigns" element={<DocsIntro />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        </CommandActionProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App