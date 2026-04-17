// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../context/UIModeContext', () => ({
  useUIMode: vi.fn(() => ({ pendingBash: null })),
}))

import { useHitCombo } from '../hooks/useHitCombo'
import { useUIMode } from '../context/UIModeContext'
const mockUseUIMode = useUIMode as ReturnType<typeof vi.fn>

describe('useHitCombo', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts at 0 combo', () => {
    const { result } = renderHook(() => useHitCombo())
    expect(result.current.comboCount).toBe(0)
  })

  it('increments on new bash', () => {
    mockUseUIMode.mockReturnValue({ pendingBash: { id: 'a', intensity: 0.5 } })
    const { result } = renderHook(() => useHitCombo())
    expect(result.current.comboCount).toBe(1)
  })

  it('resets after window expires', () => {
    mockUseUIMode.mockReturnValue({ pendingBash: { id: 'b', intensity: 0.5 } })
    const { result } = renderHook(() => useHitCombo())
    act(() => vi.advanceTimersByTime(180_001))
    expect(result.current.comboCount).toBe(0)
  })
})
