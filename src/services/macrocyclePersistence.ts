import { v4 as uuidv4 } from 'uuid'
import { db as defaultDb } from '../db/db'
import { ensureIronExerciseLibrary } from '../db/seedExercises'
import {
  APP_SETTINGS_ID,
  type Exercise,
  type IronProtocolDB,
  type Workout,
  type WorkoutSet,
} from '../db/schema'
import { canonicalizeExerciseName, type AIGeneratedMacrocycle } from './aiPlannerService'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_ROUTINE_TYPE = 'PPL'
const DEFAULT_DAYS_PER_WEEK = 3
const PRIMARY_COMPOUND_PATTERNS = [
  /\bsquat\b/i,
  /\bbench(\s+press)?\b/i,
  /\bdeadlift\b/i,
  /\boverhead\s+press\b/i,
  /\bohp\b/i,
]

export const MACROCYCLE_WORKOUT_NOTE_PREFIX = '[macrocycle:auto]'

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function startOfTodayTimestamp(): number {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function toPositiveInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.max(1, Math.trunc(value))
}

function isGeneratedMacrocycleWorkout(workout: Workout): boolean {
  return workout.notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX)
}

function buildMacrocycleWorkoutNote(weekNumber: number, dayNumber: number, dayLabel: string): string {
  return `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w${weekNumber}d${dayNumber}|${dayLabel}`
}

function isLikelyPrimaryCompound(name: string): boolean {
  if (/\bromanian\b/i.test(name)) {
    return false
  }
  return PRIMARY_COMPOUND_PATTERNS.some((pattern) => pattern.test(name))
}

function createPlaceholderExercise(exerciseName: string): Exercise {
  const tier = isLikelyPrimaryCompound(exerciseName) ? 1 : 2

  return {
    id: uuidv4(),
    name: exerciseName,
    muscleGroup: 'General',
    mediaType: 'video',
    mediaRef: '',
    tags: tier === 1 ? ['ai-generated', 'compound'] : ['ai-generated'],
    tier,
  }
}

export async function persistMacrocycle(
  macrocycle: AIGeneratedMacrocycle,
  dbInstance: IronProtocolDB = defaultDb,
): Promise<void> {
  const sessionStart = startOfTodayTimestamp()

  await ensureIronExerciseLibrary(dbInstance)

  await dbInstance.transaction(
    'rw',
    [
      dbInstance.settings,
      dbInstance.exercises,
      dbInstance.baselines,
      dbInstance.workouts,
      dbInstance.sets,
    ],
    async () => {
      const existingWorkouts = await dbInstance.workouts.toArray()
      const generatedWorkoutIds = existingWorkouts
        .filter(isGeneratedMacrocycleWorkout)
        .map((workout) => workout.id)

      if (generatedWorkoutIds.length > 0) {
        await dbInstance.sets.where('workoutId').anyOf(generatedWorkoutIds).delete()
        await dbInstance.workouts.bulkDelete(generatedWorkoutIds)
      }

      const [settings, existingExercises, baselines] = await Promise.all([
        dbInstance.settings.get(APP_SETTINGS_ID),
        dbInstance.exercises.toArray(),
        dbInstance.baselines.toArray(),
      ])

      const exerciseByName = new Map(
        existingExercises.map((exercise) => [normalizeExerciseName(exercise.name), exercise]),
      )
      const baselineByName = new Map(
        baselines.map((baseline) => [normalizeExerciseName(baseline.exerciseName), baseline.weight]),
      )

      for (const week of macrocycle.blueprint.weeks) {
        for (const day of week.days) {
          for (const plannedExercise of day.plannedExercises) {
            const canonicalName = canonicalizeExerciseName(plannedExercise.exerciseName)
            const normalizedName = normalizeExerciseName(canonicalName)

            if (exerciseByName.has(normalizedName)) {
              continue
            }

            const placeholder = createPlaceholderExercise(canonicalName)
            await dbInstance.exercises.add(placeholder)
            exerciseByName.set(normalizedName, placeholder)
          }
        }
      }

      for (const fallbackExercise of Object.values(macrocycle.fallbackPool).flat()) {
        const canonicalName = canonicalizeExerciseName(fallbackExercise.exerciseName)
        const normalizedName = normalizeExerciseName(canonicalName)

        if (exerciseByName.has(normalizedName)) {
          continue
        }

        const placeholder = createPlaceholderExercise(canonicalName)
        await dbInstance.exercises.add(placeholder)
        exerciseByName.set(normalizedName, placeholder)
      }

      const routineType =
        typeof settings?.preferredRoutineType === 'string' && settings.preferredRoutineType.trim().length > 0
          ? settings.preferredRoutineType
          : DEFAULT_ROUTINE_TYPE

      const workoutsToAdd: Workout[] = []
      const setsToAdd: WorkoutSet[] = []

      let sessionIndex = 0
      let dayOffset = 0

      for (const week of macrocycle.blueprint.weeks) {
        for (const day of week.days) {
          const workoutId = uuidv4()
          workoutsToAdd.push({
            id: workoutId,
            date: sessionStart + (dayOffset * MILLISECONDS_PER_DAY),
            routineType,
            sessionIndex,
            notes: buildMacrocycleWorkoutNote(week.weekNumber, day.dayNumber, day.dayLabel),
          })

          let orderIndex = 0

          for (const plannedExercise of day.plannedExercises) {
            const canonicalName = canonicalizeExerciseName(plannedExercise.exerciseName)
            const normalizedName = normalizeExerciseName(canonicalName)
            const exercise = exerciseByName.get(normalizedName)

            if (!exercise) {
              continue
            }

            const setCount = toPositiveInteger(plannedExercise.targetSets)
            const reps = toPositiveInteger(plannedExercise.targetReps)
            const resolvedBaseline = baselineByName.get(normalizeExerciseName(exercise.name)) ?? baselineByName.get(normalizedName)
            const requiresCalibration = typeof resolvedBaseline !== 'number'
            const weight = requiresCalibration ? 0 : resolvedBaseline

            for (let setNumber = 0; setNumber < setCount; setNumber += 1) {
              setsToAdd.push({
                id: uuidv4(),
                workoutId,
                exerciseId: exercise.id,
                weight,
                reps,
                orderIndex,
                requiresCalibration,
              })
              orderIndex += 1
            }
          }

          sessionIndex += 1
          dayOffset += 1
        }
      }

      if (workoutsToAdd.length > 0) {
        await dbInstance.workouts.bulkAdd(workoutsToAdd)
      }

      if (setsToAdd.length > 0) {
        await dbInstance.sets.bulkAdd(setsToAdd)
      }

      const updated = await dbInstance.settings.update(APP_SETTINGS_ID, {
        activeFallbackPool: macrocycle.fallbackPool,
      })

      if (updated === 0) {
        await dbInstance.settings.put({
          id: APP_SETTINGS_ID,
          hasCompletedOnboarding: false,
          preferredRoutineType: routineType,
          daysPerWeek: DEFAULT_DAYS_PER_WEEK,
          activeFallbackPool: macrocycle.fallbackPool,
        })
      }
    },
  )
}