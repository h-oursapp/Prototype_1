import { useNavigate } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { ROUTES } from '../routes'
import { useSettings } from '../settings/useSettings'
import { GRID_SIZE_OPTIONS, type ColorTheme, type GridSize } from '../settings/types'
import './SettingsPage.css'

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/** Appkarte §9. Only the settings that actually persist are shown as controls — swipe-up
 *  reassignment and notifications are listed in the card but not built, so they stay a note
 *  rather than buttons that do nothing. */
export function SettingsPage() {
  const navigate = useNavigate()
  const { colorTheme, gridSize, setColorTheme, setGridSize } = useSettings()

  return (
    <PageShell title="Settings">
      <div className="settings-page">
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

        <button type="button" className="settings-page__link" onClick={() => navigate(ROUTES.legal)}>
          Legal
        </button>

        <p className="settings-page__note">
          More settings (swipe-up target, notifications) are planned but not wired up yet.
        </p>
      </div>
    </PageShell>
  )
}
