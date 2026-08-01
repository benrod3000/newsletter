import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      /**
       * A capped baseline, not an endorsement.
       *
       * These are pre-existing violations. Blocking CI on them today would mean
       * choosing between having no CI at all and changing behaviour across the
       * dashboard with zero test coverage to catch a mistake - both worse than
       * the debt itself.
       *
       * They are warnings, and `npm run lint:ci` caps the total warning count, so
       * the debt can shrink but never grow. Fix some, then lower the cap in
       * package.json. Never raise it.
       *
       * Worth knowing what is in here:
       * - `no-empty` is 11 empty catch blocks - failures currently vanish with no
       *   log and no user feedback. Each needs a per-site decision (report, toast,
       *   or an explicit comment saying why it is safe to swallow).
       * - `set-state-in-effect` and `exhaustive-deps` are real render-correctness
       *   smells, mostly in the five oversized dashboard pages.
       */
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      'no-empty': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    /**
     * Build configuration runs in Node, not the browser. Without this the
     * browser globals above are the only ones in scope, so reading
     * process.env - which is how the Sentry release and auth token reach the
     * build - is reported as `'process' is not defined`. These are errors
     * rather than warnings, so they would fail lint:ci outright.
     */
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
