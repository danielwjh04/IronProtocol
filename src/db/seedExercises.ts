import { v4 as uuidv4 } from 'uuid'
import type { Exercise, IronProtocolDB } from './schema'

type SeedExercise = Omit<Exercise, 'id'>

const IRON_EXERCISE_LIBRARY: SeedExercise[] = [
  {
    name: 'Back Squat',
    muscleGroup: 'Legs',
    mediaType: 'webp',
    mediaRef: 'squat.webp',
    tags: ['legs', 'lower', 'compound'],
    tier: 1,
  },
  {
    name: 'Bench Press',
    muscleGroup: 'Chest',
    mediaType: 'webp',
    mediaRef: 'bench.webp',
    tags: ['push', 'upper', 'compound'],
    tier: 1,
  },
  {
    name: 'Deadlift',
    muscleGroup: 'Legs',
    mediaType: 'webp',
    mediaRef: 'deadlift.webp',
    tags: ['legs', 'lower', 'compound'],
    tier: 1,
  },
  {
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    mediaType: 'webp',
    mediaRef: 'ohp.webp',
    tags: ['push', 'upper', 'compound'],
    tier: 1,
  },
  {
    name: 'Barbell Row',
    muscleGroup: 'Back',
    mediaType: 'webp',
    mediaRef: 'row.webp',
    tags: ['pull', 'upper', 'compound'],
    tier: 1,
  },
  {
    name: 'Pull Up',
    muscleGroup: 'Back',
    mediaType: 'webp',
    mediaRef: 'pull-up.webp',
    tags: ['pull', 'upper', 'compound'],
    tier: 1,
  },
  {
    name: 'Incline Press',
    muscleGroup: 'Chest',
    mediaType: 'webp',
    mediaRef: 'incline.webp',
    tags: ['push', 'upper', 'compound'],
    tier: 2,
  },
  {
    name: 'Romanian Deadlift',
    muscleGroup: 'Hamstrings',
    mediaType: 'webp',
    mediaRef: 'rdl.webp',
    tags: ['legs', 'lower', 'compound'],
    tier: 2, // secondary compound — T2, not a Big 4 anchor
  },
  {
    name: 'Leg Press',
    muscleGroup: 'Legs',
    mediaType: 'webp',
    mediaRef: 'leg-press.webp',
    tags: ['legs', 'lower', 'compound'],
    tier: 2,
  },
  {
    name: 'Biceps Curl',
    muscleGroup: 'Arms',
    mediaType: 'webp',
    mediaRef: 'curl.webp',
    tags: ['pull', 'upper', 'isolation'],
    tier: 3,
  },
  {
    name: 'Triceps Pushdown',
    muscleGroup: 'Arms',
    mediaType: 'webp',
    mediaRef: 'pushdown.webp',
    tags: ['push', 'upper', 'isolation'],
    tier: 3,
  },
  {
    name: 'Lateral Raise',
    muscleGroup: 'Shoulders',
    mediaType: 'webp',
    mediaRef: 'lateral-raise.webp',
    tags: ['push', 'upper', 'isolation'],
    tier: 3,
  },
]

export async function ensureIronExerciseLibrary(db: IronProtocolDB): Promise<void> {
  const existingExercises = await db.exercises.toArray()
  const existingNames = new Set(existingExercises.map((exercise) => exercise.name.toLowerCase()))

  const missingExercises = IRON_EXERCISE_LIBRARY
    .filter((exercise) => !existingNames.has(exercise.name.toLowerCase()))
    .map((exercise) => ({
      id: uuidv4(),
      ...exercise,
    }))

  if (missingExercises.length === 0) {
    return
  }

  await db.exercises.bulkAdd(missingExercises)
}
