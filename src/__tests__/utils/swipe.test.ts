import { describe, expect, it } from 'vitest'
import { isSwipeLeft, isSwipeRight, isSwipeUp } from '../../utils/swipe'

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

describe('isSwipeRight', () => {
  it('is true once a left-to-right drag reaches the default threshold', () => {
    expect(isSwipeRight(100, 140)).toBe(true)
    expect(isSwipeRight(100, 141)).toBe(true)
  })

  it('is false for drags under the threshold, leftward drags, or no movement', () => {
    expect(isSwipeRight(100, 130)).toBe(false)
    expect(isSwipeRight(100, 60)).toBe(false)
    expect(isSwipeRight(100, 100)).toBe(false)
  })

  it('honors a custom threshold', () => {
    expect(isSwipeRight(100, 120, 10)).toBe(true)
    expect(isSwipeRight(100, 105, 10)).toBe(false)
  })
})

describe('isSwipeLeft', () => {
  it('is true once a right-to-left drag reaches the default threshold', () => {
    expect(isSwipeLeft(300, 260)).toBe(true)
    expect(isSwipeLeft(300, 259)).toBe(true)
  })

  it('is false for drags under the threshold, rightward drags, or no movement', () => {
    expect(isSwipeLeft(300, 270)).toBe(false)
    expect(isSwipeLeft(300, 340)).toBe(false)
    expect(isSwipeLeft(300, 300)).toBe(false)
  })

  it('honors a custom threshold', () => {
    expect(isSwipeLeft(300, 280, 10)).toBe(true)
    expect(isSwipeLeft(300, 295, 10)).toBe(false)
  })
})
