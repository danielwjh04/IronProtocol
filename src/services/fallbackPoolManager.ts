import { APP_SETTINGS_ID, type Exercise, type IronProtocolDB } from '../db/schema'
import type { PlannedExercise, PlannedWorkout } from '../planner/autoPlanner'
import {
  cloneExercise,
  normalizeExerciseName,
  resolveGoalTierPrescription,
  type ExerciseCardModel,
} from './exerciseQoS'

export interface SwapCandidateQuery {
  card: ExerciseCardModel
  cards: readonly ExerciseCardModel[]
}

function normalizeMuscleGroup(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getLocalSwapBlockedExerciseIds(
  sourceCard: ExerciseCardModel,
  cards: readonly ExerciseCardModel[],
): string[] {
  const ids = cards
    .filter((card) => card.instanceId !== sourceCard.instanceId)
    .map((card) => card.exercise.exerciseId)

  return [...new Set(ids)]
}

function dedupeExercisesByNameOrId(exercises: readonly Exercise[]): Exercise[] {
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const deduped: Exercise[] = []

  for (const exercise of exercises) {
    const normalizedName = normalizeExerciseName(exercise.name)

    if (seenIds.has(exercise.id) || seenNames.has(normalizedName)) {
      continue
    }

    seenIds.add(exercise.id)
    seenNames.add(normalizedName)
    deduped.push(exercise)
  }

  return deduped
}

export function isDatabaseClosedError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: string }).name === 'DatabaseClosedError'
}

export async function loadSwapCandidates(
  db: IronProtocolDB,
  query: SwapCandidateQuery,
): Promise<Exercise[]> {
  const { card, cards } = query
  const blockedExerciseIds = new Set(getLocalSwapBlockedExerciseIds(card, cards))

  const [settings, sourceOriginal, allExercises] = await Promise.all([
    db.settings.get(APP_SETTINGS_ID),
    db.exercises.get(card.exercise.exerciseId),
    db.exercises.toArray(),
  ])

  const fallbackPoolEntries = Object.values(settings?.activeFallbackPool ?? {}).flat()
  const fallbackNames = new Set(
    fallbackPoolEntries.map((entry) => normalizeExerciseName(entry.exerciseName)),
  )

  const sourceFromLibrary = sourceOriginal
    ?? allExercises.find((exercise) => (
      normalizeExerciseName(exercise.name) === normalizeExerciseName(card.exercise.exerciseName)
    ))

  const sourceTier = sourceFromLibrary?.tier ?? card.exercise.tier
  const sourceMuscleGroup = sourceFromLibrary
    ? normalizeMuscleGroup(sourceFromLibrary.muscleGroup)
    : null

  const eligibleAlternatives = dedupeExercisesByNameOrId(
    allExercises.filter((exercise) => (
      exercise.id !== card.exercise.exerciseId
      && normalizeExerciseName(exercise.name) !== normalizeExerciseName(card.exercise.exerciseName)
      && !blockedExerciseIds.has(exercise.id)
      && exercise.tier === sourceTier
      && (
        sourceMuscleGroup === null
        || normalizeMuscleGroup(exercise.muscleGroup) === sourceMuscleGroup
      )
    )),
  )

  const prioritizedAlternatives = fallbackNames.size > 0
    ? [
        ...eligibleAlternatives.filter((exercise) => (
          fallbackNames.has(normalizeExerciseName(exercise.name))
        )),
        ...eligibleAlternatives.filter((exercise) => (
          !fallbackNames.has(normalizeExerciseName(exercise.name))
        )),
      ]
    : [...eligibleAlternatives]

  return prioritizedAlternatives.slice(0, 6)
}

export interface SwapCommitInputs {
  sourcePlan: PlannedWorkout
  swapIndex: number
  sourceCardExercise: PlannedExercise
  nextExercise: Exercise
  trainingGoal: 'Hypertrophy' | 'Power'
}

export function commitSwapToPlan(inputs: SwapCommitInputs): PlannedWorkout | null {
  const { sourcePlan, swapIndex, sourceCardExercise, nextExercise, trainingGoal } = inputs

  if (swapIndex < 0 || swapIndex >= sourcePlan.exercises.length) {
    return null
  }

  const sourceSlotExercise = sourcePlan.exercises[swapIndex]
  if (!sourceSlotExercise) {
    return null
  }

  const sourceSlotPrescription = resolveGoalTierPrescription(sourceSlotExercise.tier, trainingGoal)
  const nextSets = sourceCardExercise.sets > 0 ? sourceCardExercise.sets : sourceSlotPrescription.sets
  const nextReps = sourceCardExercise.reps > 0 ? sourceCardExercise.reps : sourceSlotPrescription.reps

  const nextSourceExercises: PlannedExercise[] = sourcePlan.exercises.map((exercise) => cloneExercise(exercise))
  nextSourceExercises[swapIndex] = {
    ...cloneExercise(sourceSlotExercise),
    exerciseId: nextExercise.id,
    exerciseName: nextExercise.name,
    sets: nextSets,
    reps: nextReps,
  }

  return {
    ...sourcePlan,
    exercises: [...nextSourceExercises],
  }
}

export async function persistFallbackSwap(
  db: IronProtocolDB,
  sourceExercise: PlannedExercise,
  nextExercise: Exercise,
): Promise<void> {
  const settings = await db.settings.get(APP_SETTINGS_ID)

  const currentFallbackEntries = [...Object.values(settings?.activeFallbackPool ?? {}).flat()]
  const dedupedFallbackEntries: Array<{ exerciseName: string; reason: string }> = []
  const seenFallbackNames = new Set<string>()

  for (const entry of currentFallbackEntries) {
    const normalizedName = normalizeExerciseName(entry.exerciseName)
    if (normalizedName.length === 0 || seenFallbackNames.has(normalizedName)) {
      continue
    }

    seenFallbackNames.add(normalizedName)
    dedupedFallbackEntries.push({ ...entry })
  }

  const removedFallbackName = normalizeExerciseName(nextExercise.name)
  const addedFallbackName = normalizeExerciseName(sourceExercise.exerciseName)

  const nextGlobalPool = dedupedFallbackEntries
    .filter((entry) => normalizeExerciseName(entry.exerciseName) !== removedFallbackName)
    .map((entry) => ({ ...entry }))

  if (!nextGlobalPool.some((entry) => normalizeExerciseName(entry.exerciseName) === addedFallbackName)) {
    nextGlobalPool.push({
      exerciseName: sourceExercise.exerciseName,
      reason: `Returned from active plan after swapping to ${nextExercise.name}`,
    })
  }

  await db.settings.update(APP_SETTINGS_ID, {
    activeFallbackPool: {
      ...(settings?.activeFallbackPool ?? {}),
      global: [...nextGlobalPool],
    },
  })
}
