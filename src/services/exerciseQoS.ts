import {
  calcEstimatedMinutes,
  GOAL_TIER_PRESCRIPTIONS,
  type PlannedExercise,
  type PlannedWorkout,
} from '../planner/autoPlanner'

export interface ExerciseCardModel {
  instanceId: string
  exercise: PlannedExercise
}

export interface QosResolution {
  activeExercises: PlannedExercise[]
  trimmedExercises: PlannedExercise[]
  estimatedMinutes: number
}

export interface AppliedQosPlan {
  activePlan: PlannedWorkout
  trimmedExercises: PlannedExercise[]
}

const REST_MINUTES_BY_GOAL_AND_TIER: Record<'Hypertrophy' | 'Power', Record<1 | 2 | 3, number>> = {
  Hypertrophy: {
    1: 3,
    2: 2,
    3: 1.5,
  },
  Power: {
    1: 3,
    2: 2,
    3: 1.5,
  },
}

export function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function createInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function cloneExercise(exercise: PlannedExercise): PlannedExercise {
  return { ...exercise }
}

export function clonePlan(plan: PlannedWorkout): PlannedWorkout {
  return {
    ...plan,
    exercises: plan.exercises.map((exercise) => cloneExercise(exercise)),
  }
}

export function cloneCard(card: ExerciseCardModel): ExerciseCardModel {
  return {
    instanceId: card.instanceId,
    exercise: cloneExercise(card.exercise),
  }
}

export function cloneCards(cards: readonly ExerciseCardModel[]): ExerciseCardModel[] {
  return cards.map((card) => cloneCard(card))
}

export function planSyncSignature(plan: PlannedWorkout | null): string {
  if (!plan) {
    return '__none__'
  }

  const exerciseSignature = plan.exercises
    .map((exercise) => (
      `${exercise.exerciseId}:${normalizeExerciseName(exercise.exerciseName)}:${exercise.tier}:${exercise.sets}:${exercise.reps}:${exercise.weight}`
    ))
    .join('|')

  return `${plan.routineType}:${plan.sessionIndex}:${plan.estimatedMinutes}:${exerciseSignature}`
}

export function exerciseIdentityKey(exercise: PlannedExercise): string {
  return `${exercise.exerciseId}:${normalizeExerciseName(exercise.exerciseName)}:${exercise.tier}`
}

export function reconcileExerciseCards(
  previousCards: readonly ExerciseCardModel[],
  nextExercises: readonly PlannedExercise[],
): ExerciseCardModel[] {
  const previousByKey = new Map<string, ExerciseCardModel[]>()

  for (const card of previousCards) {
    const key = exerciseIdentityKey(card.exercise)
    const queue = previousByKey.get(key)
    if (queue) {
      queue.push(card)
    } else {
      previousByKey.set(key, [card])
    }
  }

  const reconciledCards: ExerciseCardModel[] = []

  for (const exercise of nextExercises) {
    const key = exerciseIdentityKey(exercise)
    const queue = previousByKey.get(key)
    const reused = queue?.shift()

    if (reused) {
      reconciledCards.push({
        instanceId: reused.instanceId,
        exercise: cloneExercise(exercise),
      })
      continue
    }

    reconciledCards.push({
      instanceId: createInstanceId(),
      exercise: cloneExercise(exercise),
    })
  }

  return reconciledCards
}

function hasAdjacentDuplicateExercises(exercises: readonly PlannedExercise[]): boolean {
  for (let index = 1; index < exercises.length; index += 1) {
    const previous = exercises[index - 1]
    const current = exercises[index]
    if (
      previous.exerciseId === current.exerciseId
      || normalizeExerciseName(previous.exerciseName) === normalizeExerciseName(current.exerciseName)
    ) {
      return true
    }
  }
  return false
}

function hasDuplicateExerciseIds(exercises: readonly PlannedExercise[]): boolean {
  return new Set(exercises.map((exercise) => exercise.exerciseId)).size !== exercises.length
}

export function isExerciseIntegrityValid(exercises: readonly PlannedExercise[]): boolean {
  return !hasAdjacentDuplicateExercises(exercises) && !hasDuplicateExerciseIds(exercises)
}

export function clampWorkoutLengthMinutes(minutes: number): number {
  const bounded = Math.max(15, Math.min(120, minutes))
  return Math.round(bounded / 5) * 5
}

function estimateExerciseMinutes(
  exercise: PlannedExercise,
  trainingGoal: 'Hypertrophy' | 'Power',
): number {
  const restMinutes = REST_MINUTES_BY_GOAL_AND_TIER[trainingGoal][exercise.tier as 1 | 2 | 3]
  return exercise.sets + (exercise.sets * restMinutes)
}

export function resolveQosExercises(
  exercises: readonly PlannedExercise[],
  trainingGoal: 'Hypertrophy' | 'Power',
  qosMinutes: number,
): QosResolution {
  const activeExercises = exercises.map((exercise) => cloneExercise(exercise))
  const trimmedExercises: PlannedExercise[] = []

  const calculateTotalMinutes = (plannedExercises: readonly PlannedExercise[]): number => {
    const totalMinutes = plannedExercises.reduce(
      (accumulated, exercise) => accumulated + estimateExerciseMinutes(exercise, trainingGoal),
      0,
    )
    return Math.ceil(totalMinutes)
  }

  let estimatedMinutes = calculateTotalMinutes(activeExercises)

  while (estimatedMinutes > qosMinutes && activeExercises.length > 0) {
    const removed = activeExercises.pop()
    if (!removed) {
      break
    }
    trimmedExercises.unshift(cloneExercise(removed))
    estimatedMinutes = calculateTotalMinutes(activeExercises)
  }

  return {
    activeExercises,
    trimmedExercises,
    estimatedMinutes,
  }
}

export function applyQosToPlan(
  sourcePlan: PlannedWorkout,
  trainingGoal: 'Hypertrophy' | 'Power',
  qosMinutes: number,
): AppliedQosPlan {
  const qosResolution = resolveQosExercises(sourcePlan.exercises, trainingGoal, qosMinutes)

  return {
    activePlan: {
      ...sourcePlan,
      exercises: qosResolution.activeExercises,
      estimatedMinutes: qosResolution.estimatedMinutes,
    },
    trimmedExercises: qosResolution.trimmedExercises,
  }
}

export function resolveGoalTierPrescription(
  tier: PlannedExercise['tier'],
  trainingGoal: 'Hypertrophy' | 'Power',
): { sets: number; reps: number } {
  return GOAL_TIER_PRESCRIPTIONS[trainingGoal][tier]
}

export function remapExercisesForGoal(
  exercises: readonly PlannedExercise[],
  trainingGoal: 'Hypertrophy' | 'Power',
): PlannedExercise[] {
  return exercises.map((exercise) => {
    const prescription = resolveGoalTierPrescription(exercise.tier, trainingGoal)
    return {
      ...cloneExercise(exercise),
      sets: prescription.sets,
      reps: prescription.reps,
    }
  })
}

export function buildUpdatedPlanFromCards(
  sourcePlan: PlannedWorkout,
  nextCards: readonly ExerciseCardModel[],
  trainingGoal: 'Hypertrophy' | 'Power',
): PlannedWorkout | null {
  const nextExercises = nextCards.map((card) => cloneExercise(card.exercise))
  if (!isExerciseIntegrityValid(nextExercises)) {
    return null
  }

  return {
    ...sourcePlan,
    exercises: [...nextExercises],
    estimatedMinutes: calcEstimatedMinutes(nextExercises, trainingGoal),
  }
}

export function reorderCardsByInstanceIds(
  currentCards: readonly ExerciseCardModel[],
  nextOrderIds: readonly string[],
): ExerciseCardModel[] {
  if (currentCards.length !== nextOrderIds.length) {
    return cloneCards(currentCards)
  }

  const uniqueOrderIds = new Set(nextOrderIds)
  const uniqueCurrentIds = new Set(currentCards.map((card) => card.instanceId))
  if (uniqueOrderIds.size !== nextOrderIds.length || uniqueCurrentIds.size !== currentCards.length) {
    return cloneCards(currentCards)
  }

  const byId = new Map(currentCards.map((card) => [card.instanceId, card]))
  const reorderedCards: ExerciseCardModel[] = []

  for (const id of nextOrderIds) {
    const resolved = byId.get(id)
    if (!resolved) {
      return cloneCards(currentCards)
    }
    reorderedCards.push(cloneCard(resolved))
  }

  return reorderedCards
}
