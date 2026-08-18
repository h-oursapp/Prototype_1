import { describe, expect, it } from 'vitest'
import {
  MAX_DISTANCE_KM,
  distanceFilterLabel,
  isSearchFilters,
  kindFilterLabel,
  ratingFilterLabel,
} from '../../data/searchFilters'

describe('kindFilterLabel', () => {
  it('labels each kind, falling back to "All" for anything unrecognized', () => {
    expect(kindFilterLabel('all')).toBe('All')
    expect(kindFilterLabel('skill')).toBe('Skills')
    expect(kindFilterLabel('item')).toBe('Items')
  })
})

describe('distanceFilterLabel', () => {
  it('reads as "Any distance" at or past the max, and "Within N km" below it', () => {
    expect(distanceFilterLabel(MAX_DISTANCE_KM)).toBe('Any distance')
    expect(distanceFilterLabel(3)).toBe('Within 3 km')
  })
})

describe('ratingFilterLabel', () => {
  it('reads as "Any rating" at 0, and "Min N★" otherwise', () => {
    expect(ratingFilterLabel(0)).toBe('Any rating')
    expect(ratingFilterLabel(4)).toBe('Min 4★')
  })
})

describe('isSearchFilters', () => {
  it('accepts a well-formed filter set', () => {
    expect(isSearchFilters({ kindFilter: 'skill', maxDistanceKm: 5, minRating: 3 })).toBe(true)
  })

  it('rejects a bad kind filter', () => {
    expect(isSearchFilters({ kindFilter: 'blue', maxDistanceKm: 5, minRating: 3 })).toBe(false)
  })

  it('rejects a distance outside 0..MAX_DISTANCE_KM', () => {
    expect(isSearchFilters({ kindFilter: 'all', maxDistanceKm: 0, minRating: 0 })).toBe(false)
    expect(isSearchFilters({ kindFilter: 'all', maxDistanceKm: MAX_DISTANCE_KM + 1, minRating: 0 })).toBe(false)
  })

  it('rejects a rating outside 0..5', () => {
    expect(isSearchFilters({ kindFilter: 'all', maxDistanceKm: MAX_DISTANCE_KM, minRating: -1 })).toBe(false)
    expect(isSearchFilters({ kindFilter: 'all', maxDistanceKm: MAX_DISTANCE_KM, minRating: 6 })).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(isSearchFilters(null)).toBe(false)
    expect(isSearchFilters('nope')).toBe(false)
    expect(isSearchFilters(undefined)).toBe(false)
  })
})
