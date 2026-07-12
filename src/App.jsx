import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
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
import DemoPage from './pages/Demo'

// -----------------------------
// Veloce Motion System (GSAP)
// -----------------------------

export function useReveal(ref, options = {}) {
  const {
    y = 12,
    duration = 0.6,
    delay = 0,
    stagger = 0.06,
    opacity = 0,
  } = options

  useEffect(() => {
    if (!ref?.current) return

    const elements = ref.current.children

    gsap.fromTo(
      elements,
      {
        opacity,
        y,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'power2.out',
      }
    )
  }, [ref])
}

export function PageTransition({ children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
  }, [])

  return <div ref={ref}>{children}</div>
}

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg">
      <div className="max-w-6xl mx-auto px-6 py-16">
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
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />

        <Route
          path="/demo"
          element={
            <PublicLayout>
              <DemoPage />
            </PublicLayout>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="subscribers" element={<SubscribersPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App