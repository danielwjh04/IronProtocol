// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import WorkoutIgnition from '../components/WorkoutIgnition'

// Phase durations must match WorkoutIgnition.tsx
const PHASE_DURATIONS = [520, 480, 720]
const EXIT_DELAY_MS = 300
const TICK_VIBRATION_MS = 60
const FINAL_VIBRATION_MS = 140
const TOTAL_MS = PHASE_DURATIONS.reduce((a, b) => a + b, 0) + EXIT_DELAY_MS

afterEach(() => cleanup())

describe('WorkoutIgnition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens with READY and completes only after the final delay', async () => {
    const onComplete = vi.fn()

    render(<WorkoutIgnition onComplete={onComplete} />)

    expect(screen.getByText('READY')).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(TOTAL_MS - 1)
    })
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires a tick on each phase and a final heavy pulse', async () => {
    const onComplete = vi.fn()
    const vibrateSpy = vi.fn().mockReturnValue(true)

    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    })

    render(<WorkoutIgnition onComplete={onComplete} />)

    await act(async () => {
      vi.advanceTimersByTime(TOTAL_MS)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(TICK_VIBRATION_MS)
    expect(vibrateSpy).toHaveBeenCalledWith(FINAL_VIBRATION_MS)
    expect(vibrateSpy.mock.calls.filter(([duration]) => duration === TICK_VIBRATION_MS)).toHaveLength(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
