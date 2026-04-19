import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { APP_SETTINGS_ID, IronProtocolDB, type Exercise } from '../db/schema'
import type { PlannedExercise, PlannedWorkout } from '../planner/autoPlanner'
import {
  commitSwapToPlan,
  loadSwapCandidates,
  persistFallbackSwap,
} from '../services/fallbackPoolManager'
import type { ExerciseCardModel } from '../services/exerciseQoS'

function makePlannedExercise(overrides: Partial<PlannedExercise> = {}): PlannedExercise {
  return {
    exerciseId: 'planned-1',
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

describe('fallbackPoolManager — commitSwapToPlan', () => {
  it('returns null for out-of-range swap index', () => {
    const plan = makePlan([makePlannedExercise()])
    const result = commitSwapToPlan({
      sourcePlan: plan,
      swapIndex: 5,
      sourceCardExercise: plan.exercises[0],
      nextExercise: { id: 'x', name: 'Row', muscleGroup: 'Back', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'row.webp' },
      trainingGoal: 'Hypertrophy',
    })
    expect(result).toBeNull()
  })

  it('replaces exercise at index preserving sets/reps from source card', () => {
    const plan = makePlan([
      makePlannedExercise({ exerciseId: 'p1', exerciseName: 'Bench', sets: 4, reps: 6 }),
      makePlannedExercise({ exerciseId: 'p2', exerciseName: 'Squat', tier: 1, sets: 5, reps: 5 }),
    ])
    const next: Exercise = { id: 'p3', name: 'Incline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'incline.webp' }

    const result = commitSwapToPlan({
      sourcePlan: plan,
      swapIndex: 0,
      sourceCardExercise: plan.exercises[0],
      nextExercise: next,
      trainingGoal: 'Hypertrophy',
    })

    expect(result).not.toBeNull()
    expect(result?.exercises).toHaveLength(2)
    expect(result?.exercises[0].exerciseId).toBe('p3')
    expect(result?.exercises[0].exerciseName).toBe('Incline Bench')
    expect(result?.exercises[0].sets).toBe(4)
    expect(result?.exercises[0].reps).toBe(6)
    expect(result?.exercises[1].exerciseId).toBe('p2')
  })

  it('falls back to tier prescription when source card sets are 0', () => {
    const plan = makePlan([makePlannedExercise({ sets: 0, reps: 0, tier: 1 })])
    const next: Exercise = { id: 'x', name: 'Row', muscleGroup: 'Back', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'row.webp' }

    const result = commitSwapToPlan({
      sourcePlan: plan,
      swapIndex: 0,
      sourceCardExercise: plan.exercises[0],
      nextExercise: next,
      trainingGoal: 'Hypertrophy',
    })
    expect(result?.exercises[0].sets).toBeGreaterThan(0)
    expect(result?.exercises[0].reps).toBeGreaterThan(0)
  })
})

describe('fallbackPoolManager — loadSwapCandidates', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('returns same-tier same-muscle-group alternatives', async () => {
    const sourceId = uuidv4()
    const altId = uuidv4()
    const otherTierId = uuidv4()
    const otherMuscleId = uuidv4()

    await db.exercises.bulkAdd([
      { id: sourceId, name: 'Bench Press', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'bench.webp' },
      { id: altId, name: 'Incline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'incline.webp' },
      { id: otherTierId, name: 'Cable Fly', muscleGroup: 'Chest', tier: 2, tags: [], mediaType: 'webp', mediaRef: 'fly.webp' },
      { id: otherMuscleId, name: 'Squat', muscleGroup: 'Legs', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'squat.webp' },
    ])

    const card: ExerciseCardModel = {
      instanceId: 'instance-1',
      exercise: makePlannedExercise({ exerciseId: sourceId, exerciseName: 'Bench Press', tier: 1 }),
    }

    const candidates = await loadSwapCandidates(db, { card, cards: [card] })

    const candidateIds = candidates.map((c) => c.id)
    expect(candidateIds).toContain(altId)
    expect(candidateIds).not.toContain(sourceId)
    expect(candidateIds).not.toContain(otherTierId)
    expect(candidateIds).not.toContain(otherMuscleId)
  })

  it('excludes exercises already in the workout (blocked IDs)', async () => {
    const sourceId = uuidv4()
    const usedId = uuidv4()
    const freeId = uuidv4()

    await db.exercises.bulkAdd([
      { id: sourceId, name: 'Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'bench.webp' },
      { id: usedId, name: 'Incline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'incline.webp' },
      { id: freeId, name: 'Decline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'decline.webp' },
    ])

    const sourceCard: ExerciseCardModel = {
      instanceId: 'ia',
      exercise: makePlannedExercise({ exerciseId: sourceId, exerciseName: 'Bench', tier: 1 }),
    }
    const usedCard: ExerciseCardModel = {
      instanceId: 'ib',
      exercise: makePlannedExercise({ exerciseId: usedId, exerciseName: 'Incline Bench', tier: 1 }),
    }

    const candidates = await loadSwapCandidates(db, { card: sourceCard, cards: [sourceCard, usedCard] })

    const ids = candidates.map((c) => c.id)
    expect(ids).toContain(freeId)
    expect(ids).not.toContain(usedId)
  })
})

describe('fallbackPoolManager — persistFallbackSwap', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
    })
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('adds swapped-out exercise to fallback pool', async () => {
    const source = makePlannedExercise({ exerciseName: 'Bench Press' })
    const next: Exercise = { id: 'x', name: 'Incline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'incline.webp' }

    await persistFallbackSwap(db, source, next)

    const settings = await db.settings.get(APP_SETTINGS_ID)
    const pool = Object.values(settings?.activeFallbackPool ?? {}).flat()
    expect(pool.some((entry) => entry.exerciseName === 'Bench Press')).toBe(true)
  })

  it('removes swapped-in exercise from fallback pool if it was there', async () => {
    await db.settings.update(APP_SETTINGS_ID, {
      activeFallbackPool: {
        global: [{ exerciseName: 'Incline Bench', reason: 'parked earlier' }],
      },
    })

    const source = makePlannedExercise({ exerciseName: 'Bench Press' })
    const next: Exercise = { id: 'x', name: 'Incline Bench', muscleGroup: 'Chest', tier: 1, tags: [], mediaType: 'webp', mediaRef: 'incline.webp' }

    await persistFallbackSwap(db, source, next)

    const settings = await db.settings.get(APP_SETTINGS_ID)
    const pool = Object.values(settings?.activeFallbackPool ?? {}).flat()
    expect(pool.some((entry) => entry.exerciseName === 'Incline Bench')).toBe(false)
    expect(pool.some((entry) => entry.exerciseName === 'Bench Press')).toBe(true)
  })
})
