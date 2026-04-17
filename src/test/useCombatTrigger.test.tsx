// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIModeProvider, useUIMode } from '../context/UIModeContext'
import { useCombatTrigger } from '../hooks/useCombatTrigger'
import { publish, subscribe } from '../events/setCommitEvents'
import type { SetCommitEvent } from '../events/setCommitEvents'

const vibrateMock = vi.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  return <UIModeProvider>{children}</UIModeProvider>
}

const BASE: SetCommitEvent = {
  exerciseId: 'ex-1',
  weight: 100,
  reps: 10,
  volume: 1000,
  timestamp: Date.now(),
  source: 'mid-session',
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

function useCombined() {
  const { setUIMode, pendingBash } = useUIMode()
  useCombatTrigger()
  return { setUIMode, pendingBash }
}

describe('useCombatTrigger', () => {
  beforeEach(() => {
    localStorage.clear()
    vibrateMock.mockClear()
    ;(navigator as unknown as Record<string, unknown>).vibrate = vibrateMock
  })

  it('no-op in focus mode – pendingBash stays null after event', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => publish(BASE))
    await act(flush)
    expect(result.current.pendingBash).toBeNull()
  })

  it('dispatches pendingBash in hero mode after event', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish(BASE))
    await act(flush)
    expect(result.current.pendingBash).not.toBeNull()
  })

  it('intensity equals volume / 2000', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish({ ...BASE, volume: 1000 }))
    await act(flush)
    expect(result.current.pendingBash?.intensity).toBe(0.5)
  })

  it('intensity clamped at 1 for heavy loads', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish({ ...BASE, volume: 6000 }))
    await act(flush)
    expect(result.current.pendingBash?.intensity).toBe(1)
  })

  it('intensity is 0 for bodyweight (volume 0)', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish({ ...BASE, volume: 0 }))
    await act(flush)
    expect(result.current.pendingBash?.intensity).toBe(0)
  })

  it('does not call vibrate directly (haptics fire at strike frame via onStrike)', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish({ ...BASE, volume: 2000 }))
    await act(flush)
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('dispatches combat for low intensity sets without calling vibrate', async () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => publish({ ...BASE, volume: 1000 }))
    await act(flush)
    expect(result.current.pendingBash?.intensity).toBe(0.5)
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('no vibrate call in focus mode', async () => {
    renderHook(() => useCombined(), { wrapper })
    act(() => publish({ ...BASE, volume: 4000 }))
    await act(flush)
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('unsubscribes on unmount – no crash after cleanup', async () => {
    const { result, unmount } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    unmount()
    const probe = vi.fn()
    const unsub = subscribe(probe)
    act(() => publish(BASE))
    await act(flush)
    expect(probe).toHaveBeenCalledOnce()
    expect(result.current.pendingBash).toBeNull()
    unsub()
  })
})
