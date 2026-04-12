import { v4 as uuidv4 } from 'uuid'
import type { Exercise, IronProtocolDB } from './schema'

type SeedExercise = Omit<Exercise, 'id'>

const IRON_EXERCISE_LIBRARY: SeedExercise[] = [
  // ─── TIER 1: THE BIG ANCHORS (Compound) ──────────────────────────────────
  { name: 'Back Squat', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'squat.webp', tags: ['legs', 'lower', 'compound'], tier: 1 },
  { name: 'Bench Press', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'bench.webp', tags: ['push', 'upper', 'compound'], tier: 1 },
  { name: 'Deadlift', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'deadlift.webp', tags: ['legs', 'lower', 'compound'], tier: 1 },
  { name: 'Overhead Press', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'ohp.webp', tags: ['push', 'upper', 'compound'], tier: 1 },
  { name: 'Barbell Row', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'row.webp', tags: ['pull', 'upper', 'compound'], tier: 1 },
  { name: 'Pull Up', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'pull-up.webp', tags: ['pull', 'upper', 'compound'], tier: 1 },
  { name: 'Dumbbell Bench Press', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'db-bench.webp', tags: ['push', 'upper', 'compound'], tier: 1 },
  { name: 'Close Grip Bench Press', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'close-grip-bench.webp', tags: ['push', 'upper', 'compound'], tier: 1 },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'bulgarian.webp', tags: ['legs', 'lower', 'compound'], tier: 1 },
  { name: 'Hack Squat', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'hack-squat.webp', tags: ['legs', 'lower', 'compound'], tier: 1 },
  { name: 'Front Squat', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'front-squat.webp', tags: ['legs', 'lower', 'compound'], tier: 1 },

  // ─── TIER 2: PUSH (Secondary Compounds) ──────────────────────────────────
  { name: 'Incline Press', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'incline.webp', tags: ['push', 'upper', 'compound'], tier: 2 },
  { name: 'Dumbbell Incline Press', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'db-incline.webp', tags: ['push', 'upper', 'compound'], tier: 2 },
  { name: 'Dips', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'dips.webp', tags: ['push', 'upper', 'compound'], tier: 2 },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'db-shoulder-press.webp', tags: ['push', 'upper', 'compound'], tier: 2 },

  // ─── TIER 2: PULL (Secondary Compounds) ──────────────────────────────────
  { name: 'Lat Pulldown', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'lat-pulldown.webp', tags: ['pull', 'upper', 'compound'], tier: 2 },
  { name: 'Seated Cable Row', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'cable-row.webp', tags: ['pull', 'upper', 'compound'], tier: 2 },
  { name: 'Dumbbell Row', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'db-row.webp', tags: ['pull', 'upper', 'compound'], tier: 2 },
  { name: 'T-Bar Row', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 't-bar-row.webp', tags: ['pull', 'upper', 'compound'], tier: 2 },
  { name: 'Chin Up', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'chin-up.webp', tags: ['pull', 'upper', 'compound'], tier: 2 },

  // ─── TIER 2: LEGS (Secondary Compounds) ──────────────────────────────────
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', mediaType: 'webp', mediaRef: 'rdl.webp', tags: ['legs', 'lower', 'compound'], tier: 2 },
  { name: 'Leg Press', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'leg-press.webp', tags: ['legs', 'lower', 'compound'], tier: 2 },
  { name: 'Hip Thrust', muscleGroup: 'Glutes', mediaType: 'webp', mediaRef: 'hip-thrust.webp', tags: ['legs', 'lower', 'compound'], tier: 2 },
  { name: 'Walking Lunges', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'lunges.webp', tags: ['legs', 'lower', 'compound'], tier: 2 },

  // ─── TIER 3: PUSH (Isolations) ───────────────────────────────────────────
  { name: 'Triceps Pushdown', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'pushdown.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'lateral-raise.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Cable Chest Fly', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'cable-fly.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Pec Deck Machine', muscleGroup: 'Chest', mediaType: 'webp', mediaRef: 'pec-deck.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Skullcrushers', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'skullcrushers.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Overhead Triceps Extension', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'oh-triceps.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },
  { name: 'Front Raise', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'front-raise.webp', tags: ['push', 'upper', 'isolation'], tier: 3 },

  // ─── TIER 3: PULL (Isolations) ───────────────────────────────────────────
  { name: 'Biceps Curl', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'curl.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Hammer Curl', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'hammer-curl.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Preacher Curl', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'preacher-curl.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Reverse Curl', muscleGroup: 'Arms', mediaType: 'webp', mediaRef: 'reverse-curl.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Rear Delt Fly', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'rear-delt-fly.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Barbell Shrug', muscleGroup: 'Back', mediaType: 'webp', mediaRef: 'shrug.webp', tags: ['pull', 'upper', 'isolation'], tier: 3 },
  { name: 'Face Pull', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'face-pull.webp', tags: ['pull', 'prehab', 'upper', 'isolation'], tier: 3 }, // Also tagged prehab

  // ─── TIER 3: LEGS (Isolations) ───────────────────────────────────────────
  { name: 'Leg Extension', muscleGroup: 'Legs', mediaType: 'webp', mediaRef: 'leg-extension.webp', tags: ['legs', 'lower', 'isolation'], tier: 3 },
  { name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', mediaType: 'webp', mediaRef: 'seated-leg-curl.webp', tags: ['legs', 'lower', 'isolation'], tier: 3 },
  { name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', mediaType: 'webp', mediaRef: 'lying-leg-curl.webp', tags: ['legs', 'lower', 'isolation'], tier: 3 },
  { name: 'Standing Calf Raise', muscleGroup: 'Calves', mediaType: 'webp', mediaRef: 'standing-calf.webp', tags: ['legs', 'lower', 'isolation'], tier: 3 },
  { name: 'Seated Calf Raise', muscleGroup: 'Calves', mediaType: 'webp', mediaRef: 'seated-calf.webp', tags: ['legs', 'lower', 'isolation'], tier: 3 },

  // ─── TIER 3: CORE (Universal Gap Fillers) ────────────────────────────────
  { name: 'Cable Crunch', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'cable-crunch.webp', tags: ['core', 'isolation'], tier: 3 },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'leg-raise.webp', tags: ['core', 'isolation'], tier: 3 },
  { name: 'Plank', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'plank.webp', tags: ['core', 'isolation'], tier: 3 },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'ab-wheel.webp', tags: ['core', 'compound'], tier: 3 },
  { name: 'Russian Twist', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'russian-twist.webp', tags: ['core', 'isolation'], tier: 3 },

  // ─── TIER 3: PRE-HAB (Universal Gap Fillers) ─────────────────────────────
  { name: 'Band Pull-Apart', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'band-pull.webp', tags: ['prehab', 'upper', 'isolation'], tier: 3 },
  { name: 'External Rotation', muscleGroup: 'Shoulders', mediaType: 'webp', mediaRef: 'external-rotation.webp', tags: ['prehab', 'upper', 'isolation'], tier: 3 },
  { name: 'Pallof Press', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'pallof.webp', tags: ['prehab', 'core', 'isolation'], tier: 3 },
  { name: 'Glute Bridge', muscleGroup: 'Glutes', mediaType: 'webp', mediaRef: 'glute-bridge.webp', tags: ['prehab', 'lower', 'isolation'], tier: 3 },
  { name: 'Bird Dog', muscleGroup: 'Core', mediaType: 'webp', mediaRef: 'bird-dog.webp', tags: ['prehab', 'core', 'isolation'], tier: 3 },
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
