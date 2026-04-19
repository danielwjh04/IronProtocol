import { describe, expect, it } from 'vitest'
import type { PlannedExercise, PlannedWorkout } from '../planner/autoPlanner'
import {
  applyQosToPlan,
  buildUpdatedPlanFromCards,
  clampWorkoutLengthMinutes,
  isExerciseIntegrityValid,
  planSyncSignature,
  reconcileExerciseCards,
  remapExercisesForGoal,
  reorderCardsByInstanceIds,
  resolveQosExercises,
  type ExerciseCardModel,
} from '../services/exerciseQoS'

function makeExercise(overrides: Partial<PlannedExercise> = {}): PlannedExercise {
  return {
    exerciseId: 'e1',
    exerciseName: 'Bench Press',
    weight: 60,
    reps: 8,
    sets: 3,
    tier: 1,
    progressionGoal: 'Goal',
    ...overrides,
  }
}

function makePlan(exercises: PlannedExercise[]): PlannedWorkout {
  return {
    routineType: 'PPL',
    sessionIndex: 0,
    estimatedMinutes: 45,
    exercises,
  }
}

describe('exerciseQoS — clampWorkoutLengthMinutes', () => {
  it('clamps below minimum to 15', () => {
    expect(clampWorkoutLengthMinutes(5)).toBe(15)
  })
  it('clamps above maximum to 120', () => {
    expect(clampWorkoutLengthMinutes(180)).toBe(120)
  })
  it('rounds to nearest 5', () => {
    expect(clampWorkoutLengthMinutes(42)).toBe(40)
    expect(clampWorkoutLengthMinutes(43)).toBe(45)
  })
})

describe('exerciseQoS — resolveQosExercises', () => {
  it('keeps all exercises when time budget is sufficient', () => {
    const exercises = [makeExercise({ exerciseId: 'a', tier: 3, sets: 2 })]
    const result = resolveQosExercises(exercises, 'Hypertrophy', 120)
    expect(result.activeExercises).toHaveLength(1)
    expect(result.trimmedExercises).toHaveLength(0)
  })

  it('trims trailing exercises when budget is tight', () => {
    const exercises = [
      makeExercise({ exerciseId: 'a', tier: 1, sets: 4 }),
      makeExercise({ exerciseId: 'b', tier: 1, sets: 4 }),
      makeExercise({ exerciseId: 'c', tier: 1, sets: 4 }),
      makeExercise({ exerciseId: 'd', tier: 1, sets: 4 }),
    ]
    const result = resolveQosExercises(exercises, 'Hypertrophy', 20)
    expect(result.activeExercises.length).toBeLessThan(exercises.length)
    expect(result.trimmedExercises.length).toBeGreaterThan(0)
    expect(result.activeExercises.length + result.trimmedExercises.length).toBe(exercises.length)
  })

  it('trims from the end, preserving front-loaded priorities', () => {
    const exercises = [
      makeExercise({ exerciseId: 'a', tier: 3, sets: 2 }),
      makeExercise({ exerciseId: 'b', tier: 1, sets: 4 }),
    ]
    const result = resolveQosExercises(exercises, 'Hypertrophy', 20)
    expect(result.trimmedExercises.length).toBe(1)
    expect(result.trimmedExercises[0].exerciseId).toBe('b')
    expect(result.activeExercises[0].exerciseId).toBe('a')
  })
})

describe('exerciseQoS — applyQosToPlan', () => {
  it('returns new plan with recalculated estimated minutes', () => {
    const plan = makePlan([makeExercise({ tier: 3, sets: 2 })])
    const { activePlan } = applyQosToPlan(plan, 'Hypertrophy', 60)
    expect(activePlan.estimatedMinutes).toBeGreaterThan(0)
    expect(activePlan.routineType).toBe('PPL')
  })
})

describe('exerciseQoS — reconcileExerciseCards', () => {
  it('preserves instanceId for unchanged exercises', () => {
    const card: ExerciseCardModel = { instanceId: 'stable-id', exercise: makeExercise({ exerciseId: 'a' }) }
    const reconciled = reconcileExerciseCards([card], [makeExercise({ exerciseId: 'a' })])
    expect(reconciled).toHaveLength(1)
    expect(reconciled[0].instanceId).toBe('stable-id')
  })

  it('assigns new instanceId to new exercises', () => {
    const card: ExerciseCardModel = { instanceId: 'old-id', exercise: makeExercise({ exerciseId: 'a' }) }
    const reconciled = reconcileExerciseCards([card], [makeExercise({ exerciseId: 'b', exerciseName: 'Squat' })])
    expect(reconciled).toHaveLength(1)
    expect(reconciled[0].instanceId).not.toBe('old-id')
  })

  it('preserves order from nextExercises', () => {
    const existing: ExerciseCardModel[] = [
      { instanceId: 'id-a', exercise: makeExercise({ exerciseId: 'a' }) },
      { instanceId: 'id-b', exercise: makeExercise({ exerciseId: 'b', exerciseName: 'Row' }) },
    ]
    const reconciled = reconcileExerciseCards(existing, [
      makeExercise({ exerciseId: 'b', exerciseName: 'Row' }),
      makeExercise({ exerciseId: 'a' }),
    ])
    expect(reconciled[0].instanceId).toBe('id-b')
    expect(reconciled[1].instanceId).toBe('id-a')
  })
})

describe('exerciseQoS — isExerciseIntegrityValid', () => {
  it('rejects duplicate IDs', () => {
    expect(isExerciseIntegrityValid([
      makeExercise({ exerciseId: 'a' }),
      makeExercise({ exerciseId: 'a' }),
    ])).toBe(false)
  })

  it('rejects adjacent duplicate names', () => {
    expect(isExerciseIntegrityValid([
      makeExercise({ exerciseId: 'a', exerciseName: 'Bench' }),
      makeExercise({ exerciseId: 'b', exerciseName: 'bench' }),
    ])).toBe(false)
  })

  it('accepts distinct exercises', () => {
    expect(isExerciseIntegrityValid([
      makeExercise({ exerciseId: 'a', exerciseName: 'Bench' }),
      makeExercise({ exerciseId: 'b', exerciseName: 'Squat' }),
    ])).toBe(true)
  })
})

describe('exerciseQoS — remapExercisesForGoal', () => {
  it('rewrites sets and reps based on tier prescription', () => {
    const remapped = remapExercisesForGoal([makeExercise({ tier: 1 })], 'Power')
    expect(remapped).toHaveLength(1)
    expect(remapped[0].exerciseId).toBe('e1')
    expect(typeof remapped[0].sets).toBe('number')
    expect(typeof remapped[0].reps).toBe('number')
  })
})

describe('exerciseQoS — reorderCardsByInstanceIds', () => {
  it('reorders to match given id sequence', () => {
    const cards: ExerciseCardModel[] = [
      { instanceId: 'a', exercise: makeExercise({ exerciseId: '1' }) },
      { instanceId: 'b', exercise: makeExercise({ exerciseId: '2', exerciseName: 'Row' }) },
    ]
    const reordered = reorderCardsByInstanceIds(cards, ['b', 'a'])
    expect(reordered.map((c) => c.instanceId)).toEqual(['b', 'a'])
  })

  it('returns cloned current cards when id sets do not match', () => {
    const cards: ExerciseCardModel[] = [
      { instanceId: 'a', exercise: makeExercise({ exerciseId: '1' }) },
    ]
    const reordered = reorderCardsByInstanceIds(cards, ['missing'])
    expect(reordered.map((c) => c.instanceId)).toEqual(['a'])
  })
})

describe('exerciseQoS — buildUpdatedPlanFromCards', () => {
  it('returns null when integrity is violated', () => {
    const plan = makePlan([])
    const cards: ExerciseCardModel[] = [
      { instanceId: 'a', exercise: makeExercise({ exerciseId: 'x' }) },
      { instanceId: 'b', exercise: makeExercise({ exerciseId: 'x' }) },
    ]
    expect(buildUpdatedPlanFromCards(plan, cards, 'Hypertrophy')).toBeNull()
  })

  it('recomputes estimated minutes on success', () => {
    const plan = makePlan([makeExercise()])
    const cards: ExerciseCardModel[] = [
      { instanceId: 'a', exercise: makeExercise({ exerciseId: '1' }) },
      { instanceId: 'b', exercise: makeExercise({ exerciseId: '2', exerciseName: 'Squat' }) },
    ]
    const result = buildUpdatedPlanFromCards(plan, cards, 'Hypertrophy')
    expect(result).not.toBeNull()
    expect(result?.exercises).toHaveLength(2)
    expect(typeof result?.estimatedMinutes).toBe('number')
  })
})

describe('exerciseQoS — planSyncSignature', () => {
  it('returns sentinel for null plan', () => {
    expect(planSyncSignature(null)).toBe('__none__')
  })

  it('returns stable signature for identical plans', () => {
    const plan = makePlan([makeExercise()])
    expect(planSyncSignature(plan)).toBe(planSyncSignature(makePlan([makeExercise()])))
  })

  it('differs when exercise order changes', () => {
    const a = makeExercise({ exerciseId: 'a' })
    const b = makeExercise({ exerciseId: 'b', exerciseName: 'Squat' })
    expect(planSyncSignature(makePlan([a, b]))).not.toBe(planSyncSignature(makePlan([b, a])))
  })
})
