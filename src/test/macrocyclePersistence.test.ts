import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'
import { runPlannerPreflightAudit } from '../planner/autoPlanner'
import type { AIGeneratedMacrocycle } from '../services/macrocycleTypes'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX, persistMacrocycle } from '../services/macrocyclePersistence'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function startOfTodayTimestamp(): number {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function buildMacrocycleFixture(): AIGeneratedMacrocycle {
  return {
    blueprint: {
      durationWeeks: 12,
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              dayLabel: 'Day 1 (A)',
              plannedExercises: [
                {
                  plannedExerciseId: 'w1d1e1',
                  exerciseName: 'Bench Press',
                  targetSets: 2,
                  targetReps: 5,
                },
                {
                  plannedExerciseId: 'w1d1e2',
                  exerciseName: 'Novel Curl Machine',
                  targetSets: 1,
                  targetReps: 12,
                },
              ],
            },
            {
              dayNumber: 2,
              dayLabel: 'Day 2 (B)',
              plannedExercises: [
                {
                  plannedExerciseId: 'w1d2e1',
                  exerciseName: 'Deadlift',
                  targetSets: 3,
                  targetReps: 3,
                },
              ],
            },
          ],
        },
      ],
    },
    fallbackPool: {
      w1d1e1: [{ exerciseName: 'Incline Bench Press', reason: 'Backup horizontal press.' }],
      w1d1e2: [{ exerciseName: 'Cable Curl', reason: 'Backup elbow flexion.' }],
      w1d2e1: [{ exerciseName: 'Trap Bar Deadlift', reason: 'Backup hinge pattern.' }],
    },
  }
}

function buildCompoundSafetyFixture(): AIGeneratedMacrocycle {
  return {
    blueprint: {
      durationWeeks: 12,
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              dayLabel: 'Day 1 (A)',
              plannedExercises: [
                {
                  plannedExerciseId: 'w1d1e1',
                  exerciseName: 'Bodyweight Squat',
                  targetSets: 3,
                  targetReps: 12,
                },
                {
                  plannedExerciseId: 'w1d1e2',
                  exerciseName: 'Split Squat',
                  targetSets: 3,
                  targetReps: 10,
                },
                {
                  plannedExerciseId: 'w1d1e3',
                  exerciseName: 'Single-Leg Squat to Box',
                  targetSets: 3,
                  targetReps: 8,
                },
                {
                  plannedExerciseId: 'w1d1e4',
                  exerciseName: 'Close-Grip Bench Press',
                  targetSets: 4,
                  targetReps: 6,
                },
              ],
            },
          ],
        },
      ],
    },
    fallbackPool: {
      w1d1e1: [{ exerciseName: 'Walking Lunges', reason: 'Bodyweight lower-body backup.' }],
      w1d1e2: [{ exerciseName: 'Walking Lunges', reason: 'Single-leg lower-body backup.' }],
      w1d1e3: [{ exerciseName: 'Front Squat', reason: 'Primary squat pattern backup.' }],
      w1d1e4: [{ exerciseName: 'Dips', reason: 'Close-grip pressing backup.' }],
    },
  }
}

describe('persistMacrocycle', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()

    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: false,
      preferredRoutineType: 'UpperLower',
      daysPerWeek: 4,
    })

    await db.exercises.bulkAdd([
      {
        id: uuidv4(),
        name: 'Bench Press',
        muscleGroup: 'Chest',
        mediaType: 'video',
        mediaRef: '',
        tags: ['push', 'compound'],
        tier: 1,
      },
      {
        id: uuidv4(),
        name: 'Deadlift',
        muscleGroup: 'Legs',
        mediaType: 'video',
        mediaRef: '',
        tags: ['hinge', 'compound'],
        tier: 1,
      },
    ])

    await db.baselines.bulkAdd([
      { exerciseName: 'bench press', weight: 100 },
      { exerciseName: 'deadlift', weight: 140 },
    ])
  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('clears only previously generated macrocycle sessions and preserves user history', async () => {
    const generatedWorkoutId = uuidv4()
    const manualWorkoutId = uuidv4()
    const [bench] = await db.exercises.where('name').equals('Bench Press').toArray()

    await db.workouts.bulkAdd([
      {
        id: generatedWorkoutId,
        date: startOfTodayTimestamp() - MILLISECONDS_PER_DAY,
        routineType: 'UpperLower',
        sessionIndex: 99,
        notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|legacy`,
      },
      {
        id: manualWorkoutId,
        date: startOfTodayTimestamp() - (3 * MILLISECONDS_PER_DAY),
        routineType: 'UpperLower',
        sessionIndex: 7,
        notes: 'manual-history-workout',
      },
    ])

    await db.sets.bulkAdd([
      {
        id: uuidv4(),
        workoutId: generatedWorkoutId,
        exerciseId: bench.id,
        weight: 80,
        reps: 5,
        orderIndex: 0,
      },
      {
        id: uuidv4(),
        workoutId: manualWorkoutId,
        exerciseId: bench.id,
        weight: 90,
        reps: 4,
        orderIndex: 0,
      },
    ])

    await persistMacrocycle(buildMacrocycleFixture(), db)

    const allWorkouts = await db.workouts.toArray()
    const manualWorkout = allWorkouts.find((workout) => workout.id === manualWorkoutId)
    const legacyGeneratedWorkout = allWorkouts.find((workout) => workout.id === generatedWorkoutId)

    expect(manualWorkout).toBeDefined()
    expect(legacyGeneratedWorkout).toBeUndefined()

    const allSets = await db.sets.toArray()
    expect(allSets.some((set) => set.workoutId === manualWorkoutId)).toBe(true)
    expect(allSets.some((set) => set.workoutId === generatedWorkoutId)).toBe(false)
  })

  it('unrolls macrocycle sessions, auto-creates missing exercises, and persists fallback pool', async () => {
    const fixture = buildMacrocycleFixture()

    await persistMacrocycle(fixture, db)

    const generatedWorkouts = (await db.workouts.toArray())
      .filter((workout) => workout.notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX))
      .sort((left, right) => left.sessionIndex - right.sessionIndex)

    expect(generatedWorkouts).toHaveLength(2)
    expect(generatedWorkouts[0].routineType).toBe('UpperLower')
    expect(generatedWorkouts[1].routineType).toBe('UpperLower')

    const today = startOfTodayTimestamp()
    expect(generatedWorkouts[0].date).toBe(today)
    expect(generatedWorkouts[1].date).toBe(today + MILLISECONDS_PER_DAY)

    const generatedWorkoutIds = generatedWorkouts.map((workout) => workout.id)
    const generatedSets = await db.sets.where('workoutId').anyOf(generatedWorkoutIds).toArray()
    expect(generatedSets).toHaveLength(6)

    const novelExercise = await db.exercises.where('name').equals('Novel Curl Machine').first()
    expect(novelExercise).toBeDefined()
    expect(novelExercise?.tags).toContain('ai-generated')

    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.activeFallbackPool).toEqual(fixture.fallbackPool)
  })

  it('normalizes aliases and assigns tier-1 placeholders for primary compounds', async () => {
    await persistMacrocycle(buildCompoundSafetyFixture(), db)

    const hyphenatedBench = await db.exercises.where('name').equals('Close-Grip Bench Press').first()
    const canonicalBench = await db.exercises.where('name').equals('Close Grip Bench Press').first()

    expect(hyphenatedBench).toBeUndefined()
    expect(canonicalBench).toBeDefined()
    expect(canonicalBench?.tier).toBe(1)

    const bodyweightSquat = await db.exercises.where('name').equals('Bodyweight Squat').first()
    const splitSquat = await db.exercises.where('name').equals('Bulgarian Split Squat').first()
    const singleLegSquat = await db.exercises.where('name').equals('Single-Leg Squat to Box').first()

    expect(bodyweightSquat).toBeDefined()
    expect(bodyweightSquat?.tier).toBe(1)
    expect(splitSquat).toBeDefined()
    expect(splitSquat?.tier).toBe(1)
    expect(singleLegSquat).toBeDefined()
    expect(singleLegSquat?.tier).toBe(1)

    const audit = await runPlannerPreflightAudit(db)
    expect(audit.compoundTierViolations).toEqual([])
    expect(audit.passed).toBe(true)
  })
})
