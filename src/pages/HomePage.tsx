import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import ActiveLogger from '../components/ActiveLogger'
import ThinkingTerminal from '../components/ThinkingTerminal'
import DraftBlueprintReview from '../components/DraftBlueprintReview'
import IdentitySplash from '../components/IdentitySplash'
import OnboardingHero from '../components/OnboardingHero'
import { db as defaultDb } from '../db/db'
import { ensureIronExerciseLibrary } from '../db/seedExercises'
import {
  APP_SETTINGS_ID,
  TEMP_SESSION_ID,
  type AppSettings,
  type IronProtocolDB,
  type TempSession,
} from '../db/schema'
import {
  generateWorkout,
  getRoutineSessionLabel,
  ROUTINE_OPTIONS,
  type CanonicalRoutineType,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'

interface Props {
  db?: IronProtocolDB
}

type OnboardingTourStep = 0 | 1 | 2

interface OnboardingFlowState {
  tourStarted: boolean
  step: OnboardingTourStep
}

interface ActivitySnapshot {
  workoutCount: number
  setCount: number
}

const INITIAL_ONBOARDING_FLOW: OnboardingFlowState = {
  tourStarted: false,
  step: 0,
}

function getPlanSignature(plan: PlannedWorkout | null): string {
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

function buildPlanFromDraft(draft: TempSession): PlannedWorkout {
  return {
    exercises: draft.exercises,
    estimatedMinutes: draft.estimatedMinutes,
    routineType: draft.routineType,
    sessionIndex: draft.sessionIndex,
  }
}

export default function HomePage({ db = defaultDb }: Props) {
  const [routineType, setRoutineType] = useState<CanonicalRoutineType>('PPL')
  const [trainingGoal, setTrainingGoal] = useState<'Hypertrophy' | 'Power'>('Hypertrophy')
  const [timeAvailable, setTimeAvailable] = useState(45)
  const [plannerRefreshTick, setPlannerRefreshTick] = useState(0)
  const [hasHydratedRoutine, setHasHydratedRoutine] = useState(false)
  const [plan, setPlan] = useState<PlannedWorkout | null>(null)
  const [fullPlan, setFullPlan] = useState<PlannedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  type SessionPhase = 'idle' | 'thinking' | 'review' | 'logging'
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
  
  const [activePlan, setActivePlan] = useState<PlannedWorkout | null>(null)
  const [activeDraft, setActiveDraft] = useState<TempSession | null>(null)
  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingFlowState>(INITIAL_ONBOARDING_FLOW)

  const deferredTimeAvailable = useDeferredValue(timeAvailable)

  const onboardingRecord = useLiveQuery<AppSettings | null>(
    async () => (await db.settings.get(APP_SETTINGS_ID)) ?? null,
    [db],
  )

  const rawTempSession = useLiveQuery<TempSession | null>(
    async () => (await db.tempSessions.get(TEMP_SESSION_ID)) ?? null,
    [db],
  )

  const tempSession = useMemo<TempSession | null>(() => {
    if (!rawTempSession) {
      return null
    }

    try {
      return parseTempSessionDraft(rawTempSession)
    } catch {
      return null
    }
  }, [rawTempSession])

  const activitySnapshot = useLiveQuery<ActivitySnapshot>(
    async () => {
      const [workoutCount, setCount] = await Promise.all([
        db.workouts.where('routineType').equals(routineType).count(),
        db.sets.count(),
      ])
      return {
        workoutCount,
        setCount,
      }
    },
    [db, routineType],
  )

  const safeActivitySnapshot = activitySnapshot ?? { workoutCount: 0, setCount: 0 }

  useEffect(() => {
    if (onboardingRecord === null) {
      void db.settings.put({
        id: APP_SETTINGS_ID,
        hasCompletedOnboarding: false,
        preferredRoutineType: 'PPL',
        daysPerWeek: 3,
      })
    }
  }, [db, onboardingRecord])

  useEffect(() => {
    if (hasHydratedRoutine || onboardingRecord === undefined || onboardingRecord === null) {
      return
    }

    const persistedRoutine = ROUTINE_OPTIONS.find((option) => option.type === onboardingRecord.preferredRoutineType)
    if (persistedRoutine) {
      setRoutineType(persistedRoutine.type)
    }
    setHasHydratedRoutine(true)
  }, [hasHydratedRoutine, onboardingRecord])

  useEffect(() => {
    if (rawTempSession && tempSession === null) {
      void db.tempSessions.delete(TEMP_SESSION_ID)
    }
  }, [db, rawTempSession, tempSession])

  const activitySignal = useMemo(
    () => `${safeActivitySnapshot.workoutCount}:${safeActivitySnapshot.setCount}`,
    [safeActivitySnapshot.setCount, safeActivitySnapshot.workoutCount],
  )

  const plannerInputs = useMemo(() => ({
    db,
    routineType,
    trainingGoal,
    timeAvailable: deferredTimeAvailable,
  }), [db, routineType, trainingGoal, deferredTimeAvailable])

  useEffect(() => {
    let cancelled = false

    async function refreshPlan() {
      setLoading(true)
      setError(null)

      try {
        const [nextPlan, nextFullPlan] = await Promise.all([
          generateWorkout(plannerInputs),
          generateWorkout({
            ...plannerInputs,
            timeAvailable: Math.max(40, plannerInputs.timeAvailable),
          }),
        ])

        if (cancelled) {
          return
        }

        const nextPlanSignature = getPlanSignature(nextPlan)
        const nextFullPlanSignature = getPlanSignature(nextFullPlan)

        setPlan((current) => (
          getPlanSignature(current) === nextPlanSignature
            ? current
            : nextPlan
        ))

        setFullPlan((current) => (
          getPlanSignature(current) === nextFullPlanSignature
            ? current
            : nextFullPlan
        ))
      } catch (unknownError) {
        if (!cancelled) {
          setError(
            unknownError instanceof Error
              ? unknownError.message
              : 'Planner failed. Please verify your routine data.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void refreshPlan()

    return () => {
      cancelled = true
    }
  }, [plannerInputs, activitySignal, plannerRefreshTick])

  const selectedRoutine = ROUTINE_OPTIONS.find((option) => option.type === routineType)
  const cycleLength = selectedRoutine?.cycleLength ?? 1
  const detectedSessionIndex = plan?.sessionIndex ?? 0
  const hasCompletedOnboarding: boolean = onboardingRecord?.hasCompletedOnboarding === true
  const onboardingActive = !hasCompletedOnboarding
  const routineSetupRequired = Boolean(plan && plan.routineType.trim().length === 0)

  const progressionPreview = useMemo(() => {
    const leadExercise = plan?.exercises[0]
    if (!leadExercise) {
      return 'Syncing progression target...'
    }
    return `${leadExercise.exerciseName}: ${leadExercise.progressionGoal}`
  }, [plan])

  const sessionLabel = useMemo(() => {
    if (!plan || routineSetupRequired) {
      return routineSetupRequired ? 'Setup Required' : 'Loading Session'
    }

    try {
      return getRoutineSessionLabel(plan.routineType, plan.sessionIndex)
    } catch {
      return 'Setup Required'
    }
  }, [plan, routineSetupRequired])

  const trimmedExercises = useMemo(() => {
    if (!plan || !fullPlan) {
      return []
    }

    const includedIds = new Set(plan.exercises.map((exercise) => exercise.exerciseId))
    return fullPlan.exercises.filter((exercise) => !includedIds.has(exercise.exerciseId))
  }, [plan, fullPlan])

  async function handleFinishSetup(): Promise<void> {
    // update (partial) preserves userName; put would risk clobbering it if
    // onboardingRecord is stale or undefined at call time.
    await db.settings.update(APP_SETTINGS_ID, {
      hasCompletedOnboarding: true,
      preferredRoutineType: routineType,
      daysPerWeek: onboardingRecord?.daysPerWeek ?? 3,
    })
    setOnboardingFlow(INITIAL_ONBOARDING_FLOW)
  }

  async function handleInitializeEngine(selectedRoutineType: CanonicalRoutineType): Promise<void> {
    try {
      setRoutineType(selectedRoutineType)
      setHasHydratedRoutine(true)
      await ensureIronExerciseLibrary(db)
      // update (partial) preserves userName regardless of React state staleness.
      await db.settings.update(APP_SETTINGS_ID, {
        hasCompletedOnboarding: false,
        preferredRoutineType: selectedRoutineType,
        daysPerWeek: onboardingRecord?.daysPerWeek ?? 3,
      })
      setOnboardingFlow({
        tourStarted: true,
        step: 0,
      })
      setPlannerRefreshTick((current) => current + 1)
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : 'Failed to initialize routine engine.',
      )
    }
  }

  function handleTourNext(): void {
    setOnboardingFlow((current) => {
      const nextStep = Math.min(current.step + 1, 2) as OnboardingTourStep
      return {
        ...current,
        step: nextStep,
      }
    })
  }

  function handleRoutineSelect(nextRoutineType: CanonicalRoutineType): void {
    setRoutineType(nextRoutineType)
    setHasHydratedRoutine(true)
  }

  function openLoggerWithPlan(nextPlan: PlannedWorkout, nextDraft: TempSession | null): void {
    if (nextDraft !== null) {
      setActivePlan(nextPlan)
      setActiveDraft(nextDraft)
      setSessionPhase('logging')
      return
    }

    setActivePlan(nextPlan)
    setActiveDraft(nextDraft)
    setSessionPhase('thinking')
  }

  async function handleDiscardDraft(): Promise<void> {
    await db.tempSessions.delete(TEMP_SESSION_ID)
    setSessionPhase('idle')
    setActivePlan(null)
    setActiveDraft(null)
    setPlannerRefreshTick((current) => current + 1)
  }

  const loggerPlan = activePlan ?? plan

  // ── Thinking phase ─────────────────────────────────────────────────────────
  if (sessionPhase === 'thinking' && loggerPlan) {
    return (
      <ThinkingTerminal
        plan={loggerPlan}
        onComplete={() => {
          setSessionPhase('review')
        }}
      />
    )
  }

  // ── Review phase ───────────────────────────────────────────────────────────
  if (sessionPhase === 'review' && loggerPlan) {
    return (
      <DraftBlueprintReview
        plan={loggerPlan}
        db={db}
        onConfirm={() => {
          setSessionPhase('logging')
        }}
        onCancel={() => {
          setSessionPhase('idle')
          setActivePlan(null)
        }}
        onUpdatePlan={(updatedPlan) => {
          setActivePlan(updatedPlan)
        }}
      />
    )
  }

  // ── Logging phase ──────────────────────────────────────────────────────────
  if (sessionPhase === 'logging' && loggerPlan) {
    return (
      <ActiveLogger
        plan={loggerPlan}
        db={db}
        initialDraft={activeDraft}
        onDone={() => {
          setSessionPhase('idle')
          setActivePlan(null)
          setActiveDraft(null)
        }}
        onCancel={() => {
          void handleDiscardDraft()
        }}
      />
    )
  }

  if (tempSession) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-5 text-zinc-100">
        <div className="rounded-3xl bg-gradient-to-br from-[#ec4899]/15 to-[#3B71FE]/15 p-[1px]">
          <motion.section
            whileTap={{ scale: 0.95 }}
            className="rounded-3xl bg-[#0D1626] p-5 shadow-[0_16px_34px_-22px_rgba(59,113,254,0.5)]"
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#3B71FE]">Recovery Draft</p>
            <h1 className="mt-3 text-3xl font-black text-zinc-100">Resume Active Workout</h1>
            <p className="mt-2 text-sm font-semibold text-zinc-200">
              A temporary session was found. Resume first to prevent data loss.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                openLoggerWithPlan(buildPlanFromDraft(tempSession), tempSession)
              }}
              className="mt-5 h-14 w-full cursor-pointer rounded-3xl bg-[#3B71FE] px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-[#5585ff] active:bg-[#2860ee]"
            >
              Resume Active Workout
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                void handleDiscardDraft()
              }}
              className="mt-3 h-12 w-full cursor-pointer rounded-3xl border border-[#3B71FE]/20 bg-transparent px-6 text-sm font-bold uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:border-[#3B71FE]/40 hover:bg-[#3B71FE]/5 hover:text-zinc-100 active:bg-[#3B71FE]/10"
            >
              Discard Draft
            </motion.button>
          </motion.section>
        </div>
      </main>
    )
  }

  // ── Identity gate: show splash if no userName yet ──────────────────────────
  if (onboardingRecord !== undefined && !onboardingRecord?.userName) {
    return <IdentitySplash db={db} />
  }

  if (onboardingActive) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-5 text-zinc-100">
        <motion.section
          key="onboarding-hero"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <OnboardingHero
            selectedRoutine={routineType}
            sessionLabel={sessionLabel}
            cycleLength={cycleLength}
            sessionIndex={detectedSessionIndex}
            timeAvailable={timeAvailable}
            progressionPreview={progressionPreview}
            isTourStarted={onboardingFlow.tourStarted}
            tourStep={onboardingFlow.step}
            onSelectRoutine={handleRoutineSelect}
            onTimeAvailableChange={setTimeAvailable}
            onInitialize={(selectedRoutineType) => {
              void handleInitializeEngine(selectedRoutineType)
            }}
            onTourNext={handleTourNext}
            onTourFinish={() => {
              void handleFinishSetup()
            }}
          />
        </motion.section>

        {error && (
          <p className="rounded-2xl border border-red-500/40 bg-red-900/20 p-3 text-sm font-semibold text-red-300">{error}</p>
        )}
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-5 text-zinc-100">
      {/* ── Session Blueprint ─────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-[#ec4899]/15 to-[#3B71FE]/15 p-[1px]">
        <motion.section
          key="dashboard-blueprint"
          initial={{ opacity: 0, scale: 0.92, y: 14, transformOrigin: '50% 88%' }}
          animate={{ opacity: 1, scale: 1, y: 0, transformOrigin: '50% 88%' }}
          exit={{ opacity: 0, scale: 0.98, y: -6 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-3xl bg-[#0D1626] p-5 shadow-[0_16px_30px_-20px_rgba(59,113,254,0.35)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Session Blueprint</p>
            <span className="rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-3 py-2 text-xs font-black text-zinc-100">
              Workout Day {detectedSessionIndex + 1} of {cycleLength}
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-50">{sessionLabel}</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-300">Est. {Math.round(plan?.estimatedMinutes ?? 0)} min</p>

          <ul className="mt-4 flex flex-col gap-2">
            {plan?.exercises.map((exercise) => (
              <motion.li
                layout="position"
                key={exercise.exerciseId}
                className="flex items-center justify-between rounded-2xl border border-[#3B71FE]/15 bg-[#091020] px-3 py-3"
              >
                <div>
                  <p className="text-base font-black text-zinc-100">{exercise.exerciseName}</p>
                  <p className="text-xs text-zinc-400">{exercise.sets} sets × {exercise.reps} reps</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#3B71FE]/30 px-2 py-1 text-xs font-bold text-zinc-200">T{exercise.tier}</span>
                  <span className="text-lg font-black text-[#3B71FE]">{exercise.weight} kg</span>
                </div>
              </motion.li>
            ))}
          </ul>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              if (plan) {
                openLoggerWithPlan(plan, null)
              }
            }}
            disabled={!plan || loading || routineSetupRequired}
            className="mt-5 h-16 w-full cursor-pointer rounded-3xl bg-[#3B71FE] px-6 text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.55)] transition-all hover:bg-[#5585ff] active:scale-[0.98] active:bg-[#2860ee] disabled:cursor-not-allowed disabled:bg-[#3B71FE]/20 disabled:text-zinc-600 disabled:shadow-none"
          >
            {routineSetupRequired ? 'Choose Routine to Continue' : (loading ? 'Syncing Session...' : 'Start Recommended Session')}
          </motion.button>
          {error && (
            <p className="mt-3 text-sm font-semibold text-red-300">{error}</p>
          )}
        </motion.section>
      </div>

      {routineSetupRequired && (
        <motion.section
          whileTap={{ scale: 0.95 }}
          className="rounded-3xl border border-[#3B71FE]/40 bg-[#0f1f44] p-4 shadow-[0_10px_24px_-16px_rgba(59,113,254,0.5)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3B71FE]">Setup Required</p>
          <p className="mt-2 text-sm font-semibold text-zinc-100">
            A routine must be selected before planning can continue.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              const defaultRoutine = ROUTINE_OPTIONS[0]
              if (defaultRoutine) {
                handleRoutineSelect(defaultRoutine.type)
              }
            }}
            className="mt-4 h-12 w-full cursor-pointer rounded-2xl bg-[#3B71FE] px-4 text-sm font-black text-white transition-colors hover:bg-[#5585ff] active:bg-[#2860ee]"
          >
            Choose Routine
          </motion.button>
        </motion.section>
      )}

      {/* ── Training Goal ─────────────────────────────────────────────────── */}
      <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Training Goal</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['Hypertrophy', 'Power'] as const).map((goal) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={goal}
              type="button"
              onClick={() => setTrainingGoal(goal)}
              className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                trainingGoal === goal
                  ? 'border-[#3B71FE] bg-[#3B71FE]/15 text-[#3B71FE] active:bg-[#3B71FE]/20'
                  : 'border-[#3B71FE]/15 bg-[#091020] text-zinc-300 hover:border-[#3B71FE]/30 active:bg-[#091020]'
              }`}
            >
              {goal}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── QoS Governor ──────────────────────────────────────────────────── */}
      <motion.section whileTap={{ scale: 0.95 }} className="min-h-[208px] rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="time-available" className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">
            Time Available
          </label>
          <span className="text-sm font-black text-[#3B71FE]">{timeAvailable} min</span>
        </div>
        <div className="mt-4">
          <input
            id="time-available"
            type="range"
            min={15}
            max={120}
            step={5}
            value={timeAvailable}
            onChange={(event) => setTimeAvailable(Number(event.target.value))}
            className="w-full cursor-pointer appearance-none"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-[#3B71FE]/15 bg-[#091020] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400/50">QoS Preview</p>
          {trimmedExercises.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-300">No exercises trimmed at this time window.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {trimmedExercises.map((exercise) => (
                <li key={exercise.exerciseId} className="flex items-center justify-between rounded-xl border border-[#3B71FE]/15 px-3 py-2">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{exercise.exerciseName}</p>
                    <p className="text-xs font-bold text-zinc-300">{exercise.progressionGoal}</p>
                  </div>
                  <span className="rounded-full border border-[#3B71FE]/30 px-2 py-1 text-xs font-bold text-zinc-200">
                    T{exercise.tier}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>
    </main>
  )
}
