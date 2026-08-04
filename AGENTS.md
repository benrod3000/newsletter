# Veloce Frontend

React 19 + Vite 8 SPA. Tailwind CSS v4 (CSS-first config). Zustand for auth state. React Router v7. GSAP for animations. Leaflet for maps.

## Key files

- `src/lib/api.ts` - Axios client, all API calls go through here
- `src/stores/authStore.js` - Zustand store, JWT token management
- `src/components/CommandPalette.jsx` - Cmd+K search
- `src/components/GeoFilter.jsx` - Multi-ZIP radius filter with Leaflet map
- `src/layouts/DashboardLayout.jsx` - Sidebar navigation

## Design system

Brutalist: `#f5f5f0` background, 3px black borders, no rounded corners. Bebas Neue headings. Yellow `#f5e642` CTAs. Green `#2f7f5f` data accents.

## Conventions

- New files should be `.tsx` (TypeScript migration in progress)
- API calls: always use helpers from `../../lib/api`, never raw fetch
- State: Zustand for auth, local useState for page state


## Shipping a user-visible change

Add a `src/data/changelog.js` entry in the same commit as the change.

It was a literal array inside `Changelog.jsx` until August 2026, so updating it
meant editing a React component and it only happened when someone remembered -
it sat eight days stale while four rounds of user-facing work shipped. Moving it
to data removes the excuse, not the discipline.

- Write for someone using Veloce, not someone who built it. "You can now see how
  many people a broadcast will reach before sending it", not the function name.
- Never edit or delete a past entry to reflect a later change. Add a new one. The
  July 25 entry still announces a template picker that August 4 records removing;
  that is the correct behaviour for a changelog.
- Bug fixes count as user-visible when the user could see the bug.
