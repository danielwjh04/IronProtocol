// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSensoryFeedback } from '../hooks/useSensoryFeedback'

describe('useSensoryFeedback', () => {
  it('returns vibrate and crunch functions', () => {
    const { result } = renderHook(() => useSensoryFeedback())
    expect(typeof result.current.vibrate).toBe('function')
    expect(typeof result.current.crunch).toBe('function')
  })

  it('does not throw when APIs are absent', () => {
    const { result } = renderHook(() => useSensoryFeedback())
    expect(() => result.current.vibrate([50])).not.toThrow()
    expect(() => result.current.crunch(0.5)).not.toThrow()
  })
})

describe('vibration patterns', () => {
  it('heavyDouble triggers [200, 100, 200]', () => {
    const spy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true })
    const { result } = renderHook(() => useSensoryFeedback())
    result.current.heavyDouble()
    expect(spy).toHaveBeenCalledWith([200, 100, 200])
  })

  it('lightTap triggers [50]', () => {
    const spy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true })
    const { result } = renderHook(() => useSensoryFeedback())
    result.current.lightTap()
    expect(spy).toHaveBeenCalledWith([50])
  })
})
