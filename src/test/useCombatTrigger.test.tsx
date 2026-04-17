// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIModeProvider, useUIMode } from '../context/UIModeContext'
import { useCombatTrigger } from '../hooks/useCombatTrigger'

const vibrateMock = vi.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  return <UIModeProvider>{children}</UIModeProvider>
}

function useCombined() {
  const { setUIMode, pendingBash } = useUIMode()
  const { triggerBash } = useCombatTrigger()
  return { setUIMode, triggerBash, pendingBash }
}

describe('useCombatTrigger', () => {
  beforeEach(() => {
    localStorage.clear()
    vibrateMock.mockClear()
    ;(navigator as unknown as Record<string, unknown>).vibrate = vibrateMock
  })

  it('no-op in focus mode — pendingBash stays null', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.triggerBash(100, 10))
    expect(result.current.pendingBash).toBeNull()
  })

  it('dispatches pendingBash in hero mode', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(100, 10))
    expect(result.current.pendingBash).not.toBeNull()
  })

  it('intensity equals weight×reps÷2000', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(100, 10))
    expect(result.current.pendingBash?.intensity).toBe(0.5)
  })

  it('intensity capped at 1 for heavy loads', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(300, 20))
    expect(result.current.pendingBash?.intensity).toBe(1)
  })

  it('intensity is 0 for bodyweight (weight=0)', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(0, 10))
    expect(result.current.pendingBash?.intensity).toBe(0)
  })

  it('heavy haptic pattern [120,30,40] when intensity > 0.7', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(200, 10))
    expect(vibrateMock).toHaveBeenCalledWith([120, 30, 40])
  })

  it('light haptic pattern [60,30,40] when intensity <= 0.7', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    act(() => result.current.triggerBash(100, 10))
    expect(vibrateMock).toHaveBeenCalledWith([60, 30, 40])
  })

  it('no vibrate call in focus mode', () => {
    const { result } = renderHook(() => useCombined(), { wrapper })
    act(() => result.current.triggerBash(200, 20))
    expect(vibrateMock).not.toHaveBeenCalled()
  })
})
