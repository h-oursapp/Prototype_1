import type { ReactNode } from 'react'
import './onboarding.css'

interface OnboardingStepShellProps {
  step: number
  totalSteps: number
  title: string
  description?: string
  children?: ReactNode
  primaryLabel: string
  onPrimary: () => void
  onSkip?: () => void
}

export function OnboardingStepShell({
  step,
  totalSteps,
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  onSkip,
}: OnboardingStepShellProps) {
  return (
    <section className="onboarding-step">
      <ol className="onboarding-step__progress" aria-label={`Step ${step} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <li key={index} className={index < step ? 'is-done' : ''} />
        ))}
      </ol>

      <h2>{title}</h2>
      {description && <p className="onboarding-step__description">{description}</p>}

      <div className="onboarding-step__body">{children}</div>

      <div className="onboarding-step__actions">
        {onSkip && (
          <button type="button" className="onboarding-step__skip" onClick={onSkip}>
            Skip
          </button>
        )}
        <button type="button" className="onboarding-step__primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </section>
  )
}
