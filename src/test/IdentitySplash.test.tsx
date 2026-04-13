// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import IdentitySplash from '../components/IdentitySplash'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'
import { generateWorkoutBlueprint } from '../services/aiPlannerService'
import { persistMacrocycle } from '../services/macrocyclePersistence'

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

afterEach(() => cleanup())

describe('IdentitySplash', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    vi.mocked(generateWorkoutBlueprint).mockReset()
    vi.mocked(generateWorkoutBlueprint).mockResolvedValue(MOCK_AI_MACROCYCLE)
    vi.mocked(persistMacrocycle).mockReset()
    vi.mocked(persistMacrocycle).mockResolvedValue(undefined)
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  function fillIdentityStep(name = 'Atlas'): void {
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: name } })
    fireEvent.change(screen.getByPlaceholderText(/train to/i), { target: { value: 'Build elite strength' } })
  }

  function fillBaselinesStep(): void {
    fireEvent.change(screen.getByPlaceholderText(/years/i), { target: { value: '29' } })
    fireEvent.change(screen.getByPlaceholderText(/^kg$/i), { target: { value: '82.5' } })
    fireEvent.click(screen.getByRole('button', { name: /^male$/i }))
  }

  function fillExperienceAndLogisticsStep(): void {
    fireEvent.click(screen.getByRole('button', { name: /^intermediate$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^4x$/i }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } })
  }

  function fillEquipmentStep(): void {
    fireEvent.click(screen.getByRole('button', { name: /commercial gym/i }))
  }

  function advanceToBaselinesStep(): void {
    fillIdentityStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
  }

  function advanceToExperienceStep(): void {
    advanceToBaselinesStep()
    fillBaselinesStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
  }

  function advanceToEquipmentStep(): void {
    advanceToExperienceStep()
    fillExperienceAndLogisticsStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
  }

  function advanceToGoalsStep(): void {
    advanceToEquipmentStep()
    fillEquipmentStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
  }

  function advanceToInjuriesStepWithStrengthGoal(): void {
    advanceToGoalsStep()
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))
  }

  it('renders identity step first with disabled next until name is provided', () => {
    render(<IdentitySplash db={db} />)

    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/train to/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()

    fillIdentityStep()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled()
  })

  it('requires complete physiological baselines before allowing progress', () => {
    render(<IdentitySplash db={db} />)

    advanceToBaselinesStep()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()

    fillBaselinesStep()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled()
  })

  it('requires specific lift target details when goal is specific-lift-target', () => {
    render(<IdentitySplash db={db} />)

    advanceToGoalsStep()

    fireEvent.click(screen.getByRole('button', { name: /specific lift target/i }))
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bench-press' } })
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/reps/i), { target: { value: '5' } })
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled()
  })

  it('requires at least one injury constraint when active constraints are enabled', () => {
    render(<IdentitySplash db={db} />)

    advanceToInjuriesStepWithStrengthGoal()

    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }))
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/constraint/i), {
      target: { value: 'No deep knee flexion under fatigue' },
    })
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeEnabled()
  })

  it('fires haptic thud and saves strict V11 + compatibility fields for specific-lift-target path', async () => {
    const vibrateSpy = vi.fn()
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
    })

    render(<IdentitySplash db={db} />)

    fillIdentityStep('Atlas')
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillBaselinesStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillExperienceAndLogisticsStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillEquipmentStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /specific lift target/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bench-press' } })
    fireEvent.change(screen.getByPlaceholderText(/kg/i), { target: { value: '140' } })
    fireEvent.change(screen.getByPlaceholderText(/reps/i), { target: { value: '3' } })
    fireEvent.change(screen.getByPlaceholderText(/competition timeline/i), {
      target: { value: 'Peak in 12 weeks' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }))
    fireEvent.change(screen.getByPlaceholderText(/constraint/i), {
      target: { value: 'No spinal loading on consecutive days' },
    })
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(true)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.northStar).toBe('Build elite strength')
      expect(settings?.purposeChip).toBe('strength')
      expect(settings?.qosMinutes).toBe(60)
      expect(settings?.daysPerWeek).toBe(4)

      expect(settings?.v11PromptContract).toBeDefined()
      expect(settings?.v11PromptContract?.physiologicalBaselines).toEqual({
        ageYears: 29,
        bodyWeightKg: 82.5,
        gender: 'male',
      })
      expect(settings?.v11PromptContract?.trainingExperienceLevel).toBe('intermediate')
      expect(settings?.v11PromptContract?.logisticalConstraints).toEqual({
        targetDaysPerWeek: 4,
        hardSessionLimitMinutes: 60,
      })
      expect(settings?.v11PromptContract?.equipmentAvailability).toBe('commercial-gym')
      expect(settings?.v11PromptContract?.primaryGoals.primaryFocus).toBe('specific-lift-target')
      expect(settings?.v11PromptContract?.primaryGoals.specificLiftTargets).toHaveLength(1)
      expect(settings?.v11PromptContract?.primaryGoals.specificLiftTargets[0]).toEqual({
        liftName: 'bench-press',
        targetWeightKg: 140,
        targetReps: 3,
        notes: 'Peak in 12 weeks',
      })
      expect(settings?.v11PromptContract?.injuryConstraints).toEqual({
        hasActiveConstraints: true,
        constraints: [{ structuralAversion: 'No spinal loading on consecutive days' }],
      })
    })

    expect(vibrateSpy).toHaveBeenCalledWith(100)
    expect(generateWorkoutBlueprint).toHaveBeenCalledTimes(1)
    expect(persistMacrocycle).toHaveBeenCalledTimes(1)
  })

  it('shows ThinkingTerminal during AI generation and marks onboarding complete after resolve', async () => {
    const deferred = createDeferredPromise<typeof MOCK_AI_MACROCYCLE>()
    vi.mocked(generateWorkoutBlueprint).mockReturnValueOnce(deferred.promise)

    render(<IdentitySplash db={db} />)

    fillIdentityStep('Atlas')
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillBaselinesStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillExperienceAndLogisticsStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillEquipmentStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/architect engine reasoning sequence/i)).toBeInTheDocument()
    })

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(false)
    })

    deferred.resolve(MOCK_AI_MACROCYCLE)

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(true)
    })

    await waitFor(() => {
      expect(screen.queryByLabelText(/architect engine reasoning sequence/i)).not.toBeInTheDocument()
    })

    expect(persistMacrocycle).toHaveBeenCalledWith(MOCK_AI_MACROCYCLE, db)
  })

  it('returns to IdentitySplash with retry error when AI generation fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const deferred = createDeferredPromise<typeof MOCK_AI_MACROCYCLE>()
    vi.mocked(generateWorkoutBlueprint).mockReturnValueOnce(deferred.promise)

    render(<IdentitySplash db={db} />)

    fillIdentityStep('Atlas')
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillBaselinesStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillExperienceAndLogisticsStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillEquipmentStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/architect engine reasoning sequence/i)).toBeInTheDocument()
    })

    deferred.promise.catch(() => {})
    deferred.reject(new Error('planner offline'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/planner offline/i)
    })

    await waitFor(() => {
      expect(screen.queryByLabelText(/architect engine reasoning sequence/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/step 6 of 6/i)).toBeInTheDocument()

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(false)
    })

    expect(persistMacrocycle).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('preserves existing system flags via merge-safe settings.put()', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'UpperLower',
      daysPerWeek: 3,
    })

    render(<IdentitySplash db={db} />)

    fillIdentityStep('Atlas')
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillBaselinesStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillExperienceAndLogisticsStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fillEquipmentStep()
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^endurance$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }))

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(true)
      expect(settings?.preferredRoutineType).toBe('UpperLower')
      expect(settings?.daysPerWeek).toBe(4)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.purposeChip).toBe('endurance')
      expect(settings?.v11PromptContract?.injuryConstraints.hasActiveConstraints).toBe(false)
    })

    expect(persistMacrocycle).toHaveBeenCalledTimes(1)
  })
})
