import { Link, Outlet, useLocation } from 'react-router-dom'

/*
 * Only pages that exist.
 *
 * This listed 18 entries and 13 of them had no content. App.jsx mapped each one
 * to <DocsIntro /> or <Setup />, so clicking "Widgets" or "Automations" silently
 * returned the documentation introduction - not a 404, which at least tells the
 * truth, but a page that looked deliberate and answered nothing. Two of the
 * sections were worse than empty: "Templates" advertised a feature that had been
 * removed from the product, and the three API pages advertised an API that does
 * not exist.
 *
 * Adding a link here without a route and a page is the same bug again. Write the
 * page first.
 */
const SIDEBAR = [
  { heading: 'Getting Started', links: [
    { to: '/docs', label: 'Introduction', exact: true },
    { to: '/docs/quickstart', label: 'Quickstart' },
    { to: '/docs/setup', label: 'Setup Guide' },
  ]},
  { heading: 'Account', links: [
    { to: '/docs/security', label: 'Security & Privacy' },
    { to: '/docs/changelog', label: 'Changelog' },
    { to: '/docs/faq', label: 'FAQ' },
  ]},
]

export default function DocsLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg flex flex-col">
      {/* Nav */}
      <nav className="border-b-3 border-brutal-fg bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-heading text-xl uppercase tracking-wider hover:text-brutal-green transition-colors">Veloce</Link>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/60 hover:text-brutal-fg transition-colors">Docs</Link>
            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-brutal-fg/50 hover:text-brutal-fg transition-colors">Home</Link>
            <Link to="/signup" className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r-3 border-brutal-fg bg-white hidden md:block">
          <nav className="p-4 space-y-6">
            {SIDEBAR.map((section) => (
              <div key={section.heading}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-brutal-muted mb-2">{section.heading}</p>
                <ul className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = link.exact
                      ? location.pathname === link.to
                      : location.pathname.startsWith(link.to)
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className={`block px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                            isActive
                              ? 'bg-brutal-yellow text-brutal-fg border-l-3 border-brutal-fg'
                              : 'text-brutal-muted hover:text-brutal-fg hover:bg-brutal-surface/50'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 sm:p-10 max-w-3xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
