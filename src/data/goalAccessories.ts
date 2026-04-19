import type { ParsedGoal, TargetLift } from '../db/schema'

const ACCESSORIES_BY_LIFT: Record<TargetLift, string[]> = {
  'Bench Press': [
    'Close Grip Bench Press',
    'Incline Press',
    'Dumbbell Incline Press',
    'Dumbbell Bench Press',
    'Dips',
    'Overhead Press',
    'Skullcrushers',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
  ],
  'Back Squat': [
    'Front Squat',
    'Hack Squat',
    'Bulgarian Split Squat',
    'Leg Press',
    'Leg Extension',
    'Walking Lunges',
  ],
  'Deadlift': [
    'Romanian Deadlift',
    'Hip Thrust',
    'Barbell Row',
    'Barbell Shrug',
    'Hack Squat',
    'Glute Bridge',
  ],
  'Overhead Press': [
    'Dumbbell Shoulder Press',
    'Lateral Raise',
    'Front Raise',
    'Close Grip Bench Press',
    'Dips',
  ],
}

const LOWER_BODY_MUSCLE_GROUPS = new Set(['Legs', 'Glutes', 'Hamstrings', 'Calves', 'Quads'])
const LOWER_BODY_TAGS = new Set(['lower'])

interface ScoreableExercise {
  exerciseName: string
  muscleGroup?: string
  tags?: string[]
}

export function isLowerBody(exercise: ScoreableExercise): boolean {
  const inLowerGroup = exercise.muscleGroup ? LOWER_BODY_MUSCLE_GROUPS.has(exercise.muscleGroup) : false
  const hasLowerTag = exercise.tags?.some(t => LOWER_BODY_TAGS.has(t)) ?? false
  return inLowerGroup || hasLowerTag
}

export function scoreForGoal(exercise: ScoreableExercise, parsed: ParsedGoal | undefined): number {
  if (!parsed) return 0

  if (parsed.aim === 'lift-pr') {
    if (parsed.targetLifts.includes(exercise.exerciseName as TargetLift)) return 2
    for (const lift of parsed.targetLifts) {
      if (ACCESSORIES_BY_LIFT[lift].includes(exercise.exerciseName)) return 1
    }
    return 0
  }

  if (parsed.aim === 'jump' || parsed.aim === 'run') {
    return isLowerBody(exercise) ? 1 : 0
  }

  return 0
}

export function shouldEnduranceTilt(parsed: ParsedGoal | undefined): boolean {
  if (!parsed) return false
  return parsed.aim === 'run' || parsed.aim === 'stamina' || parsed.aim === 'fat-loss'
}
