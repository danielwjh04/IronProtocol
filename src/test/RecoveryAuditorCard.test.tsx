// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import RecoveryAuditorCard, { type AuditResult } from '../components/RecoveryAuditorCard'

afterEach(cleanup)

const LOW_RESULT: AuditResult = {
  severity: 'low',
  missionBrief: 'Telemetry nominal.',
  sessionAdjustments: [],
}

const HIGH_RESULT: AuditResult = {
  severity: 'high',
  missionBrief: 'Critical fatigue.',
  sessionAdjustments: [{ detail: 'Full rest.' }],
  arcRecommendation: { action: 'insert-deload', rationale: '3-session accumulation.' },
}

describe('RecoveryAuditorCard', () => {
  it('renders locked state when isLabAvailable is false', () => {
    render(
      <RecoveryAuditorCard
        auditResult={null}
        isLabAvailable={false}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.getByText(/Lab Connection Required/i)).toBeInTheDocument()
  })

  it('renders green badge for low severity', () => {
    render(
      <RecoveryAuditorCard
        auditResult={LOW_RESULT}
        isLabAvailable={true}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.getByText(/Recovery · Clear/i)).toBeInTheDocument()
    expect(screen.getByText('Telemetry nominal.')).toBeInTheDocument()
  })

  it('hides arc adjustment section when severity is not high', () => {
    render(
      <RecoveryAuditorCard
        auditResult={{ severity: 'medium', missionBrief: 'Caution.', sessionAdjustments: [] }}
        isLabAvailable={true}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /review arc/i })).not.toBeInTheDocument()
  })

  it('shows arc CTA and fires callback when severity is high', () => {
    const onArcReviewRequested = vi.fn()
    render(
      <RecoveryAuditorCard
        auditResult={HIGH_RESULT}
        isLabAvailable={true}
        onArcReviewRequested={onArcReviewRequested}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /review arc adjustment/i }))
    expect(onArcReviewRequested).toHaveBeenCalledOnce()
  })
})
