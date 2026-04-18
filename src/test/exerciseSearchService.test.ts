// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/localAIService', () => ({ getEmbedding: vi.fn().mockResolvedValue([1, 0, 0]) }))
vi.mock('../db/db', () => ({
  db: {
    exercises: {
      toArray: vi.fn().mockResolvedValue([
        { id: 'e1', name: 'Bench Press', muscleGroup: 'chest', tags: [], tier: 1, mediaType: 'none', mediaRef: '', embedding: [1, 0, 0] },
        { id: 'e2', name: 'Squat',       muscleGroup: 'legs',  tags: [], tier: 1, mediaType: 'none', mediaRef: '', embedding: [0, 1, 0] },
      ]),
    },
  },
}))

import { searchExercises } from '../services/exerciseSearchService'

describe('searchExercises', () => {
  it('returns exercises sorted by cosine similarity, best first', async () => {
    const results = await searchExercises('bench press')
    expect(results[0].exerciseId).toBe('e1')
    expect(results[0].score).toBeGreaterThan(results[1].score)
  })

  it('result shape has exerciseId, name, muscleGroup, tier, score', async () => {
    const results = await searchExercises('bench press')
    const r = results[0]
    expect(typeof r.exerciseId).toBe('string')
    expect(typeof r.name).toBe('string')
    expect(typeof r.muscleGroup).toBe('string')
    expect(typeof r.score).toBe('number')
  })
})
