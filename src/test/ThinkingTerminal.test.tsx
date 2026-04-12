// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ThinkingTerminal from '../components/ThinkingTerminal'

function mockVibrate(): ReturnType<typeof vi.fn> {
  const vibrateMock = vi.fn().mockReturnValue(true)
  Object.defineProperty(window.navigator, 'vibrate', {
    configurable: true,
    value: vibrateMock,
  })
  return vibrateMock
}

describe('ThinkingTerminal onboarding mode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('hits protocol milestones at the expected boundaries and completes at exactly 10s', async () => {
    const onComplete = vi.fn()
    render(<ThinkingTerminal mode="onboarding" onComplete={onComplete} />)

    expect(screen.getByRole('heading', { name: /architect engine/i })).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2_999)
    })
    expect(screen.queryByText(/initiating qos optimization/i)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/initiating qos optimization/i)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2_999)
    })
    expect(screen.queryByText(/running routine selection lattice/i)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/running routine selection lattice/i)).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2_999)
    })
    expect(screen.queryByText(/sealing architect blueprint/i)).not.toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/sealing architect blueprint/i)).toBeInTheDocument()
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

  it('fires 50ms haptic ticks for logs and a final heavy thud at completion', async () => {
    const vibrateSpy = mockVibrate()
    const onComplete = vi.fn()

    render(<ThinkingTerminal mode="onboarding" onComplete={onComplete} />)

    await act(async () => {
      vi.advanceTimersByTime(10_000)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(50)
    expect(vibrateSpy).toHaveBeenCalledWith(120)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
