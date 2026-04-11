import { z } from 'zod'
import LZString from 'lz-string'

// All schemas use .strict() so that any extraneous property causes an
// immediate parse failure. This is the first line of defence against
// hostile import payloads (see docs/import_validation.md).

const uuidV4Schema = z
  .string()
  .uuid()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

const exerciseTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

export const exerciseSchema = z.object({
  id: uuidV4Schema,
  name: z.string(),
  muscleGroup: z.string(),
  tier: exerciseTierSchema,
  tags: z.array(z.string()),
  mediaType: z.string(),
  mediaRef: z.string(),
}).strict()

export const workoutSchema = z.object({
  id: uuidV4Schema,
  date: z.number().int(),
  routineType: z.string().min(1),
  sessionIndex: z.number().int().nonnegative(),
  notes: z.string(),
}).strict()

export const workoutSetSchema = z.object({
  id: uuidV4Schema,
  workoutId: uuidV4Schema,
  exerciseId: uuidV4Schema,
  weight: z.number(),
  reps: z.number().int(),
  orderIndex: z.number().int(),
}).strict()

const importPayloadSchema = z.object({
  exercises: z.array(exerciseSchema),
  workouts: z.array(workoutSchema),
  sets: z.array(workoutSetSchema),
}).strict()

// Four-step validation pipeline (docs/import_validation.md):
//   1. base64-decode + lz-string decompress  2. JSON.parse  3. Zod.parse
// Throws immediately on any failure — no partial salvage, no sanitization.
export function validateImportPayload(payload: string): unknown {
  // Step 1 — decompress. LZString.decompressFromBase64 returns null on failure.
  const decompressed = LZString.decompressFromBase64(payload)
  if (decompressed === null || decompressed === '') {
    throw new Error('Import failed: could not decompress payload')
  }

  // Step 2 — parse JSON. Throws SyntaxError on invalid input.
  const parsed: unknown = JSON.parse(decompressed)

  // Step 3 — strict Zod validation. Throws ZodError on any mismatch.
  return importPayloadSchema.parse(parsed)
}
