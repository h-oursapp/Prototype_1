import { OptionGroup } from '../components/OptionGroup'
import { useSettings } from '../settings/useSettings'
import { GRID_SIZE_OPTIONS, type ColorTheme, type GridSize } from '../settings/types'
import './SettingsPage.css'

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

interface SettingsPageProps {
  onBack: () => void
}

/** Standalone Settings page for tweaking the settings that actually persist right now.
 *  The Appkarte also lists swipe-up-target reassignment and notifications here — not built
 *  yet, so they're left out rather than shown as buttons that don't do anything. */
export function SettingsPage({ onBack }: SettingsPageProps) {
  const { colorTheme, gridSize, setColorTheme, setGridSize } = useSettings()

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <button type="button" className="settings-page__back" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1>Settings</h1>
      </header>

      <OptionGroup
        legend="Grid size"
        options={GRID_SIZE_OPTIONS.map((size) => ({ value: size, label: `${size} per row` }))}
        selected={gridSize}
        onSelect={(size: GridSize) => setGridSize(size)}
      />
      <OptionGroup
        legend="Color theme"
        options={COLOR_THEME_OPTIONS}
        selected={colorTheme}
        onSelect={setColorTheme}
      />

      <p className="settings-page__note">
        More settings (swipe-up target, notifications) are planned but not wired up yet.
      </p>
    </div>
  )
}
