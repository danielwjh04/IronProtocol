// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { v4 as uuidv4 } from 'uuid'
import DraftBlueprintReview from '../components/DraftBlueprintReview'
import { APP_SETTINGS_ID, IronProtocolDB, TEMP_SESSION_ID, type Exercise } from '../db/schema'
import type { PlannedWorkout } from '../planner/autoPlanner'

afterEach(() => cleanup())

function makeExercise(input: {
  id: string
  name: string
  tier?: 1 | 2 | 3
  tags?: string[]
  muscleGroup?: string
}): Exercise {
  return {
    id: input.id,
    name: input.name,
    tier: input.tier ?? 1,
    tags: input.tags ?? [],
    muscleGroup: input.muscleGroup ?? 'Chest',
    mediaType: 'video',
    mediaRef: '',
  }
}

describe('DraftBlueprintReview Smart Swap', () => {
  let db: IronProtocolDB

  const plan: PlannedWorkout = {
    routineType: 'PPL',
    sessionIndex: 0,
    estimatedMinutes: 22,
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
    ],
  }

  const squatPlan: PlannedWorkout = {
    routineType: 'PPL',
    sessionIndex: 0,
    estimatedMinutes: 22,
    exercises: [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Back Squat',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ],
  }

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()

    await db.exercises.bulkPut([
      makeExercise({ id: 'ex-bench', name: 'Bench Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-incline', name: 'Incline Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-incline-db', name: 'Incline Dumbbell Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-pushup', name: 'Push Up', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-machine-press', name: 'Hammer Strength Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-ohp', name: 'Overhead Press', tier: 2, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-cable-fly', name: 'Cable Fly', tier: 3, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-triceps-pushdown', name: 'Triceps Pushdown', tier: 3, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-row', name: 'Barbell Row', tier: 1, tags: ['pull', 'upper'] }),
      makeExercise({ id: 'ex-lateral', name: 'Lateral Raise', tier: 2, tags: ['shoulders'] }),
      makeExercise({ id: 'ex-squat', name: 'Back Squat', tier: 1, tags: ['legs', 'compound'] }),
      makeExercise({ id: 'ex-leg-extension', name: 'Leg Extension', tier: 1, tags: ['legs'] }),
    ])
  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('opens quick swap drawer with same-category alternatives and purpose text', async () => {
    render(
      <DraftBlueprintReview
        plan={plan}
        db={db}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close quick swap drawer/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/biomechanical goal: horizontal press/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Incline Press')).toBeInTheDocument()
      expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument()
      expect(screen.getByText('Push Up')).toBeInTheDocument()
    })

    expect(screen.queryByText('Barbell Row')).not.toBeInTheDocument()
    expect(screen.getByText(/upper pectorals/i)).toBeInTheDocument()
  })

  it('excludes alternatives already present in the active session while swapping', async () => {
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 22,
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
          reps: 6,
          sets: 4,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })

    render(
      <DraftBlueprintReview
        plan={plan}
        db={db}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close quick swap drawer/i })).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /incline press/i })).not.toBeInTheDocument()
  })

  it('swaps in one tap, vibrates, preserves sets/reps, and persists temp session draft', async () => {
    const onUpdatePlan = vi.fn()
    const vibrateSpy = vi.fn().mockReturnValue(true)

    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    })

    render(
      <DraftBlueprintReview
        plan={plan}
        db={db}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close quick swap drawer/i })).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline press/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /incline press/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const updatedPlan = onUpdatePlan.mock.calls[0][0] as PlannedWorkout
    expect(updatedPlan.exercises[0].exerciseId).toBe('ex-incline')
    expect(updatedPlan.exercises[0].exerciseName).toBe('Incline Press')
    expect(updatedPlan.exercises[0].sets).toBe(5)
    expect(updatedPlan.exercises[0].reps).toBe(5)

    expect(vibrateSpy).toHaveBeenCalledWith(50)

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft?.exercises[0].exerciseId).toBe('ex-incline')
      expect(draft?.exercises[0].sets).toBe(5)
      expect(draft?.exercises[0].reps).toBe(5)
    })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /close quick swap drawer/i })).not.toBeInTheDocument()
    })
  })

  it('applies intensity guard for compound-to-accessory swaps and persists adjusted reps to active session', async () => {
    const onUpdatePlan = vi.fn()
    const vibrateSpy = vi.fn().mockReturnValue(true)

    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    })

    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      purposeChip: 'hypertrophy',
    })

    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 22,
      exercises: [
        {
          exerciseId: 'ex-squat',
          exerciseName: 'Back Squat',
          weight: 100,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 100,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })

    render(
      <DraftBlueprintReview
        plan={squatPlan}
        db={db}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap back squat/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /leg extension/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /leg extension/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const updatedPlan = onUpdatePlan.mock.calls[0][0] as PlannedWorkout
    expect(updatedPlan.exercises[0].exerciseName).toBe('Leg Extension')
    expect(updatedPlan.exercises[0].sets).toBe(5)
    expect(updatedPlan.exercises[0].reps).toBe(12)

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft?.exercises[0].exerciseName).toBe('Leg Extension')
      expect(draft?.exercises[0].reps).toBe(12)
      expect(draft?.reps).toBe(12)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(50)
  })

  it('shortens the exercise list when workout length changes from 60 to 15 minutes', async () => {
    const onUpdatePlan = vi.fn()
    const onWorkoutLengthChange = vi.fn()

    await db.exercises.clear()

    const benchId = uuidv4()
    const inclineId = uuidv4()
    const arnoldPressId = uuidv4()
    const cableFlyId = uuidv4()
    const tricepsPushdownId = uuidv4()

    await db.exercises.bulkPut([
      makeExercise({ id: benchId, name: 'Bench Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: inclineId, name: 'Incline Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: arnoldPressId, name: 'Arnold Press', tier: 2, tags: ['push', 'upper'] }),
      makeExercise({ id: cableFlyId, name: 'Cable Fly', tier: 3, tags: ['push', 'upper'] }),
      makeExercise({ id: tricepsPushdownId, name: 'Triceps Pushdown', tier: 3, tags: ['push', 'upper'] }),
    ])

    const dynamicPlan: PlannedWorkout = {
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 45,
      exercises: [
        {
          exerciseId: benchId,
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
    }

    render(
      <DraftBlueprintReview
        plan={dynamicPlan}
        db={db}
        trainingGoal="Hypertrophy"
        initialWorkoutLengthMinutes={45}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={onUpdatePlan}
        onWorkoutLengthChange={onWorkoutLengthChange}
      />,
    )

    const workoutLengthSlider = screen.getByLabelText(/default workout length/i)

    fireEvent.change(workoutLengthSlider, { target: { value: '60' } })
    expect(onWorkoutLengthChange).toHaveBeenCalledWith(60)

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalledTimes(1)
    })

    const planAt60 = onUpdatePlan.mock.calls[0][0] as PlannedWorkout

    fireEvent.change(workoutLengthSlider, { target: { value: '15' } })
    expect(onWorkoutLengthChange).toHaveBeenCalledWith(15)

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalledTimes(2)
    })

    const planAt15 = onUpdatePlan.mock.calls[1][0] as PlannedWorkout

    expect(planAt15.exercises.length).toBeLessThan(planAt60.exercises.length)
    expect(planAt15.exercises.some((exercise) => exercise.tier === 1)).toBe(true)
  })

  it('rebuilds blueprint immediately when trainingGoal prop changes', async () => {
    const onUpdatePlan = vi.fn()

    const benchId = uuidv4()
    const inclineId = uuidv4()
    const cableFlyId = uuidv4()

    await db.exercises.clear()
    await db.exercises.bulkPut([
      makeExercise({ id: benchId, name: 'Bench Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: inclineId, name: 'Incline Press', tier: 2, tags: ['push', 'upper'] }),
      makeExercise({ id: cableFlyId, name: 'Cable Fly', tier: 3, tags: ['push', 'upper'] }),
    ])

    const startingPlan: PlannedWorkout = {
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 45,
      exercises: [
        {
          exerciseId: benchId,
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 8,
          sets: 3,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
    }

    const { rerender } = render(
      <DraftBlueprintReview
        plan={startingPlan}
        db={db}
        trainingGoal="Hypertrophy"
        initialWorkoutLengthMinutes={45}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    rerender(
      <DraftBlueprintReview
        plan={startingPlan}
        db={db}
        trainingGoal="Power"
        initialWorkoutLengthMinutes={45}
        onConfirm={() => undefined}
        onCancel={() => undefined}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const powerPlan = onUpdatePlan.mock.calls.at(-1)?.[0] as PlannedWorkout
    const tier1 = powerPlan.exercises.find((exercise) => exercise.tier === 1)
    const tier2 = powerPlan.exercises.find((exercise) => exercise.tier === 2)

    expect([tier1?.sets, tier1?.reps]).toEqual([5, 3])
    expect([tier2?.sets, tier2?.reps]).toEqual([4, 6])
  })
})
