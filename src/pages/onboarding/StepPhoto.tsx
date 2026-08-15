import { OnboardingStepShell } from './OnboardingStepShell'
import { PhotoPickerButton } from './PhotoPickerButton'
import { usePhotoCapture } from './usePhotoCapture'

interface StepPhotoProps {
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
}

/** TODO #2.5: two ways to set a profile picture — take one now, or pick an existing one from your
 *  phone (`PhotoPickerButton`'s `capture` prop is the whole difference between the two, see
 *  usePhotoCapture.ts). Both just preview locally; nothing here is saved past this visit, same
 *  "nothing persists" honesty as every other create/edit flow in this prototype — ProfilePage's
 *  own avatar is still the fixed 🙂 in mockUser.ts regardless of what gets chosen here. Skippable,
 *  and Continue is never gated on it — only §2.1's skills step gates Continue. */
export function StepPhoto({ step, totalSteps, onNext, onSkip }: StepPhotoProps) {
  const { photoUrl, choosePhoto } = usePhotoCapture()

  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="Add a profile picture"
      description="Help people recognize you when you trade."
      primaryLabel="Continue"
      onPrimary={onNext}
      onSkip={onSkip}
    >
      <div className="onboarding-step__photo-actions">
        <PhotoPickerButton label="Take a picture" capture="user" onChoose={choosePhoto} />
        <PhotoPickerButton label="Choose from your phone" onChoose={choosePhoto} />
      </div>

      {photoUrl && (
        <div className="onboarding-step__photo-preview">
          <img src={photoUrl} alt="Your chosen profile picture" />
        </div>
      )}

      <p className="onboarding-step__note">
        Nothing here is saved: your profile still shows the same picture as before once you finish
        onboarding.
      </p>
    </OnboardingStepShell>
  )
}
