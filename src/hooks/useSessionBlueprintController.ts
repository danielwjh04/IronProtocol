import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  generateWorkout,
  type CanonicalRoutineType,
  type PlannedExercise,
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
  remapExercisesForGoal,
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
  onTrainingGoalChange?: (goal: TrainingGoal) => void
  onTimeAvailableChange?: (minutes: number) => void
  onUpdatePlan: (plan: PlannedWorkout) => void
}

export interface SessionBlueprintView {
  resolvedPlan: PlannedWorkout | null
  exerciseCards: ExerciseCardModel[]
  orderedExerciseIds: string[]
  trimmedExercises: PlannedExercise[]
  localTrainingGoal: TrainingGoal
  workoutLengthMinutes: number
  estimatedMinutes: number
  isPacingUpdating: boolean
  swapTarget: ExerciseCardModel | null
  swapCandidates: Exercise[]
  swapTargetInfo: ExerciseFunctionalInfo | null
  isSwapDrawerOpen: boolean
  isSwapPending: boolean
  isSwapLoading: boolean
}

export interface SessionBlueprintActions {
  onTrainingGoalToggle: (goal: TrainingGoal) => void
  onWorkoutLengthChange: (event: ChangeEvent<HTMLInputElement>) => void
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
    routineType,
    trainingGoal,
    timeAvailable,
    onTrainingGoalChange,
    onTimeAvailableChange,
    onUpdatePlan,
  } = inputs

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
  const [trimmedExercises, setTrimmedExercises] = useState<PlannedExercise[]>([])
  const [localTrainingGoal, setLocalTrainingGoal] = useState<TrainingGoal>(trainingGoal)
  const [workoutLengthMinutes, setWorkoutLengthMinutes] = useState<number>(() => (
    clampWorkoutLengthMinutes(timeAvailable)
  ))
  const [alternatives, setAlternatives] = useState<Record<string, Exercise[]>>({})
  const [swapTarget, setSwapTarget] = useState<ExerciseCardModel | null>(null)
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false)
  const [isSwapPending, setIsSwapPending] = useState(false)
  const [isSwapLoading, setIsSwapLoading] = useState(false)
  const [isPacingUpdating, setIsPacingUpdating] = useState(false)

  const pacingRequestIdRef = useRef(0)
  const sourcePlanSyncKeyRef = useRef<string | null>(null)

  const commitQosSourcePlan = useCallback((
    nextSourcePlan: PlannedWorkout,
    nextGoal: TrainingGoal,
    nextDurationMinutes: number,
    notifyParent: boolean,
  ): PlannedWorkout => {
    const clonedSourcePlan = clonePlan(nextSourcePlan)
    const { activePlan, trimmedExercises: nextTrimmedExercises } = applyQosToPlan(
      clonedSourcePlan,
      nextGoal,
      nextDurationMinutes,
    )
    const clonedActivePlan = clonePlan(activePlan)

    setQosSourcePlan(clonedSourcePlan)
    setTrimmedExercises(nextTrimmedExercises.map((exercise) => cloneExercise(exercise)))
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
      setTrimmedExercises([])
      setExerciseCards((currentCards) => reconcileExerciseCards(currentCards, []))
      return
    }

    commitQosSourcePlan(incomingSourcePlan, localTrainingGoal, workoutLengthMinutes, false)
  }, [commitQosSourcePlan, fullPlan, localTrainingGoal, plan, workoutLengthMinutes])

  useEffect(() => {
    setLocalTrainingGoal(trainingGoal)
  }, [trainingGoal])

  useEffect(() => {
    setWorkoutLengthMinutes(clampWorkoutLengthMinutes(timeAvailable))
  }, [timeAvailable])

  const regeneratePlanForInputs = useCallback(async (
    nextDurationMinutes: number,
    nextGoal: TrainingGoal,
  ): Promise<void> => {
    const requestId = pacingRequestIdRef.current + 1
    pacingRequestIdRef.current = requestId
    setIsPacingUpdating(true)

    try {
      const regeneratedPlan = await generateWorkout({
        db,
        routineType,
        trainingGoal: nextGoal,
        timeAvailable: nextDurationMinutes,
      })

      if (requestId !== pacingRequestIdRef.current) {
        return
      }

      commitQosSourcePlan(clonePlan(regeneratedPlan), nextGoal, nextDurationMinutes, true)
    } catch {
      // Preserve the current blueprint on regeneration failure.
    } finally {
      if (requestId === pacingRequestIdRef.current) {
        setIsPacingUpdating(false)
      }
    }
  }, [commitQosSourcePlan, db, routineType])

  const onTrainingGoalToggle = useCallback((nextGoal: TrainingGoal): void => {
    if (localTrainingGoal === nextGoal) {
      return
    }

    setLocalTrainingGoal(nextGoal)
    onTrainingGoalChange?.(nextGoal)

    if (qosSourcePlan) {
      const remappedSourcePlan: PlannedWorkout = {
        ...qosSourcePlan,
        exercises: remapExercisesForGoal(qosSourcePlan.exercises, nextGoal),
      }
      commitQosSourcePlan(remappedSourcePlan, nextGoal, workoutLengthMinutes, true)
    }

    void regeneratePlanForInputs(workoutLengthMinutes, nextGoal)
  }, [commitQosSourcePlan, localTrainingGoal, onTrainingGoalChange, qosSourcePlan, regeneratePlanForInputs, workoutLengthMinutes])

  const onWorkoutLengthChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const nextDurationMinutes = clampWorkoutLengthMinutes(Number(event.target.value))

    setWorkoutLengthMinutes(nextDurationMinutes)
    onTimeAvailableChange?.(nextDurationMinutes)

    if (qosSourcePlan) {
      commitQosSourcePlan(qosSourcePlan, localTrainingGoal, nextDurationMinutes, true)
    }

    void regeneratePlanForInputs(nextDurationMinutes, localTrainingGoal)
  }, [commitQosSourcePlan, localTrainingGoal, onTimeAvailableChange, qosSourcePlan, regeneratePlanForInputs])

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
        trainingGoal: localTrainingGoal,
      })

      if (!nextSourcePlan) {
        return
      }

      commitQosSourcePlan(nextSourcePlan, localTrainingGoal, workoutLengthMinutes, true)
      await persistFallbackSwap(db, swapTarget.exercise, nextExercise)

      setSwapTarget(null)
      setIsSwapDrawerOpen(false)
    } finally {
      setIsSwapPending(false)
    }
  }, [blueprint, commitQosSourcePlan, db, exerciseCards, isSwapPending, localTrainingGoal, qosSourcePlan, swapTarget, workoutLengthMinutes])

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

    const updatedPlan = buildUpdatedPlanFromCards(blueprint, reorderedCards, localTrainingGoal)
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

    commitQosSourcePlan(nextSourcePlan, localTrainingGoal, workoutLengthMinutes, true)
  }, [blueprint, commitQosSourcePlan, exerciseCards, localTrainingGoal, qosSourcePlan, workoutLengthMinutes])

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
      trimmedExercises,
      localTrainingGoal,
      workoutLengthMinutes,
      estimatedMinutes,
      isPacingUpdating,
      swapTarget,
      swapCandidates,
      swapTargetInfo,
      isSwapDrawerOpen,
      isSwapPending,
      isSwapLoading,
    },
    actions: {
      onTrainingGoalToggle,
      onWorkoutLengthChange,
      onReorder,
      onOpenSwapDrawer,
      onCloseSwapDrawer,
      onSwap,
    },
  }
}
