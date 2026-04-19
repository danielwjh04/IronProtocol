import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type CanonicalRoutineType,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import {
  type Exercise,
  type IronProtocolDB,
} from '../db/schema'
import { getFunctionalInfo, type ExerciseFunctionalInfo } from '../data/functionalMapping'
import {
  applyQosToPlan,
  buildUpdatedPlanFromCards,
  clampWorkoutLengthMinutes,
  cloneCard,
  cloneExercise,
  clonePlan,
  planSyncSignature,
  reconcileExerciseCards,
  reorderCardsByInstanceIds,
  type ExerciseCardModel,
} from '../services/exerciseQoS'
import {
  commitSwapToPlan,
  isDatabaseClosedError,
  loadSwapCandidates,
  persistFallbackSwap,
} from '../services/fallbackPoolManager'

export type TrainingGoal = 'Hypertrophy' | 'Power'

export interface SessionBlueprintControllerInputs {
  db: IronProtocolDB
  plan: PlannedWorkout | null
  fullPlan: PlannedWorkout | null
  routineType: CanonicalRoutineType
  trainingGoal: TrainingGoal
  timeAvailable: number
  onUpdatePlan: (plan: PlannedWorkout) => void
}

export interface SessionBlueprintView {
  resolvedPlan: PlannedWorkout | null
  exerciseCards: ExerciseCardModel[]
  orderedExerciseIds: string[]
  estimatedMinutes: number
  swapTarget: ExerciseCardModel | null
  swapCandidates: Exercise[]
  swapTargetInfo: ExerciseFunctionalInfo | null
  isSwapDrawerOpen: boolean
  isSwapPending: boolean
  isSwapLoading: boolean
}

export interface SessionBlueprintActions {
  onReorder: (nextOrderIds: string[]) => void
  onOpenSwapDrawer: (card: ExerciseCardModel) => Promise<void>
  onCloseSwapDrawer: () => void
  onSwap: (nextExercise: Exercise) => Promise<void>
}

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

export function useSessionBlueprintController(
  inputs: SessionBlueprintControllerInputs,
): { view: SessionBlueprintView; actions: SessionBlueprintActions } {
  const {
    db,
    plan,
    fullPlan,
    trainingGoal,
    timeAvailable,
    onUpdatePlan,
  } = inputs

  const workoutLengthMinutes = clampWorkoutLengthMinutes(timeAvailable)

  const [qosSourcePlan, setQosSourcePlan] = useState<PlannedWorkout | null>(() => {
    if (fullPlan) {
      return clonePlan(fullPlan)
    }
    if (plan) {
      return clonePlan(plan)
    }
    return null
  })
  const [blueprint, setBlueprint] = useState<PlannedWorkout | null>(() => (
    plan ? clonePlan(plan) : null
  ))
  const [exerciseCards, setExerciseCards] = useState<ExerciseCardModel[]>(() => (
    reconcileExerciseCards([], plan?.exercises ?? [])
  ))
  const [alternatives, setAlternatives] = useState<Record<string, Exercise[]>>({})
  const [swapTarget, setSwapTarget] = useState<ExerciseCardModel | null>(null)
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false)
  const [isSwapPending, setIsSwapPending] = useState(false)
  const [isSwapLoading, setIsSwapLoading] = useState(false)

  const sourcePlanSyncKeyRef = useRef<string | null>(null)

  const commitQosSourcePlan = useCallback((
    nextSourcePlan: PlannedWorkout,
    nextGoal: TrainingGoal,
    nextDurationMinutes: number,
    notifyParent: boolean,
  ): PlannedWorkout => {
    const clonedSourcePlan = clonePlan(nextSourcePlan)
    const { activePlan } = applyQosToPlan(
      clonedSourcePlan,
      nextGoal,
      nextDurationMinutes,
    )
    const clonedActivePlan = clonePlan(activePlan)

    setQosSourcePlan(clonedSourcePlan)
    setExerciseCards((currentCards) => reconcileExerciseCards(currentCards, clonedActivePlan.exercises))
    setBlueprint(clonedActivePlan)

    if (notifyParent) {
      onUpdatePlan(clonedActivePlan)
    }

    return clonedActivePlan
  }, [onUpdatePlan])

  useEffect(() => {
    const incomingSourcePlan = fullPlan ? clonePlan(fullPlan) : plan ? clonePlan(plan) : null
    const nextSyncKey = planSyncSignature(incomingSourcePlan)

    if (sourcePlanSyncKeyRef.current === nextSyncKey) {
      return
    }

    sourcePlanSyncKeyRef.current = nextSyncKey

    if (!incomingSourcePlan) {
      setQosSourcePlan(null)
      setBlueprint(null)
      setExerciseCards((currentCards) => reconcileExerciseCards(currentCards, []))
      return
    }

    commitQosSourcePlan(incomingSourcePlan, trainingGoal, workoutLengthMinutes, false)
  }, [commitQosSourcePlan, fullPlan, plan, trainingGoal, workoutLengthMinutes])

  const onOpenSwapDrawer = useCallback(async (card: ExerciseCardModel): Promise<void> => {
    setSwapTarget(cloneCard(card))
    setIsSwapDrawerOpen(true)
    setIsSwapLoading(true)

    try {
      const candidates = await loadSwapCandidates(db, { card, cards: exerciseCards })
      setAlternatives((current) => ({
        ...current,
        [card.instanceId]: [...candidates],
      }))
    } catch (unknownError) {
      if (!isDatabaseClosedError(unknownError)) {
        throw unknownError
      }
    } finally {
      setIsSwapLoading(false)
    }
  }, [db, exerciseCards])

  const onCloseSwapDrawer = useCallback((): void => {
    if (isSwapPending) {
      return
    }
    setSwapTarget(null)
    setIsSwapDrawerOpen(false)
    setIsSwapLoading(false)
  }, [isSwapPending])

  const onSwap = useCallback(async (nextExercise: Exercise): Promise<void> => {
    if (!swapTarget || !blueprint || !qosSourcePlan || isSwapPending) {
      return
    }

    setIsSwapPending(true)
    vibrate(50)

    try {
      const swapIndex = exerciseCards.findIndex((card) => card.instanceId === swapTarget.instanceId)
      const nextSourcePlan = commitSwapToPlan({
        sourcePlan: qosSourcePlan,
        swapIndex,
        sourceCardExercise: swapTarget.exercise,
        nextExercise,
        trainingGoal,
      })

      if (!nextSourcePlan) {
        return
      }

      commitQosSourcePlan(nextSourcePlan, trainingGoal, workoutLengthMinutes, true)
      await persistFallbackSwap(db, swapTarget.exercise, nextExercise)

      setSwapTarget(null)
      setIsSwapDrawerOpen(false)
    } finally {
      setIsSwapPending(false)
    }
  }, [blueprint, commitQosSourcePlan, db, exerciseCards, isSwapPending, qosSourcePlan, swapTarget, trainingGoal, workoutLengthMinutes])

  const onReorder = useCallback((nextOrderIds: string[]): void => {
    if (!blueprint || !qosSourcePlan) {
      return
    }

    const reorderedCards = reorderCardsByInstanceIds(exerciseCards, nextOrderIds)
    const hasOrderChanged = reorderedCards.some(
      (card, index) => card.instanceId !== exerciseCards[index]?.instanceId,
    )

    if (!hasOrderChanged) {
      return
    }

    const updatedPlan = buildUpdatedPlanFromCards(blueprint, reorderedCards, trainingGoal)
    if (!updatedPlan) {
      return
    }

    vibrate(20)

    const reorderedActiveExercises = reorderedCards.map((card) => cloneExercise(card.exercise))
    const preservedTrailingExercises = qosSourcePlan.exercises
      .slice(reorderedActiveExercises.length)
      .map((exercise) => cloneExercise(exercise))

    const nextSourcePlan: PlannedWorkout = {
      ...qosSourcePlan,
      exercises: [...reorderedActiveExercises, ...preservedTrailingExercises],
    }

    commitQosSourcePlan(nextSourcePlan, trainingGoal, workoutLengthMinutes, true)
  }, [blueprint, commitQosSourcePlan, exerciseCards, qosSourcePlan, trainingGoal, workoutLengthMinutes])

  const resolvedPlan = blueprint
  const orderedExerciseIds = exerciseCards.map((card) => card.instanceId)
  const swapCandidates = swapTarget ? (alternatives[swapTarget.instanceId] ?? []) : []
  const swapTargetInfo = swapTarget ? getFunctionalInfo(swapTarget.exercise.exerciseName) : null
  const estimatedMinutes = resolvedPlan?.estimatedMinutes ?? 0

  return {
    view: {
      resolvedPlan,
      exerciseCards,
      orderedExerciseIds,
      estimatedMinutes,
      swapTarget,
      swapCandidates,
      swapTargetInfo,
      isSwapDrawerOpen,
      isSwapPending,
      isSwapLoading,
    },
    actions: {
      onReorder,
      onOpenSwapDrawer,
      onCloseSwapDrawer,
      onSwap,
    },
  }
}
