import { describe, it, expect } from 'vitest'
import exercises from '../data/exercises.json'

describe('exercises.json output', () => {
  it('returns exactly 300 entries', () => {
    expect(exercises).toHaveLength(300)
  })

  it('has no duplicate ids', () => {
    expect(new Set((exercises as Array<{ id: string }>).map(e => e.id)).size).toBe(300)
  })

  it('has no duplicate lowercased names', () => {
    expect(new Set((exercises as Array<{ name: string }>).map(e => e.name.toLowerCase())).size).toBe(300)
  })

  it('all entries have numeric tier and no raw-only fields', () => {
    for (const e of exercises as Array<Record<string, unknown>>) {
      expect([1, 2, 3]).toContain(e['tier'])
      expect('technical_cues' in e).toBe(false)
      expect('biomechanical_why' in e).toBe(false)
    }
  })
})
