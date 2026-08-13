import { useState } from 'react'
import { OptionGroup } from '../../components/OptionGroup'
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
