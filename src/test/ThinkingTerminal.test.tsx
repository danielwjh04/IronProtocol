// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ThinkingTerminal from '../components/ThinkingTerminal'
import type { PlannedWorkout } from '../planner/autoPlanner'

const MOCK_PLAN: PlannedWorkout = {
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
  ],
}

describe('ThinkingTerminal onboarding mode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('cycles quotes every 3 seconds and never auto-completes onboarding mode', async () => {
    const onComplete = vi.fn()
    render(<ThinkingTerminal mode="onboarding" onComplete={onComplete} />)

    expect(screen.getByRole('heading', { name: /architect engine/i })).toBeInTheDocument()
    expect(screen.getByText(/discipline compounds quietly before it looks obvious/i)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3_100)
    })
    expect(screen.getByText(/precision today is momentum tomorrow/i)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3_100)
    })
    expect(screen.getByText(/consistency beats intensity when no one is watching/i)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('keeps planning mode completion semantics intact', async () => {
    const onComplete = vi.fn()

    render(<ThinkingTerminal mode="planning" plan={MOCK_PLAN} onComplete={onComplete} />)

    await act(async () => {
      vi.advanceTimersByTime(2_160)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
