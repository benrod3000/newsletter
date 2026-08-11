/**
 * Turn `consent_source` into something readable.
 *
 * Capture forms record `widget:<slug>`, so the raw value already says where
 * someone came from - it just says it in a shape meant for code.
 *
 * Lives in its own module rather than beside the panel component because a file
 * that exports both a component and a helper breaks Fast Refresh for the whole
 * file: editing this function would remount the panel and lose its open state.
 */
export function describeSource(source) {
  if (!source) return 'Imported or added manually'
  if (source.startsWith('widget:')) return `Capture form: ${source.slice(7)}`
  if (source === 'signup') return 'Signed up directly'
  return source
}
