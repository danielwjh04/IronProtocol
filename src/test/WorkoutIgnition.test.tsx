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

  it('runs 3 → 2 → 1 countdown and completes only after final delay', async () => {
    const onComplete = vi.fn()

    render(<WorkoutIgnition onComplete={onComplete} />)

    expect(screen.getByText('LOAD')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(999)
    })
    expect(screen.getByText('LOAD')).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1319)
    })
    expect(onComplete).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires haptics on each step and a final heavy pulse', async () => {
    const onComplete = vi.fn()
    const vibrateSpy = vi.fn().mockReturnValue(true)

    Object.defineProperty(window.navigator, 'vibrate', {
      configurable: true,
      value: vibrateSpy,
    })

    render(<WorkoutIgnition onComplete={onComplete} />)

    await act(async () => {
      vi.advanceTimersByTime(3320)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(70)
    expect(vibrateSpy).toHaveBeenCalledWith(120)
    expect(vibrateSpy.mock.calls.filter(([duration]) => duration === 70)).toHaveLength(3)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})