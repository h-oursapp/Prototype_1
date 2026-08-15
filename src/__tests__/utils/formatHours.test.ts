import { describe, expect, it } from 'vitest'
import { formatHoursBalance } from '../../utils/formatHours'

describe('formatHoursBalance', () => {
  it('drops the minutes entirely for a whole-hours balance', () => {
    expect(formatHoursBalance(12)).toBe('12h')
    expect(formatHoursBalance(0)).toBe('0h')
  })

  it('shows both hours and minutes for a fractional balance', () => {
    expect(formatHoursBalance(10.25)).toBe('10h15m')
    expect(formatHoursBalance(1.5)).toBe('1h30m')
  })

  it('carries a rounded-up 60 minutes into the next hour instead of showing "60m"', () => {
    expect(formatHoursBalance(11.999)).toBe('12h')
  })
})
