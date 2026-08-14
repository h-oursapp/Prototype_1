import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoCollapse } from '../../components/useAutoCollapse'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useAutoCollapse', () => {
  it('never collapses while disabled, however long it waits (Home)', () => {
    const { result } = renderHook(() => useAutoCollapse(false, 1000))

    act(() => void vi.advanceTimersByTime(10_000))
    expect(result.current.isCollapsed).toBe(false)
  })

  it('collapses once the timer runs out', () => {
    const { result } = renderHook(() => useAutoCollapse(true, 1000))

    expect(result.current.isCollapsed).toBe(false)
    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.isCollapsed).toBe(true)
  })

  it('reopens on expand, then collapses again after a fresh timer', () => {
    const { result } = renderHook(() => useAutoCollapse(true, 1000))

    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.isCollapsed).toBe(true)

    act(() => result.current.expand())
    expect(result.current.isCollapsed).toBe(false)

    act(() => void vi.advanceTimersByTime(1000))
    expect(result.current.isCollapsed).toBe(true)
  })

  it('restarts the countdown on interaction, so the bar cannot vanish mid-tap', () => {
    const { result } = renderHook(() => useAutoCollapse(true, 1000))

    act(() => void vi.advanceTimersByTime(900))
    act(() => result.current.keepOpen())

    // Past the original deadline, but only 900ms into the restarted one.
    act(() => void vi.advanceTimersByTime(900))
    expect(result.current.isCollapsed).toBe(false)

    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.isCollapsed).toBe(true)
  })
})
