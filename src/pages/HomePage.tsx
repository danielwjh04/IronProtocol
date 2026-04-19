import { useCallback } from 'react'
import ActiveLogger from '../components/ActiveLogger'
import WorkoutIgnition from '../components/WorkoutIgnition'
import IdentitySplash from '../components/IdentitySplash'
import DashboardShell from '../components/dashboard/DashboardShell'
import TempSessionTakeover from '../components/dashboard/TempSessionTakeover'
import { useHomePageController } from '../hooks/useHomePageController'
import type { IronProtocolDB } from '../db/schema'

interface Props {
  db?: IronProtocolDB
}

export default function HomePage({ db }: Props) {
  const { view, actions } = useHomePageController({ db })

  const {
    db: resolvedDb,
    onboardingRecord,
    hasCompletedOnboarding,
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
    onRoutineSelect,
    onTrainingGoalChange,
    onTimeAvailableChange,
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
      userName={onboardingRecord?.userName}
      completedAscensions={onboardingRecord?.completedAscensions ?? 0}
      onTrainingGoalChange={onTrainingGoalChange}
      onTimeAvailableChange={onTimeAvailableChange}
      onUpdatePlan={onUpdatePlanFromBlueprint}
      onStartWorkout={onStartWorkout}
      onSelectRoutine={onRoutineSelect}
    />
  )
}
