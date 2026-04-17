// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SessionBlueprint from '../components/SessionBlueprint'
import { APP_SETTINGS_ID, IronProtocolDB, type Exercise } from '../db/schema'
import { generateWorkout, type PlannedWorkout } from '../planner/autoPlanner'

vi.mock('../planner/autoPlanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../planner/autoPlanner')>()
  return {
    ...actual,
    generateWorkout: vi.fn(),
  }
})

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

const basePlan: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 28,
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
}

function makePlan(exercises: PlannedWorkout['exercises'], estimatedMinutes: number): PlannedWorkout {
  return {
    routineType: 'PPL',
    sessionIndex: 0,
    estimatedMinutes,
    exercises,
  }
}

describe('SessionBlueprint drafting behavior', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    vi.mocked(generateWorkout).mockReset()

    db = new IronProtocolDB()
    await db.open()

    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      purposeChip: 'hypertrophy',
      activeFallbackPool: {
        global: [
          { exerciseName: 'Incline Dumbbell Press', reason: 'Fallback chest press.' },
          { exerciseName: 'Push Up', reason: 'Fallback horizontal press.' },
          { exerciseName: 'Leg Extension', reason: 'Fallback quad accessory.' },
          { exerciseName: 'Dumbbell Shoulder Press', reason: 'Fallback vertical press.' },
        ],
      },
    })

    await db.exercises.bulkPut([
      makeExercise({ id: 'ex-bench', name: 'Bench Press', tier: 1, tags: ['push', 'upper', 'compound'] }),
      makeExercise({ id: 'ex-incline', name: 'Incline Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-incline-db', name: 'Incline Dumbbell Press', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-pushup', name: 'Push Up', tier: 1, tags: ['push', 'upper'] }),
      makeExercise({ id: 'ex-squat', name: 'Back Squat', tier: 1, tags: ['legs', 'compound'] }),
      makeExercise({ id: 'ex-leg-extension', name: 'Leg Extension', tier: 1, tags: ['legs'] }),
      makeExercise({ id: 'ex-shoulder-press', name: 'Dumbbell Shoulder Press', tier: 1, tags: ['push', 'upper'], muscleGroup: 'Shoulders' }),
    ])

  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('opens quick swap drawer with alternatives and purpose text', async () => {
    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /replace bench press/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/biomechanical goal: horizontal press/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /push up/i })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /dumbbell shoulder press/i })).not.toBeInTheDocument()

    expect(screen.getByText(/upper chest/i)).toBeInTheDocument()
  })

  it('excludes alternatives already present in the active plan', async () => {
    await db.settings.update(APP_SETTINGS_ID, {
      activeFallbackPool: {
        global: [
          { exerciseName: 'Incline Press', reason: 'Duplicate in active card list.' },
          { exerciseName: 'Incline Dumbbell Press', reason: 'Valid replacement.' },
        ],
      },
    })

    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /^incline press$/i })).not.toBeInTheDocument()
  })

  it('falls back to same-tier local alternatives when fallback pool is empty', async () => {
    await db.settings.update(APP_SETTINGS_ID, {
      activeFallbackPool: {
        global: [],
      },
    })

    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /push up/i })).toBeInTheDocument()
    })

    expect(screen.queryByText(/no alternatives available/i)).not.toBeInTheDocument()
  })

  it('swaps in one tap, preserving sets and reps while emitting updated plan', async () => {
    const onUpdatePlan = vi.fn()

    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /incline dumbbell press/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /swap incline dumbbell press/i })).toBeInTheDocument()
    })

    const updatedPlan = onUpdatePlan.mock.calls.at(-1)?.[0] as PlannedWorkout
    const swapped = updatedPlan.exercises[0]

    expect(swapped.exerciseId).toBe('ex-incline-db')
    expect(swapped.exerciseName).toBe('Incline Dumbbell Press')
    expect(swapped.sets).toBe(5)
    expect(swapped.reps).toBe(5)
  })

  it('updates global fallback pool bidirectionally after swap', async () => {
    const onUpdatePlan = vi.fn()

    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /incline dumbbell press/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const settings = await db.settings.get(APP_SETTINGS_ID)
    const globalPool = settings?.activeFallbackPool?.global ?? []
    const normalizedNames = globalPool.map((entry) => entry.exerciseName.trim().toLowerCase())

    expect(normalizedNames).not.toContain('incline dumbbell press')
    expect(normalizedNames).toContain('bench press')
  })

  it('does not ghost swapped-out exercises into QoS preview', async () => {
    const onUpdatePlan = vi.fn()

    const activePlan = makePlan([
      {
        exerciseId: 'ex-bench',
        exerciseName: 'Bench Press',
        weight: 80,
        reps: 5,
        sets: 3,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-incline',
        exerciseName: 'Incline Press',
        weight: 70,
        reps: 6,
        sets: 3,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ], 24)

    const fullPlan = makePlan([
      ...activePlan.exercises,
      {
        exerciseId: 'ex-pushup',
        exerciseName: 'Push Up',
        weight: 0,
        reps: 12,
        sets: 3,
        tier: 2,
        progressionGoal: 'Linear Progression: Add reps next session',
      },
    ], 33)

    render(
      <SessionBlueprint
        db={db}
        plan={activePlan}
        fullPlan={fullPlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={25}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incline dumbbell press/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /incline dumbbell press/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const qosPreviewCard = screen.getByText(/qos preview/i).closest('div')
    expect(qosPreviewCard).not.toBeNull()

    const qosScope = within(qosPreviewCard as HTMLElement)
    expect(qosScope.queryByText(/^bench press$/i)).not.toBeInTheDocument()
  })

  it('strictly trims bottom exercises to fit a 75 minute QoS budget', async () => {
    const heavyPlan = makePlan([
      {
        exerciseId: 'ex-heavy-1',
        exerciseName: 'Heavy Press 1',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-heavy-2',
        exerciseName: 'Heavy Press 2',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-heavy-3',
        exerciseName: 'Heavy Press 3',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-heavy-4',
        exerciseName: 'Heavy Press 4',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-heavy-5',
        exerciseName: 'Heavy Press 5',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ], 100)

    render(
      <SessionBlueprint
        db={db}
        plan={heavyPlan}
        fullPlan={heavyPlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={75}
        onUpdatePlan={() => undefined}
      />,
    )

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^swap heavy press/i })).toHaveLength(3)
    })

    const qosPreviewCard = screen.getByText(/qos preview/i).closest('div')
    expect(qosPreviewCard).not.toBeNull()

    const qosScope = within(qosPreviewCard as HTMLElement)
    expect(qosScope.getByText('Heavy Press 4')).toBeInTheDocument()
    expect(qosScope.getByText('Heavy Press 5')).toBeInTheDocument()
  })

  it('preserves exact slot set and rep footprint on swap', async () => {
    const onUpdatePlan = vi.fn()
    const squatPlan = makePlan([
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Back Squat',
        weight: 100,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ], 24)

    render(
      <SessionBlueprint
        db={db}
        plan={squatPlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
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

    const updatedPlan = onUpdatePlan.mock.calls.at(-1)?.[0] as PlannedWorkout
    expect(updatedPlan.exercises[0].exerciseName).toBe('Leg Extension')
    expect(updatedPlan.exercises[0].sets).toBe(5)
    expect(updatedPlan.exercises[0].reps).toBe(5)
  })

  it('shortens regenerated blueprint when workout length is reduced from 60 to 15 minutes', async () => {
    const onUpdatePlan = vi.fn()

    const planAt60 = makePlan([
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
      {
        exerciseId: 'ex-pushup',
        exerciseName: 'Push Up',
        weight: 0,
        reps: 12,
        sets: 3,
        tier: 1,
        progressionGoal: 'Linear Progression: Add reps next session',
      },
    ], 58)

    const planAt15 = makePlan([
      {
        exerciseId: 'ex-bench',
        exerciseName: 'Bench Press',
        weight: 80,
        reps: 5,
        sets: 3,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ], 15)

    vi.mocked(generateWorkout).mockImplementation(async ({ timeAvailable }) => {
      if (timeAvailable >= 60) {
        return planAt60
      }
      if (timeAvailable <= 15) {
        return planAt15
      }
      return basePlan
    })

    render(
      <SessionBlueprint
        db={db}
        plan={basePlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    const slider = screen.getByLabelText(/time available/i)

    fireEvent.change(slider, { target: { value: '60' } })
    fireEvent.change(slider, { target: { value: '15' } })

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    const latestPlan = onUpdatePlan.mock.calls.at(-1)?.[0] as PlannedWorkout

    expect(
      vi.mocked(generateWorkout).mock.calls.some((call) => call[0].timeAvailable === 60),
    ).toBe(true)
    expect(
      vi.mocked(generateWorkout).mock.calls.some((call) => call[0].timeAvailable === 15),
    ).toBe(true)
    expect(latestPlan.exercises.some((exercise) => exercise.tier === 1)).toBe(true)
    expect(latestPlan.exercises.length).toBe(planAt15.exercises.length)
  })

  it('remaps visible blueprint immediately when training goal toggles to Power', async () => {
    const onUpdatePlan = vi.fn()

    const hypertrophyPlan = makePlan([
      {
        exerciseId: 'ex-bench',
        exerciseName: 'Bench Press',
        weight: 80,
        reps: 8,
        sets: 4,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-incline',
        exerciseName: 'Incline Press',
        weight: 70,
        reps: 12,
        sets: 4,
        tier: 2,
        progressionGoal: 'Linear Progression: Add reps next session',
      },
    ], 45)

    const powerPlan = makePlan([
      {
        exerciseId: 'ex-bench',
        exerciseName: 'Bench Press',
        weight: 82.5,
        reps: 5,
        sets: 5,
        tier: 1,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
      {
        exerciseId: 'ex-incline',
        exerciseName: 'Incline Press',
        weight: 72.5,
        reps: 8,
        sets: 4,
        tier: 2,
        progressionGoal: 'Linear Progression: Add 2.5kg next session',
      },
    ], 47)

    let resolvePowerPlan: ((value: PlannedWorkout | PromiseLike<PlannedWorkout>) => void) | undefined
    const pendingPowerPlan = new Promise<PlannedWorkout>((resolve) => {
      resolvePowerPlan = resolve
    })

    vi.mocked(generateWorkout).mockImplementation(async ({ trainingGoal }) => {
      if (trainingGoal === 'Power') {
        return pendingPowerPlan
      }
      return hypertrophyPlan
    })

    render(
      <SessionBlueprint
        db={db}
        plan={hypertrophyPlan}
        routineType="PPL"
        trainingGoal="Hypertrophy"
        timeAvailable={45}
        onUpdatePlan={onUpdatePlan}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^power$/i }))

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalled()
    })

    expect(screen.getByText(/5 sets x 5 reps/i)).toBeInTheDocument()
    expect(screen.getByText(/4 sets x 8 reps/i)).toBeInTheDocument()

    const immediatePlan = onUpdatePlan.mock.calls.at(-1)?.[0] as PlannedWorkout
    const tier1 = immediatePlan.exercises.find((exercise) => exercise.tier === 1)
    const tier2 = immediatePlan.exercises.find((exercise) => exercise.tier === 2)

    expect([tier1?.sets, tier1?.reps]).toEqual([5, 5])
    expect([tier2?.sets, tier2?.reps]).toEqual([4, 8])

    if (!resolvePowerPlan) {
      throw new Error('Power plan resolver was not initialized.')
    }

    resolvePowerPlan(powerPlan)

    await waitFor(() => {
      expect(onUpdatePlan).toHaveBeenCalledTimes(2)
    })

    expect(
      vi.mocked(generateWorkout).mock.calls.some((call) => call[0].trainingGoal === 'Power'),
    ).toBe(true)
  })
})
