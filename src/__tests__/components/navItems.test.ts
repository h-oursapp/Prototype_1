import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, activeNavKey } from '../../components/navItems'

describe('NAV_ITEMS', () => {
  it('lists the Appkarte §3 buttons in order, plus Settings', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'wallet',
      'profile',
      'community',
      'trades',
      'inventory',
      'home',
      'settings',
    ])
  })
})

describe('activeNavKey', () => {
  it('matches a nav item on its own path', () => {
    expect(activeNavKey('/wallet')).toBe('wallet')
    expect(activeNavKey('/trades')).toBe('trades')
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
  })
})
