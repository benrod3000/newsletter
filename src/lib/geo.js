/**
 * Frontend geo utilities.
 * Uses zippopotam.us (free, no API key) and Census Bureau as fallback.
 */

/**
 * Resolve a US ZIP code to lat/lng + city/state.
 */
export async function resolveZip(zip) {
  const clean = zip.trim()
  if (!/^\d{5}(-\d{4})?$/.test(clean)) return null

  // Shared cache key — declared once so every fallback branch can write to it.
  // (Previously scoped inside the read block, so cache writes threw silently.)
  const cacheKey = `geo-zip-${clean}`

  // Check cache (24h TTL)
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.ts < 86400000) return parsed.data
    }
  } catch { /* localStorage may be blocked */ }

  // Try zippopotam.us (free, reliable, no key needed)
  try {
    const res = await fetch(
      `https://api.zippopotam.us/us/${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const place = data?.places?.[0]
      if (place?.latitude && place?.longitude) {
        const result = {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          city: place['place name'] || '',
          state: place.state || '',
        }
        try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })) } catch {}
        return result
      }
    }
  } catch {}

  // Fallback: ip-api.com
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

  // Last fallback: Nominatim (OpenStreetMap)
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&country=us&format=json&limit=1`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (nomRes.ok) {
      const nomData = await nomRes.json()
      const first = nomData?.[0]
      if (first?.lat && first?.lon) {
        const result = { lat: parseFloat(first.lat), lng: parseFloat(first.lon), city: '', state: '' }
        try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })) } catch {}
        return result
      }
    }
  } catch {}

  return null
}

/**
 * Forward-geocode free text (city, town, neighborhood, address) to a list of
 * US location suggestions for the location search box. Returns up to 5 results
 * shaped like resolveZip output plus a display `label` and any known `zip`.
 */
export async function searchPlaces(query) {
  const q = (query || '').trim()
  if (q.length < 3) return []
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=us&limit=5&addressdetails=1`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : [])
      .map((r) => {
        const a = r.address || {}
        const city = a.city || a.town || a.village || a.hamlet || a.county || ''
        const state = a.state || ''
        const zip = a.postcode || ''
        const label =
          [city, state].filter(Boolean).join(', ') ||
          (r.display_name ? r.display_name.split(',').slice(0, 2).join(', ').trim() : 'Location')
        return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), city, state, zip, label }
      })
      .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng))
  } catch {
    return []
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
