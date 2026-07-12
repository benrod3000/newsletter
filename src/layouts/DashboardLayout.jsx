import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▣' },
  { path: '/dashboard/campaigns', label: 'Campaigns', icon: '■' },
  { path: '/dashboard/subscribers', label: 'Subscribers', icon: '●' },
  { path: '/dashboard/lists', label: 'Lists', icon: '☰' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: '▲' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { role, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg">
      {/* Top Bar */}
      <div className="border-brutal border-b border-brutal-fg bg-brutal-yellow px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1.5 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-sm uppercase tracking-wide hover:opacity-80"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
          <h1 className="text-lg font-heading tracking-wider uppercase leading-none">Veloce</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-wide text-brutal-fg/60">{role}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border-brutal border-brutal-fg bg-white text-brutal-fg font-bold text-xs uppercase tracking-wide hover:opacity-80"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`border-r-brutal border-r border-brutal-fg bg-brutal-bg transition-all duration-200 ${
            sidebarOpen ? 'w-56' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 text-xs font-bold uppercase tracking-wide border-brutal transition ${
                    isActive
                      ? 'border-brutal-fg bg-brutal-yellow text-brutal-fg'
                      : 'border-transparent text-brutal-muted hover:border-brutal-fg hover:text-brutal-fg bg-transparent'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-brutal-bg">
          <Outlet />
        </div>
      </div>
    </div>
  )
}