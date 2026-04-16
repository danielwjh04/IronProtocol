// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecoveryAudit } from '../hooks/useRecoveryAudit'
import type { AuditResult } from '../services/recoveryAuditorService'

vi.mock('../services/geminiClient', () => ({
  isLabAvailable: vi.fn(),
}))

vi.mock('../services/recoveryAuditorService', () => ({
  generateRecoveryAudit: vi.fn(),
}))

import { isLabAvailable } from '../services/geminiClient'
import { generateRecoveryAudit } from '../services/recoveryAuditorService'

const mockIsLabAvailable = vi.mocked(isLabAvailable)
const mockGenerateRecoveryAudit = vi.mocked(generateRecoveryAudit)

const MOCK_AUDIT: AuditResult = {
  severity: 'medium',
  missionBrief: 'Moderate fatigue detected.',
  sessionAdjustments: [{ type: 'reduce-volume', detail: 'Drop T3 by 1 set.' }],
}

afterEach(() => vi.clearAllMocks())

describe('useRecoveryAudit', () => {
  it('returns hasLogs=false and does not call service when no logs provided', async () => {
    mockIsLabAvailable.mockReturnValue(true)

    const { result } = renderHook(() => useRecoveryAudit([], []))

    await waitFor(() => expect(result.current.status).not.toBe('loading'))

    expect(result.current.hasLogs).toBe(false)
    expect(mockGenerateRecoveryAudit).not.toHaveBeenCalled()
  })

  it('returns isLabAvailable=false when Lab is offline', () => {
    mockIsLabAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useRecoveryAudit([], []))
    expect(result.current.isLabAvailable).toBe(false)
  })

  it('calls generateRecoveryAudit and returns result when logs exist', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateRecoveryAudit.mockResolvedValue(MOCK_AUDIT)

    const mockLog = {
      id: 'log-1', workoutId: 'wk-1', loggedAt: Date.now(),
      sleepHours: 6, sleepQuality: 3 as const, stressLevel: 3 as const,
      overallFatigue: 3 as const, soreness: {},
    }

    const { result } = renderHook(() =>
      useRecoveryAudit([mockLog], [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      }),
    )

    await waitFor(() => expect(result.current.status).toBe('result'))

    expect(result.current.auditResult).toEqual(MOCK_AUDIT)
    expect(result.current.hasLogs).toBe(true)
  })
})
