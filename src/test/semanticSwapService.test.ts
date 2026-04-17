import { describe, it, expect } from 'vitest'
import { buildSwapPrompt, swapResultSchema } from '../services/semanticSwapService'
import type { V11AppSettingsSchema } from '../db/schema'
import type { ReadonlyExercise } from '../db/schema'

function makeV11Contract(): V11AppSettingsSchema {
  return {
    physiologicalBaselines: { ageYears: 28, bodyWeightKg: 80, gender: 'male' },
    trainingExperienceLevel: 'intermediate',
    logisticalConstraints: { targetDaysPerWeek: 3, hardSessionLimitMinutes: 60 },
    equipmentAvailability: 'commercial-gym',
    primaryGoals: { primaryFocus: 'hypertrophy', specificLiftTargets: [] },
    injuryConstraints: { hasActiveConstraints: true, constraints: [{ structuralAversion: 'No overhead pressing' }] },
  }
}

const MOCK_EXERCISE_DB: ReadonlyExercise[] = [
  { id: 'ex-1', name: 'Leg Press', muscleGroup: 'legs', tier: 1, tags: ['compound'], mediaType: 'image', mediaRef: '' },
  { id: 'ex-2', name: 'Hack Squat', muscleGroup: 'legs', tier: 2, tags: ['compound'], mediaType: 'image', mediaRef: '' },
]

describe('buildSwapPrompt', () => {
  it('includes the user query', () => {
    const prompt = buildSwapPrompt(
      'knee pain, need a quad exercise',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('knee pain, need a quad exercise')
  })

  it('includes the current exercise being swapped', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('Back Squat')
    expect(prompt).toContain('T1')
  })

  it('includes injury constraints from V11 contract', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Overhead Press', tier: 1, muscleGroup: 'shoulders' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('No overhead pressing')
  })

  it('includes available exercises from the local DB', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('Leg Press')
    expect(prompt).toContain('Hack Squat')
  })
})

describe('swapResultSchema', () => {
  it('accepts a valid SwapResult', () => {
    const result = swapResultSchema.safeParse({
      name: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      reason: 'Isolates quads without spinal load.',
      confidence: 'high',
    })
    expect(result.success).toBe(true)
  })

  it('transforms tier string to numeric ExerciseTier', () => {
    expect(swapResultSchema.safeParse({ name: 'A', muscleGroup: 'legs', tier: 'T1', reason: 'r', confidence: 'high' }).data?.tier).toBe(1)
    expect(swapResultSchema.safeParse({ name: 'A', muscleGroup: 'legs', tier: 'T2', reason: 'r', confidence: 'high' }).data?.tier).toBe(2)
    expect(swapResultSchema.safeParse({ name: 'A', muscleGroup: 'legs', tier: 'T3', reason: 'r', confidence: 'high' }).data?.tier).toBe(3)
  })

  it('rejects missing reason field', () => {
    const result = swapResultSchema.safeParse({
      name: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      confidence: 'high',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid confidence value', () => {
    const result = swapResultSchema.safeParse({
      name: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      reason: 'Good.',
      confidence: 'excellent',
    })
    expect(result.success).toBe(false)
  })
})
