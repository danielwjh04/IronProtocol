// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import BottomNav from '../components/BottomNav'
import HomePage from '../pages/HomePage'
import { APP_SETTINGS_ID, IronProtocolDB, TEMP_SESSION_ID } from '../db/schema'
import { generateWorkout } from '../planner/autoPlanner'
import type { PlannedWorkout } from '../planner/autoPlanner'

// Auto-mock the planner so component tests never hit IndexedDB.
vi.mock('../planner/autoPlanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../planner/autoPlanner')>()
  return {
    ...actual,
    generateWorkout: vi.fn(),
  }
})

// Bypass the 2.5 s CoreIgnition boot sequence in tests.
// The real component fires onComplete via setTimeout(fn, 2500); RTL v16 wraps
// each waitFor poll in act(), which does NOT advance real timers, so the
// settings page would never render. Mocking with useEffect makes act() flush
// the callback synchronously after mount.
vi.mock('../components/CoreIgnition', async () => {
  const { useEffect } = await import('react')
  return {
    default: function MockCoreIgnition({ onComplete }: { onComplete: () => void }) {
      useEffect(() => { onComplete() }, [])
      return null
    },
  }
})

// RTL auto-cleanup doesn't fire in per-file jsdom environments without
// Vitest globals enabled, so we register it manually.
afterEach(() => cleanup())

// ── BottomNav ──────────────────────────────────────────────────────────────────

describe('BottomNav', () => {
  it('renders Home, History, and Settings navigation links', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })
})

describe('Settings Data Ownership', () => {
  it('renders the Data Ownership card and export button on settings route', async () => {
    window.history.pushState({}, '', '/settings')
    const { default: App } = await import('../App')

    render(<App />)

    expect(screen.getByText(/data ownership/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download backup\.json/i })).toBeInTheDocument()

    window.history.pushState({}, '', '/')
  })
})

// ── HomePage ───────────────────────────────────────────────────────────────────

describe('HomePage', () => {
  let db: IronProtocolDB

  beforeEach(() => {
    vi.mocked(generateWorkout).mockReset()
    vi.mocked(generateWorkout).mockResolvedValue({
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [
        {
          exerciseId: 'ex-seed',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
    })

    db = new IronProtocolDB()
  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('renders dashboard controls only after onboarding is complete', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: true, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/^Session Blueprint$/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/time available/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ppl/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/ironprotocol: initialize engine/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/muscle group/i)).not.toBeInTheDocument()
  })

  it('displays the planner exercise blueprint automatically', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: true, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    const mockPlan: PlannedWorkout = {
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 9,
      exercises: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 10,
          sets: 3,
          tier: 1,
          progressionGoal: 'Linear Progression: Add 2.5kg next session',
        },
      ],
    }
    vi.mocked(generateWorkout).mockResolvedValueOnce(mockPlan)

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/time available/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/time available/i), { target: { value: '30' } })

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument()
    })
  })

  it('renders a Setup Required bento when planner returns an empty routineType', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: true, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    const coldStartMissingRoutine: PlannedWorkout = {
      routineType: '',
      sessionIndex: 0,
      estimatedMinutes: 0,
      exercises: [],
    }

    vi.mocked(generateWorkout)
      .mockResolvedValueOnce(coldStartMissingRoutine)
      .mockResolvedValueOnce(coldStartMissingRoutine)

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /setup required/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /^choose routine$/i })).toBeInTheDocument()
  })

  it('renders only the IronProtocol onboarding card when onboarding is incomplete', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: false, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/ironprotocol: initialize engine/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /initialize engine/i })).toBeInTheDocument()
    expect(screen.queryByText(/^Session Blueprint$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/time available/i)).not.toBeInTheDocument()
  })

  it('auto-advances onboarding tour steps with Next and reaches Finish on step 2', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: false, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    render(<HomePage db={db} />)

    fireEvent.click(screen.getByRole('button', { name: /initialize engine/i }))

    await waitFor(() => {
      expect(screen.getByText(/qos governor/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByText(/cycle memory/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByText(/progression engine/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /finish setup/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /initialize engine/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /finish setup/i })).toHaveLength(1)
  })

  it('uses GZCL selection on initialize and does not fall back to Burpees', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: false, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })

    vi.mocked(generateWorkout).mockImplementation(async ({ routineType }) => {
      if (routineType === 'GZCL') {
        return {
          routineType: 'GZCL',
          sessionIndex: 0,
          estimatedMinutes: 15,
          exercises: [
            {
              exerciseId: 'ex-squat',
              exerciseName: 'Back Squat',
              weight: 100,
              reps: 5,
              sets: 5,
              tier: 1,
              progressionGoal: 'Goal: 3 Reps (Baseline)',
            },
          ],
        }
      }

      return {
        routineType: 'PPL',
        sessionIndex: 0,
        estimatedMinutes: 12,
        exercises: [
          {
            exerciseId: 'ex-burpees',
            exerciseName: 'Burpees',
            weight: 0,
            reps: 12,
            sets: 3,
            tier: 3,
            progressionGoal: 'Goal: 12 Reps (Baseline)',
          },
        ],
      }
    })

    render(<HomePage db={db} />)

    fireEvent.click(screen.getByRole('button', { name: /^gzcl$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize engine/i }))

    await waitFor(() => {
      expect(screen.getByText(/back squat/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/workout\s+day\s+1\s+of\s+4/i)).toBeInTheDocument()

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.preferredRoutineType).toBe('GZCL')
    })
  })

  it('shows a Resume Active Workout bento when a temp session draft exists', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: true, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [
        {
          exerciseId: 'ex-seed',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Goal: 3 Reps (Baseline)',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 1,
      weight: 77.5,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [
        { exerciseId: 'ex-seed', weight: 80, reps: 5, orderIndex: 0 },
      ],
      updatedAt: Date.now(),
    })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /resume active workout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
  })

  it('discards a temp draft and re-evaluates back to dashboard without refresh', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: true, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [
        {
          exerciseId: 'ex-seed',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Goal: 3 Reps (Baseline)',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 1,
      weight: 77.5,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [
        { exerciseId: 'ex-seed', weight: 80, reps: 5, orderIndex: 0 },
      ],
      updatedAt: Date.now(),
    })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /discard draft/i }))

    await waitFor(() => {
      expect(screen.getByText(/^Session Blueprint$/i)).toBeInTheDocument()
    })

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeUndefined()
    })

    expect(screen.queryByRole('heading', { name: /resume active workout/i })).not.toBeInTheDocument()
  })

  it('prioritizes recovery state over onboarding when temp_session exists', async () => {
    await db.open()
    await db.settings.put({ id: APP_SETTINGS_ID, hasCompletedOnboarding: false, preferredRoutineType: 'PPL', daysPerWeek: 3, userName: 'TestUser' })
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 18,
      exercises: [
        {
          exerciseId: 'ex-seed',
          exerciseName: 'Bench Press',
          weight: 80,
          reps: 5,
          sets: 5,
          tier: 1,
          progressionGoal: 'Goal: 3 Reps (Baseline)',
        },
      ],
      currentExIndex: 0,
      currentSetInEx: 1,
      weight: 77.5,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [
        { exerciseId: 'ex-seed', weight: 80, reps: 5, orderIndex: 0 },
      ],
      updatedAt: Date.now(),
    })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })
    expect(screen.queryByText(/ironprotocol: initialize engine/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Session Blueprint$/i)).not.toBeInTheDocument()
  })
})
