import { describe, it, expect } from 'vitest'
import LZString from 'lz-string'
import { validateImportPayload } from '../validation/importSchema'

// Helper — builds a valid base64+lz-string encoded payload string.
function encode(obj: unknown): string {
  const json = JSON.stringify(obj)
  const compressed = LZString.compressToBase64(json)
  return compressed
}

const VALID_PAYLOAD = {
  exercises: [
    {
      id: 'a1b2c3d4-e5f6-4a90-8bcd-ef1234567890',
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    },
  ],
  workouts: [
    {
      id: 'b2c3d4e5-f6a7-4901-bcde-f12345678901',
      date: 1712000000,
      routineType: 'PPL',
      sessionIndex: 0,
      notes: 'Felt strong.',
    },
  ],
  sets: [
    {
      id: 'c3d4e5f6-a7b8-4012-8def-123456789012',
      workoutId: 'b2c3d4e5-f6a7-4901-bcde-f12345678901',
      exerciseId: 'a1b2c3d4-e5f6-4a90-8bcd-ef1234567890',
      weight: 80,
      reps: 8,
      orderIndex: 0,
    },
  ],
}

describe('validateImportPayload — four-step pipeline', () => {
  it('returns the parsed payload for a valid encoded string', () => {
    const result = validateImportPayload(encode(VALID_PAYLOAD))
    expect(result).toMatchObject(VALID_PAYLOAD)
  })

  it('throws on corrupt base64 / non-decompressible input', () => {
    expect(() => validateImportPayload('!!!not-valid-base64!!!')).toThrow()
  })

  it('throws when decompressed content is not valid JSON', () => {
    // Compress a non-JSON string so decompression succeeds but JSON.parse fails.
    const notJson = LZString.compressToBase64('this is not json {{{')
    expect(() => validateImportPayload(notJson)).toThrow()
  })

  it('throws when an exercise record has an extraneous field', () => {
    const hostile = {
      ...VALID_PAYLOAD,
      exercises: [{ ...VALID_PAYLOAD.exercises[0], injectedField: 'x' }],
    }
    expect(() => validateImportPayload(encode(hostile))).toThrow()
  })

  it('throws when a required field is missing from a workout record', () => {
    const broken = {
      ...VALID_PAYLOAD,
      workouts: [{ id: 'd4e5f6a7-b8c9-4d23-8ef0-123456789013', date: 1712000000, routineType: 'PPL', sessionIndex: 0 }], // missing notes
    }
    expect(() => validateImportPayload(encode(broken))).toThrow()
  })

  it('throws when routineType is missing from a workout record', () => {
    const broken = {
      ...VALID_PAYLOAD,
      workouts: [{ id: 'd4e5f6a7-b8c9-4d23-8ef0-123456789013', date: 1712000000, sessionIndex: 0, notes: 'no routine' }],
    }
    expect(() => validateImportPayload(encode(broken))).toThrow()
  })

  it('throws when any primary key is not UUID v4', () => {
    const broken = {
      ...VALID_PAYLOAD,
      sets: [{ ...VALID_PAYLOAD.sets[0], id: 'c3d4e5f6-a7b8-1012-8def-123456789012' }],
    }
    expect(() => validateImportPayload(encode(broken))).toThrow()
  })
})
