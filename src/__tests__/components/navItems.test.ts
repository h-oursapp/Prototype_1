import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, activeNavKey } from '../../components/navItems'

describe('NAV_ITEMS', () => {
  it('lists the nav bar buttons with Home in the middle, Offers beside it, and Settings off the bar (TODO #4/#3)', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'wallet',
      'profile',
      'home',
      'offers',
      'community',
      'trades',
      'inventory',
    ])
  })

  it('gives only Hours the wide slot and no icon', () => {
    expect(NAV_ITEMS.filter((item) => item.wide).map((item) => item.key)).toEqual(['wallet'])
    expect(NAV_ITEMS.find((item) => item.key === 'wallet')?.icon).toBeUndefined()
  })
})

describe('activeNavKey', () => {
  it('matches a nav item on its own path', () => {
    expect(activeNavKey('/wallet')).toBe('wallet')
    expect(activeNavKey('/trades')).toBe('trades')
    expect(activeNavKey('/offers')).toBe('offers')
  })

  it('keeps the section lit on a sub-page', () => {
    expect(activeNavKey('/trades/trade-3/review')).toBe('trades')
  })

  it('matches Home only exactly, so its "/" prefix does not swallow every route', () => {
    expect(activeNavKey('/')).toBe('home')
    expect(activeNavKey('/search')).toBeNull()
  })

  it('returns null on a page that has no nav button', () => {
    expect(activeNavKey('/ads/ad-1')).toBeNull()
    expect(activeNavKey('/settings')).toBeNull()
  })
})
