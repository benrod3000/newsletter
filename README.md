# Newsletter - Client Portal

A client portal for managing email marketing campaigns, subscribers, and automations.

Built with React and Vite as a multi-tenant dashboard for a white-label email platform.

---

## What this is

This is the frontend for a newsletter/email marketing system. It lets clients log in, manage their workspace, and handle things like:

- subscribers
- campaigns
- automations
- branding

Each workspace is isolated so data stays separate between clients.

---

## Features

- Subscriber management (lists, segments, imports)
- Campaign dashboard (open/click tracking, performance overview)
- Automation workflows (trigger-based email actions)
- White-label branding (logos, colors, sender info, domains)
- Multi-tenant workspace isolation (role-based access: owner/editor/viewer)
- Analytics dashboard (campaign + subscriber insights)
- Dark mode support

---

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Zustand (auth + workspace state)
- Axios (API client with JWT handling)
- React Router v6

---

## Performance Notes

- Production bundle: ~96KB gzipped
- Code-split routes for dashboard pages
- Lazy-loaded views for performance
- Auth state persisted in localStorage

---

## Project Structure

```
src/
├── lib/               # API client (Axios + JWT handling)
├── stores/            # Zustand state (auth + workspace)
├── pages/
│   ├── Dashboard/     # Main app views
│   ├── Login.jsx
│   ├── Landing.jsx
│   ├── Demo.jsx
│   └── Unsubscribe.jsx
└── App.jsx
```

---

## Authentication

- JWT-based auth
- 30-day token expiry
- Persistent login via localStorage
- Protected routes for authenticated users

---

## Workspaces

Each client account is fully isolated:

- workspace_id is embedded in JWT
- API validates workspace on every request
- database uses Row-Level Security (RLS)
- UI context managed through Zustand

No cross-workspace data access.

---

## API

All requests go through `/api` with JWT authentication.

Key endpoints:

- `POST /api/auth/token`
- `GET /api/auth/verify`
- `/api/clients/:workspaceId/subscribers`
- `/api/clients/:workspaceId/campaigns`
- `/api/clients/:workspaceId/branding`
- `/api/clients/:workspaceId/automations`

Full API docs are available at `/api/docs` (OpenAPI).

---

## Running locally

```bash
git clone https://github.com/benrod3000/newsletter.git
cd newsletter
npm install
npm run dev
```

App runs at:
```
http://localhost:5173
```

---

## Build

```bash
npm run build
npm run preview
```

---

## Notes

This project is still evolving. A lot of the structure is in place, but the focus right now is:

- keeping the dashboard fast
- keeping the state model simple
- making multi-tenancy safe and predictable

---

## License

MIT

---

## Support

Issues and feature requests:
https://github.com/benrod3000/newsletter/issues

---

## Related

Backend API:
https://github.com/benrod3000/newsletter-core

Version: v1.0.0-beta
Last updated: April 2026│   ├── Dashboard/
│   │   ├── Home.jsx        # Main dashboard with metrics
│   │   ├── Subscribers.jsx # Subscriber management
│   │   ├── Campaigns.jsx   # Campaign management
│   │   ├── Lists.jsx       # List management
│   │   ├── Analytics.jsx   # Performance analytics
│   │   └── Settings.jsx    # Branding & automations config
│   ├── Landing.jsx         # Public landing page
│   ├── Login.jsx           # Authentication
│   ├── Demo.jsx            # Interactive product demo
│   └── Unsubscribe.jsx     # Email unsubscribe page
└── App.jsx                 # Router setup + protected routes
```

## Key Components

### Authentication
- JWT token-based auth with 30-day expiry
- Persistent login with localStorage
- Protected routes with redirect to login

### Branding Configuration
- Logo URL with preview
- Custom brand colors (primary/secondary)
- Custom domain support
- Sender name and email customization
- Real-time updates with audit logging

### Workflow Automation
- Trigger types: subscriber_joined, lead_magnet_claimed, location_change, custom_webhook, on_schedule
- Actions: send_email, add_to_list, send_notification
- Status tracking (pending, processing, success, failed)
- Execution logging with error handling

## API Integration

All API calls route through the backend at `/api` with automatic JWT bearer token injection via Axios interceptors.

### Key Endpoints
- `POST /api/auth/token` - Login and get JWT
- `GET /api/auth/verify` - Verify current token
- `GET/POST /api/clients/{workspaceId}/subscribers` - Subscriber management
- `GET/POST /api/clients/{workspaceId}/campaigns` - Campaign management
- `GET/PUT /api/clients/{workspaceId}/branding` - Branding settings
- `GET/POST /api/clients/{workspaceId}/automations` - Workflow automation

Full API documentation available at backend `/api/docs` (OpenAPI 3.0)

## Performance

- Development build: 259ms
- Production bundle: 96KB gzipped (from 304KB unminified)
- Lazy-loaded routes for optimal code splitting
- Optimized image loading with preview support

## Workspace Isolation

Enforced at multiple levels:
1. **Database Layer**: PostgreSQL Row-Level Security (RLS) policies
2. **JWT Claims**: workspace_id embedded in token
3. **API Layer**: workspace_id validation on all protected endpoints
4. **UI Layer**: workspace context in Zustand store

No data leakage between workspaces at any layer.

## License

MIT

## Support

For issues and feature requests, visit [GitHub Issues](https://github.com/benrod3000/newsletter/issues)

---

**Backend API Repository**: [newsletter-core](https://github.com/benrod3000/newsletter-core)  
**Version**: v1.0.0-beta  
**Last Updated**: April 2026
