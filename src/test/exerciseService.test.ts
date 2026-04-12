import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import type { Exercise } from '../db/schema'
import { IronProtocolDB } from '../db/schema'
import type { PlannedExercise } from '../planner/autoPlanner'
import {
  getExercisesInSameCategory,
  getSmartSwapAlternatives,
  getSwapRepTarget,
  hasExerciseOrderChanged,
  reorderExercisesById,
} from '../services/exerciseService'

function createExercise(input: {
  id: string
  name: string
  tier?: 1 | 2 | 3
  tags?: string[]
  muscleGroup?: string
}): Exercise {
  return {
    id: input.id,
    name: input.name,
    muscleGroup: input.muscleGroup ?? 'Chest',
    mediaType: 'video',
    mediaRef: '',
    tags: input.tags ?? [],
    tier: input.tier ?? 1,
  }
}

function createPlannedExercise(input: {
  exerciseId: string
  exerciseName: string
  tier?: 1 | 2 | 3
}): PlannedExercise {
  return {
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName,
    weight: 80,
    reps: 5,
    sets: 5,
    tier: input.tier ?? 1,
    progressionGoal: 'Linear Progression',
  }
}

describe('getExercisesInSameCategory', () => {
  const pool: Exercise[] = [
    createExercise({ id: 'bench', name: 'Bench Press' }),
    createExercise({ id: 'incline', name: 'Incline Press' }),
    createExercise({ id: 'db-incline', name: 'Incline Dumbbell Press' }),
    createExercise({ id: 'row', name: 'Barbell Row' }),
  ]

  it('returns all other exercises in the same functional category', () => {
    const matches = getExercisesInSameCategory('Bench Press', pool)
    const names = matches.map((exercise) => exercise.name)

    expect(names).toEqual(expect.arrayContaining(['Incline Press', 'Incline Dumbbell Press']))
    expect(names).not.toContain('Bench Press')
    expect(names).not.toContain('Barbell Row')
  })

  it('returns an empty list when the source category is unknown', () => {
    const matches = getExercisesInSameCategory('Unknown Movement', pool)
    expect(matches).toHaveLength(0)
  })
})

describe('getSwapRepTarget', () => {
  it('keeps reps unchanged for compound-to-compound swaps', () => {
    const reps = getSwapRepTarget({
      sourceExerciseName: 'Back Squat',
      sourceTags: ['compound', 'legs'],
      targetExerciseName: 'Leg Press',
      currentReps: 5,
      purposeChip: 'hypertrophy',
    })

    expect(reps).toBe(5)
  })

  it('scales reps up for compound-to-accessory swaps in hypertrophy mode', () => {
    const reps = getSwapRepTarget({
      sourceExerciseName: 'Back Squat',
      sourceTags: ['compound', 'legs'],
      targetExerciseName: 'Leg Extension',
      currentReps: 5,
      purposeChip: 'hypertrophy',
    })

    expect(reps).toBe(12)
  })

  it('scales reps up for compound-to-accessory swaps in strength mode', () => {
    const reps = getSwapRepTarget({
      sourceExerciseName: 'Back Squat',
      sourceTags: ['compound', 'legs'],
      targetExerciseName: 'Leg Extension',
      currentReps: 5,
      purposeChip: 'strength',
    })

    expect(reps).toBe(8)
  })
})

describe('getSmartSwapAlternatives', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('explicitly excludes source id and keeps alternatives unique', async () => {
    const sourceId = uuidv4()

    await db.exercises.bulkPut([
      createExercise({ id: sourceId, name: 'Bench Press', tier: 1, tags: ['push', 'upper'] }),
      createExercise({ id: uuidv4(), name: 'Incline Press', tier: 1, tags: ['push', 'upper'] }),
      createExercise({ id: uuidv4(), name: 'Incline Press', tier: 1, tags: ['push', 'upper'] }),
      createExercise({ id: uuidv4(), name: 'Push Up', tier: 1, tags: ['push', 'upper'] }),
      createExercise({ id: uuidv4(), name: 'Hammer Strength Press', tier: 1, tags: ['push', 'upper'] }),
      createExercise({ id: uuidv4(), name: 'Barbell Row', tier: 1, tags: ['pull', 'upper'] }),
    ])

    const alternatives = await getSmartSwapAlternatives(
      db,
      createPlannedExercise({ exerciseId: sourceId, exerciseName: 'Bench Press', tier: 1 }),
      { limit: 4 },
    )

    expect(alternatives.every((exercise) => exercise.id !== sourceId)).toBe(true)
    expect(new Set(alternatives.map((exercise) => exercise.id)).size).toBe(alternatives.length)
    expect(new Set(alternatives.map((exercise) => exercise.name.toLowerCase())).size).toBe(alternatives.length)
  })
})

describe('reorderExercisesById', () => {
  const bench: PlannedExercise = {
    exerciseId: 'ex-bench',
    exerciseName: 'Bench Press',
    weight: 80,
    reps: 5,
    sets: 5,
    tier: 1,
    progressionGoal: 'Linear Progression',
  }

  const row: PlannedExercise = {
    exerciseId: 'ex-row',
    exerciseName: 'Barbell Row',
    weight: 70,
    reps: 8,
    sets: 4,
    tier: 1,
    progressionGoal: 'Linear Progression',
  }

  const curl: PlannedExercise = {
    exerciseId: 'ex-curl',
    exerciseName: 'Biceps Curl',
    weight: 15,
    reps: 12,
    sets: 3,
    tier: 2,
    progressionGoal: 'Double Progression',
  }

  it('reorders exercises to the dragged id sequence', () => {
    const current = [bench, row, curl]
    const reordered = reorderExercisesById(current, ['ex-row', 'ex-curl', 'ex-bench'])

    expect(reordered.map((exercise) => exercise.exerciseId)).toEqual([
      'ex-row',
      'ex-curl',
      'ex-bench',
    ])
    expect(hasExerciseOrderChanged(current, reordered)).toBe(true)
  })

  it('returns original order when reorder ids are invalid', () => {
    const current = [bench, row, curl]
    const reordered = reorderExercisesById(current, ['ex-row', 'ex-curl', 'missing'])

    expect(reordered.map((exercise) => exercise.exerciseId)).toEqual([
      'ex-bench',
      'ex-row',
      'ex-curl',
    ])
    expect(hasExerciseOrderChanged(current, reordered)).toBe(false)
  })

  it('returns original order when reorder ids contain duplicates', () => {
    const current = [bench, row, curl]
    const reordered = reorderExercisesById(current, ['ex-row', 'ex-row', 'ex-curl'])

    expect(reordered.map((exercise) => exercise.exerciseId)).toEqual([
      'ex-bench',
      'ex-row',
      'ex-curl',
    ])
    expect(hasExerciseOrderChanged(current, reordered)).toBe(false)
  })
})