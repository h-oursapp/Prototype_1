import { useState } from 'react'
import { SkippablePlaceholderStep } from './SkippablePlaceholderStep'
import { StepCustomize } from './StepCustomize'
import { StepIntro } from './StepIntro'
import { StepSkills } from './StepSkills'

const TOTAL_STEPS = 5 // skills, friends, verify, intro, customize

interface OnboardingPageProps {
  onComplete: () => void
}

/** Five fixed steps, dispatched by index. This used to be a `SKIPPABLE_STEPS` array driving one
 *  generic placeholder renderer for skills/friends/verify — that made sense while all three were
 *  interchangeable stand-ins, the same way GridSection and PagedGrid stayed separate components
 *  once their "what happens on overflow" behaviour actually diverged (see HANDOFF.md §8). Now that
 *  skills (TODO #2.1) is a real, different step from the other two, forcing it back through the
 *  shared shape would cost more than the small amount of repetition explicit `if`s bring back. */
export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const advance = () => {
    if (stepIndex === TOTAL_STEPS - 1) onComplete()
    else setStepIndex((index) => index + 1)
  }

  const stepNumber = stepIndex + 1

  if (stepIndex === 0) {
    return <StepSkills step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} onSkip={advance} />
  }

  if (stepIndex === 1) {
    return (
      <SkippablePlaceholderStep
        step={stepNumber}
        totalSteps={TOTAL_STEPS}
        title="Add friends"
        description="Invite people you know, or find them once your profile is public."
        placeholder="Friend search coming soon."
        onNext={advance}
        onSkip={advance}
      />
    )
  }

  if (stepIndex === 2) {
    return (
      <SkippablePlaceholderStep
        step={stepNumber}
        totalSteps={TOTAL_STEPS}
        title="Verify your identity"
        description="Verified profiles build more trust when trading with others."
        placeholder="Verification coming soon."
        onNext={advance}
        onSkip={advance}
      />
    )
  }

  if (stepIndex === 3) {
    return <StepIntro step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} />
  }

  return <StepCustomize step={stepNumber} totalSteps={TOTAL_STEPS} onFinish={advance} />
}
