import { describe, it, expect, vi, afterEach } from 'vitest'
import { isLabAvailable } from '../services/geminiClient'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isLabAvailable', () => {
  it('returns false when VITE_GEMINI_API_KEY is missing', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')
    expect(isLabAvailable()).toBe(false)
  })

  it('returns true when VITE_GEMINI_API_KEY is set', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key-abc')
    expect(isLabAvailable()).toBe(true)
  })
})
