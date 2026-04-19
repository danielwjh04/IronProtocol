import { useCallback } from 'react'
import { motion } from 'framer-motion'
import ActiveLogger from '../components/ActiveLogger'
import WorkoutIgnition from '../components/WorkoutIgnition'
import IdentitySplash from '../components/IdentitySplash'
import DashboardShell from '../components/dashboard/DashboardShell'
import TempSessionTakeover from '../components/dashboard/TempSessionTakeover'
import { useHomePageController } from '../hooks/useHomePageController'
import type { IronProtocolDB } from '../db/schema'

function navigateToRoutines(): void {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', '/routines')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

interface Props {
  db?: IronProtocolDB
}

export default function HomePage({ db }: Props) {
  const { view, actions } = useHomePageController({ db })

  const {
    db: resolvedDb,
    onboardingRecord,
    hasCompletedOnboarding,
    activeRoutine,
    sessionPhase,
    plan,
    fullPlan,
    tempSession,
    sessionLabel,
    primaryActionLabel,
    cycleLength,
    detectedSessionIndex,
    routineType,
    trainingGoal,
    timeAvailable,
    error,
    loggerPlan,
    activeDraft,
  } = view

  const {
    onResumeDraft,
    onDiscardDraft,
    onUpdatePlanFromBlueprint,
    onLockBlueprint,
    onStartIgnition,
    onStartLogging,
    onWorkoutComplete,
  } = actions

  const onStartWorkout = useCallback((): void => {
    onLockBlueprint()
    onStartIgnition()
  }, [onLockBlueprint, onStartIgnition])

  if ((sessionPhase === 'ignition' || sessionPhase === 'review') && loggerPlan) {
    return <WorkoutIgnition onComplete={onStartLogging} />
  }

  if (sessionPhase === 'logging' && loggerPlan) {
    return (
      <ActiveLogger
        plan={loggerPlan}
        db={resolvedDb}
        initialDraft={activeDraft}
        parsedGoal={activeRoutine?.parsedGoal}
        onDone={onWorkoutComplete}
        onCancel={onDiscardDraft}
      />
    )
  }

  if (onboardingRecord === undefined) {
    return (
      <main
        className="mx-auto flex min-h-svh w-full max-w-[430px]"
        style={{ backgroundColor: 'var(--color-surface-base)' }}
      />
    )
  }

  if (!hasCompletedOnboarding) {
    return <IdentitySplash db={resolvedDb} />
  }

  if (tempSession) {
    return (
      <TempSessionTakeover
        onResume={onResumeDraft}
        onDiscard={onDiscardDraft}
      />
    )
  }

  if (activeRoutine === null) {
    return (
      <main
        className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center gap-5 px-6"
        style={{ backgroundColor: 'var(--color-surface-base)' }}
      >
        <div
          className="w-full rounded-3xl border p-6 text-center"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
            Setup Required
          </p>
          <h1 className="text-display mt-3" style={{ color: 'var(--color-text-primary)' }}>
            Create a Routine
          </h1>
          <p className="text-body mt-3" style={{ color: 'var(--color-text-secondary)' }}>
            Routines define your training goal, days per week, and cycle length. The planner
            needs an active routine before it can generate a workout.
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={navigateToRoutines}
            className="text-label mt-5 w-full rounded-2xl px-5 py-3 text-white"
            style={{ backgroundColor: 'var(--color-accent-primary)' }}
          >
            Create Routine
          </motion.button>
        </div>
      </main>
    )
  }

  return (
    <DashboardShell
      db={resolvedDb}
      plan={plan}
      fullPlan={fullPlan}
      error={error}
      sessionLabel={sessionLabel}
      cycleLength={cycleLength}
      sessionIndex={detectedSessionIndex}
      routineType={routineType}
      trainingGoal={trainingGoal}
      timeAvailable={timeAvailable}
      primaryActionLabel={primaryActionLabel}
      onUpdatePlan={onUpdatePlanFromBlueprint}
      onStartWorkout={onStartWorkout}
    />
  )
}
