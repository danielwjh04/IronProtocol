import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import type { Exercise } from '../db/schema'
import { IronProtocolDB } from '../db/schema'
import { generateWorkout, getRecommendedRoutinesForDays, getRoutineSessionLabel, planRoutineWorkoutPure, runPlannerPreflightAudit } from '../planner/autoPlanner'

const UPPER_MUSCLE_GROUP = 'Chest'
const LOWER_MUSCLE_GROUP = 'Legs'

describe('autoPlanner — generateWorkout', () => {
  let db: IronProtocolDB

  beforeEach(() => {
    db = new IronProtocolDB()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  describe('Cold Start (routine-only)', () => {
    it('returns 20 kg baseline for upper-body movements on a cold start', async () => {
      await db.open()
      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      expect(result.exercises.length).toBeGreaterThan(0)
      result.exercises.forEach((exercise) => {
        expect(exercise.weight).toBe(20)
      })
    })

    it('uses Tier-1 baseline defaults (5 sets x 3 reps) for users with no history', async () => {
      await db.open()
      await db.exercises.add({
        id: uuidv4(),
        name: 'Bench Press',
        muscleGroup: UPPER_MUSCLE_GROUP,
        tier: 1,
        tags: ['push', 'compound'],
        mediaType: 'webp',
        mediaRef: 'bench.webp',
      })

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].sets).toBe(5)
      expect(result.exercises[0].reps).toBe(3)
      expect(result.exercises[0].progressionGoal).toBe('Goal: 3 Reps (Baseline)')
    })

    it('gives new users seeded iron movements with numeric baseline goals instead of GPP fallback', async () => {
      await db.open()

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      expect(result.exercises.some((exercise) => /burpees|jumping jacks/i.test(exercise.exerciseName))).toBe(false)
      expect(result.exercises.some((exercise) => /bench|overhead press/i.test(exercise.exerciseName))).toBe(true)
      result.exercises.forEach((exercise) => {
        expect(exercise.progressionGoal).toMatch(/^Goal: \d+ Reps \(Baseline\)$/)
        expect(exercise.progressionGoal).not.toMatch(/fallback/i)
      })
    })

    it('returns Squat as a Tier-1 movement for a fresh GZCL plan', async () => {
      await db.open()

      const result = await generateWorkout({
        db,
        routineType: 'GZCL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      const squat = result.exercises.find((exercise) => /squat/i.test(exercise.exerciseName))
      expect(squat).toBeDefined()
      expect(squat?.tier).toBe(1)
    })

    it('uses power rest periods in estimatedMinutes (5 sets x 3 min = 15 min)', async () => {
      await db.open()
      await db.exercises.add({
        id: uuidv4(),
        name: 'Bench Press',
        muscleGroup: UPPER_MUSCLE_GROUP,
        tier: 1,
        tags: ['push', 'compound'],
        mediaType: 'webp',
        mediaRef: 'bench.webp',
      })

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Power',
        timeAvailable: 60,
      })

      expect(result.estimatedMinutes).toBe(15)
    })
  })

  describe('Progressive Overload', () => {
    it('adds 2.5 kg to upper-body Tier-1 movement from the latest matching session', async () => {
      await db.open()
      const exerciseId = uuidv4()
      const workoutId = uuidv4()
      const previousWeight = 80

      await db.exercises.add({
        id: exerciseId,
        name: 'Bench Press',
        muscleGroup: UPPER_MUSCLE_GROUP,
        tier: 1,
        tags: ['push', 'compound'],
        mediaType: 'webp',
        mediaRef: 'bench.webp',
      })
      await db.workouts.add({
        id: workoutId,
        date: Date.now() - 86_400_000,
        routineType: 'FullBody',
        sessionIndex: 0,
        notes: '',
      })
      await db.sets.add({
        id: uuidv4(),
        workoutId,
        exerciseId,
        weight: previousWeight,
        reps: 5,
        orderIndex: 0,
      })

      const result = await generateWorkout({
        db,
        routineType: 'FullBody',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      const planned = result.exercises.find((exercise) => exercise.exerciseId === exerciseId)
      expect(planned).toBeDefined()
      expect(planned!.weight).toBe(previousWeight + 2.5)
    })

    it('adds 5 kg to lower-body Tier-1 movement from the latest matching session', async () => {
      await db.open()
      const exerciseId = uuidv4()
      const workoutId = uuidv4()
      const previousWeight = 100

      await db.exercises.add({
        id: exerciseId,
        name: 'Back Squat',
        muscleGroup: LOWER_MUSCLE_GROUP,
        tier: 1,
        tags: ['legs', 'compound'],
        mediaType: 'webp',
        mediaRef: 'squat.webp',
      })
      await db.workouts.add({
        id: workoutId,
        date: Date.now() - 86_400_000,
        routineType: 'FullBody',
        sessionIndex: 0,
        notes: '',
      })
      await db.sets.add({
        id: uuidv4(),
        workoutId,
        exerciseId,
        weight: previousWeight,
        reps: 5,
        orderIndex: 0,
      })

      const result = await generateWorkout({
        db,
        routineType: 'FullBody',
        trainingGoal: 'Power',
        timeAvailable: 60,
      })

      const planned = result.exercises.find((exercise) => exercise.exerciseId === exerciseId)
      expect(planned).toBeDefined()
      expect(planned!.weight).toBe(previousWeight + 5)
    })

    it('uses the latest matching session weight, not older data', async () => {
      await db.open()
      const exerciseId = uuidv4()
      const oldWorkoutId = uuidv4()
      const latestWorkoutId = uuidv4()

      await db.exercises.add({
        id: exerciseId,
        name: 'Bench Press',
        muscleGroup: UPPER_MUSCLE_GROUP,
        tier: 1,
        tags: ['push', 'compound'],
        mediaType: 'webp',
        mediaRef: 'bench.webp',
      })

      await db.workouts.add({
        id: oldWorkoutId,
        date: Date.now() - 172_800_000,
        routineType: 'FullBody',
        sessionIndex: 0,
        notes: '',
      })
      await db.sets.add({
        id: uuidv4(),
        workoutId: oldWorkoutId,
        exerciseId,
        weight: 70,
        reps: 5,
        orderIndex: 0,
      })

      await db.workouts.add({
        id: latestWorkoutId,
        date: Date.now() - 86_400_000,
        routineType: 'FullBody',
        sessionIndex: 0,
        notes: '',
      })
      await db.sets.add({
        id: uuidv4(),
        workoutId: latestWorkoutId,
        exerciseId,
        weight: 80,
        reps: 5,
        orderIndex: 0,
      })

      const result = await generateWorkout({
        db,
        routineType: 'FullBody',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 60,
      })

      const planned = result.exercises.find((exercise) => exercise.exerciseId === exerciseId)
      expect(planned).toBeDefined()
      expect(planned!.weight).toBe(82.5)
    })
  })

  describe('Tiered QoS Trimming', () => {
    it('keeps only Tier 1 when timeAvailable is under 30 minutes', async () => {
      await db.open()
      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
        { id: uuidv4(), name: 'Cable Fly', muscleGroup: UPPER_MUSCLE_GROUP, tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 25,
      })

      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].tier).toBe(1)
    })

    it('keeps Tier 1 and Tier 2 when timeAvailable is 30 to 39 minutes', async () => {
      await db.open()
      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
        { id: uuidv4(), name: 'Cable Fly', muscleGroup: UPPER_MUSCLE_GROUP, tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 35,
      })

      expect(result.exercises).toHaveLength(2)
      expect(result.exercises.some((exercise) => exercise.tier === 1)).toBe(true)
      expect(result.exercises.some((exercise) => exercise.tier === 2)).toBe(true)
      expect(result.exercises.some((exercise) => exercise.tier === 3)).toBe(false)
    })

    it('keeps Tier 1, Tier 2, and Tier 3 when timeAvailable is at least 40 minutes', async () => {
      await db.open()
      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
        { id: uuidv4(), name: 'Cable Fly', muscleGroup: UPPER_MUSCLE_GROUP, tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 45,
      })

      expect(result.exercises).toHaveLength(3)
      expect(result.exercises.some((exercise) => exercise.tier === 1)).toBe(true)
      expect(result.exercises.some((exercise) => exercise.tier === 2)).toBe(true)
      expect(result.exercises.some((exercise) => exercise.tier === 3)).toBe(true)
    })
  })

  describe('Multi-Routine Engine (Task 2)', () => {
    it('passes pre-flight relationship and UUID audit when set foreign keys map to current UUID records', async () => {
      await db.open()

      const exerciseId = uuidv4()
      const workoutId = uuidv4()

      await db.exercises.add({
        id: exerciseId,
        name: 'Bench Press',
        muscleGroup: UPPER_MUSCLE_GROUP,
        tier: 1,
        tags: ['push', 'compound'],
        mediaType: 'webp',
        mediaRef: 'bench.webp',
      })
      await db.workouts.add({
        id: workoutId,
        date: Date.now(),
        routineType: 'PPL',
        sessionIndex: 0,
        notes: '',
      })
      await db.sets.add({
        id: uuidv4(),
        workoutId,
        exerciseId,
        weight: 80,
        reps: 5,
        orderIndex: 0,
      })

      const audit = await runPlannerPreflightAudit(db)

      expect(audit.passed).toBe(true)
      expect(audit.danglingWorkoutRefs).toBe(0)
      expect(audit.danglingExerciseRefs).toBe(0)
      expect(audit.nonUuidPrimaryKeys).toBe(0)
      expect(audit.nonUuidForeignKeys).toBe(0)
    })

    it('flags compound-lift tier corruption when a primary compound is categorized as T3', async () => {
      await db.open()

      await db.exercises.add({
        id: uuidv4(),
        name: 'Back Squat',
        muscleGroup: LOWER_MUSCLE_GROUP,
        tier: 3,
        tags: ['legs'],
        mediaType: 'webp',
        mediaRef: 'squat.webp',
      })

      const audit = await runPlannerPreflightAudit(db)

      expect(audit.passed).toBe(false)
      expect(audit.compoundTierViolations).toContain('Back Squat')
    })

    it('cycles sessionIndex back to 0 after completing a full routine cycle', async () => {
      await db.open()

      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Barbell Row', muscleGroup: 'Back', tier: 1, tags: ['pull', 'compound'], mediaType: 'webp', mediaRef: 'row.webp' },
        { id: uuidv4(), name: 'Back Squat', muscleGroup: LOWER_MUSCLE_GROUP, tier: 1, tags: ['legs', 'compound'], mediaType: 'webp', mediaRef: 'squat.webp' },
      ])

      await db.workouts.bulkAdd([
        { id: uuidv4(), date: Date.now() - 3000, routineType: 'PPL', sessionIndex: 0, notes: '' },
        { id: uuidv4(), date: Date.now() - 2000, routineType: 'PPL', sessionIndex: 1, notes: '' },
        { id: uuidv4(), date: Date.now() - 1000, routineType: 'PPL', sessionIndex: 2, notes: '' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 45,
      })

      expect(result.sessionIndex).toBe(0)
      expect(result.exercises.some((exercise) => exercise.exerciseName === 'Bench Press')).toBe(true)
      expect(result.exercises.some((exercise) => exercise.exerciseName === 'Back Squat')).toBe(false)
    })

    it('resets a 4-day cycle so the 5th logged workout maps to Session 1 of 4', async () => {
      await db.open()

      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Back Squat', muscleGroup: LOWER_MUSCLE_GROUP, tier: 1, tags: ['legs', 'compound'], mediaType: 'webp', mediaRef: 'squat.webp' },
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
      ])

      await db.workouts.bulkAdd([
        { id: uuidv4(), date: Date.now() - 4000, routineType: 'GZCL', sessionIndex: 0, notes: '' },
        { id: uuidv4(), date: Date.now() - 3000, routineType: 'GZCL', sessionIndex: 1, notes: '' },
        { id: uuidv4(), date: Date.now() - 2000, routineType: 'GZCL', sessionIndex: 2, notes: '' },
        { id: uuidv4(), date: Date.now() - 1000, routineType: 'GZCL', sessionIndex: 3, notes: '' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'GZCL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 45,
      })

      expect(result.sessionIndex).toBe(0)
      expect(getRoutineSessionLabel('GZCL', result.sessionIndex)).toBe('Squat Focus')
      expect(result.exercises.some((exercise) => exercise.exerciseName === 'Back Squat')).toBe(true)
      expect(result.exercises.some((exercise) => exercise.exerciseName === 'Bench Press')).toBe(false)
    })

    it('uses GZCL routine lifts instead of Burpees fallback when matching exercises exist', async () => {
      await db.open()

      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Back Squat', muscleGroup: LOWER_MUSCLE_GROUP, tier: 1, tags: ['legs', 'compound'], mediaType: 'webp', mediaRef: 'squat.webp' },
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'GZCL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 45,
      })

      expect(result.exercises.some((exercise) => /squat|bench/i.test(exercise.exerciseName))).toBe(true)
      expect(result.exercises.some((exercise) => /burpees/i.test(exercise.exerciseName))).toBe(false)
    })

    it('increases T2 weight only when all sets hit max reps in the most recent specific session', async () => {
      await db.open()

      const inclineAllMaxId = uuidv4()
      const inclineNotAllMaxId = uuidv4()

      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: inclineAllMaxId, name: 'Incline Press A', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline-a.webp' },
        { id: inclineNotAllMaxId, name: 'Incline Press B', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline-b.webp' },
      ])

      const latestPushWorkoutId = uuidv4()
      await db.workouts.bulkAdd([
        { id: uuidv4(), date: Date.now() - 3000, routineType: 'PPL', sessionIndex: 1, notes: '' },
        { id: uuidv4(), date: Date.now() - 2000, routineType: 'PPL', sessionIndex: 2, notes: '' },
        { id: latestPushWorkoutId, date: Date.now() - 1000, routineType: 'PPL', sessionIndex: 0, notes: '' },
      ])

      await db.sets.bulkAdd([
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineAllMaxId, weight: 60, reps: 10, orderIndex: 0 },
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineAllMaxId, weight: 60, reps: 10, orderIndex: 1 },
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineAllMaxId, weight: 60, reps: 10, orderIndex: 2 },
      ])

      await db.sets.bulkAdd([
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineNotAllMaxId, weight: 50, reps: 10, orderIndex: 3 },
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineNotAllMaxId, weight: 50, reps: 9, orderIndex: 4 },
        { id: uuidv4(), workoutId: latestPushWorkoutId, exerciseId: inclineNotAllMaxId, weight: 50, reps: 10, orderIndex: 5 },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 45,
      })

      const progressed = result.exercises.find((exercise) => exercise.exerciseId === inclineAllMaxId)
      const notProgressed = result.exercises.find((exercise) => exercise.exerciseId === inclineNotAllMaxId)

      expect(progressed).toBeDefined()
      expect(notProgressed).toBeDefined()
      expect(progressed!.weight).toBe(62.5)
      expect(notProgressed!.weight).toBe(50)
    })

    it('returns only Tier 1 movements when timeAvailable is 25 minutes', async () => {
      await db.open()

      await db.exercises.bulkAdd([
        { id: uuidv4(), name: 'Bench Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: UPPER_MUSCLE_GROUP, tier: 2, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
        { id: uuidv4(), name: 'Cable Fly', muscleGroup: UPPER_MUSCLE_GROUP, tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
      ])

      const result = await generateWorkout({
        db,
        routineType: 'PPL',
        trainingGoal: 'Hypertrophy',
        timeAvailable: 25,
      })

      expect(result.exercises).toHaveLength(1)
      expect(result.exercises[0].exerciseName).toBe('Bench Press')
    })
  })
})

describe('autoPlanner — planRoutineWorkoutPure deduplication', () => {
  const makeExercise = (overrides: Partial<Exercise> & { id: string }): Exercise => ({
    name: 'Bench Press',
    muscleGroup: 'Chest',
    tier: 1,
    tags: ['push', 'compound'],
    mediaType: 'webp',
    mediaRef: 'bench.webp',
    ...overrides,
  })

  it('returns only one entry when the exercise pool contains duplicate IDs (e.g. concurrent seed race)', () => {
    const sharedId = uuidv4()
    const exercises: Exercise[] = [
      makeExercise({ id: sharedId }),
      makeExercise({ id: sharedId }), // exact same ID twice
    ]

    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises,
      workoutsForRoutine: [],
      sets: [],
    })

    const benches = result.exercises.filter((ex) => ex.exerciseName === 'Bench Press')
    expect(benches).toHaveLength(1)
  })

  it('returns only one entry when two exercises share the same name but have different UUIDs', () => {
    const exercises: Exercise[] = [
      makeExercise({ id: uuidv4() }),
      makeExercise({ id: uuidv4() }), // different UUID, same name
    ]

    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises,
      workoutsForRoutine: [],
      sets: [],
    })

    const benches = result.exercises.filter((ex) => ex.exerciseName === 'Bench Press')
    expect(benches).toHaveLength(1)
  })
})

describe('autoPlanner — user baselines', () => {
  const benchExercise: Exercise = {
    id: uuidv4(),
    name: 'Bench Press',
    muscleGroup: 'Chest',
    tier: 1,
    tags: ['push', 'compound'],
    mediaType: 'webp',
    mediaRef: 'bench.webp',
  }

  const squatExercise: Exercise = {
    id: uuidv4(),
    name: 'Back Squat',
    muscleGroup: 'Legs',
    tier: 1,
    tags: ['legs', 'compound'],
    mediaType: 'webp',
    mediaRef: 'squat.webp',
  }

  it('uses user-set baseline weight instead of 20 kg default for upper body T1 on cold start', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchExercise],
      workoutsForRoutine: [],
      sets: [],
      baselines: new Map([['bench press', 60]]),
    })

    const bench = result.exercises.find((ex) => ex.exerciseName === 'Bench Press')
    expect(bench).toBeDefined()
    expect(bench!.weight).toBe(60)
  })

  it('uses user-set baseline weight for lower body T1 instead of 40 kg default', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 2,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [squatExercise],
      workoutsForRoutine: [],
      sets: [],
      baselines: new Map([['back squat', 100]]),
    })

    const squat = result.exercises.find((ex) => ex.exerciseName === 'Back Squat')
    expect(squat).toBeDefined()
    expect(squat!.weight).toBe(100)
  })

  it('falls back to BASELINE_WEIGHT default when no user baseline exists', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchExercise],
      workoutsForRoutine: [],
      sets: [],
      baselines: new Map(), // empty — no calibration done
    })

    const bench = result.exercises.find((ex) => ex.exerciseName === 'Bench Press')
    expect(bench).toBeDefined()
    expect(bench!.weight).toBe(20) // default upper body baseline
  })

  it('ignores baselines when the exercise already has history (progression takes precedence)', () => {
    const workoutId = uuidv4()
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchExercise],
      workoutsForRoutine: [{ id: workoutId, date: Date.now() - 86_400_000, routineType: 'PPL', sessionIndex: 0, notes: '' }],
      sets: [{ id: uuidv4(), workoutId, exerciseId: benchExercise.id, weight: 80, reps: 5, orderIndex: 0 }],
      baselines: new Map([['bench press', 60]]), // calibrated but irrelevant — history wins
    })

    const bench = result.exercises.find((ex) => ex.exerciseName === 'Bench Press')
    expect(bench).toBeDefined()
    // Linear progression from 80 kg: 80 + 2.5 = 82.5
    expect(bench!.weight).toBe(82.5)
  })
})

describe('autoPlanner — routine recommendations by frequency', () => {
  it('recommends PPL and FullBody for 3 days per week', () => {
    const recs = getRecommendedRoutinesForDays(3)
    expect(recs).toContain('PPL')
    expect(recs).toContain('FullBody')
  })

  it('recommends GZCL and UpperLower for 4 days per week', () => {
    const recs = getRecommendedRoutinesForDays(4)
    expect(recs).toContain('GZCL')
    expect(recs).toContain('UpperLower')
  })

  it('recommends ArnoldSplit and BroSplit for 5 days per week', () => {
    const recs = getRecommendedRoutinesForDays(5)
    expect(recs).toContain('ArnoldSplit')
    expect(recs).toContain('BroSplit')
  })
})

describe('autoPlanner — GZCL T1 tier enforcement', () => {
  const backSquat: Exercise = {
    id: uuidv4(),
    name: 'Back Squat',
    muscleGroup: 'Legs',
    tier: 1,
    tags: ['legs', 'lower', 'compound'],
    mediaType: 'webp',
    mediaRef: 'squat.webp',
  }
  const rdl: Exercise = {
    id: uuidv4(),
    name: 'Romanian Deadlift',
    muscleGroup: 'Hamstrings',
    tier: 1, // T1 in DB, but must be remapped to T2 in GZCL Squat context
    tags: ['legs', 'lower', 'compound'],
    mediaType: 'webp',
    mediaRef: 'rdl.webp',
  }
  const legPress: Exercise = {
    id: uuidv4(),
    name: 'Leg Press',
    muscleGroup: 'Legs',
    tier: 2,
    tags: ['legs', 'lower', 'compound'],
    mediaType: 'webp',
    mediaRef: 'leg-press.webp',
  }

  it('assigns T1 only to Back Squat on GZCL Squat day — RDL is demoted to T2', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'GZCL',
      sessionIndex: 0, // Squat Focus
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [backSquat, rdl, legPress],
      workoutsForRoutine: [],
      sets: [],
    })

    const squat = result.exercises.find((ex) => ex.exerciseName === 'Back Squat')
    const rdlResult = result.exercises.find((ex) => ex.exerciseName === 'Romanian Deadlift')
    expect(squat).toBeDefined()
    expect(squat?.tier).toBe(1)
    expect(rdlResult).toBeDefined()
    expect(rdlResult?.tier).toBe(2) // must not be T1 in GZCL Squat context
  })

  it('assigns T1 only to Bench Press on GZCL Bench day — Incline Press is demoted to T2', () => {
    const benchPress: Exercise = {
      id: uuidv4(),
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'upper', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    }
    const inclinePress: Exercise = {
      id: uuidv4(),
      name: 'Incline Press',
      muscleGroup: 'Chest',
      tier: 1, // T1 in DB, but must be demoted to T2 on GZCL Bench day
      tags: ['push', 'upper', 'compound'],
      mediaType: 'webp',
      mediaRef: 'incline.webp',
    }

    const result = planRoutineWorkoutPure({
      routineType: 'GZCL',
      sessionIndex: 1, // Bench Focus
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchPress, inclinePress],
      workoutsForRoutine: [],
      sets: [],
    })

    const bench = result.exercises.find((ex) => ex.exerciseName === 'Bench Press')
    const incline = result.exercises.find((ex) => ex.exerciseName === 'Incline Press')
    expect(bench?.tier).toBe(1)
    expect(incline?.tier).toBe(2)
  })
})

describe('autoPlanner — additionalFocusParts hybrid injection', () => {
  const benchPress: Exercise = {
    id: uuidv4(),
    name: 'Bench Press',
    muscleGroup: 'Chest',
    tier: 1,
    tags: ['push', 'upper', 'compound'],
    mediaType: 'webp',
    mediaRef: 'bench.webp',
  }
  const bicepsCurl: Exercise = {
    id: uuidv4(),
    name: 'Biceps Curl',
    muscleGroup: 'Arms',
    tier: 3,
    tags: ['pull', 'upper', 'isolation'],
    mediaType: 'webp',
    mediaRef: 'curl.webp',
  }
  const lateralRaise: Exercise = {
    id: uuidv4(),
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    tier: 3,
    tags: ['push', 'upper', 'isolation'],
    mediaType: 'webp',
    mediaRef: 'lateral-raise.webp',
  }

  it('injects a T3 Arms exercise into a Push session when additionalFocusParts includes Arms', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0, // Push A — bicepsCurl is not a push exercise but should be injected
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchPress, bicepsCurl],
      workoutsForRoutine: [],
      sets: [],
      additionalFocusParts: ['Arms'],
    })

    // PlannedExercise has no muscleGroup — search by name
    const curl = result.exercises.find((ex) => ex.exerciseName === 'Biceps Curl')
    expect(curl).toBeDefined()
  })

  it('caps focus injection at 2 exercises even when 3 different focus parts each have a matching exercise', () => {
    // Leg Curl (Hamstrings, T3) and Cable Row (Back, T3) are not Push exercises
    const legCurl: Exercise = {
      id: uuidv4(),
      name: 'Leg Curl',
      muscleGroup: 'Hamstrings',
      tier: 3,
      tags: ['pull', 'lower', 'isolation'],
      mediaType: 'webp',
      mediaRef: 'leg-curl.webp',
    }
    const cableRow: Exercise = {
      id: uuidv4(),
      name: 'Cable Row',
      muscleGroup: 'Back',
      tier: 3,
      tags: ['pull', 'upper', 'isolation'],
      mediaType: 'webp',
      mediaRef: 'cable-row.webp',
    }

    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0, // Push A — none of Arms/Hamstrings/Back exercises are push
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchPress, bicepsCurl, legCurl, cableRow],
      workoutsForRoutine: [],
      sets: [],
      additionalFocusParts: ['Arms', 'Hamstrings', 'Back'], // 3 matching parts — only 2 may inject
    })

    // benchPress is the sole Push A exercise; the others are focus-injected
    const focusInjections = result.exercises.filter((ex) => ex.exerciseName !== 'Bench Press')
    expect(focusInjections.length).toBe(2) // hard cap: never more than 2 injections
  })

  it('does not inject an exercise that is already in the session blueprint', () => {
    // Lateral Raise has 'push' tag — it is already included in Push A session
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchPress, lateralRaise],
      workoutsForRoutine: [],
      sets: [],
      additionalFocusParts: ['Shoulders'],
    })

    const laterals = result.exercises.filter((ex) => ex.exerciseName === 'Lateral Raise')
    expect(laterals.length).toBeLessThanOrEqual(1)
  })

  it('falls back gracefully when no exercises match the requested focus muscle group', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
      exercises: [benchPress],
      workoutsForRoutine: [],
      sets: [],
      additionalFocusParts: ['Calves'], // no Calves exercises in pool
    })

    // Should not throw and should still return the base blueprint
    expect(result.exercises.some((ex) => ex.exerciseName === 'Bench Press')).toBe(true)
  })
})

describe('autoPlanner — extended time ceiling (120 min)', () => {
  it('includes all tiers when timeAvailable is 120 minutes', () => {
    const result = planRoutineWorkoutPure({
      routineType: 'PPL',
      sessionIndex: 0,
      trainingGoal: 'Hypertrophy',
      timeAvailable: 120,
      exercises: [
        { id: uuidv4(), name: 'Bench Press', muscleGroup: 'Chest', tier: 1, tags: ['push', 'upper', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
        { id: uuidv4(), name: 'Incline Press', muscleGroup: 'Chest', tier: 2, tags: ['push', 'upper', 'compound'], mediaType: 'webp', mediaRef: 'incline.webp' },
        { id: uuidv4(), name: 'Cable Fly', muscleGroup: 'Chest', tier: 3, tags: ['push', 'upper', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
      ],
      workoutsForRoutine: [],
      sets: [],
    })

    expect(result.exercises.some((ex) => ex.tier === 1)).toBe(true)
    expect(result.exercises.some((ex) => ex.tier === 2)).toBe(true)
    expect(result.exercises.some((ex) => ex.tier === 3)).toBe(true)
  })

  it('clamps timeAvailable to 120m — passing 180m behaves identically to 120m', () => {
    const exercises: Exercise[] = [
      { id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
      { id: 'e2', name: 'Overhead Press', muscleGroup: 'Shoulders', tier: 2, tags: ['push'], mediaType: 'webp', mediaRef: 'ohp.webp' },
      { id: 'e3', name: 'Cable Fly', muscleGroup: 'Chest', tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
    ]
    const base = {
      routineType: 'PPL',
      trainingGoal: 'Hypertrophy' as const,
      exercises,
      workoutsForRoutine: [],
      sets: [],
    }
    const at120 = planRoutineWorkoutPure({ ...base, timeAvailable: 120 })
    const at180 = planRoutineWorkoutPure({ ...base, timeAvailable: 180 })

    expect(at180.exercises.map(e => e.exerciseId)).toEqual(at120.exercises.map(e => e.exerciseId))
    expect(at180.estimatedMinutes).toBe(at120.estimatedMinutes)
  })
})
