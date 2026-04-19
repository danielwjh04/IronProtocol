import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { PlannedWorkout, PlannedExercise } from '../planner/autoPlanner'
import {
  TEMP_SESSION_ID,
  type ExerciseTier,
  type IronProtocolDB,
  type TempSessionCompletedSet,
  type TempSession,
} from '../db/schema'
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

function tierIntensityClass(tier: ExerciseTier): string {
  if (tier === 1) {
    return 'text-2xl'
  }
  if (tier === 2) {
    return 'text-xl'
  }
  return 'text-lg'
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
    setCommitError(null)
    try {
      await handleCompleteSet()
    } catch (error) {
      console.error('Failed to commit set:', error)
      setCommitError('Failed to save set. Please try again.')
    }
  }

  async function handleCancelWorkout(): Promise<void> {
    try {
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
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-6 text-zinc-100">
      <motion.header layout whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/20 bg-[#0D1626] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Active Session</p>
            <div className="mt-3 flex items-center gap-2">
              <h2 className={`${tierIntensityClass(currentEx.tier)} font-black text-white`}>
                {currentEx.exerciseName}
              </h2>
            </div>
            <p className="mt-2 text-sm text-zinc-300">Set {displaySetNum} of {currentEx.sets}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowWhy(prev => !prev)}
            aria-pressed={showWhy}
            aria-label="Toggle exercise purpose"
            className={`mt-3 shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
              showWhy
                ? 'border-zinc-50 bg-zinc-50 text-[#0A0E1A]'
                : 'border-[#3B71FE]/40 bg-transparent text-blue-400/80 hover:border-[#3B71FE]/70 hover:text-blue-400'
            }`}
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

      <motion.section layout whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <ul className="flex flex-col gap-3">
          {exercises.map((exercise, index) => {
            const isCurrent = index === currentExIndex
            const exerciseCompletedSets = completedSets.filter((set) => set.exerciseId === exercise.exerciseId)
            const completedSetCount = exerciseCompletedSets.length
            const remainingSetCount = Math.max(exercise.sets - completedSetCount, 0)
            const nextSetNumber = Math.min(completedSetCount + 1, exercise.sets)
            const nextSetGuidance = remainingSetCount > 0
              ? `Next: Set ${nextSetNumber} of ${exercise.sets} (${remainingSetCount} left)`
              : `Goal sets complete (${exercise.sets}/${exercise.sets})`

            return (
              <li
                key={exercise.exerciseId}
                className={`rounded-2xl border p-3 ${
                  isCurrent
                    ? 'border-[#3B71FE] bg-[#3B71FE]/10'
                    : 'border-[#3B71FE]/15 bg-[#091020]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`${tierIntensityClass(exercise.tier)} font-black text-zinc-100`}>{exercise.exerciseName}</p>
                    <p className="relative mt-1 text-xs font-bold text-zinc-300">
                      {exercise.progressionGoal} · {nextSetGuidance}
                    </p>

                    {exerciseCompletedSets.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {exerciseCompletedSets.map((set, completedIndex) => (
                          <span
                            key={set.orderIndex}
                            className="rounded-full border border-[#3B71FE]/30 bg-[#3B71FE]/10 px-3 py-1 text-[11px] font-black text-white"
                          >
                            S{completedIndex + 1}: {set.weight}kg × {set.reps}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="rounded-full border border-[#3B71FE]/30 px-2 py-1 text-xs font-bold text-zinc-200">
                    T{exercise.tier}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </motion.section>

      {phase === 'resting' && (
        <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/20 bg-[#0D1626] p-5">
          <div className="flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Rest timer">
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="rgba(59,113,254,0.15)"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={timerRadius}
                fill="none"
                stroke="#3B71FE"
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
                fill="#fafafa"
              >
                {restSecondsLeft}s
              </text>
            </svg>
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-zinc-300">
            Recover now. Set {displaySetNum} begins at zero.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setPhase('active')}
            className="mt-4 h-12 w-full cursor-pointer rounded-3xl bg-[#3B71FE] px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_6px_18px_-6px_rgba(59,113,254,0.55)] transition-colors hover:bg-[#5585ff] active:bg-[#2860ee]"
          >
            Start Next Set →
          </motion.button>
        </motion.section>
      )}

      <motion.section layout whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/70">Weight (kg)</span>
            <input
              ref={weightInputRef}
              type="number"
              value={weight}
              onChange={e => {
                const newWeight = Number(e.target.value)
                setWeight(newWeight)
                void persistDraft({ currentExIndex, currentSetInEx, weight: newWeight, reps, phase, restSecondsLeft, completedSets })
              }}
              className="w-full rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-4 py-3 text-center text-2xl font-black text-white focus:border-[#3B71FE] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/70">Reps</span>
            <input
              type="number"
              value={reps}
              onChange={e => {
                const newReps = Number(e.target.value)
                setReps(newReps)
                void persistDraft({ currentExIndex, currentSetInEx, weight, reps: newReps, phase, restSecondsLeft, completedSets })
              }}
              className="w-full rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-4 py-3 text-center text-2xl font-black text-white focus:border-[#3B71FE] focus:outline-none"
            />
          </label>
        </div>
      </motion.section>

      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handleCompleteSetClick}
        disabled={phase === 'resting'}
        className={`h-16 w-full cursor-pointer rounded-3xl px-6 text-xl font-black text-white transition-colors ${
          phase === 'resting'
            ? 'cursor-not-allowed bg-[#3B71FE]/15 text-zinc-500'
            : 'bg-[#3B71FE] shadow-[0_8px_24px_-8px_rgba(59,113,254,0.55)] hover:bg-[#5585ff] active:bg-[#2860ee]'
        }`}
      >
        Complete Set
      </motion.button>
      <AnimatePresence>
        {commitError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-semibold text-red-400"
          >
            {commitError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setShowCancelConfirm(true)}
        className="h-12 w-full cursor-pointer rounded-3xl border border-[#3B71FE]/20 bg-transparent px-5 text-sm font-bold uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:border-[#3B71FE]/40 hover:bg-[#3B71FE]/5 hover:text-zinc-100 active:bg-[#3B71FE]/10"
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
