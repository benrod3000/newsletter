/**
 * How many contacts a radius selection actually catches.
 *
 * This is decision logic, not rendering, and it is the part of the radius picker
 * most likely to be quietly got wrong later - so it lives here, as three pure
 * functions, rather than inline in GeoFilter where it started.
 *
 * The history it encodes: the picker counted with Haversine over the
 * `subscribers` prop, which is the page the contacts table happens to hold. On a
 * workspace of 10,312 that is fifty rows, so dropping a pin on Denver, where 500
 * contacts live, read "~2 subscribers in range". The tilde was honest and nearly
 * invisible. There are now better sources, and `resolveInRange` ranks them.
 */

const EARTH_RADIUS_MILES = 3959

/** Great-circle distance in miles. */
export function milesBetween(aLat, aLng, bLat, bLng) {
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

/** Default radius in miles, matching the picker and parseGeoAreas on the server. */
const DEFAULT_RADIUS_MILES = 10

/**
 * Is this point inside any of the locations?
 *
 * Areas are a union, which is what drawing several circles means - so `some`,
 * not `every`. Reading it as an intersection is the shape of the bug that made
 * Oceanside at 10mi plus Encinitas at 100mi return nobody.
 */
export function pointInAnyRadius(lat, lng, locations) {
  if (!locations?.length) return true
  return locations.some(
    (loc) => milesBetween(loc.lat, loc.lng, lat, lng) <= (loc.radius ?? DEFAULT_RADIUS_MILES)
  )
}

/** The clusters a selection touches. */
export function clustersInRange(clusters, locations) {
  if (!Array.isArray(clusters)) return []
  return clusters.filter((c) => pointInAnyRadius(c.lat, c.lng, locations))
}

/**
 * The best available in-range count, and whether it is still an estimate.
 *
 * In order of trust:
 *  1. `exact` - the database's own count over every contact in the workspace.
 *  2. the clusters in range, summed. Exact whenever a cluster's members share its
 *     coordinate, which city-level import data guarantees; soft only at a
 *     circle's edge when coordinates are per-contact and rounding straddles it.
 *  3. `sampleCount` - Haversine over the rows this page loaded. The only case
 *     that is genuinely an estimate, and the only one that keeps the tilde.
 */
export function resolveInRange({ exact = null, clusters = null, locations = [], sampleCount = 0, loadedCount = null, total = null }) {
  if (typeof exact === 'number' && Number.isFinite(exact)) {
    return { count: exact, sampling: false, source: 'server' }
  }

  if (Array.isArray(clusters) && locations.length > 0) {
    const count = clustersInRange(clusters, locations).reduce((sum, c) => sum + (c.total ?? 0), 0)
    return { count, sampling: false, source: 'clusters' }
  }

  // Sampling is a claim about coverage, so it needs both numbers to be known. A
  // missing `total` is not evidence that the page holds everybody.
  const sampling =
    typeof total === 'number' && typeof loadedCount === 'number' && loadedCount < total
  return { count: sampleCount, sampling, source: 'page' }
}
