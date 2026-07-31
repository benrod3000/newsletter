import './instrument'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { reactErrorHandler } from '@sentry/react'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

// React 19 surfaces render errors through these root callbacks. Without them
// the SDK only sees what reaches window.onerror, so an error caught by a
// boundary and re-rendered as a fallback never reached Sentry at all.
createRoot(document.getElementById('root'), {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
