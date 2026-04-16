import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { isLabAvailable, fetchGemini } from '../services/geminiClient'
import { z } from 'zod'

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

  it('returns false when VITE_GEMINI_API_KEY is whitespace only', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '   ')
    expect(isLabAvailable()).toBe(false)
  })
})

describe('fetchGemini', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('throws when VITE_GEMINI_API_KEY is missing', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')
    await expect(fetchGemini('prompt', z.object({}))).rejects.toThrow(
      'Gemini API key missing',
    )
  })

  it('throws timeout error when fetch is aborted', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      return new Promise((_, reject) => {
        const err = new DOMException('Aborted', 'AbortError')
        reject(err)
      })
    })
    await expect(fetchGemini('prompt', z.object({}))).rejects.toThrow('timed out')
  })

  it('throws when response is not OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'invalid key' } }), { status: 403 }),
    )
    await expect(fetchGemini('prompt', z.object({}))).rejects.toThrow('invalid key')
  })

  it('throws when response body is not valid JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not-json', { status: 200 }),
    )
    await expect(fetchGemini('prompt', z.object({}))).rejects.toThrow('non-JSON')
  })

  it('throws when schema validation fails', async () => {
    const payload = {
      candidates: [{ content: { parts: [{ text: '{"wrong": true}' }] } }],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    )
    const schema = z.object({ required: z.string() })
    await expect(fetchGemini('prompt', schema)).rejects.toThrow('did not match expected schema')
  })

  it('returns parsed data when response is valid', async () => {
    const payload = {
      candidates: [{ content: { parts: [{ text: '{"value": 42}' }] } }],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    )
    const schema = z.object({ value: z.number() })
    const result = await fetchGemini('prompt', schema)
    expect(result.value).toBe(42)
  })
})
