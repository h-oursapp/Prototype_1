import { useState } from 'react'
import { MOCK_INVITE_LINK } from '../../data/mockCommunity'
import { OnboardingStepShell } from './OnboardingStepShell'

interface StepFriendsProps {
  step: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  /** Defaults to the real Clipboard API. Overridable so tests can supply a plain mock instead of
   *  fighting jsdom's own (partial, getter-only) `navigator.clipboard` — the same reasoning as
   *  passing a real function anywhere else instead of monkey-patching a global for a test. */
  copyLink?: (link: string) => Promise<void>
}

/** TODO #2.2: "an input box for copying a friend/community link" is the whole spec — one
 *  sentence — so this is exactly that and nothing more: a read-only field holding the invite
 *  link, and a Copy button beside it. No QR code, no share sheet, no per-friend links; none of
 *  that was asked for. */
export function StepFriends({
  step,
  totalSteps,
  onNext,
  onSkip,
  copyLink = (link) => navigator.clipboard.writeText(link),
}: StepFriendsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyLink(MOCK_INVITE_LINK)
      setCopied(true)
    } catch {
      // Clipboard access can be denied or unavailable (an insecure context, a permission prompt
      // the user dismissed, ...). The link is still readOnly-selectable by hand in that case, so
      // nothing is actually stuck — just not one-click.
      setCopied(false)
    }
  }

  return (
    <OnboardingStepShell
      step={step}
      totalSteps={totalSteps}
      title="Add friends"
      description="Invite people you know, or find them once your profile is public."
      primaryLabel="Continue"
      onPrimary={onNext}
      onSkip={onSkip}
    >
      <div className="onboarding-step__field">
        <label className="onboarding-step__label" htmlFor="invite-link">
          Your invite link
        </label>
        <div className="onboarding-step__copy-row">
          <input
            id="invite-link"
            className="onboarding-step__input"
            type="text"
            readOnly
            value={MOCK_INVITE_LINK}
            onFocus={(event) => event.target.select()}
          />
          <button type="button" className="onboarding-step__copy" onClick={handleCopy}>
            Copy
          </button>
        </div>
        {copied && (
          <p className="onboarding-step__copied" role="status">
            Copied to your clipboard.
          </p>
        )}
      </div>
    </OnboardingStepShell>
  )
}
