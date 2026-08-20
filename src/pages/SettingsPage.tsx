import { useNavigate } from 'react-router-dom'
import { OptionGroup } from '../components/OptionGroup'
import { PageShell } from '../components/PageShell'
import { StarRatingInput } from '../components/StarRatingInput'
import { KIND_FILTER_OPTIONS, MAX_DISTANCE_KM, distanceFilterLabel } from '../data/searchFilters'
import { ROUTES } from '../routes'
import { useSettings } from '../settings/useSettings'
import { GRID_SIZE_OPTIONS, type ColorTheme, type GridSize } from '../settings/types'
import './SettingsPage.css'

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const INVENTORY_SCROLLABLE_OPTIONS: { value: boolean; label: string }[] = [
  { value: false, label: 'No' },
  { value: true, label: 'Yes' },
]

/** Appkarte §9. Only the settings that actually persist are shown as controls — swipe-up
 *  reassignment and notifications are listed in the card but not built, so they stay a note
 *  rather than buttons that do nothing. */
export function SettingsPage() {
  const navigate = useNavigate()
  const {
    colorTheme,
    gridSize,
    defaultSearchFilters,
    inventoryScrollable,
    setColorTheme,
    setGridSize,
    setDefaultSearchFilters,
    setInventoryScrollable,
  } = useSettings()

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

        <section className="settings-page__section">
          <h2 className="page-section__heading">Inventory</h2>
          <p className="settings-page__note">
            TODO #9: scrollable shows every item at once and grows the page instead of paging
            through a fixed grid.
          </p>
          <OptionGroup
            legend="Inventory scrollable"
            options={INVENTORY_SCROLLABLE_OPTIONS}
            selected={inventoryScrollable}
            onSelect={setInventoryScrollable}
          />
        </section>

        <section className="settings-page__section">
          <h2 className="page-section__heading">Default search filters</h2>
          <p className="settings-page__note">
            Search opens with these already applied — including a search you start from Home's own
            search bar (TODO #3).
          </p>

          <OptionGroup
            legend="Kind"
            options={KIND_FILTER_OPTIONS}
            selected={defaultSearchFilters.kindFilter}
            onSelect={(kindFilter) => setDefaultSearchFilters({ kindFilter })}
          />

          <label className="settings-page__range-field">
            <span>Distance: {distanceFilterLabel(defaultSearchFilters.maxDistanceKm)}</span>
            <input
              type="range"
              min={1}
              max={MAX_DISTANCE_KM}
              step={1}
              value={defaultSearchFilters.maxDistanceKm}
              onChange={(event) => setDefaultSearchFilters({ maxDistanceKm: Number(event.target.value) })}
            />
          </label>

          <StarRatingInput
            label="Minimum rating"
            name="default-min-rating"
            value={defaultSearchFilters.minRating}
            onChange={(minRating) => setDefaultSearchFilters({ minRating })}
          />
        </section>

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
