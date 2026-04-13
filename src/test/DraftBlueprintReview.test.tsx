// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DraftBlueprintReview from '../components/DraftBlueprintReview'
import type { PlannedWorkout } from '../planner/autoPlanner'

afterEach(() => cleanup())

const populatedPlan: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 42,
  exercises: [
    {
      exerciseId: 'ex-bench',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 5,
      sets: 5,
      tier: 1,
      progressionGoal: 'Linear Progression: Add 2.5kg next session',
    },
    {
      exerciseId: 'ex-incline',
      exerciseName: 'Incline Press',
      weight: 70,
      reps: 8,
      sets: 3,
      tier: 2,
      progressionGoal: 'Double Progression',
    },
  ],
}

const emptyPlan: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 0,
  exercises: [],
}

describe('DraftBlueprintReview', () => {
  it('renders gantry read-only header and session length', () => {
    render(
      <DraftBlueprintReview
        plan={populatedPlan}
        onStartWorkout={() => undefined}
        onModifyBlueprint={() => undefined}
      />,
    )

    expect(screen.getByText('Final Check')).toBeInTheDocument()
    expect(screen.getByText('Blueprint Gantry')).toBeInTheDocument()
    expect(screen.getByText('42 min')).toBeInTheDocument()
    expect(screen.getByText(/read-only final check before ignition/i)).toBeInTheDocument()
  })

  it('renders exercise cards as read-only values', () => {
    render(
      <DraftBlueprintReview
        plan={populatedPlan}
        onStartWorkout={() => undefined}
        onModifyBlueprint={() => undefined}
      />,
    )

    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Incline Press')).toBeInTheDocument()
    expect(screen.getByText('5 sets x 5 reps')).toBeInTheDocument()
    expect(screen.getByText('3 sets x 8 reps')).toBeInTheDocument()
    expect(screen.getByText('80 kg')).toBeInTheDocument()
    expect(screen.getByText('70 kg')).toBeInTheDocument()
    expect(screen.getByText('Tier 1')).toBeInTheDocument()
    expect(screen.getByText('Tier 2')).toBeInTheDocument()
  })

  it('shows empty blueprint state when no exercises exist', () => {
    render(
      <DraftBlueprintReview
        plan={emptyPlan}
        onStartWorkout={() => undefined}
        onModifyBlueprint={() => undefined}
      />,
    )

    expect(screen.getByText('Blueprint is empty')).toBeInTheDocument()
    expect(screen.getByText(/return to the drafting lab/i)).toBeInTheDocument()
  })

  it('disables start workout when no exercises exist', () => {
    const onStartWorkout = vi.fn()

    render(
      <DraftBlueprintReview
        plan={emptyPlan}
        onStartWorkout={onStartWorkout}
        onModifyBlueprint={() => undefined}
      />,
    )

    const startButton = screen.getByRole('button', { name: /start workout/i })
    expect(startButton).toBeDisabled()

    fireEvent.click(startButton)
    expect(onStartWorkout).not.toHaveBeenCalled()
  })

  it('calls start and modify callbacks in populated state', () => {
    const onStartWorkout = vi.fn()
    const onModifyBlueprint = vi.fn()

    render(
      <DraftBlueprintReview
        plan={populatedPlan}
        onStartWorkout={onStartWorkout}
        onModifyBlueprint={onModifyBlueprint}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /start workout/i }))
    fireEvent.click(screen.getByRole('button', { name: /modify blueprint/i }))

    expect(onStartWorkout).toHaveBeenCalledOnce()
    expect(onModifyBlueprint).toHaveBeenCalledOnce()
  })

  it('does not render drafting controls like swaps or sliders', () => {
    render(
      <DraftBlueprintReview
        plan={populatedPlan}
        onStartWorkout={() => undefined}
        onModifyBlueprint={() => undefined}
      />,
    )

    expect(screen.queryByRole('button', { name: /swap/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })
})
