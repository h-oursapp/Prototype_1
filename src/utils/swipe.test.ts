import { describe, expect, it } from 'vitest'
import { isSwipeUp } from './swipe'

describe('isSwipeUp', () => {
  it('is true once the upward drag reaches the default threshold', () => {
    expect(isSwipeUp(300, 260)).toBe(true)
    expect(isSwipeUp(300, 259)).toBe(true)
  })

  it('is false for drags under the threshold, downward drags, or no movement', () => {
    expect(isSwipeUp(300, 270)).toBe(false)
    expect(isSwipeUp(300, 340)).toBe(false)
    expect(isSwipeUp(300, 300)).toBe(false)
  })

  it('honors a custom threshold', () => {
    expect(isSwipeUp(300, 280, 10)).toBe(true)
    expect(isSwipeUp(300, 295, 10)).toBe(false)
  })
})
