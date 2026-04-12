import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CheckCircle2, GripVertical, Shuffle } from 'lucide-react'
import {
  calcEstimatedMinutes,
  generateWorkout,
  type CanonicalRoutineType,
  type PlannedExercise,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import type { Exercise, IronProtocolDB } from '../db/schema'
import { APP_SETTINGS_ID } from '../db/schema'
import { getFunctionalInfo } from '../data/functionalMapping'
import { getSmartSwapAlternatives, getSwapRepTarget } from '../services/exerciseService'

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
  routineSetupRequired?: boolean
  onTrainingGoalChange?: (goal: 'Hypertrophy' | 'Power') => void
  onTimeAvailableChange?: (minutes: number) => void
  onChooseDefaultRoutine?: () => void
  onUpdatePlan: (plan: PlannedWorkout) => void
  onLockBlueprint?: () => void
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
  routineSetupRequired = false,
  onTrainingGoalChange,
  onTimeAvailableChange,
  onChooseDefaultRoutine,
  onUpdatePlan,
  onLockBlueprint,
}: Props) {
  const [blueprint, setBlueprint] = useState<PlannedWorkout | null>(() => (
    plan ? clonePlan(plan) : null
  ))
  const [exerciseCards, setExerciseCards] = useState<ExerciseCardModel[]>(() => (
    reconcileExerciseCards([], plan?.exercises ?? [])
  ))
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

  const pacingRequestIdRef = useRef(0)

  useEffect(() => {
    setBlueprint(plan ? clonePlan(plan) : null)
    setExerciseCards((currentCards) => reconcileExerciseCards(currentCards, plan?.exercises ?? []))
  }, [plan])

  useEffect(() => {
    setLocalTrainingGoal(trainingGoal)
  }, [trainingGoal])

  useEffect(() => {
    setWorkoutLengthMinutes(clampWorkoutLengthMinutes(timeAvailable))
  }, [timeAvailable])

  useEffect(() => {
    let cancelled = false

    const fetchAllAlternatives = async () => {
      try {
        const alternativesMap: Record<string, Exercise[]> = {}

        for (const card of exerciseCards) {
          const blockedExerciseIds = getLocalSwapBlockedExerciseIds(card, exerciseCards)
          const resolvedAlternatives = await getSmartSwapAlternatives(db, card.exercise, {
            limit: 4,
            blockedExerciseIds,
          })
          alternativesMap[card.instanceId] = resolvedAlternatives
        }

        if (!cancelled) {
          setAlternatives(alternativesMap)
        }
      } catch (unknownError) {
        if (!isDatabaseClosedError(unknownError)) {
          throw unknownError
        }
      }
    }

    void fetchAllAlternatives()

    return () => {
      cancelled = true
    }
  }, [db, exerciseCards])

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

      const nextPlan = clonePlan(regeneratedPlan)
      const nextCards = reconcileExerciseCards(exerciseCards, nextPlan.exercises)

      setExerciseCards(cloneCards(nextCards))
      setBlueprint(nextPlan)
      onUpdatePlan(nextPlan)
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

    void regeneratePlanForInputs(workoutLengthMinutes, nextGoal)
  }

  function handleWorkoutLengthChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextDurationMinutes = clampWorkoutLengthMinutes(Number(event.target.value))

    setWorkoutLengthMinutes(nextDurationMinutes)
    onTimeAvailableChange?.(nextDurationMinutes)

    void regeneratePlanForInputs(nextDurationMinutes, localTrainingGoal)
  }

  async function openSwapDrawer(card: ExerciseCardModel): Promise<void> {
    setSwapTarget(cloneCard(card))
    setIsSwapDrawerOpen(true)
    setIsSwapLoading(true)

    try {
      const blockedExerciseIds = getLocalSwapBlockedExerciseIds(card, exerciseCards)
      const resolvedAlternatives = await getSmartSwapAlternatives(db, card.exercise, {
        limit: 6,
        blockedExerciseIds,
      })

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
    if (!swapTarget || !blueprint || isSwapPending) {
      return
    }

    setIsSwapPending(true)
    vibrate(50)

    try {
      const sourceExercise = swapTarget.exercise
      const [settings, sourceOriginal] = await Promise.all([
        db.settings.get(APP_SETTINGS_ID),
        db.exercises.get(sourceExercise.exerciseId),
      ])

      const adjustedReps = getSwapRepTarget({
        sourceExerciseName: sourceExercise.exerciseName,
        sourceTags: sourceOriginal?.tags ?? [],
        targetExerciseName: nextExercise.name,
        currentReps: sourceExercise.reps,
        purposeChip: settings?.purposeChip,
      })

      const updatedCards = exerciseCards.map((card) => (
        card.instanceId === swapTarget.instanceId
          ? {
              ...card,
              exercise: {
                ...card.exercise,
                exerciseId: nextExercise.id,
                exerciseName: nextExercise.name,
                reps: adjustedReps,
              },
            }
          : cloneCard(card)
      ))

      const updatedPlan = buildUpdatedPlanFromCards(blueprint, updatedCards, localTrainingGoal)
      if (!updatedPlan) {
        return
      }

      const nextCards = cloneCards(updatedCards)
      const nextPlan = clonePlan(updatedPlan)

      setExerciseCards(nextCards)
      setBlueprint(nextPlan)
      onUpdatePlan(nextPlan)

      setSwapTarget(null)
      setIsSwapDrawerOpen(false)
    } finally {
      setIsSwapPending(false)
    }
  }

  function handleReorder(nextOrderIds: string[]): void {
    if (!blueprint) {
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

    const nextCards = cloneCards(reorderedCards)
    const nextPlan = clonePlan(updatedPlan)

    setExerciseCards(nextCards)
    setBlueprint(nextPlan)
    onUpdatePlan(nextPlan)
  }

  const resolvedPlan = blueprint
  const orderedExerciseIds = exerciseCards.map((card) => card.instanceId)
  const swapCandidates = swapTarget ? (alternatives[swapTarget.instanceId] ?? []) : []
  const swapTargetInfo = swapTarget ? getFunctionalInfo(swapTarget.exercise.exerciseName) : null

  const trimmedExercises = resolvedPlan && fullPlan
    ? fullPlan.exercises.filter((exercise) => !resolvedPlan.exercises.some((planned) => planned.exerciseId === exercise.exerciseId))
    : []

  const estimatedMinutes = resolvedPlan
    ? calcEstimatedMinutes(resolvedPlan.exercises, localTrainingGoal)
    : 0

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

      <motion.section whileTap={{ scale: 0.98 }} className="rounded-3xl border border-electric/20 bg-navy-card p-4">
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

      <motion.section whileTap={{ scale: 0.98 }} className="rounded-3xl border border-electric/20 bg-navy-card p-4">
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
            className="w-full cursor-pointer appearance-none"
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
          {loading ? 'Syncing Session...' : 'Lock Blueprint'}
        </motion.button>
      )}

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
                    <p className="text-xs font-semibold text-zinc-300">Scanning same-category alternatives...</p>
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
