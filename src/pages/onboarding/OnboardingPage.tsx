import { useState } from 'react'
import { StepCustomize } from './StepCustomize'
import { StepFriends } from './StepFriends'
import { StepIntro } from './StepIntro'
import { StepPhoto } from './StepPhoto'
import { StepSkills } from './StepSkills'
import { StepVerify } from './StepVerify'

const TOTAL_STEPS = 6 // skills, friends, verify, intro, photo, customize

interface OnboardingPageProps {
  onComplete: () => void
}

/** Six fixed steps, dispatched by index. This used to be a `SKIPPABLE_STEPS` array driving one
 *  generic placeholder renderer for skills/friends/verify — that made sense while all three were
 *  interchangeable stand-ins, the same way GridSection and PagedGrid stayed separate components
 *  once their "what happens on overflow" behaviour actually diverged (see HANDOFF.md §8). Now that
 *  skills (TODO #2.1) is a real, different step from the other two, forcing it back through the
 *  shared shape would cost more than the small amount of repetition explicit `if`s bring back.
 *
 *  Order follows TODO.md's own 2.1–2.5 numbering (skills, friends, verify, how-it-works, photo);
 *  `customize` ("Make it yours") is a pre-existing final step from outside that numbered list,
 *  so it stays last rather than being reordered around TODO #2.5. */
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
    return <StepFriends step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} onSkip={advance} />
  }

  if (stepIndex === 2) {
    return <StepVerify step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} onSkip={advance} />
  }

  if (stepIndex === 3) {
    return <StepIntro step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} />
  }

  if (stepIndex === 4) {
    return <StepPhoto step={stepNumber} totalSteps={TOTAL_STEPS} onNext={advance} onSkip={advance} />
  }

  return <StepCustomize step={stepNumber} totalSteps={TOTAL_STEPS} onFinish={advance} />
}
