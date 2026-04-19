export interface PlannedMacrocycleExercise {
  plannedExerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
}

export interface PlannedMacrocycleDay {
  dayNumber: number
  dayLabel: string
  plannedExercises: PlannedMacrocycleExercise[]
}

export interface PlannedMacrocycleWeek {
  weekNumber: number
  days: PlannedMacrocycleDay[]
}

export const MACROCYCLE_WEEKS = 12

export interface MacrocycleBlueprint {
  durationWeeks: typeof MACROCYCLE_WEEKS
  weeks: PlannedMacrocycleWeek[]
}

export interface MacrocycleFallbackExercise {
  exerciseName: string
  reason: string
}

export type MacrocycleFallbackPool = Record<string, MacrocycleFallbackExercise[]>

export interface GeneratedMacrocycle {
  blueprint: MacrocycleBlueprint
  fallbackPool: MacrocycleFallbackPool
}

export type AIGeneratedMacrocycle = GeneratedMacrocycle
export type AIMacrocycleBlueprint = MacrocycleBlueprint
export type AIPlannedWeek = PlannedMacrocycleWeek
export type AIPlannedDay = PlannedMacrocycleDay
export type AIPlannedExercise = PlannedMacrocycleExercise
export type AIFallbackExercise = MacrocycleFallbackExercise
export type AIFallbackPool = MacrocycleFallbackPool

const EXERCISE_NAME_ALIASES: Record<string, string> = {
  'close-grip bench press': 'Close Grip Bench Press',
  'close-grip dumbbell press': 'Dumbbell Bench Press',
  'pull-up': 'Pull Up',
  'chin-up': 'Chin Up',
  'one-arm dumbbell row': 'Dumbbell Row',
  'one-arm row': 'Dumbbell Row',
  'chest supported row': 'Seated Cable Row',
  'seated row': 'Seated Cable Row',
  'cable lateral raise': 'Lateral Raise',
  'dumbbell lateral raise': 'Lateral Raise',
  'triceps pressdown': 'Triceps Pushdown',
  'leg curl': 'Seated Leg Curl',
  'hamstring curl': 'Seated Leg Curl',
  'incline dumbbell press': 'Dumbbell Incline Press',
  'machine shoulder press': 'Dumbbell Shoulder Press',
  'barbell lunge': 'Walking Lunges',
  'walking lunge': 'Walking Lunges',
  'dumbbell lunge': 'Walking Lunges',
  'split squat': 'Bulgarian Split Squat',
  'dumbbell split squat': 'Bulgarian Split Squat',
  'dumbbell step-up': 'Walking Lunges',
  'rear delt raise': 'Rear Delt Fly',
  'reverse fly': 'Rear Delt Fly',
  'dumbbell curl': 'Biceps Curl',
  'cable curl': 'Biceps Curl',
  'floor press': 'Dumbbell Bench Press',
  skullcrusher: 'Skullcrushers',
  'dumbbell front squat': 'Front Squat',
  'goblet squat': 'Front Squat',
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function canonicalizeExerciseName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ')
  return EXERCISE_NAME_ALIASES[normalizeExerciseName(collapsed)] ?? collapsed
}
