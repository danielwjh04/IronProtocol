// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIModeProvider, useUIMode } from '../context/UIModeContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIModeProvider>{children}</UIModeProvider>
)

describe('UIModeContext', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to focus mode', () => {
    const { result } = renderHook(() => useUIMode(), { wrapper })
    expect(result.current.uiMode).toBe('focus')
  })

  it('reads persisted hero mode from localStorage on mount', () => {
    localStorage.setItem('ip_ui_mode', 'hero')
    const { result } = renderHook(() => useUIMode(), { wrapper })
    expect(result.current.uiMode).toBe('hero')
  })

  it('setUIMode updates mode and writes to localStorage', () => {
    const { result } = renderHook(() => useUIMode(), { wrapper })
    act(() => result.current.setUIMode('hero'))
    expect(result.current.uiMode).toBe('hero')
    expect(localStorage.getItem('ip_ui_mode')).toBe('hero')
  })

  it('switching back to focus writes focus to localStorage', () => {
    localStorage.setItem('ip_ui_mode', 'hero')
    const { result } = renderHook(() => useUIMode(), { wrapper })
    act(() => result.current.setUIMode('focus'))
    expect(result.current.uiMode).toBe('focus')
    expect(localStorage.getItem('ip_ui_mode')).toBe('focus')
  })

  it('dispatchCombat sets pendingBash with given intensity and a uuid id', () => {
    const { result } = renderHook(() => useUIMode(), { wrapper })
    act(() => result.current.dispatchCombat(0.8))
    expect(result.current.pendingBash?.intensity).toBe(0.8)
    expect(typeof result.current.pendingBash?.id).toBe('string')
    expect(result.current.pendingBash?.id.length).toBeGreaterThan(0)
  })

  it('consecutive dispatches with same intensity produce different ids', () => {
    const { result } = renderHook(() => useUIMode(), { wrapper })
    act(() => result.current.dispatchCombat(0.5))
    const id1 = result.current.pendingBash?.id
    act(() => result.current.dispatchCombat(0.5))
    const id2 = result.current.pendingBash?.id
    expect(id1).not.toBe(id2)
  })

  it('throws when useUIMode is used outside provider', () => {
    expect(() => renderHook(() => useUIMode())).toThrow(
      'useUIMode must be used within UIModeProvider',
    )
  })
})
