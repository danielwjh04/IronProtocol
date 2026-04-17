// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetEmbedding, mockUpdate } = vi.hoisted(() => ({
  mockGetEmbedding: vi.fn().mockResolvedValue(new Array(384).fill(0)),
  mockUpdate: vi.fn().mockResolvedValue(1),
}))

vi.mock('../services/localAIService', () => ({ getEmbedding: mockGetEmbedding }))

vi.mock('../db/db', () => ({
  db: {
    exercises: {
      toArray: vi.fn().mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `e${i}`, name: `Ex ${i}`, muscleGroup: 'chest', tags: [], tier: 3,
          mediaType: 'none', mediaRef: '', embedding: undefined,
        }))
      ),
      update: mockUpdate,
    },
  },
}))

import { seedEmbeddings } from '../utils/seedEmbeddings'

describe('seedEmbeddings chunked', () => {
  beforeEach(() => mockGetEmbedding.mockClear())

  it('calls getEmbedding once per exercise with missing embedding', async () => {
    await seedEmbeddings()
    expect(mockGetEmbedding).toHaveBeenCalledTimes(10)
  })

  it('logs batch progress to console', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await seedEmbeddings()
    const calls = spy.mock.calls.map(c => c[0] as string)
    expect(calls.some(s => s.startsWith('Processed batch'))).toBe(true)
    spy.mockRestore()
  })
})
