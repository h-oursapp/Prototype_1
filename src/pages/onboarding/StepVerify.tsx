import { useState } from 'react'
import { generateVerificationCode } from '../../utils/verificationCode'
import { OnboardingStepShell } from './OnboardingStepShell'
import { PhotoPickerButton } from './PhotoPickerButton'
import { usePhotoCapture } from './usePhotoCapture'

interface StepVerifyProps {
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
}

/** TODO #2.3: identity verification is a stand-in end to end — "during the prototype phase we
 *  don't actually verify anything" — so this step generates a code, lets you photograph yourself
 *  holding it, and Continue moves on regardless of whether a picture was taken. (Only §2.1's
 *  skills step gates Continue; nothing here asked for that.)
 *
 *  The camera button is a plain `<input type="file" accept="image/*" capture="user">`, not a
 *  live `getUserMedia` feed — on a phone this already opens the OS's own camera app directly,
 *  which is simpler and more reliable than building and cleaning up a custom camera stream for a
 *  prototype that never checks the result against anything. See PhotoPickerButton/usePhotoCapture,
 *  shared with StepPhoto (TODO #2.5) once that became a second real call site for the same thing. */
export function StepVerify({ step, totalSteps, onNext, onSkip }: StepVerifyProps) {
  const [code] = useState(generateVerificationCode)
  const { photoUrl, choosePhoto } = usePhotoCapture()

  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="Verify your identity"
      description="Write this code on a piece of paper, then take a picture of yourself holding it next to your face."
      primaryLabel="Continue"
      onPrimary={onNext}
      onSkip={onSkip}
    >
      <p className="onboarding-step__code" aria-label={`Your verification code: ${code}`}>
        {code}
      </p>

      <PhotoPickerButton
        label={photoUrl ? 'Retake picture' : 'Take a picture'}
        capture="user"
        onChoose={choosePhoto}
      />

      {photoUrl && (
        <div className="onboarding-step__photo-preview">
          <img src={photoUrl} alt="Your verification picture: you holding the code above, next to your face" />
        </div>
      )}

      <p className="onboarding-step__note">
        Nothing here is verified in the prototype — your verification pic stays in this browser
        tab only, and is never uploaded or checked against anything.
      </p>
    </OnboardingStepShell>
  )
}
