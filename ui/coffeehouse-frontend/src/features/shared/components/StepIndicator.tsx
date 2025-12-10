/**
 * StepIndicator Component
 * Feature: 003-warm-ui-theme
 * Task: T032, T033
 *
 * Displays numbered step indicators for multi-step workflows.
 * Uses warm coffeehouse theme colors for step states.
 */
import React from 'react'

export type StepStatus = 'upcoming' | 'current' | 'complete'

export interface StepProps {
  /** Step number (1-based) */
  number: number
  /** Step label */
  label: string
  /** Current status of the step */
  status: StepStatus
  /** Optional description text */
  description?: string
}

export interface StepInputProps {
  /** Step label */
  label: string
  /** Optional description text */
  description?: string
}

export interface StepIndicatorProps {
  /** Array of steps to display (status is derived from currentStep) */
  steps: StepInputProps[]
  /** Current step index (0-based) */
  currentStep: number
  /** Optional className for the container */
  className?: string
  /** Orientation of the step indicator */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Individual step component with status-based styling
 */
function Step({ number, label, status, description }: StepProps) {
  const statusClasses = {
    upcoming: 'step-indicator__step--upcoming',
    current: 'step-indicator__step--current',
    complete: 'step-indicator__step--complete',
  }

  return (
    <div className={`step-indicator__step ${statusClasses[status]}`}>
      <div className="step-indicator__circle">
        {status === 'complete' ? (
          <svg
            className="step-indicator__check"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="step-indicator__number">{number}</span>
        )}
      </div>
      <div className="step-indicator__content">
        <span className="step-indicator__label">{label}</span>
        {description && <span className="step-indicator__description">{description}</span>}
      </div>
    </div>
  )
}

/**
 * StepIndicator displays a series of numbered steps with connecting lines.
 * Supports horizontal and vertical orientations.
 *
 * @example
 * ```tsx
 * <StepIndicator
 *   steps={[
 *     { label: 'Select Document', status: 'complete' },
 *     { label: 'Enter Details', status: 'current' },
 *     { label: 'Review', status: 'upcoming' },
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export function StepIndicator({
  steps,
  currentStep,
  className = '',
  orientation = 'horizontal',
}: StepIndicatorProps) {
  // Derive status from currentStep for each step
  const stepsWithStatus = steps.map((step, index) => {
    let status: StepStatus = 'upcoming'
    if (index < currentStep) {
      status = 'complete'
    } else if (index === currentStep) {
      status = 'current'
    }
    return { ...step, status, number: index + 1 }
  })

  return (
    <div
      className={`step-indicator step-indicator--${orientation} ${className}`}
      role="navigation"
      aria-label="Progress steps"
    >
      {stepsWithStatus.map((step, index) => (
        <React.Fragment key={step.number}>
          <Step {...step} />
          {index < stepsWithStatus.length - 1 && (
            <div
              className={`step-indicator__connector ${
                index < currentStep ? 'step-indicator__connector--complete' : ''
              }`}
              aria-hidden="true"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Export Step as a subcomponent for flexibility
StepIndicator.Step = Step

export default StepIndicator
