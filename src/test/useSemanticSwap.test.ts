// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSemanticSwap } from '../hooks/useSemanticSwap'
import type { SwapResult } from '../services/semanticSwapService'

vi.mock('../services/geminiClient', () => ({
  isLabAvailable: vi.fn(),
  fetchGemini: vi.fn(),
}))

vi.mock('../services/semanticSwapService', () => ({
  generateSemanticSwap: vi.fn(),
}))

import { isLabAvailable } from '../services/geminiClient'
import { generateSemanticSwap } from '../services/semanticSwapService'

const mockIsLabAvailable = vi.mocked(isLabAvailable)
const mockGenerateSemanticSwap = vi.mocked(generateSemanticSwap)

const MOCK_RESULT: SwapResult = {
  exerciseName: 'Leg Press',
  muscleGroup: 'legs',
  tier: 'T1',
  reason: 'Isolates quads without spinal load.',
  confidence: 'high',
}

afterEach(() => vi.clearAllMocks())

describe('useSemanticSwap', () => {
  it('starts in idle state', () => {
    mockIsLabAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useSemanticSwap())
    expect(result.current.status).toBe('idle')
    expect(result.current.swapResult).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exposes isLabAvailable=false when Lab is offline', () => {
    mockIsLabAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useSemanticSwap())
    expect(result.current.isLabAvailable).toBe(false)
  })

  it('transitions idle → loading → result on successful submit', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateSemanticSwap.mockResolvedValue(MOCK_RESULT)

    const { result } = renderHook(() => useSemanticSwap())

    await act(async () => {
      result.current.submit('knee pain', { name: 'Back Squat', tier: 1, muscleGroup: 'legs' }, [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      })
    })

    expect(result.current.status).toBe('result')
    expect(result.current.swapResult).toEqual(MOCK_RESULT)
  })

  it('transitions to error state when service throws', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateSemanticSwap.mockRejectedValue(new Error('timeout'))

    const { result } = renderHook(() => useSemanticSwap())

    await act(async () => {
      result.current.submit('any query', { name: 'Bench Press', tier: 1, muscleGroup: 'chest' }, [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('timeout')
  })
})
