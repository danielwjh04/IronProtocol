import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { IronProtocolDB } from '../db/schema'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from '../services/macrocyclePersistence'
import {
  buildActivitySignal,
  buildPlanSignature,
  isMacrocycleScheduledWorkout,
  loadNextScheduledWorkoutPlan,
  resolveScheduledDayLabel,
} from '../services/plannerOrchestration'

describe('plannerOrchestration — pure helpers', () => {
  describe('buildActivitySignal', () => {
    it('formats snapshot as "W:S"', () => {
      expect(buildActivitySignal({ workoutCount: 3, setCount: 27 })).toBe('3:27')
    })

    it('returns "0:0" for empty snapshot', () => {
      expect(buildActivitySignal({ workoutCount: 0, setCount: 0 })).toBe('0:0')
    })
  })

  describe('buildPlanSignature', () => {
    it('returns sentinel for null plan', () => {
      expect(buildPlanSignature(null)).toBe('empty-plan')
    })

    it('produces stable signature for identical plans', () => {
      const plan = {
        routineType: 'PPL',
        sessionIndex: 0,
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: 'e1', exerciseName: 'Bench', weight: 60, reps: 8, sets: 3, tier: 1 as const, progressionGoal: 'Goal' },
        ],
      }
      expect(buildPlanSignature(plan)).toBe(buildPlanSignature({ ...plan, exercises: [...plan.exercises] }))
    })

    it('differs when exercise weight changes', () => {
      const base = {
        routineType: 'PPL',
        sessionIndex: 0,
        estimatedMinutes: 45,
        exercises: [
          { exerciseId: 'e1', exerciseName: 'Bench', weight: 60, reps: 8, sets: 3, tier: 1 as const, progressionGoal: 'Goal' },
        ],
      }
      const heavier = { ...base, exercises: [{ ...base.exercises[0], weight: 70 }] }
      expect(buildPlanSignature(base)).not.toBe(buildPlanSignature(heavier))
    })
  })

  describe('isMacrocycleScheduledWorkout', () => {
    it('detects macrocycle prefix', () => {
      expect(isMacrocycleScheduledWorkout(`${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1|Day 1`)).toBe(true)
    })

    it('rejects user-logged workouts', () => {
      expect(isMacrocycleScheduledWorkout('User notes here')).toBe(false)
      expect(isMacrocycleScheduledWorkout('')).toBe(false)
    })
  })

  describe('resolveScheduledDayLabel', () => {
    it('extracts embedded day label from macrocycle notes', () => {
      expect(resolveScheduledDayLabel(`${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1|Upper A`, 'PPL', 0))
        .toBe('Upper A')
    })

    it('falls back to routine session label when notes lack label', () => {
      const label = resolveScheduledDayLabel(`${MACROCYCLE_WORKOUT_NOTE_PREFIX}||`, 'PPL', 0)
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })

    it('uses generic "Day N" fallback on unknown routine', () => {
      expect(resolveScheduledDayLabel('', 'unknown-routine', 4)).toBe('Day 5')
    })
  })
})

describe('plannerOrchestration — loadNextScheduledWorkoutPlan', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('returns null when no scheduled workouts exist', async () => {
    const result = await loadNextScheduledWorkoutPlan(db, 'PPL', 'Hypertrophy')
    expect(result).toBeNull()
  })

  it('returns the next unfinished scheduled workout', async () => {
    const benchId = uuidv4()
    const workoutId = uuidv4()

    await db.exercises.add({
      id: benchId,
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: [],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    })

    await db.workouts.add({
      id: workoutId,
      date: Date.now(),
      routineType: 'PPL',
      sessionIndex: 0,
      notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1|Push Day`,
    })

    await db.sets.add({
      id: uuidv4(),
      workoutId,
      exerciseId: benchId,
      weight: 60,
      reps: 8,
      orderIndex: 0,
    })

    const result = await loadNextScheduledWorkoutPlan(db, 'PPL', 'Hypertrophy')
    expect(result).not.toBeNull()
    expect(result?.dayLabel).toBe('Push Day')
    expect(result?.plan.exercises).toHaveLength(1)
    expect(result?.plan.exercises[0].exerciseName).toBe('Bench Press')
    expect(result?.plan.exercises[0].weight).toBe(60)
  })

  it('returns null when all scheduled workouts have matching completed logs', async () => {
    const benchId = uuidv4()
    const scheduledWorkoutId = uuidv4()
    const completedWorkoutId = uuidv4()
    const baseDate = Date.now()

    await db.exercises.add({
      id: benchId,
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: [],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    })

    await db.workouts.bulkAdd([
      {
        id: scheduledWorkoutId,
        date: baseDate,
        routineType: 'PPL',
        sessionIndex: 0,
        notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1|Push`,
      },
      {
        id: completedWorkoutId,
        date: baseDate + 1000,
        routineType: 'PPL',
        sessionIndex: 0,
        notes: 'User completed',
      },
    ])

    await db.sets.add({
      id: uuidv4(),
      workoutId: scheduledWorkoutId,
      exerciseId: benchId,
      weight: 60,
      reps: 8,
      orderIndex: 0,
    })

    const result = await loadNextScheduledWorkoutPlan(db, 'PPL', 'Hypertrophy')
    expect(result).toBeNull()
  })
})
