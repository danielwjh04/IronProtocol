import { describe, expect, it } from 'vitest'
import { TEMP_SESSION_ID } from '../db/schema'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'

describe('tempSessionSchema', () => {
  it('accepts a valid strict temp session payload', () => {
    const parsed = parseTempSessionDraft({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Goal: 3 Reps (Baseline)',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 1,
      weight: 77.5,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 60,
      completedSets: [
        { exerciseId: 'ex-1', weight: 80, reps: 5, orderIndex: 0 },
      ],
      updatedAt: Date.now(),
    })

    expect(parsed.id).toBe(TEMP_SESSION_ID)
    expect(parsed.currentSetInEx).toBe(1)
    expect(parsed.weight).toBe(77.5)
  })

  it('rejects payloads with unknown properties', () => {
    expect(() => parseTempSessionDraft({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 60,
      completedSets: [],
      updatedAt: Date.now(),
      hostileField: 'inject',
    })).toThrow()
  })
})

describe('supersetGroupId — optional field round-trip', () => {
  it('accepts a TempSessionExercise with supersetGroupId defined', () => {
    const baseExercise = {
      exerciseId: 'abc',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      sets: 3,
      tier: 1 as const,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
    }
    const withSuperset = { ...baseExercise, supersetGroupId: 'grp-1' }
    expect(() => parseTempSessionDraft({
      id: 'temp_session',
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 60,
      exercises: [withSuperset],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })).not.toThrow()
  })

  it('rejects a TempSessionExercise with an empty supersetGroupId', () => {
    const exercise = {
      exerciseId: 'abc',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      sets: 3,
      tier: 1 as const,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
      supersetGroupId: '',
    }
    expect(() => parseTempSessionDraft({
      id: 'temp_session',
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 60,
      exercises: [exercise],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })).toThrow()
  })

  it('accepts a TempSessionExercise without supersetGroupId (standard single)', () => {
    const exercise = {
      exerciseId: 'abc',
      exerciseName: 'Squat',
      weight: 100,
      reps: 5,
      sets: 5,
      tier: 1 as const,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
    }
    expect(() => parseTempSessionDraft({
      id: 'temp_session',
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 60,
      exercises: [exercise],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 100,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })).not.toThrow()
  })
})
