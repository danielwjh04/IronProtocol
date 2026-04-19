import {
  calcEstimatedMinutes,
  getRoutineSessionLabel,
  type CanonicalRoutineType,
  type PlannedExercise,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import type { IronProtocolDB } from '../db/schema'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from './macrocyclePersistence'

export interface ActivitySnapshot {
  workoutCount: number
  setCount: number
}

export interface HydratedScheduledWorkout {
  plan: PlannedWorkout
  dayLabel: string
}

export function buildActivitySignal(snapshot: ActivitySnapshot): string {
  return `${snapshot.workoutCount}:${snapshot.setCount}`
}

export function buildPlanSignature(plan: PlannedWorkout | null): string {
  if (!plan) {
    return 'empty-plan'
  }

  const exerciseSignature = plan.exercises
    .map((exercise) => (
      `${exercise.exerciseId}:${exercise.weight}:${exercise.reps}:${exercise.sets}:${exercise.tier}`
    ))
    .join('|')

  return `${plan.routineType}:${plan.sessionIndex}:${plan.estimatedMinutes}:${exerciseSignature}`
}

export function isMacrocycleScheduledWorkout(notes: string): boolean {
  return notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX)
}

export function resolveScheduledDayLabel(
  notes: string,
  routineType: string,
  sessionIndex: number,
): string {
  if (isMacrocycleScheduledWorkout(notes)) {
    const [, , rawLabel] = notes.split('|')
    const label = rawLabel?.trim()
    if (label) {
      return label
    }
  }

  try {
    return getRoutineSessionLabel(routineType, sessionIndex)
  } catch {
    return `Day ${sessionIndex + 1}`
  }
}

export async function loadNextScheduledWorkoutPlan(
  db: IronProtocolDB,
  routineType: CanonicalRoutineType,
  trainingGoal: 'Hypertrophy' | 'Power',
): Promise<HydratedScheduledWorkout | null> {
  const routineWorkouts = await db.workouts.where('routineType').equals(routineType).toArray()

  const scheduledWorkouts = routineWorkouts
    .filter((workout) => isMacrocycleScheduledWorkout(workout.notes))
    .sort((left, right) => (left.date - right.date) || (left.sessionIndex - right.sessionIndex))

  if (scheduledWorkouts.length === 0) {
    return null
  }

  const firstScheduledDate = scheduledWorkouts[0].date
  const completedWorkoutCount = routineWorkouts.filter((workout) => (
    !isMacrocycleScheduledWorkout(workout.notes)
    && workout.date >= firstScheduledDate
  )).length

  if (completedWorkoutCount >= scheduledWorkouts.length) {
    return null
  }

  const nextWorkout = scheduledWorkouts[completedWorkoutCount]
  const workoutSets = (await db.sets.where('workoutId').equals(nextWorkout.id).toArray())
    .sort((left, right) => left.orderIndex - right.orderIndex)

  if (workoutSets.length === 0) {
    return null
  }

  const exerciseOrder = new Map<string, number>()
  const setAggregateByExerciseId = new Map<string, { sets: number; reps: number; weight: number }>()

  for (const loggedSet of workoutSets) {
    if (!exerciseOrder.has(loggedSet.exerciseId)) {
      exerciseOrder.set(loggedSet.exerciseId, loggedSet.orderIndex)
    }

    const currentAggregate = setAggregateByExerciseId.get(loggedSet.exerciseId)
    if (!currentAggregate) {
      setAggregateByExerciseId.set(loggedSet.exerciseId, {
        sets: 1,
        reps: loggedSet.reps,
        weight: loggedSet.weight,
      })
      continue
    }

    setAggregateByExerciseId.set(loggedSet.exerciseId, {
      ...currentAggregate,
      sets: currentAggregate.sets + 1,
    })
  }

  const orderedExerciseIds = [...exerciseOrder.entries()]
    .sort((left, right) => left[1] - right[1])
    .map(([exerciseId]) => exerciseId)

  const exerciseRows = await db.exercises.bulkGet(orderedExerciseIds)
  const exerciseById = new Map<string, (typeof exerciseRows)[number]>()

  orderedExerciseIds.forEach((exerciseId, index) => {
    const exercise = exerciseRows[index]
    if (exercise) {
      exerciseById.set(exerciseId, exercise)
    }
  })

  const exercises: PlannedExercise[] = orderedExerciseIds.flatMap((exerciseId) => {
    const aggregate = setAggregateByExerciseId.get(exerciseId)
    const exercise = exerciseById.get(exerciseId)

    if (!aggregate || !exercise) {
      return []
    }

    return [{
      exerciseId,
      exerciseName: exercise.name,
      weight: aggregate.weight,
      reps: aggregate.reps,
      sets: aggregate.sets,
      tier: exercise.tier,
      progressionGoal: `Goal: ${aggregate.reps} Reps (Scheduled)`,
    }]
  })

  if (exercises.length === 0) {
    return null
  }

  return {
    plan: {
      exercises,
      estimatedMinutes: calcEstimatedMinutes(exercises, trainingGoal),
      routineType: nextWorkout.routineType,
      sessionIndex: nextWorkout.sessionIndex,
    },
    dayLabel: resolveScheduledDayLabel(nextWorkout.notes, nextWorkout.routineType, nextWorkout.sessionIndex),
  }
}
