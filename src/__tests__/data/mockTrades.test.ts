import { describe, expect, it } from 'vitest'
import { canRespondToOffer, statusAfterAccept } from '../../data/mockTrades'

describe('canRespondToOffer', () => {
  it('is true only for an open trade', () => {
    expect(canRespondToOffer('open')).toBe(true)
    expect(canRespondToOffer('agreed')).toBe(false)
    expect(canRespondToOffer('closed')).toBe(false)
  })
})

describe('statusAfterAccept', () => {
  it('moves an open trade to agreed', () => {
    expect(statusAfterAccept('open')).toBe('agreed')
  })

  it('leaves an already-agreed or closed trade unchanged', () => {
    expect(statusAfterAccept('agreed')).toBe('agreed')
    expect(statusAfterAccept('closed')).toBe('closed')
  })
})
