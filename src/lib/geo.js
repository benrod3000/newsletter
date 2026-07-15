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

  // Check cache (24h TTL)
  try {
    const cacheKey = `geo-zip-${clean}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.ts < 86400000) return parsed.data
    }
  } catch {}

  // Try ip-api.com first
  try {
    const res = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,lat,lon,city,regionName`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'success' && data.lat && data.lon) {
        const result = { lat: data.lat, lng: data.lon, city: data.city || '', state: data.regionName || '' }
        try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })) } catch {}
        return result
      }
    }
  } catch {}

  // Fallback: US Census Bureau geocoder (free, unlimited, official)
  try {
    const censusRes = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/address?zip=${encodeURIComponent(clean)}&benchmark=2020&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (censusRes.ok) {
      const censusData = await censusRes.json()
      const match = censusData?.result?.addressMatches?.[0]?.coordinates
      if (match?.x && match?.y) {
        const result = { lat: match.y, lng: match.x, city: '', state: '' }
        try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })) } catch {}
        return result
      }
    }
  } catch {}

  return null
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
