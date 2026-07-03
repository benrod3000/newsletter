import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '█' },
  { path: '/dashboard/campaigns', label: 'Campaigns', icon: '■' },
  { path: '/dashboard/subscribers', label: 'Subscribers', icon: '●' },
  { path: '/dashboard/lists', label: 'Lists', icon: '▣' },
  { path: '/dashboard/analytics', label: 'Analytics', icon: '▤' },
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
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 border border-zinc-700 hover:bg-zinc-900"
          >
            ☰
          </button>
          <h1 className="text-sm tracking-widest uppercase">newsletter</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500 uppercase">{role}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-xs border border-zinc-700 hover:bg-zinc-900"
          >
            exit
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`border-r border-zinc-800 bg-black transition-all duration-200 ${
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
                  className={`block px-3 py-2 text-xs uppercase tracking-wide border transition ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-zinc-500 hover:text-white hover:border-zinc-700'
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
        <div className="flex-1 p-6 bg-black">
          <Outlet />
        </div>
      </div>
    </div>
  )
}