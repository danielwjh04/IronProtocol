// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { IronProtocolDB, TEMP_SESSION_ID } from '../db/schema'
import ActiveLogger from '../components/ActiveLogger'
import { UIModeProvider } from '../context/UIModeContext'
import type { PlannedWorkout } from '../planner/autoPlanner'
import * as setCommitEvents from '../events/setCommitEvents'
import { subscribe } from '../events/setCommitEvents'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <UIModeProvider>{children}</UIModeProvider>
}

// ── Constants ──────────────────────────────────────────────────────────────────
//   The logger receives a fully-resolved PlannedWorkout from the auto-planner.
//   It is responsible ONLY for: displaying, capturing adjustments, and committing.
//   No DB reads happen inside the logger — only writes on final set completion.

const BENCH_PLAN: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 13.5,
  exercises: [
    {
      exerciseId: 'ex-bench',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 10,
      sets: 3,
      tier: 1,
      progressionGoal: 'Linear Progression: Add 2.5kg next session',
    },
  ],
}

const SINGLE_SET_PLAN: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 2,
  estimatedMinutes: 1.5,
  exercises: [
    {
      exerciseId: 'ex-squat',
      exerciseName: 'Squat',
      weight: 100,
      reps: 5,
      sets: 1,
      tier: 1,
      progressionGoal: 'Linear Progression: Add 5.0kg next session',
    },
  ],
}

// A plan where the first exercise has no history — planner signals this via "(Baseline)" in the goal.
const BASELINE_PLAN: PlannedWorkout = {
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 7.5,
  exercises: [
    {
      exerciseId: 'ex-bench-new',
      exerciseName: 'Bench Press',
      weight: 20,
      reps: 3,
      sets: 5,
      tier: 1,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
    },
  ],
}

describe('ActiveLogger', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    cleanup()
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  // ── Pre-filled display ─────────────────────────────────────────────────────
  // The primary promise of the app: the user opens the logger and immediately
  // sees exactly what weight and reps to lift — zero decision fatigue.

  it('displays the first exercise name with pre-filled weight and reps from the plan', () => {
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })

    expect(screen.getByRole('heading', { name: 'Bench Press' })).toBeInTheDocument()

    // Weight and reps must be editable inputs pre-populated by the plan.
    expect(screen.getByDisplayValue('80')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  // ── Complete Set → rest state ──────────────────────────────────────────────
  // After the user taps Complete Set the UI must transition to a visible
  // resting state and show the upcoming set number so they know what's next.

  it('shows a resting indicator and advances to Set 2 after completing Set 1', async () => {
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))

    // Rest timer ring must appear during the resting phase.
    expect(screen.getByLabelText(/rest timer/i)).toBeInTheDocument()

    // The counter must have advanced. UI must show "Set 2" somewhere
    // (e.g. "Set 2 of 3") so the user knows what's coming.
    expect(screen.getByText(/set\s*2\s*of\s*3/i, { selector: 'header p' })).toBeInTheDocument()

    // Drain the async DB write triggered by the click so afterEach does not
    // close the database while the write is still in flight.
    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeDefined()
    })
  })

  it('shows per-exercise logs in the exercise card with next-set guidance beside the goal', async () => {
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })

    expect(screen.getByText(/next:\s*set\s*1\s*of\s*3\s*\(3 left\)/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))

    expect(screen.getByText(/next:\s*set\s*2\s*of\s*3\s*\(2 left\)/i)).toBeInTheDocument()
    expect(screen.getByText(/s1:\s*80kg\s*[×x]\s*10/i)).toBeInTheDocument()
    expect(screen.queryByText(/bench press\s*—\s*log/i)).not.toBeInTheDocument()

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeDefined()
    })
  })

  it('writes a temp session draft after each completed set', async () => {
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeDefined()
      expect(draft?.phase).toBe('resting')
      expect(draft?.currentSetInEx).toBe(1)
      expect(draft?.weight).toBe(80)
      expect(draft?.reps).toBe(10)
      expect(draft?.completedSets).toHaveLength(1)
    })
  })

  it('cancels workout when confirmed, clears draft, and returns to home callback', async () => {
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 13.5,
      exercises: BENCH_PLAN.exercises,
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 10,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })

    const onDone = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ActiveLogger plan={BENCH_PLAN} db={db} onDone={onDone} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /cancel workout/i }))

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure? This will delete your current progress.')

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeUndefined()
    })

    expect(onDone).toHaveBeenCalledTimes(1)

    confirmSpy.mockRestore()
  })

  // ── Manual adjustment ─────────────────────────────────────────────────────
  // Inputs are pre-filled but the user MUST be able to lower weight/reps if
  // they failed the planned load (docs/ui_guidelines.md — "Inputs are only
  // touched if the user fails the set").

  it('accepts manual weight and reps adjustments before completing a set', () => {
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })

    const weightInput = screen.getByDisplayValue('80')
    const repsInput   = screen.getByDisplayValue('10')

    fireEvent.change(weightInput, { target: { value: '75' } })
    fireEvent.change(repsInput,   { target: { value: '8'  } })

    expect(screen.getByDisplayValue('75')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
  })

  // ── Final set commits to the database ─────────────────────────────────────
  // After the last set of the last exercise is tapped, one Workout record and
  // one WorkoutSet record per completed set must be written to IndexedDB.
  // dexie_schema_rules.md: PKs are UUIDs, not auto-increment integers.

  it('commits one Workout and the correct WorkoutSet to the DB after the final set', async () => {
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 2,
      estimatedMinutes: 1.5,
      exercises: SINGLE_SET_PLAN.exercises,
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 100,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })

    render(<ActiveLogger plan={SINGLE_SET_PLAN} db={db} />, { wrapper: Wrapper })

    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))

    await waitFor(async () => {
      const workouts = await db.workouts.toArray()
      expect(workouts).toHaveLength(1)
      expect(workouts[0].id).toBeTruthy()          // UUID was generated
      expect(workouts[0].date).toBeGreaterThan(0)  // timestamp was captured
    })

    const sets = await db.sets.toArray()
    expect(sets).toHaveLength(1)
    expect(sets[0].exerciseId).toBe('ex-squat')
    expect(sets[0].weight).toBe(100)
    expect(sets[0].reps).toBe(5)
    expect(sets[0].orderIndex).toBe(0)

    const draft = await db.tempSessions.get(TEMP_SESSION_ID)
    expect(draft).toBeUndefined()
  })

  it('resumes set position, reps, and weight from an existing temp session draft', () => {
    render(
      <ActiveLogger
        plan={BENCH_PLAN}
        db={db}
        initialDraft={{
          id: TEMP_SESSION_ID,
          routineType: 'PPL',
          sessionIndex: 0,
          estimatedMinutes: 13.5,
          exercises: BENCH_PLAN.exercises,
          currentExIndex: 0,
          currentSetInEx: 1,
          weight: 77.5,
          reps: 8,
          phase: 'active',
          restSecondsLeft: 60,
          completedSets: [
            { exerciseId: 'ex-bench', weight: 80, reps: 10, orderIndex: 0 },
          ],
          updatedAt: Date.now(),
        }}
      />,
      { wrapper: Wrapper },
    )

    expect(screen.getByText(/set\s*2\s*of\s*3/i, { selector: 'header p' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('77.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
  })

  // ── Baseline auto-focus ────────────────────────────────────────────────────
  // When an exercise has no history the planner marks progressionGoal with
  // "(Baseline)". ActiveLogger must auto-focus the weight input so the user
  // can type their real starting weight without manually tapping the field.

  it('auto-focuses the weight input when the first exercise has no history (Baseline goal)', () => {
    render(<ActiveLogger plan={BASELINE_PLAN} db={db} />, { wrapper: Wrapper })

    const weightInput = screen.getByDisplayValue('20')
    expect(weightInput).toHaveFocus()
  })

  it('weight input is editable (not readOnly) so users can type their real weight', () => {
    render(<ActiveLogger plan={BASELINE_PLAN} db={db} />, { wrapper: Wrapper })

    const weightInput = screen.getByDisplayValue('20')
    expect(weightInput).not.toHaveAttribute('readOnly')

    fireEvent.change(weightInput, { target: { value: '60' } })
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
  })

  it('publishes set-commit event after mid-session set', async () => {
    const publishSpy = vi.spyOn(setCommitEvents, 'publish')
    render(<ActiveLogger plan={BENCH_PLAN} db={db} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))
    await waitFor(() => expect(publishSpy).toHaveBeenCalledOnce())
    const call = publishSpy.mock.calls[0][0]
    expect(call.exerciseId).toBe('ex-bench')
    expect(call.weight).toBe(80)
    expect(call.reps).toBe(10)
    expect(call.volume).toBe(800)
    expect(call.source).toBe('mid-session')
    publishSpy.mockRestore()
  })

  it('publishes set-commit event with source final after last set', async () => {
    const publishSpy = vi.spyOn(setCommitEvents, 'publish')
    render(<ActiveLogger plan={SINGLE_SET_PLAN} db={db} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))
    await waitFor(() => expect(publishSpy).toHaveBeenCalledOnce())
    expect(publishSpy.mock.calls[0][0].source).toBe('final')
    expect(publishSpy.mock.calls[0][0].exerciseId).toBe('ex-squat')
    publishSpy.mockRestore()
  })

  it('commit path succeeds even when a combat listener throws', async () => {
    const unsub = subscribe(() => { throw new Error('combat exploded') })
    render(<ActiveLogger plan={SINGLE_SET_PLAN} db={db} />, { wrapper: Wrapper })
    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))
    await waitFor(async () => {
      const workouts = await db.workouts.toArray()
      expect(workouts).toHaveLength(1)
    })
    unsub()
  })
})
