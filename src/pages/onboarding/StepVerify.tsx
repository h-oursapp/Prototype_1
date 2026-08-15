import { useEffect, useState, type ChangeEvent } from 'react'
import { generateVerificationCode } from '../../utils/verificationCode'
import { OnboardingStepShell } from './OnboardingStepShell'

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
 *  prototype that never checks the result against anything. */
export function StepVerify({ step, totalSteps, onNext, onSkip }: StepVerifyProps) {
  const [code] = useState(generateVerificationCode)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // The "verification pic" is only ever an object URL pointing at the browser's own memory —
  // revoke the previous one whenever it's replaced or this step unmounts, so retaking the photo
  // a few times doesn't leak memory for the rest of the tab's life.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const handlePhotoChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

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

      <label className="onboarding-step__photo-button">
        <input
          className="onboarding-step__photo-input"
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePhotoChosen}
        />
        {photoUrl ? 'Retake picture' : 'Take a picture'}
      </label>

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
