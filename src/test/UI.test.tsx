// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import BottomNav from '../components/BottomNav'
import RecoveryLogForm from '../components/RecoveryLogForm'
import HomePage from '../pages/HomePage'
import { APP_SETTINGS_ID, IronProtocolDB, TEMP_SESSION_ID } from '../db/schema'
import { generateWorkoutBlueprint } from '../services/aiPlannerService'
import { persistMacrocycle } from '../services/macrocyclePersistence'
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

vi.mock('../services/aiPlannerService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/aiPlannerService')>()
  return {
    ...actual,
    generateWorkoutBlueprint: vi.fn(),
  }
})

vi.mock('../services/macrocyclePersistence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/macrocyclePersistence')>()
  return {
    ...actual,
    persistMacrocycle: vi.fn(),
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

const MOCK_AI_MACROCYCLE = {
  blueprint: {
    durationWeeks: 12 as const,
    weeks: [],
  },
  fallbackPool: {},
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

function buildCompleteV11PromptContract() {
  return {
    physiologicalBaselines: {
      ageYears: 29,
      bodyWeightKg: 82.5,
      gender: 'male' as const,
    },
    trainingExperienceLevel: 'intermediate' as const,
    logisticalConstraints: {
      targetDaysPerWeek: 3 as const,
      hardSessionLimitMinutes: 45,
    },
    equipmentAvailability: 'commercial-gym' as const,
    primaryGoals: {
      primaryFocus: 'strength' as const,
      specificLiftTargets: [],
    },
    injuryConstraints: {
      hasActiveConstraints: true,
      constraints: [{ structuralAversion: 'No spinal loading on consecutive days' }],
    },
  }
}

function buildCompleteSettings(overrides: Record<string, unknown> = {}) {
  return {
    id: APP_SETTINGS_ID,
    hasCompletedOnboarding: true,
    preferredRoutineType: 'PPL',
    daysPerWeek: 3,
    userName: 'TestUser',
    northStar: 'Build elite strength',
    purposeChip: 'strength' as const,
    qosMinutes: 45,
    v11PromptContract: buildCompleteV11PromptContract(),
    ...overrides,
  }
}

function buildTempSessionDraft(updatedAt = Date.now()) {
  return {
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
        tier: 1 as const,
        progressionGoal: 'Goal: 3 Reps (Baseline)',
      },
    ],
    currentExIndex: 0,
    currentSetInEx: 1,
    weight: 77.5,
    reps: 8,
    phase: 'active' as const,
    restSecondsLeft: 90,
    completedSets: [
      { exerciseId: 'ex-seed', weight: 80, reps: 5, orderIndex: 0 },
    ],
    updatedAt,
  }
}

function completeIdentitySplashToSubmit(): void {
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
  fireEvent.change(screen.getByPlaceholderText(/train to\.\.\./i), { target: { value: 'Build elite strength' } })
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

  fireEvent.change(screen.getByPlaceholderText(/years/i), { target: { value: '29' } })
  fireEvent.change(screen.getByPlaceholderText(/^kg$/i), { target: { value: '82.5' } })
  fireEvent.click(screen.getByRole('button', { name: /^male$/i }))
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

  fireEvent.click(screen.getByRole('button', { name: /^intermediate$/i }))
  fireEvent.click(screen.getByRole('button', { name: /^4x$/i }))
  fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } })
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

  fireEvent.click(screen.getByRole('button', { name: /commercial gym/i }))
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

  fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
  fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

  fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
  fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))
}

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
    vi.mocked(generateWorkoutBlueprint).mockReset()
    vi.mocked(persistMacrocycle).mockReset()
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
    vi.mocked(generateWorkoutBlueprint).mockResolvedValue(MOCK_AI_MACROCYCLE)
    vi.mocked(persistMacrocycle).mockResolvedValue(undefined)

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
    await db.settings.put(buildCompleteSettings())

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start next workout/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/time available/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ppl/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/ironprotocol: initialize engine/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/muscle group/i)).not.toBeInTheDocument()
  })

  it('displays the planner exercise blueprint automatically', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings())

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

  it('loads the next macrocycle workout from Dexie and hands off to review', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings())

    await db.exercises.bulkPut([
      {
        id: 'ex-ohp',
        name: 'Overhead Press',
        muscleGroup: 'Shoulders',
        mediaType: 'video',
        mediaRef: '',
        tags: ['push', 'compound'],
        tier: 1,
      },
      {
        id: 'ex-row',
        name: 'Barbell Row',
        muscleGroup: 'Back',
        mediaType: 'video',
        mediaRef: '',
        tags: ['pull', 'compound'],
        tier: 1,
      },
    ])

    await db.workouts.bulkPut([
      {
        id: 'wk-scheduled-1',
        date: 1_700_000_000_000,
        routineType: 'PPL',
        sessionIndex: 0,
        notes: '[macrocycle:auto]|w1d1|Day 1',
      },
      {
        id: 'wk-scheduled-2',
        date: 1_700_000_100_000,
        routineType: 'PPL',
        sessionIndex: 1,
        notes: '[macrocycle:auto]|w1d2|Day 2',
      },
      {
        id: 'wk-completed-1',
        date: 1_700_000_050_000,
        routineType: 'PPL',
        sessionIndex: 0,
        notes: '',
      },
    ])

    await db.sets.bulkPut([
      {
        id: 'set-1',
        workoutId: 'wk-scheduled-2',
        exerciseId: 'ex-ohp',
        weight: 52.5,
        reps: 5,
        orderIndex: 0,
      },
      {
        id: 'set-2',
        workoutId: 'wk-scheduled-2',
        exerciseId: 'ex-ohp',
        weight: 52.5,
        reps: 5,
        orderIndex: 1,
      },
      {
        id: 'set-3',
        workoutId: 'wk-scheduled-2',
        exerciseId: 'ex-row',
        weight: 70,
        reps: 8,
        orderIndex: 2,
      },
    ])

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start day 2/i })).toBeInTheDocument()
    })

    expect(vi.mocked(generateWorkout)).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /start day 2/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /blueprint gantry/i })).toBeInTheDocument()
    })

    expect(screen.getByText('Overhead Press')).toBeInTheDocument()
    expect(screen.getByText('Barbell Row')).toBeInTheDocument()
  })

  it('renders a Setup Required bento when planner returns an empty routineType', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings())

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

  it('routes incomplete onboarding users to the IdentitySplash V11 capture gate', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings({
      hasCompletedOnboarding: false,
      v11PromptContract: {
        ...buildCompleteV11PromptContract(),
        physiologicalBaselines: {
          ageYears: null,
          bodyWeightKg: null,
          gender: null,
        },
        injuryConstraints: {
          hasActiveConstraints: false,
          constraints: [],
        },
      },
    }))

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/train to\.\.\./i)).toBeInTheDocument()
    expect(screen.queryByText(/^Session Blueprint$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/time available/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /set your starting weights/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /initialize engine/i })).not.toBeInTheDocument()
  })

  it('advances IdentitySplash from Identity to Baselines after required fields are set', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings({
      hasCompletedOnboarding: false,
      v11PromptContract: {
        ...buildCompleteV11PromptContract(),
        physiologicalBaselines: {
          ageYears: null,
          bodyWeightKg: null,
          gender: null,
        },
        injuryConstraints: {
          hasActiveConstraints: false,
          constraints: [],
        },
      },
    }))

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.change(screen.getByPlaceholderText(/train to\.\.\./i), { target: { value: 'Build elite strength' } })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    await waitFor(() => {
      expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/years/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/^kg$/i)).toBeInTheDocument()
  })

  it('keeps users in IdentitySplash when onboarding is still false even with a complete V11 profile', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings({
      hasCompletedOnboarding: false,
    }))

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /set your starting weights/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /initialize engine/i })).not.toBeInTheDocument()
  })

  it('shows ThinkingTerminal while AI generation is pending, then routes to dashboard after resolve', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings({
      hasCompletedOnboarding: false,
      v11PromptContract: {
        ...buildCompleteV11PromptContract(),
        physiologicalBaselines: {
          ageYears: null,
          bodyWeightKg: null,
          gender: null,
        },
        injuryConstraints: {
          hasActiveConstraints: false,
          constraints: [],
        },
      },
    }))

    const deferred = createDeferredPromise<typeof MOCK_AI_MACROCYCLE>()
    vi.mocked(generateWorkoutBlueprint).mockReturnValueOnce(deferred.promise)

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
    })

    completeIdentitySplashToSubmit()

    await waitFor(() => {
      expect(screen.getByLabelText(/architect engine reasoning sequence/i)).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /start next workout/i })).not.toBeInTheDocument()

    deferred.resolve(MOCK_AI_MACROCYCLE)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start next workout/i })).toBeInTheDocument()
    })

    expect(screen.queryByLabelText(/architect engine reasoning sequence/i)).not.toBeInTheDocument()
  })

  it('shows a Resume Active Workout bento when a temp session draft exists', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings())
    await db.tempSessions.put(buildTempSessionDraft())

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /resume active workout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /discard draft/i })).toBeInTheDocument()
  })

  it('discards a temp draft and re-evaluates back to dashboard without refresh', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings())
    await db.tempSessions.put(buildTempSessionDraft())

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /discard draft/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start next workout/i })).toBeInTheDocument()
    })

    await waitFor(async () => {
      const draft = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(draft).toBeUndefined()
    })

    expect(screen.queryByRole('heading', { name: /resume active workout/i })).not.toBeInTheDocument()
  })

  it('prioritizes recovery when onboarding is already complete even if V11 profile fields are incomplete', async () => {
    await db.open()
    await db.settings.put(buildCompleteSettings({
      v11PromptContract: {
        ...buildCompleteV11PromptContract(),
        physiologicalBaselines: {
          ageYears: null,
          bodyWeightKg: null,
          gender: null,
        },
        injuryConstraints: {
          hasActiveConstraints: false,
          constraints: [],
        },
      },
    }))
    await db.tempSessions.put(buildTempSessionDraft())

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /resume active workout/i })).toBeInTheDocument()
    })

    expect(screen.queryByText(/step 1 of 6/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resume active workout/i })).toBeInTheDocument()
    expect(screen.queryByText(/^Session Blueprint$/i)).not.toBeInTheDocument()
  })
})

describe('RecoveryLogForm', () => {
  it('renders all 6 muscle group soreness chips', () => {
    render(
      <RecoveryLogForm workoutId="wk-1" db={{} as IronProtocolDB} onDone={vi.fn()} onSkip={vi.fn()} />,
    )
    for (const group of ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }
  })

  it('calls onSkip when skip link is clicked', () => {
    const onSkip = vi.fn()
    render(
      <RecoveryLogForm workoutId="wk-1" db={{} as IronProtocolDB} onDone={vi.fn()} onSkip={onSkip} />,
    )
    fireEvent.click(screen.getByText(/skip/i))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
