// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import WorkoutIgnition from '../components/WorkoutIgnition'

afterEach(() => cleanup())

describe('WorkoutIgnition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens with WORKOUT. and completes only after the final delay', async () => {
    const onComplete = vi.fn()

    render(<WorkoutIgnition onComplete={onComplete} />)

    expect(screen.getByText('WORKOUT.')).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(999)
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
      vi.advanceTimersByTime(1200)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(70)
    expect(vibrateSpy).toHaveBeenCalledWith(120)
    expect(vibrateSpy.mock.calls.filter(([duration]) => duration === 70)).toHaveLength(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
