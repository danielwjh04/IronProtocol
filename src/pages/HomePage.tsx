import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import ActiveLogger from '../components/ActiveLogger'
import WorkoutIgnition from '../components/WorkoutIgnition'
import DraftBlueprintReview from '../components/DraftBlueprintReview'
import IdentitySplash from '../components/IdentitySplash'
import SessionBlueprint from '../components/SessionBlueprint'
import { db as defaultDb } from '../db/db'
import {
  APP_SETTINGS_ID,
  TEMP_SESSION_ID,
  type AppSettings,
  type IronProtocolDB,
  type TempSession,
} from '../db/schema'
import {
  calcEstimatedMinutes,
  generateWorkout,
  getRoutineSessionLabel,
  ROUTINE_OPTIONS,
  type CanonicalRoutineType,
  type PlannedExercise,
  type PlannedWorkout,
} from '../planner/autoPlanner'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from '../services/macrocyclePersistence'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'

interface Props {
  db?: IronProtocolDB
}

interface ActivitySnapshot {
  workoutCount: number
  setCount: number
}

interface HydratedScheduledWorkout {
  plan: PlannedWorkout
  dayLabel: string
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

function cloneExercises(exercises: readonly PlannedExercise[]): PlannedExercise[] {
  return exercises.map((exercise) => ({ ...exercise }))
}

function clonePlan(sourcePlan: PlannedWorkout): PlannedWorkout {
  return {
    ...sourcePlan,
    exercises: cloneExercises(sourcePlan.exercises),
  }
}

function isMacrocycleScheduledWorkout(notes: string): boolean {
  return notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX)
}

function resolveScheduledDayLabel(notes: string, routineType: string, sessionIndex: number): string {
  if (isMacrocycleScheduledWorkout(notes)) {
    const [, , rawLabel] = notes.split('|')
    const label = rawLabel?.trim()
    if (label) {
      return label
    }
  }

  try {
    return getRoutineSessionLabel(routineType, sessionIndex)
  } catch {
    return `Day ${sessionIndex + 1}`
  }
}

async function loadNextScheduledWorkoutPlan(
  db: IronProtocolDB,
  routineType: CanonicalRoutineType,
  trainingGoal: 'Hypertrophy' | 'Power',
): Promise<HydratedScheduledWorkout | null> {
  const routineWorkouts = await db.workouts.where('routineType').equals(routineType).toArray()

  const scheduledWorkouts = routineWorkouts
    .filter((workout) => isMacrocycleScheduledWorkout(workout.notes))
    .sort((left, right) => (left.date - right.date) || (left.sessionIndex - right.sessionIndex))

  if (scheduledWorkouts.length === 0) {
    return null
  }

  const firstScheduledDate = scheduledWorkouts[0].date
  const completedWorkoutCount = routineWorkouts.filter((workout) => (
    !isMacrocycleScheduledWorkout(workout.notes)
    && workout.date >= firstScheduledDate
  )).length

  if (completedWorkoutCount >= scheduledWorkouts.length) {
    return null
  }

  const nextWorkout = scheduledWorkouts[completedWorkoutCount]
  const workoutSets = (await db.sets.where('workoutId').equals(nextWorkout.id).toArray())
    .sort((left, right) => left.orderIndex - right.orderIndex)

  if (workoutSets.length === 0) {
    return null
  }

  const exerciseOrder = new Map<string, number>()
  const setAggregateByExerciseId = new Map<string, { sets: number; reps: number; weight: number }>()

  for (const loggedSet of workoutSets) {
    if (!exerciseOrder.has(loggedSet.exerciseId)) {
      exerciseOrder.set(loggedSet.exerciseId, loggedSet.orderIndex)
    }

    const currentAggregate = setAggregateByExerciseId.get(loggedSet.exerciseId)
    if (!currentAggregate) {
      setAggregateByExerciseId.set(loggedSet.exerciseId, {
        sets: 1,
        reps: loggedSet.reps,
        weight: loggedSet.weight,
      })
      continue
    }

    setAggregateByExerciseId.set(loggedSet.exerciseId, {
      ...currentAggregate,
      sets: currentAggregate.sets + 1,
    })
  }

  const orderedExerciseIds = [...exerciseOrder.entries()]
    .sort((left, right) => left[1] - right[1])
    .map(([exerciseId]) => exerciseId)

  const exerciseRows = await db.exercises.bulkGet(orderedExerciseIds)
  const exerciseById = new Map<string, (typeof exerciseRows)[number]>()

  orderedExerciseIds.forEach((exerciseId, index) => {
    const exercise = exerciseRows[index]
    if (exercise) {
      exerciseById.set(exerciseId, exercise)
    }
  })

  const exercises: PlannedExercise[] = orderedExerciseIds.flatMap((exerciseId) => {
    const aggregate = setAggregateByExerciseId.get(exerciseId)
    const exercise = exerciseById.get(exerciseId)

    if (!aggregate || !exercise) {
      return []
    }

    return [{
      exerciseId,
      exerciseName: exercise.name,
      weight: aggregate.weight,
      reps: aggregate.reps,
      sets: aggregate.sets,
      tier: exercise.tier,
      progressionGoal: `Goal: ${aggregate.reps} Reps (Scheduled)`,
    }]
  })

  if (exercises.length === 0) {
    return null
  }

  return {
    plan: {
      exercises,
      estimatedMinutes: calcEstimatedMinutes(exercises, trainingGoal),
      routineType: nextWorkout.routineType,
      sessionIndex: nextWorkout.sessionIndex,
    },
    dayLabel: resolveScheduledDayLabel(nextWorkout.notes, nextWorkout.routineType, nextWorkout.sessionIndex),
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
  const [primaryActionLabel, setPrimaryActionLabel] = useState('Start Next Workout')
  const [scheduledSessionLabel, setScheduledSessionLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  type SessionPhase = 'idle' | 'review' | 'ignition' | 'logging'
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
  
  const [activePlan, setActivePlan] = useState<PlannedWorkout | null>(null)
  const [activeDraft, setActiveDraft] = useState<TempSession | null>(null)
  const latestLabPlanRef = useRef<PlannedWorkout | null>(null)

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
        let resolvedPlan: PlannedWorkout
        let resolvedFullPlan: PlannedWorkout
        let nextActionLabel = 'Start Next Workout'
        let nextScheduledSessionLabel: string | null = null

        let scheduledWorkoutPlan: HydratedScheduledWorkout | null = null
        try {
          scheduledWorkoutPlan = await loadNextScheduledWorkoutPlan(
            plannerInputs.db,
            plannerInputs.routineType,
            plannerInputs.trainingGoal,
          )
        } catch {
          scheduledWorkoutPlan = null
        }

        if (scheduledWorkoutPlan) {
          resolvedPlan = scheduledWorkoutPlan.plan
          resolvedFullPlan = scheduledWorkoutPlan.plan
          nextActionLabel = `Start ${scheduledWorkoutPlan.dayLabel}`
          nextScheduledSessionLabel = scheduledWorkoutPlan.dayLabel
        } else {
          const [nextPlan, nextFullPlan] = await Promise.all([
            generateWorkout(plannerInputs),
            generateWorkout({
              ...plannerInputs,
              timeAvailable: Math.max(40, plannerInputs.timeAvailable),
            }),
          ])
          resolvedPlan = nextPlan
          resolvedFullPlan = nextFullPlan
        }

        if (cancelled) {
          return
        }

        const nextPlanSignature = getPlanSignature(resolvedPlan)
        const nextFullPlanSignature = getPlanSignature(resolvedFullPlan)

        setPlan((current) => (
          getPlanSignature(current) === nextPlanSignature
            ? current
            : resolvedPlan
        ))

        setFullPlan((current) => (
          getPlanSignature(current) === nextFullPlanSignature
            ? current
            : resolvedFullPlan
        ))

        setPrimaryActionLabel(nextActionLabel)
        setScheduledSessionLabel(nextScheduledSessionLabel)
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

  useEffect(() => {
    latestLabPlanRef.current = plan
  }, [plan])

  const selectedRoutine = ROUTINE_OPTIONS.find((option) => option.type === routineType)
  const cycleLength = selectedRoutine?.cycleLength ?? 1
  const detectedSessionIndex = plan?.sessionIndex ?? 0
  const hasCompletedOnboarding: boolean = onboardingRecord?.hasCompletedOnboarding === true
  const routineSetupRequired = Boolean(plan && plan.routineType.trim().length === 0)

  const sessionLabel = useMemo(() => {
    if (!plan || routineSetupRequired) {
      return routineSetupRequired ? 'Setup Required' : 'Loading Session'
    }

    if (scheduledSessionLabel && scheduledSessionLabel.trim().length > 0) {
      return scheduledSessionLabel
    }

    try {
      return getRoutineSessionLabel(plan.routineType, plan.sessionIndex)
    } catch {
      return 'Setup Required'
    }
  }, [plan, routineSetupRequired, scheduledSessionLabel])

  function handleRoutineSelect(nextRoutineType: CanonicalRoutineType): void {
    setRoutineType(nextRoutineType)
    setHasHydratedRoutine(true)
  }

  function openLoggerWithPlan(nextPlan: PlannedWorkout, nextDraft: TempSession | null): void {
    const resolvedPlan = clonePlan(nextPlan)

    if (nextDraft !== null) {
      setActivePlan(resolvedPlan)
      setActiveDraft(nextDraft)
      setSessionPhase('logging')
      return
    }

    setActivePlan(resolvedPlan)
    setActiveDraft(nextDraft)
    setSessionPhase('review')
  }

  async function handleDiscardDraft(): Promise<void> {
    await db.tempSessions.delete(TEMP_SESSION_ID)
    setSessionPhase('idle')
    setActivePlan(null)
    setActiveDraft(null)
    setPlannerRefreshTick((current) => current + 1)
  }

  const loggerPlan = activePlan ?? plan

  // ── Review phase ───────────────────────────────────────────────────────────
  if (sessionPhase === 'review' && loggerPlan) {
    return (
      <DraftBlueprintReview
        plan={loggerPlan}
        onStartWorkout={() => {
          setSessionPhase('ignition')
        }}
        onModifyBlueprint={() => {
          setSessionPhase('idle')
          setActivePlan(null)
        }}
      />
    )
  }

  // ── Workout Ignition phase ────────────────────────────────────────────────
  if (sessionPhase === 'ignition' && loggerPlan) {
    return (
      <WorkoutIgnition
        onComplete={() => {
          setSessionPhase('logging')
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

  if (onboardingRecord === undefined) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] bg-navy" />
    )
  }

  // Strict binary onboarding gate:
  // not completed -> IdentitySplash, completed -> dashboard/recovery flow.
  if (!hasCompletedOnboarding) {
    return <IdentitySplash db={db} />
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

  return (
    <SessionBlueprint
      db={db}
      plan={plan}
      fullPlan={fullPlan}
      loading={loading}
      error={error}
      sessionLabel={sessionLabel}
      cycleLength={cycleLength}
      sessionIndex={detectedSessionIndex}
      routineType={routineType}
      trainingGoal={trainingGoal}
      timeAvailable={timeAvailable}
      primaryActionLabel={primaryActionLabel}
      routineSetupRequired={routineSetupRequired}
      onTrainingGoalChange={setTrainingGoal}
      onTimeAvailableChange={setTimeAvailable}
      onChooseDefaultRoutine={() => {
        const defaultRoutine = ROUTINE_OPTIONS[0]
        if (defaultRoutine) {
          handleRoutineSelect(defaultRoutine.type)
        }
      }}
      onUpdatePlan={(updatedPlan) => {
        const nextPlan = clonePlan(updatedPlan)
        latestLabPlanRef.current = nextPlan
        setPlan(nextPlan)

        setFullPlan((currentFullPlan) => {
          if (!currentFullPlan) {
            return nextPlan
          }

          if (
            currentFullPlan.routineType !== nextPlan.routineType
            || currentFullPlan.sessionIndex !== nextPlan.sessionIndex
          ) {
            return nextPlan
          }

          const mergedExercises = [
            ...cloneExercises(nextPlan.exercises),
            ...cloneExercises(currentFullPlan.exercises.slice(nextPlan.exercises.length)),
          ]

          return {
            ...currentFullPlan,
            exercises: mergedExercises,
            estimatedMinutes: calcEstimatedMinutes(mergedExercises, trainingGoal),
          }
        })
      }}
      onLockBlueprint={() => {
        const finalizedPlan = latestLabPlanRef.current ?? plan
        if (!finalizedPlan) {
          return
        }

        setActiveDraft(null)
        setActivePlan(clonePlan(finalizedPlan))
        setSessionPhase('review')
      }}
      userName={onboardingRecord?.userName}
      completedAscensions={onboardingRecord?.completedAscensions ?? 0}
    />
  )
}
