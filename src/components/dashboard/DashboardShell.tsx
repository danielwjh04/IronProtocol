import HeaderBar from './HeaderBar'
import HeroCard from './HeroCard'
import ExerciseList from './ExerciseList'
import ExerciseSwapSheet from './ExerciseSwapSheet'
import { useSessionBlueprintController } from '../../hooks/useSessionBlueprintController'
import type { CanonicalRoutineType, PlannedWorkout } from '../../planner/autoPlanner'
import type { IronProtocolDB } from '../../db/schema'

type TrainingGoal = 'Hypertrophy' | 'Power'

interface DashboardShellProps {
  db: IronProtocolDB
  plan: PlannedWorkout | null
  fullPlan: PlannedWorkout | null
  error: string | null
  sessionLabel: string
  cycleLength: number
  sessionIndex: number
  routineType: CanonicalRoutineType
  trainingGoal: TrainingGoal
  timeAvailable: number
  primaryActionLabel: string
  onUpdatePlan: (plan: PlannedWorkout) => void
  onStartWorkout: () => void
}

export default function DashboardShell({
  db,
  plan,
  fullPlan,
  error,
  sessionLabel,
  cycleLength,
  sessionIndex,
  routineType,
  trainingGoal,
  timeAvailable,
  primaryActionLabel,
  onUpdatePlan,
  onStartWorkout,
}: DashboardShellProps) {
  const { view, actions } = useSessionBlueprintController({
    db,
    plan,
    fullPlan,
    routineType,
    trainingGoal,
    timeAvailable,
    onUpdatePlan,
  })

  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      <HeaderBar
        sessionLabel={sessionLabel}
        sessionIndex={sessionIndex}
        cycleLength={cycleLength}
      />

      <HeroCard
        plan={view.resolvedPlan}
        sessionLabel={sessionLabel}
        error={error}
        primaryActionLabel={primaryActionLabel}
        onStart={onStartWorkout}
      />

      <ExerciseList
        cards={view.exerciseCards}
        orderedIds={view.orderedExerciseIds}
        onReorder={actions.onReorder}
        onSelectCard={(card) => {
          void actions.onOpenSwapDrawer(card)
        }}
      />

      <ExerciseSwapSheet
        open={view.isSwapDrawerOpen}
        target={view.swapTarget}
        candidates={view.swapCandidates}
        isLoading={view.isSwapLoading}
        isPending={view.isSwapPending}
        onClose={actions.onCloseSwapDrawer}
        onSelect={actions.onSwap}
      />
    </main>
  )
}
