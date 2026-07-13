/**
 * Frontend geo utilities.
 * Calls ip-api.com directly (CORS supported on free tier).
 */

/**
 * Resolve a US ZIP code to lat/lng + city/state.
 */
export async function resolveZip(zip) {
  const clean = zip.trim()
  if (!/^\d{5}(-\d{4})?$/.test(clean)) return null

  try {
    const res = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,lat,lon,city,regionName`
    )
    const data = await res.json()
    if (data.status !== 'success') return null
    return { lat: data.lat, lng: data.lon, city: data.city || '', state: data.regionName || '' }
  } catch {
    return null
  }
}

/**
 * Format a distance in miles for display.
 */
export function formatDistance(miles) {
  if (miles == null) return ''
  if (miles < 0.1) return '< 0.1 mi'
  if (miles < 1) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
