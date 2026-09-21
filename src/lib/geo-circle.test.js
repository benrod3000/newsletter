import { describe, it, expect } from 'vitest'
import { circlePoints, circleFeature, boundsForLocations } from './geo-circle'
import { milesBetween } from './geo-count'

/**
 * The radius circle, once it has to be drawn as a polygon.
 *
 * Leaflet took a radius in metres and did this itself. MapLibre sizes circles in
 * pixels, so getting this wrong does not look like a crash - it looks like a
 * circle that quietly stops matching the contacts the server says are inside it.
 */

const DENVER = { lat: 39.73924, lng: -104.98486 }
const SEATTLE = { lat: 47.60383, lng: -122.33006 }
const QUITO = { lat: -0.1807, lng: -78.4678 }

describe('circlePoints', () => {
  it('puts every point at the requested distance from the centre', () => {
    for (const pt of circlePoints(DENVER.lat, DENVER.lng, 25)) {
      const [lng, lat] = pt
      expect(milesBetween(DENVER.lat, DENVER.lng, lat, lng)).toBeCloseTo(25, 1)
    }
  })

  it('holds that accuracy at high latitude, where a flat offset would not', () => {
    // A degree of longitude in Seattle is about two thirds of one at the
    // equator. A naive lng += miles/69 circle reads as an ellipse here.
    for (const pt of circlePoints(SEATTLE.lat, SEATTLE.lng, 50)) {
      const [lng, lat] = pt
      expect(milesBetween(SEATTLE.lat, SEATTLE.lng, lat, lng)).toBeCloseTo(50, 1)
    }
  })

  it('holds it at the equator too', () => {
    for (const pt of circlePoints(QUITO.lat, QUITO.lng, 10)) {
      const [lng, lat] = pt
      expect(milesBetween(QUITO.lat, QUITO.lng, lat, lng)).toBeCloseTo(10, 1)
    }
  })

  it('emits [lng, lat], not [lat, lng]', () => {
    // GeoJSON order, the opposite of Leaflet's. Reversing it is the single most
    // likely silent bug in this port: Denver would be drawn in Antarctica.
    const [first] = circlePoints(DENVER.lat, DENVER.lng, 5)
    expect(first[0]).toBeCloseTo(DENVER.lng, 0)
    expect(first[1]).toBeCloseTo(DENVER.lat, 0)
  })

  it('closes the ring, as a polygon requires', () => {
    const pts = circlePoints(DENVER.lat, DENVER.lng, 10, 32)
    expect(pts).toHaveLength(33)
    expect(pts[0][0]).toBeCloseTo(pts[32][0], 9)
    expect(pts[0][1]).toBeCloseTo(pts[32][1], 9)
  })

  it('keeps longitude inside [-180, 180] across the antimeridian', () => {
    // Otherwise a circle near Fiji emits 190 and renders as a band stretched
    // across the entire map.
    for (const [lng] of circlePoints(-17.7, 179.9, 60)) {
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
    }
  })

  it('returns nothing rather than a degenerate ring for bad input', () => {
    expect(circlePoints(DENVER.lat, DENVER.lng, 0)).toEqual([])
    expect(circlePoints(DENVER.lat, DENVER.lng, -5)).toEqual([])
    expect(circlePoints(NaN, DENVER.lng, 10)).toEqual([])
    expect(circlePoints(DENVER.lat, undefined, 10)).toEqual([])
  })

  it('grows with the radius', () => {
    const small = circlePoints(DENVER.lat, DENVER.lng, 5)[0]
    const large = circlePoints(DENVER.lat, DENVER.lng, 50)[0]
    expect(milesBetween(DENVER.lat, DENVER.lng, large[1], large[0]))
      .toBeGreaterThan(milesBetween(DENVER.lat, DENVER.lng, small[1], small[0]))
  })
})

describe('circleFeature', () => {
  it('is a GeoJSON polygon with one ring', () => {
    const f = circleFeature(DENVER.lat, DENVER.lng, 10, { id: 'a' })
    expect(f.type).toBe('Feature')
    expect(f.geometry.type).toBe('Polygon')
    expect(f.geometry.coordinates).toHaveLength(1)
    expect(f.properties.id).toBe('a')
  })
})

describe('boundsForLocations', () => {
  it('contains the whole circle, not just the centre', () => {
    // Fitting to centres crops the circle's edges at any radius worth drawing.
    const [[w, s], [e, n]] = boundsForLocations([{ ...DENVER, radius: 50 }])
    expect(w).toBeLessThan(DENVER.lng)
    expect(e).toBeGreaterThan(DENVER.lng)
    expect(s).toBeLessThan(DENVER.lat)
    expect(n).toBeGreaterThan(DENVER.lat)
  })

  it('spans every location', () => {
    const [[w, s], [e, n]] = boundsForLocations([
      { ...DENVER, radius: 10 },
      { ...SEATTLE, radius: 10 },
    ])
    expect(w).toBeLessThan(SEATTLE.lng)
    expect(e).toBeGreaterThan(DENVER.lng)
    expect(n).toBeGreaterThan(SEATTLE.lat)
    expect(s).toBeLessThan(DENVER.lat)
  })

  it('falls back to the bare point when the radius is unusable', () => {
    const b = boundsForLocations([{ ...DENVER, radius: 0 }])
    expect(b).toEqual([[DENVER.lng, DENVER.lat], [DENVER.lng, DENVER.lat]])
  })

  it('is null when there is nothing to fit', () => {
    expect(boundsForLocations([])).toBeNull()
    expect(boundsForLocations(null)).toBeNull()
  })
})
