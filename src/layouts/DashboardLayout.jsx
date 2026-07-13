import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  LayoutDashboard, Mail, Users, Layers, BarChart3,
  Settings, Zap, ChevronLeft, ChevronRight, Search,
  HelpCircle, LogOut, Globe, Menu, X
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [
      { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Create',
    items: [
      { path: '/dashboard/campaigns', label: 'Campaigns', icon: Mail },
      { path: '/dashboard/settings', label: 'Automations', icon: Zap },
    ],
  },
  {
    label: 'Audience',
    items: [
      { path: '/dashboard/subscribers', label: 'Subscribers', icon: Users },
      { path: '/dashboard/lists', label: 'Segments', icon: Layers },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/dashboard/widgets', label: 'Widgets', icon: Globe },
      { path: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { email, role, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  const closeMobile = () => setMobileOpen(false)
  const navLinkClick = () => { closeMobile() }

  const sidebarContent = (
    <>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label || 'overview'} className="space-y-1">
            {group.label && sidebarOpen && (
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-brutal-muted/50">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={navLinkClick}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`flex items-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider border-3 transition-all ${
                    active
                      ? 'border-brutal-fg bg-brutal-yellow shadow-[2px_2px_0px_#0a0a0a]'
                      : 'border-transparent text-brutal-fg/40 hover:text-brutal-fg hover:border-brutal-fg hover:bg-brutal-bg'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="border-t-3 border-brutal-fg p-4 space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted/40">Account</p>
          <p className="text-[10px] font-mono font-bold truncate">{email}</p>
          <p className="text-[10px] font-bold text-brutal-muted uppercase tracking-wider">{role || 'Admin'}</p>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b-3 border-brutal-fg bg-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger — visible on screens < lg */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 border-3 border-brutal-fg bg-brutal-bg hover:shadow-brutal active:translate-y-0.5 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop sidebar toggle — visible on lg+ */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 border-3 border-brutal-fg bg-brutal-bg hover:shadow-brutal active:translate-y-0.5 transition"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>

          <Link to="/dashboard" className="font-heading text-2xl tracking-wider uppercase leading-none select-none">
            <span className="text-brutal-green">Vel</span>oce
          </Link>

          {/* Workspace switcher */}
          <div className="hidden md:flex items-center gap-2 ml-2 px-3 py-1 border-2 border-brutal-fg bg-brutal-bg cursor-pointer hover:bg-brutal-yellow transition-colors">
            <Globe size={12} className="text-brutal-muted" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider truncate max-w-[120px]">
              {email?.split('@')[0] || 'Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">
            <Search size={14} />
            <span className="hidden lg:inline">Search</span>
          </button>
          <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">
            <HelpCircle size={14} />
            <span className="hidden lg:inline">Help</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 border-3 border-brutal-fg bg-brutal-red text-white font-bold text-[10px] uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile overlay backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-brutal-fg/30 lg:hidden"
            onClick={closeMobile}
          />
        )}

        {/* Mobile sidebar drawer */}
        <aside
          className="fixed inset-y-0 left-0 z-50 w-64 border-r-3 border-brutal-fg bg-white flex flex-col shadow-brutal lg:hidden"
          style={{ transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 300ms ease-out' }}
        >
          {/* Close button for mobile drawer */}
          <div className="flex justify-end p-2 border-b-3 border-brutal-fg">
            <button
              onClick={closeMobile}
              className="p-1.5 border-3 border-brutal-fg bg-brutal-bg hover:bg-brutal-yellow transition"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          {sidebarContent}
        </aside>

        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:flex border-r-3 border-brutal-fg bg-white transition-all duration-300 ease-out z-30 flex-col ${
            sidebarOpen ? 'w-56' : 'w-16'
          } shrink-0`}
        >
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-brutal-bg overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
            <div className="animate-fade-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}