import { OnboardingStepShell } from './OnboardingStepShell'

interface SkippablePlaceholderStepProps {
  step: number
  totalSteps: number
  title: string
  description: string
  placeholder: string
  onNext: () => void
  onSkip: () => void
}

/** Shared shape for the three onboarding steps that are just a skippable placeholder for now
 *  (skills, friends, verification) — their real UIs live outside this prototype's scope. */
export function SkippablePlaceholderStep({
  step,
  totalSteps,
  title,
  description,
  placeholder,
  onNext,
  onSkip,
}: SkippablePlaceholderStepProps) {
  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title={title}
      description={description}
      primaryLabel="Continue"
      onPrimary={onNext}
      onSkip={onSkip}
    >
      <p className="onboarding-step__placeholder">{placeholder}</p>
    </OnboardingStepShell>
  )
}
