import { describe, expect, it } from 'vitest'
import { isTopLevelRoute } from '../../components/topLevelRoutes'

describe('isTopLevelRoute', () => {
  it('is true for the pages one tap from Home', () => {
    expect(isTopLevelRoute('/wallet')).toBe(true)
    expect(isTopLevelRoute('/profile')).toBe(true)
    expect(isTopLevelRoute('/trades')).toBe(true)
    expect(isTopLevelRoute('/inventory')).toBe(true)
    expect(isTopLevelRoute('/')).toBe(true)
    expect(isTopLevelRoute('/offers')).toBe(true)
    expect(isTopLevelRoute('/search')).toBe(true)
  })

  it('is false for detail and sub-pages', () => {
    expect(isTopLevelRoute('/ads/ad-1')).toBe(false)
    expect(isTopLevelRoute('/trades/trade-1/review')).toBe(false)
    expect(isTopLevelRoute('/settings')).toBe(false)
  })
})
