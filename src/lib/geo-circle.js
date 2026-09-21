/**
 * A radius circle as a polygon, because vector maps cannot draw one.
 *
 * Leaflet's `L.circle` takes a radius in **metres** and works out the pixels
 * itself. MapLibre has no such thing: its circle layer is sized in *pixels*, so
 * a 25-mile radius drawn that way would grow and shrink as you zoom and stop
 * meaning 25 miles. The honest equivalent is a polygon of points at a fixed
 * ground distance from the centre, which is what this builds.
 *
 * The maths is the destination-point formula on a sphere rather than a flat
 * offset. A flat approximation is fine near the equator and visibly wrong by the
 * time you reach Seattle, where a degree of longitude is about two thirds the
 * length of one at the equator - the circle would read as an ellipse, and the
 * contacts it appears to contain would not be the ones the server returns.
 */

const EARTH_RADIUS_MILES = 3958.7613

/**
 * Points around a circle of `radiusMiles` about (lat, lng).
 *
 * Returns `[lng, lat]` pairs, which is GeoJSON order and the opposite of
 * Leaflet's. That flip is the single likeliest source of a silent bug in this
 * port, so it is stated here and tested.
 */
export function circlePoints(lat, lng, radiusMiles, steps = 64) {
  const points = []
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !(radiusMiles > 0)) return points

  const latRad = (lat * Math.PI) / 180
  const lngRad = (lng * Math.PI) / 180
  const angular = radiusMiles / EARTH_RADIUS_MILES

  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI

    const pointLat = Math.asin(
      Math.sin(latRad) * Math.cos(angular) +
      Math.cos(latRad) * Math.sin(angular) * Math.cos(bearing)
    )
    const pointLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(latRad),
      Math.cos(angular) - Math.sin(latRad) * Math.sin(pointLat)
    )

    // Longitude is normalised back into [-180, 180]. A circle straddling the
    // antimeridian otherwise emits values like 190, which renders as a band
    // stretched right across the map instead of a circle.
    const deg = ((pointLng * 180) / Math.PI + 540) % 360 - 180
    points.push([deg, (pointLat * 180) / Math.PI])
  }

  return points
}

/** The same circle as a GeoJSON Feature, ready to hand to a MapLibre source. */
export function circleFeature(lat, lng, radiusMiles, properties = {}) {
  return {
    type: 'Feature',
    properties,
    geometry: { type: 'Polygon', coordinates: [circlePoints(lat, lng, radiusMiles)] },
  }
}

/**
 * A bounding box around every location and its radius, as [[w,s],[e,n]].
 *
 * Built from the circle points rather than from the centres, so fitting to it
 * shows the whole circle instead of cropping its edges - which is what a
 * centre-only bounds does at any radius large enough to matter.
 */
export function boundsForLocations(locations, defaultRadius = 10) {
  const all = []
  for (const loc of locations ?? []) {
    const pts = circlePoints(loc.lat, loc.lng, loc.radius ?? defaultRadius)
    if (pts.length) all.push(...pts)
    else if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) all.push([loc.lng, loc.lat])
  }
  if (all.length === 0) return null

  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity
  for (const [lng, lat] of all) {
    if (lng < west) west = lng
    if (lng > east) east = lng
    if (lat < south) south = lat
    if (lat > north) north = lat
  }
  return [[west, south], [east, north]]
}
