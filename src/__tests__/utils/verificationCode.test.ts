import { describe, expect, it } from 'vitest'
import { generateVerificationCode } from '../../utils/verificationCode'

describe('generateVerificationCode', () => {
  it('is always exactly 5 digits, zero-padded, across many samples', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVerificationCode()
      expect(code).toMatch(/^\d{5}$/)
    }
  })

  it('can produce a zero-padded code (covers the low end of the range)', () => {
    const original = Math.random
    Math.random = () => 0
    try {
      expect(generateVerificationCode()).toBe('00000')
    } finally {
      Math.random = original
    }
  })

  it('can produce the top of the range without overflowing to 6 digits', () => {
    const original = Math.random
    Math.random = () => 0.999999
    try {
      expect(generateVerificationCode()).toBe('99999')
    } finally {
      Math.random = original
    }
  })
})
