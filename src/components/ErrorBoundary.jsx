import { Component } from 'react'
import EmptyState from './ux/EmptyState'

/** Detect stale code-split chunks (after deploy) */
function isChunkError(error) {
  const msg = typeof error === 'string' ? error : error?.message || ''
  return msg.includes('Failed to fetch dynamically imported module')
    || msg.includes('Importing a module script failed')
    || msg.includes('Loading chunk')
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // Auto-recover on stale chunk errors
    if (isChunkError(error)) {
      window.location.reload()
    }
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <EmptyState
            title="Something went wrong"
            description={this.state.error?.message || 'An unexpected error occurred.'}
            icon="⚠"
            action={
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition"
              >
                Retry
              </button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
