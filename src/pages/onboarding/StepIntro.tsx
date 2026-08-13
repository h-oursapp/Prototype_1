import { OnboardingStepShell } from './OnboardingStepShell'

interface StepIntroProps {
  step: number
  totalSteps: number
  onNext: () => void
}

export function StepIntro({ step, totalSteps, onNext }: StepIntroProps) {
  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="How h_OURs works"
      description="Offer your time and skills, browse what people nearby are offering, and trade hour for hour."
      primaryLabel="Next"
      onPrimary={onNext}
    >
      <div className="onboarding-step__illustration" aria-hidden="true" />
    </OnboardingStepShell>
  )
}
