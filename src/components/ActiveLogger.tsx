import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PlannedWorkout, PlannedExercise } from '../planner/autoPlanner'
import {
  TEMP_SESSION_ID,
  type ExerciseTier,
  type IronProtocolDB,
  type ParsedGoal,
  type TempSessionCompletedSet,
  type TempSession,
} from '../db/schema'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'
import { PersonalBestsService } from '../services/personalBestsService'
import { publish } from '../events/setCommitEvents'
import FunctionalWhy from './FunctionalWhy'
import RecoveryLogForm from './RecoveryLogForm'
import ConfirmDialog from './UI/ConfirmDialog'
import TierIcon from './dashboard/TierIcon'

interface Props {
  plan: PlannedWorkout
  db: IronProtocolDB
  initialDraft?: TempSession | null
  parsedGoal?: ParsedGoal
  onDone?: () => void
  onCancel?: () => void
}

type CompletedSet = TempSessionCompletedSet

type Phase = 'active' | 'resting'

function isDatabaseClosedError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'name' in error
    && (error as { name?: string }).name === 'DatabaseClosedError'
}

export default function ActiveLogger({ plan, db, initialDraft, onDone, onCancel }: Props) {
  const initialExercises: readonly PlannedExercise[] = plan.exercises.length > 0
    ? plan.exercises
    : [{
        exerciseId: 'fallback-gpp',
        exerciseName: 'Bodyweight Circuit',
        weight: 0,
        reps: 12,
        sets: 3,
        tier: 3 as ExerciseTier,
        progressionGoal: 'Goal: 12 Reps (Baseline)',
      }]

  const pbService = useMemo(() => new PersonalBestsService(db), [db])

  const resumableDraft = (() => {
    if (!initialDraft) {
      return null
    }

    try {
      const parsed = parseTempSessionDraft(initialDraft)
      const matchingPlan =
        parsed.routineType === plan.routineType
        && parsed.sessionIndex === plan.sessionIndex
        && parsed.exercises.length === initialExercises.length
        && parsed.exercises.every((exercise, index) => exercise.exerciseId === initialExercises[index]?.exerciseId)
      return matchingPlan ? parsed : null
    } catch {
      return null
    }
  })()

  const totalAllSets = initialExercises.reduce((sum, ex) => sum + ex.sets, 0)
  const restSeconds  = Math.max(30, Math.round((plan.estimatedMinutes * 60) / totalAllSets))

  const initialExIndex = resumableDraft
    ? Math.min(resumableDraft.currentExIndex, Math.max(0, initialExercises.length - 1))
    : 0
  const initialExercise = initialExercises[initialExIndex]
  const initialSetInEx = resumableDraft
    ? Math.min(resumableDraft.currentSetInEx, Math.max(0, initialExercise.sets - 1))
    : 0

  const exercises: readonly PlannedExercise[] = initialExercises
  const [currentExIndex, setCurrentExIndex] = useState(initialExIndex)
  const [currentSetInEx, setCurrentSetInEx] = useState(initialSetInEx) // 0-based within exercise
  const [weight,         setWeight]         = useState(resumableDraft?.weight ?? initialExercise.weight)
  const [reps,           setReps]           = useState(resumableDraft?.reps ?? initialExercise.reps)
  const [phase,          setPhase]          = useState<Phase>(resumableDraft?.phase ?? 'active')
  const [restSecondsLeft, setRestSecondsLeft] = useState(
    resumableDraft?.phase === 'resting'
      ? Math.max(0, resumableDraft.restSecondsLeft)
      : restSeconds,
  )
  const [completedSets,  setCompletedSets]  = useState<CompletedSet[]>(resumableDraft?.completedSets ?? [])
  const [showWhy,        setShowWhy]        = useState(false)

  const [showRecoveryForm,    setShowRecoveryForm]    = useState(false)
  const [completedWorkoutId,  setCompletedWorkoutId]  = useState<string | null>(null)
  const [commitError,         setCommitError]         = useState<string | null>(null)
  const [showCancelConfirm,   setShowCancelConfirm]   = useState(false)
  const [isCommitting,        setIsCommitting]        = useState(false)

  const weightInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (phase !== 'resting') return

    const timerId = setInterval(() => {
      setRestSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId)
          setPhase('active')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerId)
  }, [phase])

  useEffect(() => {
    const ex = exercises[currentExIndex]
    if (ex?.progressionGoal.includes('(Baseline)') && phase === 'active') {
      weightInputRef.current?.focus()
      weightInputRef.current?.select()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExIndex])

  useEffect(() => {
    setShowWhy(false)
  }, [currentExIndex])

  useEffect(() => {
    setCommitError(null)
  }, [currentExIndex, currentSetInEx])


  const currentEx      = exercises[currentExIndex]
  const displaySetNum  = currentSetInEx + 1
  const timerProgress = restSeconds > 0 ? Math.max(0, Math.min(1, restSecondsLeft / restSeconds)) : 0

  function formatRestTime(seconds: number): string {
    const clamped = Math.max(0, Math.floor(seconds))
    const minutes = Math.floor(clamped / 60)
    const secs    = clamped % 60
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  function addRestSeconds(deltaSeconds: number): void {
    setRestSecondsLeft((prev) => Math.max(0, prev + deltaSeconds))
  }

  async function persistDraft(nextState: {
    currentExIndex: number
    currentSetInEx: number
    weight: number
    reps: number
    phase: Phase
    restSecondsLeft: number
    completedSets: CompletedSet[]
  }): Promise<void> {
    try {
      const validatedDraft = parseTempSessionDraft({
        id: TEMP_SESSION_ID,
        routineType: plan.routineType,
        sessionIndex: plan.sessionIndex,
        estimatedMinutes: plan.estimatedMinutes,
        exercises,
        currentExIndex: nextState.currentExIndex,
        currentSetInEx: nextState.currentSetInEx,
        weight: nextState.weight,
        reps: nextState.reps,
        phase: nextState.phase,
        restSecondsLeft: nextState.restSecondsLeft,
        completedSets: nextState.completedSets,
        updatedAt: Date.now(),
      })

      await db.tempSessions.put(validatedDraft)
    } catch (error) {
      if (!isDatabaseClosedError(error)) {
        throw error
      }
    }
  }

  async function handleCompleteSet() {
    try {
      const newSet: CompletedSet = {
        exerciseId: currentEx.exerciseId,
        weight,
        reps,
        orderIndex: completedSets.length,
      }
      const newCompleted = [...completedSets, newSet]

      const isLastSetInEx = currentSetInEx === currentEx.sets - 1
      const isLastEx      = currentExIndex  === exercises.length - 1
      const isFinalSet    = isLastSetInEx && isLastEx

      if (isFinalSet) {
        // PB check before atomic commit — still in the same handler tick.
        await pbService.checkAndUpdate(currentEx.exerciseId, weight, reps)
        // ── Atomic commit ────────────────────────────────────────────────────
        const workoutId = uuidv4()
        await db.workouts.add({
          id: workoutId,
          date: Date.now(),
          routineType: plan.routineType,
          sessionIndex: plan.sessionIndex,
          notes: '',
        })
        await Promise.all(
          newCompleted.map(s =>
            db.sets.add({
              id: uuidv4(),
              workoutId,
              exerciseId: s.exerciseId,
              weight:     s.weight,
              reps:       s.reps,
              orderIndex: s.orderIndex,
            })
          )
        )
        await db.tempSessions.delete(TEMP_SESSION_ID)
        publish({ exerciseId: currentEx.exerciseId, weight, reps, volume: weight * reps, timestamp: Date.now(), source: 'final' })
        setCompletedSets(newCompleted)
        setCompletedWorkoutId(workoutId)
        setShowRecoveryForm(true)
      } else {
        let nextExIndex = currentExIndex
        let nextSetInEx = currentSetInEx + 1
        let nextWeight = weight
        let nextReps = reps

        setCompletedSets(newCompleted)

        if (isLastSetInEx) {
          // Advance to next exercise — reset inputs to plan values
          const nextIdx = currentExIndex + 1
          const nextExercise = exercises[nextIdx]
          nextExIndex = nextIdx
          nextSetInEx = 0
          nextWeight = nextExercise.weight
          nextReps = nextExercise.reps
          setCurrentExIndex(nextIdx)
          setCurrentSetInEx(0)
          setWeight(nextExercise.weight)
          setReps(nextExercise.reps)
        } else {
          // Same exercise, next set — weight/reps cascade by staying unchanged
          setCurrentSetInEx(nextSetInEx)
        }

        setRestSecondsLeft(restSeconds)
        setPhase('resting')

        // PB check and draft persist happen after UI state updates so React
        // re-renders the resting screen immediately without waiting for DB I/O.
        await pbService.checkAndUpdate(currentEx.exerciseId, weight, reps)
        await persistDraft({
          currentExIndex: nextExIndex,
          currentSetInEx: nextSetInEx,
          weight: nextWeight,
          reps: nextReps,
          phase: 'resting',
          restSecondsLeft: restSeconds,
          completedSets: newCompleted,
        })
        publish({ exerciseId: currentEx.exerciseId, weight, reps, volume: weight * reps, timestamp: Date.now(), source: 'mid-session' })
      }
    } catch (error) {
      if (!isDatabaseClosedError(error)) {
        throw error
      }
    }
  }

  async function handleCompleteSetClick() {
    if (isCommitting) return
    setIsCommitting(true)
    setCommitError(null)
    try {
      await handleCompleteSet()
    } catch (error) {
      console.error('Failed to commit set:', error)
      setCommitError('Failed to save set. Please try again.')
    } finally {
      setIsCommitting(false)
    }
  }

  async function handleCancelWorkout(): Promise<void> {
    try {
      if (completedSets.length > 0) {
        const workoutId = uuidv4()
        await db.workouts.add({
          id: workoutId,
          date: Date.now(),
          routineType: plan.routineType,
          sessionIndex: plan.sessionIndex,
          notes: 'Session abandoned early',
        })
        await Promise.all(
          completedSets.map((s) =>
            db.sets.add({
              id: uuidv4(),
              workoutId,
              exerciseId: s.exerciseId,
              weight:     s.weight,
              reps:       s.reps,
              orderIndex: s.orderIndex,
            })
          )
        )
      }
      await db.tempSessions.delete(TEMP_SESSION_ID)
    } catch (error) {
      if (!isDatabaseClosedError(error)) {
        throw error
      }
    }

    if (onCancel) {
      onCancel()
      return
    }

    onDone?.()
  }

  return (
    <>
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-[232px] pt-6"
      style={{
        backgroundColor: 'var(--color-surface-base)',
        color:           'var(--color-text-primary)',
      }}
    >
      <motion.header
        layout
        className="rounded-3xl border p-5"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor:     'var(--color-border-subtle)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
              Active Session · Set {displaySetNum} of {currentEx.sets}
            </p>
            <h2 className="text-display mt-3" style={{ color: 'var(--color-text-primary)' }}>
              {currentEx.exerciseName}
            </h2>
            <p className="text-body mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Exercise {currentExIndex + 1} of {exercises.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWhy(prev => !prev)}
            aria-pressed={showWhy}
            aria-label="Toggle exercise purpose"
            className="text-label mt-3 shrink-0 rounded-full border px-3 py-1 transition-colors"
            style={{
              borderColor:     showWhy ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)',
              backgroundColor: showWhy ? 'var(--color-accent-primary)' : 'transparent',
              color:           showWhy ? 'var(--color-accent-on)'      : 'var(--color-text-secondary)',
            }}
          >
            Why
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showWhy && (
            <motion.div
              key="why-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
              className="mt-4"
            >
              <FunctionalWhy exerciseName={currentEx.exerciseName} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <ul className="flex flex-col gap-2">
        {exercises.map((exercise, index) => {
          const isCurrent = index === currentExIndex
          const exerciseCompletedSets = completedSets.filter((set) => set.exerciseId === exercise.exerciseId)
          const completedSetCount = exerciseCompletedSets.length
          const isDone = completedSetCount >= exercise.sets && !isCurrent
          const lastSet = exerciseCompletedSets[exerciseCompletedSets.length - 1]

          // Ring geometry — viewBox 0 0 40 40, radius 17
          const ringRadius = 17
          const ringCircumference = 2 * Math.PI * ringRadius
          const ringProgress = Math.max(0, Math.min(1, completedSetCount / exercise.sets))
          const ringDashOffset = ringCircumference * (1 - ringProgress)

          const subtitle = isDone
            ? `Complete · ${exercise.sets} sets`
            : `${exercise.weight}kg × ${exercise.reps} · ${isCurrent ? 'Next set' : 'Target'}`

          return (
            <li
              key={exercise.exerciseId}
              className="rounded-2xl border p-3.5 transition-colors"
              style={{
                borderColor:     isCurrent ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)',
                backgroundColor: isCurrent ? 'var(--color-accent-soft)'    : 'var(--color-surface-raised)',
                opacity:         isDone ? 0.55 : 1,
              }}
            >
              <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                {/* Progress ring */}
                <div className="relative" style={{ width: 48, height: 48 }}>
                  <svg
                    width={48}
                    height={48}
                    viewBox="0 0 40 40"
                    role="img"
                    aria-label={`${completedSetCount} of ${exercise.sets} sets complete`}
                  >
                    <circle
                      cx={20}
                      cy={20}
                      r={ringRadius}
                      fill="none"
                      stroke="var(--color-border-subtle)"
                      strokeWidth={3}
                    />
                    <circle
                      cx={20}
                      cy={20}
                      r={ringRadius}
                      fill="none"
                      stroke="var(--color-accent-primary)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringDashOffset}
                      transform="rotate(-90 20 20)"
                      style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      fontVariantNumeric: 'tabular-nums',
                      color: isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {completedSetCount}/{exercise.sets}
                  </span>
                </div>

                {/* Name + subtitle (+ optional last-set caption) */}
                <div className="min-w-0">
                  <p className="text-body" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {exercise.exerciseName}
                  </p>
                  <p className="text-label mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {subtitle}
                  </p>
                  {isCurrent && lastSet && (
                    <p
                      className="text-label mt-1"
                      style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}
                    >
                      Last · {lastSet.weight}kg × {lastSet.reps}
                    </p>
                  )}
                </div>

                {/* Tier icon — shape conveys tier, color conveys state:
                    current = accent, done = muted, upcoming = secondary. */}
                <div
                  style={{
                    color: isCurrent
                      ? 'var(--color-accent-primary)'
                      : isDone
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text-secondary)',
                  }}
                  aria-label={`Tier ${exercise.tier}`}
                >
                  <TierIcon tier={exercise.tier} size={22} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {commitError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-body text-center"
            style={{ color: 'var(--color-utility-danger)' }}
          >
            {commitError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setShowCancelConfirm(true)}
        aria-label="Cancel workout"
        className="text-label h-12 w-full cursor-pointer rounded-2xl border bg-transparent px-5 transition-colors"
        style={{
          borderColor: 'var(--color-border-subtle)',
          color:       'var(--color-text-secondary)',
        }}
      >
        Cancel Workout
      </motion.button>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Abandon this workout?"
        message="Logged sets are kept in history; the session ends."
        confirmLabel="Abandon"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false)
          void handleCancelWorkout()
        }}
      />

      <AnimatePresence>
        {showRecoveryForm && completedWorkoutId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-10"
          >
            <RecoveryLogForm
              workoutId={completedWorkoutId}
              db={db}
              onDone={() => { setShowRecoveryForm(false); onDone?.() }}
              onSkip={() => { setShowRecoveryForm(false); onDone?.() }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>

    {/* ── Sticky bottom dock — flush with screen edge. Swaps between the
         log-set form (active) and the rest timer (resting) so the user never
         has to scroll to see the countdown. ──────────────────────────────── */}
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div
        className="pointer-events-auto w-full max-w-[430px] border-t border-x"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor:     'var(--color-border-subtle)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow:       '0 -18px 40px -14px rgba(0,0,0,0.55)',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        {phase === 'resting' ? (
          <motion.div
            key="rest-dock"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
                Rest
              </span>
              <span
                className="text-label truncate pl-3"
                style={{ color: 'var(--color-text-muted)', maxWidth: '60%' }}
              >
                {currentEx.exerciseName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Compact progress ring with the countdown inside */}
              <div
                className="relative shrink-0"
                style={{ width: 76, height: 76, color: 'var(--color-accent-primary)' }}
              >
                <svg
                  width="76"
                  height="76"
                  viewBox="0 0 76 76"
                  role="img"
                  aria-label="Rest timer"
                >
                  <circle
                    cx="38"
                    cy="38"
                    r="32"
                    fill="none"
                    stroke="var(--color-border-subtle)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="38"
                    cy="38"
                    r="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - timerProgress)}
                    transform="rotate(-90 38 38)"
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(48,209,88,0.45))',
                      transition: 'stroke-dashoffset 0.4s linear',
                    }}
                  />
                </svg>
                <span
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {formatRestTime(restSecondsLeft)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-1 flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setPhase('active')}
                  className="text-body flex h-[44px] w-full items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color:           'var(--color-accent-on)',
                    fontWeight:      700,
                    letterSpacing:   '-0.01em',
                  }}
                >
                  Start Next Set
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => addRestSeconds(15)}
                  className="text-label flex h-9 w-full items-center justify-center rounded-2xl border"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor:     'var(--color-border-subtle)',
                    color:           'var(--color-text-secondary)',
                    fontWeight:      600,
                  }}
                >
                  + 15s
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="log-dock"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
                Log Set {displaySetNum}
              </span>
              <span
                className="text-label truncate pl-3"
                style={{ color: 'var(--color-text-muted)', maxWidth: '60%' }}
              >
                {currentEx.exerciseName}
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <label
                className="flex flex-col gap-1 rounded-2xl border px-3.5 py-2.5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  borderColor:     'var(--color-border-subtle)',
                }}
              >
                <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                  Weight
                </span>
                <div className="flex items-baseline gap-1.5">
                  <input
                    ref={weightInputRef}
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={e => {
                      const newWeight = Number(e.target.value)
                      setWeight(newWeight)
                      void persistDraft({ currentExIndex, currentSetInEx, weight: newWeight, reps, phase, restSecondsLeft, completedSets })
                    }}
                    className="no-spinner w-full bg-transparent focus:outline-none"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                  <span className="text-label shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    kg
                  </span>
                </div>
              </label>
              <label
                className="flex flex-col gap-1 rounded-2xl border px-3.5 py-2.5"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  borderColor:     'var(--color-border-subtle)',
                }}
              >
                <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                  Reps
                </span>
                <div className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={reps}
                    onChange={e => {
                      const newReps = Number(e.target.value)
                      setReps(newReps)
                      void persistDraft({ currentExIndex, currentSetInEx, weight, reps: newReps, phase, restSecondsLeft, completedSets })
                    }}
                    className="no-spinner w-full bg-transparent focus:outline-none"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--color-text-primary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>
              </label>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleCompleteSetClick}
              disabled={isCommitting}
              className="text-body flex h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color:           'var(--color-accent-on)',
                fontWeight:      700,
                letterSpacing:   '-0.01em',
              }}
            >
              {isCommitting ? 'Logging…' : 'Complete Set'}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}
