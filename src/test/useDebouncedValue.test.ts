// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not update before delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
    rerender({ val: 'bench' })
    expect(result.current).toBe('a')
  })

  it('updates after delay', () => {
    const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
    rerender({ val: 'bench' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('bench')
  })

  it('coalesces rapid changes', () => {
    const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
    rerender({ val: 'b' })
    rerender({ val: 'c' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('c')
  })
})
