import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhotoCapture } from '../../../pages/onboarding/usePhotoCapture'

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
})

describe('usePhotoCapture', () => {
  it('starts with no photo', () => {
    const { result } = renderHook(() => usePhotoCapture())
    expect(result.current.photoUrl).toBeNull()
  })

  it('turns a chosen file into an object URL', () => {
    const { result } = renderHook(() => usePhotoCapture())
    const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => result.current.choosePhoto(file))

    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(result.current.photoUrl).toBe('blob:mock-url')
  })

  it('revokes the previous URL when a second photo replaces the first', () => {
    const { result } = renderHook(() => usePhotoCapture())
    act(() => result.current.choosePhoto(new File(['a'], 'first.jpg', { type: 'image/jpeg' })))
    act(() => result.current.choosePhoto(new File(['b'], 'second.jpg', { type: 'image/jpeg' })))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('revokes the current URL on unmount', () => {
    const { result, unmount } = renderHook(() => usePhotoCapture())
    act(() => result.current.choosePhoto(new File(['a'], 'photo.jpg', { type: 'image/jpeg' })))

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
