import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/dashboard/campaigns', label: 'Campaigns', icon: '✉️' },
  { path: '/dashboard/subscribers', label: 'Subscribers', icon: '👥' },
  { path: '/dashboard/lists', label: 'Lists', icon: '📋' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { email, role, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] text-white">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold">📬 Newsletter Elite</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 capitalize">{role}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm border border-zinc-700 rounded-lg hover:border-zinc-600 hover:bg-zinc-800/50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`border-r border-zinc-800 bg-zinc-950/50 transition-all duration-200 ${
            sidebarOpen ? 'w-56' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-2.5 rounded-lg transition ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                      : 'text-zinc-400 hover:bg-zinc-800'
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
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
