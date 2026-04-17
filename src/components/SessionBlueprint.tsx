import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { PrestigeBadge } from './PrestigeBadge'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CheckCircle2, GripVertical, Shuffle } from 'lucide-react'
import {
  calcEstimatedMinutes,
  GOAL_TIER_PRESCRIPTIONS,
  generateWorkout,
  type CanonicalRoutineType,
  type PlannedExercise,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import type { Exercise, ExerciseTier, IronProtocolDB, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'
import { APP_SETTINGS_ID } from '../db/schema'
import SemanticSwapDrawer from './SemanticSwapDrawer'
import { getFunctionalInfo } from '../data/functionalMapping'

interface Props {
  db: IronProtocolDB
  plan: PlannedWorkout | null
  fullPlan?: PlannedWorkout | null
  loading?: boolean
  error?: string | null
  sessionLabel?: string
  cycleLength?: number
  sessionIndex?: number
  routineType: CanonicalRoutineType
  trainingGoal: 'Hypertrophy' | 'Power'
  timeAvailable: number
  primaryActionLabel?: string
  routineSetupRequired?: boolean
  onTrainingGoalChange?: (goal: 'Hypertrophy' | 'Power') => void
  onTimeAvailableChange?: (minutes: number) => void
  onChooseDefaultRoutine?: () => void
  onUpdatePlan: (plan: PlannedWorkout) => void
  onLockBlueprint?: () => void
  userName?: string
  completedAscensions?: number
}

interface ExerciseCardModel {
  instanceId: string
  exercise: PlannedExercise
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function createInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneExercise(exercise: PlannedExercise): PlannedExercise {
  return { ...exercise }
}

function clonePlan(plan: PlannedWorkout): PlannedWorkout {
  return {
    ...plan,
    exercises: plan.exercises.map((exercise) => cloneExercise(exercise)),
  }
}

function cloneCard(card: ExerciseCardModel): ExerciseCardModel {
  return {
    instanceId: card.instanceId,
    exercise: cloneExercise(card.exercise),
  }
}

function cloneCards(cards: readonly ExerciseCardModel[]): ExerciseCardModel[] {
  return cards.map((card) => cloneCard(card))
}

function planSyncSignature(plan: PlannedWorkout | null): string {
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

function exerciseIdentityKey(exercise: PlannedExercise): string {
  return `${exercise.exerciseId}:${normalizeExerciseName(exercise.exerciseName)}:${exercise.tier}`
}

function reconcileExerciseCards(
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

function isExerciseIntegrityValid(exercises: readonly PlannedExercise[]): boolean {
  return !hasAdjacentDuplicateExercises(exercises) && !hasDuplicateExerciseIds(exercises)
}

function clampWorkoutLengthMinutes(minutes: number): number {
  const bounded = Math.max(15, Math.min(120, minutes))
  return Math.round(bounded / 5) * 5
}

function isDatabaseClosedError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: string }).name === 'DatabaseClosedError'
}

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

interface QosResolution {
  activeExercises: PlannedExercise[]
  trimmedExercises: PlannedExercise[]
  estimatedMinutes: number
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

function estimateExerciseMinutes(
  exercise: PlannedExercise,
  trainingGoal: 'Hypertrophy' | 'Power',
): number {
  const restMinutes = REST_MINUTES_BY_GOAL_AND_TIER[trainingGoal][exercise.tier as 1 | 2 | 3]
  return exercise.sets + (exercise.sets * restMinutes)
}

function resolveQosExercises(
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

function applyQosToPlan(
  sourcePlan: PlannedWorkout,
  trainingGoal: 'Hypertrophy' | 'Power',
  qosMinutes: number,
): { activePlan: PlannedWorkout; trimmedExercises: PlannedExercise[] } {
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

function resolveGoalTierPrescription(
  tier: PlannedExercise['tier'],
  trainingGoal: 'Hypertrophy' | 'Power',
): { sets: number; reps: number } {
  return GOAL_TIER_PRESCRIPTIONS[trainingGoal][tier]
}

function remapExercisesForGoal(
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

function buildUpdatedPlanFromCards(
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

function reorderCardsByInstanceIds(
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

function getLocalSwapBlockedExerciseIds(
  sourceCard: ExerciseCardModel,
  cards: readonly ExerciseCardModel[],
): string[] {
  const ids = cards
    .filter((card) => card.instanceId !== sourceCard.instanceId)
    .map((card) => card.exercise.exerciseId)

  return [...new Set(ids)]
}

function normalizeMuscleGroup(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
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

export default function SessionBlueprint({
  db,
  plan,
  fullPlan = null,
  loading = false,
  error = null,
  sessionLabel = 'Session Blueprint',
  cycleLength = 1,
  sessionIndex = 0,
  routineType,
  trainingGoal,
  timeAvailable,
  primaryActionLabel = 'Start Next Workout',
  routineSetupRequired = false,
  onTrainingGoalChange,
  onTimeAvailableChange,
  onChooseDefaultRoutine,
  onUpdatePlan,
  onLockBlueprint,
  userName,
  completedAscensions = 0,
}: Props) {
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
  const [localTrainingGoal, setLocalTrainingGoal] = useState<'Hypertrophy' | 'Power'>(trainingGoal)
  const [workoutLengthMinutes, setWorkoutLengthMinutes] = useState<number>(() => (
    clampWorkoutLengthMinutes(timeAvailable)
  ))
  const [alternatives, setAlternatives] = useState<Record<string, Exercise[]>>({})
  const [swapTarget, setSwapTarget] = useState<ExerciseCardModel | null>(null)
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false)
  const [isSwapPending, setIsSwapPending] = useState(false)
  const [isSwapLoading, setIsSwapLoading] = useState(false)
  const [isPacingUpdating, setIsPacingUpdating] = useState(false)
  const [semanticSwapTarget, setSemanticSwapTarget] = useState<{ name: string; tier: ExerciseTier; muscleGroup: string } | null>(null)
  const [exerciseDB, setExerciseDB] = useState<ReadonlyExercise[]>([])
  const [v11Contract, setV11Contract] = useState<V11AppSettingsSchema | null>(null)

  const pacingRequestIdRef = useRef(0)
  const sourcePlanSyncKeyRef = useRef<string | null>(null)

  const commitQosSourcePlan = useCallback((
    nextSourcePlan: PlannedWorkout,
    nextGoal: 'Hypertrophy' | 'Power',
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

  useEffect(() => {
    db.exercises.toArray().then((exs) => setExerciseDB(exs)).catch(() => {})
    db.settings.get(APP_SETTINGS_ID).then((s) => {
      if (s?.v11PromptContract) setV11Contract(s.v11PromptContract)
    }).catch(() => {})
  }, [db])

  async function regeneratePlanForInputs(
    nextDurationMinutes: number,
    nextGoal: 'Hypertrophy' | 'Power',
  ): Promise<void> {
    const requestId = pacingRequestIdRef.current + 1
    pacingRequestIdRef.current = requestId
    setIsPacingUpdating(true)

    try {
      const regeneratedPlan = await generateWorkout({
        db,
        routineType,
        sessionIndex,
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
  }

  function handleTrainingGoalToggle(nextGoal: 'Hypertrophy' | 'Power'): void {
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
  }

  function handleWorkoutLengthChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextDurationMinutes = clampWorkoutLengthMinutes(Number(event.target.value))

    setWorkoutLengthMinutes(nextDurationMinutes)
    onTimeAvailableChange?.(nextDurationMinutes)

    if (qosSourcePlan) {
      commitQosSourcePlan(qosSourcePlan, localTrainingGoal, nextDurationMinutes, true)
    }

    void regeneratePlanForInputs(nextDurationMinutes, localTrainingGoal)
  }

  async function openSwapDrawer(card: ExerciseCardModel): Promise<void> {
    setSwapTarget(cloneCard(card))
    setIsSwapDrawerOpen(true)
    setIsSwapLoading(true)

    try {
      const blockedExerciseIds = new Set(getLocalSwapBlockedExerciseIds(card, exerciseCards))
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

      const resolvedAlternatives = prioritizedAlternatives.slice(0, 6)

      setAlternatives((current) => ({
        ...current,
        [card.instanceId]: [...resolvedAlternatives],
      }))
    } catch (unknownError) {
      if (!isDatabaseClosedError(unknownError)) {
        throw unknownError
      }
    } finally {
      setIsSwapLoading(false)
    }
  }

  function closeSwapDrawer(): void {
    if (isSwapPending) {
      return
    }
    setSwapTarget(null)
    setIsSwapDrawerOpen(false)
    setIsSwapLoading(false)
  }

  async function handleSwap(nextExercise: Exercise): Promise<void> {
    if (!swapTarget || !blueprint || !qosSourcePlan || isSwapPending) {
      return
    }

    setIsSwapPending(true)
    vibrate(50)

    try {
      const sourceExercise = swapTarget.exercise
      const settings = await db.settings.get(APP_SETTINGS_ID)
      const swapIndex = exerciseCards.findIndex((card) => card.instanceId === swapTarget.instanceId)

      if (swapIndex < 0 || swapIndex >= qosSourcePlan.exercises.length) {
        return
      }

      const sourceSlotExercise = qosSourcePlan.exercises[swapIndex]
      if (!sourceSlotExercise) {
        return
      }

      const sourceSlotPrescription = resolveGoalTierPrescription(sourceSlotExercise.tier, localTrainingGoal)
      const nextSets = sourceExercise.sets > 0 ? sourceExercise.sets : sourceSlotPrescription.sets
      const nextReps = sourceExercise.reps > 0 ? sourceExercise.reps : sourceSlotPrescription.reps

      const nextSourceExercises = qosSourcePlan.exercises.map((exercise) => cloneExercise(exercise))
      nextSourceExercises[swapIndex] = {
        ...cloneExercise(sourceSlotExercise),
        exerciseId: nextExercise.id,
        exerciseName: nextExercise.name,
        sets: nextSets,
        reps: nextReps,
      }

      const nextSourcePlan: PlannedWorkout = {
        ...qosSourcePlan,
        exercises: [...nextSourceExercises],
      }

      commitQosSourcePlan(nextSourcePlan, localTrainingGoal, workoutLengthMinutes, true)

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

      setSwapTarget(null)
      setIsSwapDrawerOpen(false)
    } finally {
      setIsSwapPending(false)
    }
  }

  function handleReorder(nextOrderIds: string[]): void {
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
  }

  const resolvedPlan = blueprint
  const orderedExerciseIds = exerciseCards.map((card) => card.instanceId)
  const swapCandidates = swapTarget ? (alternatives[swapTarget.instanceId] ?? []) : []
  const swapTargetInfo = swapTarget ? getFunctionalInfo(swapTarget.exercise.exerciseName) : null

  const estimatedMinutes = resolvedPlan?.estimatedMinutes ?? 0

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-navy px-4 pb-24 pt-5 text-zinc-100">
      <div className="rounded-3xl bg-gradient-to-br from-[#ec4899]/15 to-electric/15 p-[1px]">
        <motion.section
          key="session-blueprint-drafting-lab"
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-3xl bg-navy-card p-5 shadow-[0_16px_30px_-20px_rgba(59,113,254,0.35)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Drafting Lab</p>
            <span className="rounded-2xl border border-electric/20 bg-navy px-3 py-2 text-xs font-black text-zinc-100">
              Day {sessionIndex + 1} of {Math.max(cycleLength, 1)}
            </span>
          </div>
          {userName && (
            <p className="mt-2 flex items-center text-xs font-semibold text-zinc-400">
              {userName}
              <PrestigeBadge ascensions={completedAscensions} />
            </p>
          )}

          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-50">{sessionLabel}</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-300">
            Est. {estimatedMinutes} min
            {isPacingUpdating && <span className="ml-2 text-[11px] text-electric/80">Rebalancing...</span>}
          </p>

          {error && (
            <p className="mt-3 rounded-2xl border border-red-500/40 bg-red-900/20 p-3 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}
        </motion.section>
      </div>

      <motion.section className="rounded-3xl border border-electric/20 bg-navy-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Training Goal</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['Hypertrophy', 'Power'] as const).map((goal) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={goal}
              type="button"
              onClick={() => handleTrainingGoalToggle(goal)}
              className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                localTrainingGoal === goal
                  ? 'border-electric bg-electric/15 text-electric'
                  : 'border-electric/20 bg-navy text-zinc-300 hover:border-electric/40'
              }`}
            >
              {goal}
            </motion.button>
          ))}
        </div>
      </motion.section>

      <motion.section className="rounded-3xl border border-electric/20 bg-navy-card p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="drafting-lab-time" className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
            Time Available
          </label>
          <span className="text-sm font-black text-electric">{workoutLengthMinutes} min</span>
        </div>
        <div className="mt-4">
          <input
            id="drafting-lab-time"
            type="range"
            min={15}
            max={120}
            step={5}
            value={workoutLengthMinutes}
            onChange={handleWorkoutLengthChange}
            className="relative z-10 w-full cursor-pointer pointer-events-auto touch-pan-x accent-electric"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-electric/20 bg-navy p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric/60">QoS Preview</p>
          {trimmedExercises.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-300">No exercises trimmed for this time budget.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {trimmedExercises.map((exercise) => (
                <li key={exercise.exerciseId} className="flex items-center justify-between rounded-xl border border-electric/20 px-3 py-2">
                  <p className="text-sm font-bold text-zinc-100">{exercise.exerciseName}</p>
                  <span className="rounded-full border border-electric/30 px-2 py-1 text-xs font-bold text-zinc-200">T{exercise.tier}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>

      {loading && !resolvedPlan ? (
        <div className="rounded-3xl border border-electric/20 bg-navy-card p-6 text-center">
          <p className="text-sm font-semibold text-zinc-400">Syncing session...</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedExerciseIds}
          onReorder={handleReorder}
          className="flex flex-col gap-3"
        >
          {exerciseCards.map((card) => (
            <Reorder.Item key={card.instanceId} value={card.instanceId} className="flex flex-col">
              <motion.div
                layout
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between rounded-2xl border border-electric/20 bg-navy-card p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-navy/70 text-zinc-500">
                    <GripVertical size={16} />
                  </span>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-electric/10 px-1.5 py-0.5 text-[10px] font-black text-electric">T{card.exercise.tier}</span>
                      <h3 className="text-base font-black text-white">{card.exercise.exerciseName}</h3>
                    </div>
                    <p className="text-xs font-semibold text-zinc-400">
                      {card.exercise.sets} sets x {card.exercise.reps} reps · {card.exercise.weight} kg
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      void openSwapDrawer(card)
                    }}
                    aria-label={`Swap ${card.exercise.exerciseName}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-electric/30 bg-electric/10 px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-electric hover:bg-electric/15"
                  >
                    <Shuffle size={14} />
                    Swap
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSemanticSwapTarget({
                        name: card.exercise.exerciseName,
                        tier: card.exercise.tier,
                        muscleGroup: exerciseDB.find(e => e.id === card.exercise.exerciseId)?.muscleGroup ?? '',
                      })
                    }}
                    aria-label={`AI match ${card.exercise.exerciseName}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#ec4899]/30 bg-[#ec4899]/10 px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#ec4899] hover:bg-[#ec4899]/15"
                  >
                    AI
                  </motion.button>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {routineSetupRequired ? (
        <motion.section whileTap={{ scale: 0.98 }} className="rounded-3xl border border-electric/35 bg-[#0f1f44] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric">Setup Required</p>
          <p className="mt-2 text-sm font-semibold text-zinc-100">A routine must be selected before planning can continue.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onChooseDefaultRoutine}
            className="mt-4 h-12 w-full cursor-pointer rounded-2xl bg-electric text-sm font-black text-white"
          >
            Choose Routine
          </motion.button>
        </motion.section>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onLockBlueprint}
          disabled={!resolvedPlan || loading}
          className="flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-3xl bg-electric text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.55)] disabled:cursor-not-allowed disabled:bg-electric/30 disabled:text-zinc-500 disabled:shadow-none"
        >
          <CheckCircle2 size={22} />
          {loading ? 'Syncing Session...' : primaryActionLabel}
        </motion.button>
      )}

      <AnimatePresence>
        {semanticSwapTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setSemanticSwapTarget(null)}
            />
            <SemanticSwapDrawer
              exercise={semanticSwapTarget}
              exerciseDB={exerciseDB}
              v11Contract={v11Contract}
              onSwapConfirmed={(newName) => {
                if (plan && semanticSwapTarget) {
                  const matchedExercise = exerciseDB.find(e => e.name === newName)
                  const updatedExercises = plan.exercises.map((ex) =>
                    ex.exerciseName === semanticSwapTarget.name
                      ? {
                          ...ex,
                          exerciseName: newName,
                          exerciseId: matchedExercise?.id ?? ex.exerciseId,
                        }
                      : ex,
                  )
                  onUpdatePlan({ ...plan, exercises: updatedExercises })
                }
                setSemanticSwapTarget(null)
              }}
              onClose={() => setSemanticSwapTarget(null)}
            />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSwapDrawerOpen && swapTarget && (
          <>
            <motion.button
              type="button"
              aria-label="Close quick swap drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSwapDrawer}
              className="fixed inset-0 z-[60] bg-navy/55 backdrop-blur-[12px]"
            />

            <motion.section
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[430px] rounded-t-3xl border border-electric/25 bg-navy-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-16px_44px_-20px_rgba(59,113,254,0.72)]"
              aria-label="Quick swap drawer"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-electric/75">Quick Swap Drawer</p>
                  <h2 className="mt-1 text-lg font-black text-zinc-100">Replace {swapTarget.exercise.exerciseName}</h2>
                  <p className="mt-1 text-[11px] font-semibold text-zinc-300">
                    {swapTargetInfo?.category
                      ? `Biomechanical goal: ${swapTargetInfo.category}`
                      : 'Biomechanical goal inferred from tier and tags.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSwapDrawer}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:border-electric/35 hover:text-zinc-100"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-2 pb-2">
                {isSwapLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-navy px-3.5 py-3">
                    <p className="text-xs font-semibold text-zinc-300">Scanning global fallback pool...</p>
                  </div>
                ) : swapCandidates.length > 0 ? (
                  swapCandidates.slice(0, 4).map((alternative) => {
                    const info = getFunctionalInfo(alternative.name)
                    return (
                      <motion.button
                        key={alternative.id}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSwapPending}
                        onClick={() => void handleSwap(alternative)}
                        className="cursor-pointer rounded-2xl border border-electric/20 bg-navy px-3.5 py-3 text-left transition-colors hover:border-electric/45 hover:bg-electric/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <p className="text-sm font-black text-electric">{alternative.name}</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-300">
                          {info?.purpose ?? 'Same tier alternative for the current biomechanical objective.'}
                        </p>
                      </motion.button>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-navy px-3.5 py-3">
                    <p className="text-xs font-semibold text-zinc-400">No alternatives available for this movement yet.</p>
                  </div>
                )}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
