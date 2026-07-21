# Veloce Frontend

React 19 + Vite 8 SPA. Tailwind CSS v4 (CSS-first config). Zustand for auth state. React Router v7. GSAP for animations. Leaflet for maps.

## Key files

- `src/lib/api.js` — Axios client, all API calls go through here
- `src/stores/authStore.js` — Zustand store, JWT token management
- `src/components/CommandPalette.jsx` — Cmd+K search
- `src/components/GeoFilter.jsx` — Multi-ZIP radius filter with Leaflet map
- `src/layouts/DashboardLayout.jsx` — Sidebar navigation

## Design system

Brutalist: `#f5f5f0` background, 3px black borders, no rounded corners. Bebas Neue headings. Yellow `#f5e642` CTAs. Green `#2f7f5f` data accents.

## Conventions

- New files should be `.tsx` (TypeScript migration in progress)
- API calls: always use helpers from `../../lib/api`, never raw fetch
- State: Zustand for auth, local useState for page state
