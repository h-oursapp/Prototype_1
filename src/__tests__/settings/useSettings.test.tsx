import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useSettings } from '../../settings/useSettings'

it('throws when used outside a SettingsProvider', () => {
  const BareProbe = () => {
    useSettings()
    return null
  }
  expect(() => render(<BareProbe />)).toThrow(/SettingsProvider/)
})
