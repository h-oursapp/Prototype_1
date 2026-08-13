import { useState } from 'react'
import { SkippablePlaceholderStep } from './SkippablePlaceholderStep'
import { StepCustomize } from './StepCustomize'
import { StepIntro } from './StepIntro'

const SKIPPABLE_STEPS = [
  {
    title: 'Add your skills',
    description: 'List a few things you can teach, do, or lend a hand with. You can add more anytime later.',
    placeholder: 'Skill picker coming soon.',
  },
  {
    title: 'Add friends',
    description: 'Invite people you know, or find them once your profile is public.',
    placeholder: 'Friend search coming soon.',
  },
  {
    title: 'Verify your identity',
    description: 'Verified profiles build more trust when trading with others.',
    placeholder: 'Verification coming soon.',
  },
] as const

const TOTAL_STEPS = SKIPPABLE_STEPS.length + 2 // + intro + customize

interface OnboardingPageProps {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const advance = () => {
    if (stepIndex === TOTAL_STEPS - 1) onComplete()
    else setStepIndex((index) => index + 1)
  }

  const stepNumber = stepIndex + 1

  if (stepIndex < SKIPPABLE_STEPS.length) {
    const { title, description, placeholder } = SKIPPABLE_STEPS[stepIndex]
    return (
      <SkippablePlaceholderStep
        step={stepNumber}
        totalSteps={TOTAL_STEPS}
        title={title}
        description={description}
        placeholder={placeholder}
        onNext={advance}
        onSkip={advance}
      />
    )
  }

  if (stepIndex === SKIPPABLE_STEPS.length) {
    return <StepIntro step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} />
  }

  return <StepCustomize step={stepNumber} totalSteps={TOTAL_STEPS} onFinish={advance} />
}
