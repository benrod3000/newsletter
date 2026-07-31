/**
 * Sentry initialisation, deliberately in its own module.
 *
 * This has to run before any other application code. ES imports are hoisted and
 * evaluated before the importing module's body, so calling Sentry.init() inside
 * main.jsx underneath `import App from './App.jsx'` meant App and its entire
 * import graph - stores, the API client, every page module - had already
 * executed by the time Sentry started. Anything that threw at module scope in
 * that graph was invisible. A sidecar imported first is the only ordering that
 * actually holds.
 *
 * Nothing is sent unless VITE_SENTRY_DSN is set, so local development and any
 * environment without the variable stay silent rather than erroring.
 */
import { useEffect } from 'react'
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_VERCEL_ENV || import.meta.env.MODE || 'development',
  integrations: [
    // Router-aware rather than the generic browser tracing integration, so a
    // navigation is reported as its route pattern. Keyed by raw URL instead,
    // every subscriber detail page became its own transaction name.
    Sentry.reactRouterV7BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    // Masking is not configured here on purpose: replayIntegration already
    // defaults maskAllText, maskAllInputs and blockAllMedia to true, which is
    // what this app needs given every dashboard page renders subscriber
    // names, emails and locations.
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.02,
  replaysOnErrorSampleRate: 1.0,
})
