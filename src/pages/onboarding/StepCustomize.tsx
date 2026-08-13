import { useState } from 'react'
import { useSettings } from '../../settings/useSettings'
import { GRID_SIZE_OPTIONS, type ColorTheme, type GridSize } from '../../settings/types'
import { OnboardingStepShell } from './OnboardingStepShell'

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

type ProfileVisibility = 'public' | 'private'

const PROFILE_VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

interface StepCustomizeProps {
  step: number
  totalSteps: number
  onFinish: () => void
}

export function StepCustomize({ step, totalSteps, onFinish }: StepCustomizeProps) {
  const { colorTheme, gridSize, setColorTheme, setGridSize } = useSettings()
  // Profile visibility isn't persisted yet — only grid size and color theme are saved for now.
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public')

  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="Make it yours"
      description="You can change these anytime in Settings."
      primaryLabel="Finish"
      onPrimary={onFinish}
    >
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
      <OptionGroup
        legend="Profile visibility"
        options={PROFILE_VISIBILITY_OPTIONS}
        selected={profileVisibility}
        onSelect={setProfileVisibility}
      />
    </OnboardingStepShell>
  )
}

interface OptionGroupProps<T extends string | number> {
  legend: string
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}

function OptionGroup<T extends string | number>({ legend, options, selected, onSelect }: OptionGroupProps<T>) {
  return (
    <fieldset className="onboarding-customize__group">
      <legend>{legend}</legend>
      <div className="onboarding-customize__options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`onboarding-customize__option ${selected === option.value ? 'is-selected' : ''}`}
            aria-pressed={selected === option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
