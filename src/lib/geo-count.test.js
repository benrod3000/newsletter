import { describe, it, expect } from 'vitest'
import { milesBetween, pointInAnyRadius, clustersInRange, resolveInRange } from './geo-count'

const DENVER = { lat: 39.73924, lng: -104.98486 }
const BOULDER = { lat: 40.015, lng: -105.2705 }   // ~24 mi from Denver
const CHICAGO = { lat: 41.87556, lng: -87.62442 }

describe('milesBetween', () => {
  it('measures a known distance', () => {
    // Denver to Chicago is about 920 miles.
    expect(milesBetween(DENVER.lat, DENVER.lng, CHICAGO.lat, CHICAGO.lng)).toBeGreaterThan(900)
    expect(milesBetween(DENVER.lat, DENVER.lng, CHICAGO.lat, CHICAGO.lng)).toBeLessThan(940)
  })

  it('is zero for a point against itself', () => {
    expect(milesBetween(DENVER.lat, DENVER.lng, DENVER.lat, DENVER.lng)).toBeCloseTo(0, 6)
  })
})

describe('pointInAnyRadius', () => {
  it('treats several areas as a union, not an intersection', () => {
    // The shape of the original bug: Oceanside at 10mi holds nobody, Encinitas at
    // 100mi holds eight, and reading the areas as an intersection returned zero.
    const locations = [
      { ...DENVER, radius: 5 },
      { ...CHICAGO, radius: 25 },
    ]
    expect(pointInAnyRadius(CHICAGO.lat, CHICAGO.lng, locations)).toBe(true)
    expect(pointInAnyRadius(DENVER.lat, DENVER.lng, locations)).toBe(true)
  })

  it('excludes a point outside every area', () => {
    expect(pointInAnyRadius(BOULDER.lat, BOULDER.lng, [{ ...DENVER, radius: 10 }])).toBe(false)
  })

  it('includes it once the radius reaches', () => {
    expect(pointInAnyRadius(BOULDER.lat, BOULDER.lng, [{ ...DENVER, radius: 30 }])).toBe(true)
  })

  it('defaults a missing radius to ten miles rather than zero', () => {
    // A zero default would match nobody and read as "this city is empty".
    expect(pointInAnyRadius(DENVER.lat, DENVER.lng, [{ ...DENVER }])).toBe(true)
    expect(pointInAnyRadius(BOULDER.lat, BOULDER.lng, [{ ...DENVER }])).toBe(false)
  })

  it('counts everything as in range when nothing is selected', () => {
    expect(pointInAnyRadius(DENVER.lat, DENVER.lng, [])).toBe(true)
  })
})

describe('clustersInRange', () => {
  const clusters = [
    { ...DENVER, total: 500, active: 500, at_risk: 0, cold: 0 },
    { ...CHICAGO, total: 500, active: 400, at_risk: 100, cold: 0 },
    { ...BOULDER, total: 7, active: 7, at_risk: 0, cold: 0 },
  ]

  it('keeps only the clusters a selection touches', () => {
    const got = clustersInRange(clusters, [{ ...DENVER, radius: 10 }])
    expect(got).toHaveLength(1)
    expect(got[0].total).toBe(500)
  })

  it('survives a missing clusters array', () => {
    expect(clustersInRange(null, [{ ...DENVER, radius: 10 }])).toEqual([])
  })
})

describe('resolveInRange', () => {
  const clusters = [
    { ...DENVER, total: 500 },
    { ...CHICAGO, total: 500 },
    { ...BOULDER, total: 7 },
  ]
  const locations = [{ ...DENVER, radius: 10 }]

  it('prefers the server count and drops the tilde', () => {
    const got = resolveInRange({ exact: 500, clusters, locations, sampleCount: 2, loadedCount: 50, total: 10312 })
    expect(got).toEqual({ count: 500, sampling: false, source: 'server' })
  })

  it('falls back to summing clusters, which is still not a sample', () => {
    const got = resolveInRange({ exact: null, clusters, locations, sampleCount: 2, loadedCount: 50, total: 10312 })
    expect(got.count).toBe(500)
    expect(got.sampling).toBe(false)
    expect(got.source).toBe('clusters')
  })

  it('sums every cluster a wider radius reaches', () => {
    const got = resolveInRange({ clusters, locations: [{ ...DENVER, radius: 30 }] })
    expect(got.count).toBe(507)
  })

  it('counts a person once when two areas overlap', () => {
    // Two circles over the same city must not report 1,000 contacts.
    const got = resolveInRange({
      clusters: [{ ...DENVER, total: 500 }],
      locations: [{ ...DENVER, radius: 10 }, { lat: 39.75, lng: -104.99, radius: 10 }],
    })
    expect(got.count).toBe(500)
  })

  it('is the page sample only as a last resort, and says so', () => {
    const got = resolveInRange({ exact: null, clusters: null, locations, sampleCount: 2, loadedCount: 50, total: 10312 })
    expect(got).toEqual({ count: 2, sampling: true, source: 'page' })
  })

  it('does not claim to be sampling when the page holds everybody', () => {
    const got = resolveInRange({ clusters: null, locations, sampleCount: 8, loadedCount: 8, total: 8 })
    expect(got.sampling).toBe(false)
  })

  it('does not claim to be sampling when the total is unknown', () => {
    // A missing total is not evidence that the page is complete, but it is not
    // evidence that it is partial either - and a tilde next to a number the user
    // cannot check is worse than no mark.
    const got = resolveInRange({ clusters: null, locations, sampleCount: 8, loadedCount: 8, total: null })
    expect(got.sampling).toBe(false)
  })

  it('reports zero rather than NaN when a cluster carries no total', () => {
    const got = resolveInRange({ clusters: [{ ...DENVER }], locations })
    expect(got.count).toBe(0)
  })
})
