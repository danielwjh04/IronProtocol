import { describe, it, expect } from 'vitest'
import { mergeRawExercises } from '../utils/mergeExercises'

describe('mergeRawExercises', () => {
  it('returns exactly 300 entries', async () => {
    const result = await mergeRawExercises()
    expect(result).toHaveLength(300)
  })

  it('has no duplicate ids', async () => {
    const result = await mergeRawExercises()
    expect(new Set(result.map(e => e.id)).size).toBe(300)
  })

  it('has no duplicate lowercased names', async () => {
    const result = await mergeRawExercises()
    expect(new Set(result.map(e => e.name.toLowerCase())).size).toBe(300)
  })

  it('all entries have numeric tier and no raw-only fields', async () => {
    const result = await mergeRawExercises()
    for (const e of result) {
      expect([1, 2, 3]).toContain(e.tier)
      expect('technical_cues' in e).toBe(false)
      expect('biomechanical_why' in e).toBe(false)
    }
  })
})
