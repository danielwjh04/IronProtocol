import { useLiveQuery } from 'dexie-react-hooks'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
import {
  buildActivitySignal,
  buildPlanSignature,
  loadNextScheduledWorkoutPlan,
  type ActivitySnapshot,
  type HydratedScheduledWorkout,
} from '../services/plannerOrchestration'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'
import { resolveGoalTheme } from '../design/designSystem'

export type TrainingGoal = 'Hypertrophy' | 'Power'
export type SessionPhase = 'idle' | 'review' | 'ignition' | 'logging'

export interface HomePageControllerInputs {
  db?: IronProtocolDB
}

export interface HomePageView {
  db: IronProtocolDB
  onboardingRecord: AppSettings | null | undefined
  hasCompletedOnboarding: boolean
  routineSetupRequired: boolean
  sessionPhase: SessionPhase
  plan: PlannedWorkout | null
  fullPlan: PlannedWorkout | null
  tempSession: TempSession | null
  sessionLabel: string
  scheduledSessionLabel: string | null
  primaryActionLabel: string
  cycleLength: number
  detectedSessionIndex: number
  routineType: CanonicalRoutineType
  trainingGoal: TrainingGoal
  timeAvailable: number
  loading: boolean
  error: string | null
  loggerPlan: PlannedWorkout | null
  activeDraft: TempSession | null
}

export interface HomePageActions {
  onRoutineSelect: (routineType: CanonicalRoutineType) => void
  onTrainingGoalChange: (goal: TrainingGoal) => void
  onTimeAvailableChange: (minutes: number) => void
  onChooseDefaultRoutine: () => void
  onResumeDraft: () => void
  onDiscardDraft: () => void
  onUpdatePlanFromBlueprint: (plan: PlannedWorkout) => void
  onLockBlueprint: () => void
  onStartIgnition: () => void
  onStartLogging: () => void
  onReturnToDraftingLab: () => void
  onWorkoutComplete: () => void
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

function buildPlanFromDraft(draft: TempSession): PlannedWorkout {
  return {
    exercises: draft.exercises,
    estimatedMinutes: draft.estimatedMinutes,
    routineType: draft.routineType,
    sessionIndex: draft.sessionIndex,
  }
}

export function useHomePageController(
  inputs: HomePageControllerInputs = {},
): { view: HomePageView; actions: HomePageActions } {
  const db = inputs.db ?? defaultDb

  const [routineType, setRoutineType] = useState<CanonicalRoutineType>('PPL')
  const [trainingGoal, setTrainingGoal] = useState<TrainingGoal>('Hypertrophy')
  const [timeAvailable, setTimeAvailable] = useState(45)
  const [plannerRefreshTick, setPlannerRefreshTick] = useState(0)
  const [hasHydratedRoutine, setHasHydratedRoutine] = useState(false)
  const [plan, setPlan] = useState<PlannedWorkout | null>(null)
  const [fullPlan, setFullPlan] = useState<PlannedWorkout | null>(null)
  const [primaryActionLabel, setPrimaryActionLabel] = useState('Start Next Workout')
  const [scheduledSessionLabel, setScheduledSessionLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle')
  const [activePlan, setActivePlan] = useState<PlannedWorkout | null>(null)
  const [activeDraft, setActiveDraft] = useState<TempSession | null>(null)

  const latestLabPlanRef = useRef<PlannedWorkout | null>(null)
  const deferredTimeAvailable = useDeferredValue(timeAvailable)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-goal-theme', resolveGoalTheme(trainingGoal))
  }, [trainingGoal])

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
      return { workoutCount, setCount }
    },
    [db, routineType],
  )

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
    () => buildActivitySignal(activitySnapshot ?? { workoutCount: 0, setCount: 0 }),
    [activitySnapshot],
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

        const nextPlanSignature = buildPlanSignature(resolvedPlan)
        const nextFullPlanSignature = buildPlanSignature(resolvedFullPlan)

        setPlan((current) => (
          buildPlanSignature(current) === nextPlanSignature
            ? current
            : resolvedPlan
        ))

        setFullPlan((current) => (
          buildPlanSignature(current) === nextFullPlanSignature
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

  const onRoutineSelect = useCallback((nextRoutineType: CanonicalRoutineType): void => {
    setRoutineType(nextRoutineType)
    setHasHydratedRoutine(true)
  }, [])

  const onChooseDefaultRoutine = useCallback((): void => {
    const defaultRoutine = ROUTINE_OPTIONS[0]
    if (defaultRoutine) {
      onRoutineSelect(defaultRoutine.type)
    }
  }, [onRoutineSelect])

  const openLoggerWithPlan = useCallback((
    nextPlan: PlannedWorkout,
    nextDraft: TempSession | null,
  ): void => {
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
  }, [])

  const onResumeDraft = useCallback((): void => {
    if (!tempSession) return
    openLoggerWithPlan(buildPlanFromDraft(tempSession), tempSession)
  }, [openLoggerWithPlan, tempSession])

  const onDiscardDraft = useCallback((): void => {
    void (async () => {
      await db.tempSessions.delete(TEMP_SESSION_ID)
      setSessionPhase('idle')
      setActivePlan(null)
      setActiveDraft(null)
      setPlannerRefreshTick((current) => current + 1)
    })()
  }, [db])

  const onUpdatePlanFromBlueprint = useCallback((updatedPlan: PlannedWorkout): void => {
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
  }, [trainingGoal])

  const onLockBlueprint = useCallback((): void => {
    const finalizedPlan = latestLabPlanRef.current ?? plan
    if (!finalizedPlan) {
      return
    }

    setActiveDraft(null)
    setActivePlan(clonePlan(finalizedPlan))
    setSessionPhase('review')
  }, [plan])

  const onStartIgnition = useCallback((): void => {
    setSessionPhase('ignition')
  }, [])

  const onStartLogging = useCallback((): void => {
    setSessionPhase('logging')
  }, [])

  const onReturnToDraftingLab = useCallback((): void => {
    setSessionPhase('idle')
    setActivePlan(null)
  }, [])

  const onWorkoutComplete = useCallback((): void => {
    setSessionPhase('idle')
    setActivePlan(null)
    setActiveDraft(null)
  }, [])

  const loggerPlan = activePlan ?? plan

  return {
    view: {
      db,
      onboardingRecord,
      hasCompletedOnboarding,
      routineSetupRequired,
      sessionPhase,
      plan,
      fullPlan,
      tempSession,
      sessionLabel,
      scheduledSessionLabel,
      primaryActionLabel,
      cycleLength,
      detectedSessionIndex,
      routineType,
      trainingGoal,
      timeAvailable,
      loading,
      error,
      loggerPlan,
      activeDraft,
    },
    actions: {
      onRoutineSelect,
      onTrainingGoalChange: setTrainingGoal,
      onTimeAvailableChange: setTimeAvailable,
      onChooseDefaultRoutine,
      onResumeDraft,
      onDiscardDraft,
      onUpdatePlanFromBlueprint,
      onLockBlueprint,
      onStartIgnition,
      onStartLogging,
      onReturnToDraftingLab,
      onWorkoutComplete,
    },
  }
}
