import { describe, it, expect } from 'vitest'
import { exerciseSchema } from '../validation/importSchema'

// Zod strict validation — these tests define the contract the schema must satisfy.
//
// Test 1 currently FAILS: the non-strict schema accepts extra properties,
//   so result.success is true when it must be false.
// Test 2 currently PASSES: a clean payload is accepted.
//
// Both tests will pass once .strict() is applied to exerciseSchema.

describe('importSchema — Zod strict validation', () => {
  it('rejects an exercise payload containing extraneous properties', () => {
    const result = exerciseSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4a90-8bcd-ef1234567890',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
      injectedField: 'malicious_value', // hostile extra field — must be rejected
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid exercise payload with no extra fields', () => {
    const result = exerciseSchema.safeParse({
      id: 'a1b2c3d4-e5f6-4a90-8bcd-ef1234567890',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non-v4 UUID even if shape is otherwise valid', () => {
    const result = exerciseSchema.safeParse({
      id: 'a1b2c3d4-e5f6-1a90-8bcd-ef1234567890',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    })
    expect(result.success).toBe(false)
  })
})
