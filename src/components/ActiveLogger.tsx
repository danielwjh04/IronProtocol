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
import { scoreForGoal } from '../data/goalAccessories'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'
import { PersonalBestsService } from '../services/personalBestsService'
import { publish } from '../events/setCommitEvents'
import FunctionalWhy from './FunctionalWhy'
import RecoveryLogForm from './RecoveryLogForm'
import ConfirmDialog from './UI/ConfirmDialog'

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

export default function ActiveLogger({ plan, db, initialDraft, parsedGoal, onDone, onCancel }: Props) {
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
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({})

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
  const timerRadius = 44
  const timerCircumference = 2 * Math.PI * timerRadius
  const timerProgress = restSecondsLeft / restSeconds
  const timerOffset = timerCircumference * (1 - timerProgress)

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
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-6"
      style={{
        backgroundColor: 'var(--color-surface-base)',
        color:           'var(--color-text-primary)',
      }}
    >
      <motion.header
        layout
        whileTap={{ scale: 0.98 }}
        className="rounded-3xl border p-5"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor:     'var(--color-border-subtle)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>Active Session</p>
            <div className="mt-3 flex items-center gap-2">
              <h2 className="text-display" style={{ color: 'var(--color-text-primary)' }}>
                {currentEx.exerciseName}
              </h2>
              {scoreForGoal(currentEx, parsedGoal) > 0 && (
                <span
                  className="text-label rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: 'var(--color-accent-primary)',
                    color: 'var(--color-accent-on)',
                  }}
                >
                  GOAL
                </span>
              )}
            </div>
            <p className="text-body mt-2" style={{ color: 'var(--color-text-secondary)' }}>
              Set {displaySetNum} of {currentEx.sets}
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
            WHY
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

      <motion.section
        layout
        whileTap={{ scale: 0.98 }}
        className="rounded-3xl border p-4"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor:     'var(--color-border-subtle)',
        }}
      >
        <ul className="flex flex-col gap-3">
          {exercises.map((exercise, index) => {
            const isCurrent = index === currentExIndex
            const exerciseCompletedSets = completedSets.filter((set) => set.exerciseId === exercise.exerciseId)
            const completedSetCount = exerciseCompletedSets.length
            const remainingSetCount = Math.max(exercise.sets - completedSetCount, 0)
            const nextSetNumber = Math.min(completedSetCount + 1, exercise.sets)
            const subtitle = remainingSetCount > 0
              ? `Set ${nextSetNumber}/${exercise.sets} · ${exercise.weight}kg × ${exercise.reps}`
              : `Complete · ${exercise.sets} sets`

            const isExpanded = Boolean(expandedExercises[exercise.exerciseId])
            const hasCompletedSets = exerciseCompletedSets.length > 0

            return (
              <li
                key={exercise.exerciseId}
                className="rounded-2xl border p-3"
                style={{
                  borderColor:     isCurrent ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)',
                  backgroundColor: isCurrent ? 'var(--color-accent-soft)'    : 'var(--color-surface-base)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-body font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {exercise.exerciseName}
                      </p>
                      {scoreForGoal(exercise, parsedGoal) > 0 && (
                        <span
                          className="text-label rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor: 'var(--color-accent-primary)',
                            color: 'var(--color-accent-on)',
                          }}
                        >
                          GOAL
                        </span>
                      )}
                    </div>
                    <p className="text-label mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {subtitle}
                    </p>
                  </div>
                  <span
                    className="text-label rounded-full border px-2 py-1"
                    style={{
                      borderColor: 'var(--color-border-subtle)',
                      color:       'var(--color-text-secondary)',
                    }}
                  >
                    T{exercise.tier}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {hasCompletedSets && isExpanded && (
                    <motion.div
                      key="completed-sets"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exerciseCompletedSets.map((set, completedIndex) => (
                          <span
                            key={set.orderIndex}
                            className="text-label rounded-full border px-3 py-1"
                            style={{
                              borderColor:     'var(--color-accent-primary)',
                              backgroundColor: 'var(--color-accent-soft)',
                              color:           'var(--color-accent-primary)',
                            }}
                          >
                            S{completedIndex + 1}: {set.weight}kg × {set.reps}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasCompletedSets && (
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="text-label"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {completedSetCount} logged
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() =>
                        setExpandedExercises((prev) => ({
                          ...prev,
                          [exercise.exerciseId]: !prev[exercise.exerciseId],
                        }))
                      }
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide completed sets' : 'Show completed sets'}
                      className="flex h-8 w-8 items-center justify-center rounded-full border"
                      style={{
                        borderColor: isExpanded
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-border-subtle)',
                        color: isExpanded
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-text-secondary)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <motion.svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      >
                        <polyline points="3 5 7 9 11 5" />
                      </motion.svg>
                    </motion.button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </motion.section>

      {phase === 'resting' && (
        <motion.section
          whileTap={{ scale: 0.98 }}
          className="rounded-3xl border p-5"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderColor:     'var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center justify-center" style={{ color: 'var(--color-accent-primary)' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Rest timer">
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="var(--color-border-subtle)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerOffset}
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="64"
                textAnchor="middle"
                fontSize="26"
                fontWeight="800"
                fill="var(--color-text-primary)"
              >
                {restSecondsLeft}s
              </text>
            </svg>
          </div>
          <p className="text-body mt-3 text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Recover now. Set {displaySetNum} begins at zero.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setPhase('active')}
            className="text-body mt-4 h-12 w-full cursor-pointer rounded-2xl font-bold"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color:           'var(--color-accent-on)',
            }}
          >
            Start Next Set →
          </motion.button>
        </motion.section>
      )}

      <motion.section
        layout
        whileTap={{ scale: 0.98 }}
        className="rounded-3xl border p-4"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor:     'var(--color-border-subtle)',
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-label" style={{ color: 'var(--color-accent-primary)' }}>Weight (kg)</span>
            <input
              ref={weightInputRef}
              type="number"
              value={weight}
              onChange={e => {
                const newWeight = Number(e.target.value)
                setWeight(newWeight)
                void persistDraft({ currentExIndex, currentSetInEx, weight: newWeight, reps, phase, restSecondsLeft, completedSets })
              }}
              className="text-body w-full rounded-2xl border px-4 py-3 text-center focus:outline-none"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                borderColor:     'var(--color-border-subtle)',
                color:           'var(--color-text-primary)',
                fontWeight:      700,
              }}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-label" style={{ color: 'var(--color-accent-primary)' }}>Reps</span>
            <input
              type="number"
              value={reps}
              onChange={e => {
                const newReps = Number(e.target.value)
                setReps(newReps)
                void persistDraft({ currentExIndex, currentSetInEx, weight, reps: newReps, phase, restSecondsLeft, completedSets })
              }}
              className="text-body w-full rounded-2xl border px-4 py-3 text-center focus:outline-none"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                borderColor:     'var(--color-border-subtle)',
                color:           'var(--color-text-primary)',
                fontWeight:      700,
              }}
            />
          </label>
        </div>
      </motion.section>

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={handleCompleteSetClick}
        disabled={phase === 'resting' || isCommitting}
        className="text-body h-14 w-full cursor-pointer rounded-2xl disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-accent-primary)',
          color:           'var(--color-accent-on)',
          fontWeight:      700,
        }}
      >
        {isCommitting ? 'Logging…' : 'Complete Set'}
      </motion.button>
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
  )
}
