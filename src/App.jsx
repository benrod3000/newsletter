import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ToastProvider } from './components/Toast'

gsap.registerPlugin(ScrollTrigger)
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/Dashboard/Home'
import SubscribersPage from './pages/Dashboard/Subscribers'
import CampaignsPage from './pages/Dashboard/Campaigns'
import ListsPage from './pages/Dashboard/Lists'
import AnalyticsPage from './pages/Dashboard/Analytics'
import SettingsPage from './pages/Dashboard/Settings'
import WidgetsPage from './pages/Dashboard/Widgets'
import WidgetFormPage from './pages/WidgetForm'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DemoPage from './pages/Demo'

// =============================================
// Veloce Motion System — GSAP animations
// =============================================

/**
 * Staggered reveal of children on mount.
 * Use on a container div — animates direct children.
 */
export function useReveal(ref, options = {}) {
  const {
    y = 24,
    duration = 0.55,
    delay = 0,
    stagger = 0.08,
    opacity = 0,
    ease = 'power3.out',
  } = options

  useEffect(() => {
    if (!ref?.current) return
    const elements = Array.from(ref.current.children)
    if (!elements.length) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        { opacity, y },
        { opacity: 1, y: 0, duration, delay, stagger, ease }
      )
    }, ref)

    return () => ctx.revert()
  }, [ref, y, duration, delay, stagger, opacity, ease])
}

/**
 * Scroll-triggered reveal — elements animate in when they enter the viewport.
 */
export function useScrollReveal(selector, options = {}) {
  const {
    y = 40,
    opacity = 0,
    duration = 0.6,
    stagger = 0.08,
    start = 'top 85%',
    ease = 'power3.out',
  } = options

  useLayoutEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elements,
        { opacity, y },
        {
          opacity: 1, y: 0, duration, stagger, ease,
          scrollTrigger: { trigger: elements[0], start, toggleActions: 'play none none none' },
        }
      )
    })

    return () => ctx.revert()
  }, [selector, y, opacity, duration, stagger, start, ease])
}

/**
 * Page-level entrance animation — staggers children with fade-up.
 */
export function PageTransition({ children, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const children = Array.from(ref.current.children)
    if (!children.length) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        children,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.05, ease: 'power2.out' }
      )
    }, ref)

    return () => ctx.revert()
  }, [])

  return <div ref={ref} className={className}>{children}</div>
}

// =============================================
// Layouts
// =============================================

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      {/* Top nav — full width with inner grid */}
      <div className="border-b-3 border-brutal-fg bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-xl uppercase tracking-wider leading-none hover:text-brutal-green transition-colors">Veloce</Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">Login</Link>
            <Link to="/signup" className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-green text-white font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">Sign Up</Link>
            <Link to="/demo" className="px-3 py-1.5 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition">Demo</Link>
          </div>
        </div>
      </div>

      {/* Main content — generous breathing room, constrained grid */}
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
      <BrowserRouter>
        <ErrorBoundary>
        <CommandPalette />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <ErrorBoundary><LandingPage /></ErrorBoundary>
              </PublicLayout>
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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App