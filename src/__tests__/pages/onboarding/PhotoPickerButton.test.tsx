import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PhotoPickerButton } from '../../../pages/onboarding/PhotoPickerButton'

describe('PhotoPickerButton', () => {
  it('calls onChoose with the selected file', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<PhotoPickerButton label="Take a picture" onChoose={onChoose} />)

    const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Take a picture'), file)

    expect(onChoose).toHaveBeenCalledWith(file)
  })

  it('sets the capture attribute when given one, and omits it otherwise', () => {
    const { rerender } = render(<PhotoPickerButton label="Take a picture" capture="user" onChoose={vi.fn()} />)
    expect(screen.getByLabelText('Take a picture')).toHaveAttribute('capture', 'user')

    rerender(<PhotoPickerButton label="Choose from your phone" onChoose={vi.fn()} />)
    expect(screen.getByLabelText('Choose from your phone')).not.toHaveAttribute('capture')
  })
})
