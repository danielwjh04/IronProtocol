import { describe, expect, it } from 'vitest'
import { cosineSimilarity } from '../utils/vectorMath'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('returns 0 for a zero vector', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
  })

  it('computes correct similarity for arbitrary vectors', () => {
    const a = [1, 2, 3]
    const b = [4, 5, 6]
    const dot = 1 * 4 + 2 * 5 + 3 * 6
    const magA = Math.sqrt(1 + 4 + 9)
    const magB = Math.sqrt(16 + 25 + 36)
    expect(cosineSimilarity(a, b)).toBeCloseTo(dot / (magA * magB))
  })
})
