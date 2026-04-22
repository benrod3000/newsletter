# Newsletter - Client Portal

A modern, white-label email marketing client portal built with React and Vite. Manage subscribers, campaigns, automations, and branding for your email marketing platform.

## Features

- 📧 **Subscriber Management** - Add, segment, and manage email lists
- 📬 **Campaign Dashboard** - Monitor open rates, click rates, and campaign performance
- 🤖 **Workflow Automation** - Set up trigger-based automations (subscriber joins, lead magnet claims, location changes, scheduled actions)
- 🎨 **White-Label Branding** - Customize logos, colors, domain names, and sender information
- 🔐 **Multi-Tenant Workspace Isolation** - Role-based access control (owner, editor, viewer)
- 📊 **Analytics & Reporting** - Real-time campaign metrics and subscriber insights
- 🌙 **Dark Mode** - Native dark/light theme support with Tailwind CSS

## Tech Stack

- **Frontend Framework**: React 19.2.4
- **Build Tool**: Vite 8.0.4
- **State Management**: Zustand (auth) + localStorage persistence
- **HTTP Client**: Axios with JWT interceptors
- **UI Framework**: Tailwind CSS with custom dark theme
- **Routing**: React Router v6
- **Build Time**: 259ms
- **Bundle Size**: 304KB unminified → 96KB gzipped

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Environment variables configured

### Installation

```bash
git clone https://github.com/benrod3000/newsletter.git
cd newsletter
npm install
```

### Environment Setup

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   └── api.js              # Axios client with JWT interceptors
├── stores/
│   └── authStore.js        # Zustand auth state management
├── pages/
│   ├── Dashboard/
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
