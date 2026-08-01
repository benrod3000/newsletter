import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

/**
 * Release identifier for Sentry.
 *
 * Vercel exposes the commit SHA to the build as VERCEL_GIT_COMMIT_SHA, but that
 * is a build-time variable and Vite only forwards VITE_-prefixed values to the
 * client, so it is injected through `define` below rather than read at runtime.
 * Without a release every event is attributed to "unknown", which means Sentry
 * cannot say which deploy introduced a regression and cannot match an error to
 * the source maps uploaded for that build.
 */
const release =
  process.env.VITE_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || null

/**
 * Source map upload is opt-in on the presence of an auth token, so a build
 * without one still succeeds rather than failing in CI or on a fresh clone. The
 * token is a real secret and belongs only in the Vercel environment.
 */
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default defineConfig({
  plugins: [
    react(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG || 'brod3000',
            project: process.env.SENTRY_PROJECT || 'javascript-react',
            authToken: sentryAuthToken,
            release: release ? { name: release } : undefined,
            // Upload the maps, then delete them, so Sentry can symbolicate
            // stack traces without the maps being served next to the bundle.
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
          }),
        ]
      : []),
  ],
  build: {
    target: 'esnext',
    /**
     * Generated only when there is a token to upload them with, and 'hidden'
     * so no //# sourceMappingURL comment is emitted.
     *
     * Plain `true` was wrong in the no-token case: it both published the .map
     * files and pointed at them from the bundle, which hands out readable
     * source to anyone - strictly worse than having no maps at all, which is
     * where this started. With a token the maps are built, uploaded, and then
     * deleted by filesToDeleteAfterUpload above, so Sentry can symbolicate
     * while nothing extra is ever served.
     */
    sourcemap: sentryAuthToken ? 'hidden' : false,
  },
  define: {
    'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(release),
  },
})
