// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
