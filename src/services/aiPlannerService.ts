import type {
  Exercise,
  ExerciseTier,
  V11AppSettingsSchema,
  V11SpecificLiftTarget,
} from '../db/schema'
import { GOAL_TIER_PRESCRIPTIONS } from '../planner/autoPlanner'
import { db as ironDB } from '../db/db'
import { getEmbedding } from './localAIService'
import { cosineSimilarity } from '../utils/vectorMath'

export interface AIPlannedExercise {
  plannedExerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
}

export interface AIPlannedDay {
  dayNumber: number
  dayLabel: string
  plannedExercises: AIPlannedExercise[]
}

export interface AIPlannedWeek {
  weekNumber: number
  days: AIPlannedDay[]
}

export interface AIMacrocycleBlueprint {
  durationWeeks: typeof MACROCYCLE_WEEKS
  weeks: AIPlannedWeek[]
}

export interface AIFallbackExercise {
  exerciseName: string
  reason: string
}

export type AIFallbackPool = Record<string, AIFallbackExercise[]>

export interface AIGeneratedMacrocycle {
  blueprint: AIMacrocycleBlueprint
  fallbackPool: AIFallbackPool
}

export type AIExerciseTier = 'T1' | 'T2' | 'T3'

export interface AIExerciseSelection {
  workoutTitle: string
  primaryExercise: string
  muscleGroup: string
  tier: AIExerciseTier
  fallbacks: string[]
}

const MACROCYCLE_WEEKS = 12
const DEFAULT_DAYS_PER_WEEK = 3
const AI_PRIMARY_EXERCISES_PER_DAY = 5
const MIN_EXERCISES_PER_DAY = 8
const EXACT_FALLBACKS_PER_PRIMARY = 3

const AI_EXERCISE_SELECTION_INTERFACE = [
  'interface AIExerciseSelection {',
  '  workoutTitle: string',
  '  primaryExercise: string',
  '  muscleGroup: string',
  "  tier: 'T1' | 'T2' | 'T3'",
  '  fallbacks: string[]',
  '}',
  '',
  'type AIExerciseSelectionResponse = AIExerciseSelection[]',
].join('\n')


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

const AI_TIER_TO_NUMERIC_TIER: Record<AIExerciseTier, 1 | 2 | 3> = {
  T1: 1,
  T2: 2,
  T3: 3,
}

type LocalMacrocycleTrainingGoal = 'Hypertrophy' | 'Power'

function resolveLocalMacrocycleGoal(settings: V11AppSettingsSchema): LocalMacrocycleTrainingGoal {
  const primaryFocus = settings.primaryGoals.primaryFocus

  if (primaryFocus === 'strength' || primaryFocus === 'specific-lift-target') {
    return 'Power'
  }

  return 'Hypertrophy'
}

function resolveLocalTargetPrescription(
  tier: AIExerciseTier,
  trainingGoal: LocalMacrocycleTrainingGoal,
): { targetSets: number; targetReps: number } {
  const normalizedTier = AI_TIER_TO_NUMERIC_TIER[tier]
  const target = GOAL_TIER_PRESCRIPTIONS[trainingGoal][normalizedTier]

  return {
    targetSets: target.sets,
    targetReps: target.reps,
  }
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function canonicalizeExerciseName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ')
  return EXERCISE_NAME_ALIASES[normalizeExerciseName(collapsed)] ?? collapsed
}

function formatValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}

function formatSpecificLiftTarget(target: V11SpecificLiftTarget): string {
  const parts: string[] = [`lift=${target.liftName}`]

  if (typeof target.targetWeightKg === 'number') {
    parts.push(`targetWeightKg=${target.targetWeightKg}`)
  }

  if (typeof target.targetReps === 'number') {
    parts.push(`targetReps=${target.targetReps}`)
  }

  if (target.notes && target.notes.trim().length > 0) {
    parts.push(`notes=${target.notes.trim()}`)
  }

  return parts.join(', ')
}

function resolveTargetDaysPerWeek(settings: V11AppSettingsSchema): number {
  const configuredDays = settings.logisticalConstraints.targetDaysPerWeek
  if (configuredDays === 3 || configuredDays === 4 || configuredDays === 5) {
    return configuredDays
  }

  return DEFAULT_DAYS_PER_WEEK
}

function buildDayBuckets(selections: AIExerciseSelection[], daysPerWeek: number): AIExerciseSelection[][] {
  const buckets: AIExerciseSelection[][] = []

  for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex += 1) {
    const startIndex = dayIndex * AI_PRIMARY_EXERCISES_PER_DAY
    const endIndex = startIndex + AI_PRIMARY_EXERCISES_PER_DAY
    buckets.push(selections.slice(startIndex, endIndex))
  }

  return buckets
}

interface DayExerciseSeed {
  exerciseName: string
  tier: AIExerciseTier
  muscleGroup: string
}

function addUniqueSeed(
  seeds: DayExerciseSeed[],
  seen: Set<string>,
  candidate: DayExerciseSeed,
): void {
  const normalizedName = normalizeExerciseName(candidate.exerciseName)
  if (normalizedName.length === 0 || seen.has(normalizedName)) {
    return
  }

  seen.add(normalizedName)
  seeds.push(candidate)
}

function buildExpandedDaySeeds(
  daySelections: AIExerciseSelection[],
  allSelections: AIExerciseSelection[],
  minimumExercises: number,
): DayExerciseSeed[] {
  const seeds: DayExerciseSeed[] = []
  const seenNames = new Set<string>()

  for (const selection of daySelections) {
    addUniqueSeed(seeds, seenNames, {
      exerciseName: canonicalizeExerciseName(selection.primaryExercise),
      tier: selection.tier,
      muscleGroup: selection.muscleGroup,
    })
  }

  for (const selection of daySelections) {
    for (const fallback of selection.fallbacks) {
      addUniqueSeed(seeds, seenNames, {
        exerciseName: canonicalizeExerciseName(fallback),
        tier: selection.tier,
        muscleGroup: selection.muscleGroup,
      })

      if (seeds.length >= minimumExercises) {
        return seeds
      }
    }
  }

  for (const selection of allSelections) {
    addUniqueSeed(seeds, seenNames, {
      exerciseName: canonicalizeExerciseName(selection.primaryExercise),
      tier: selection.tier,
      muscleGroup: selection.muscleGroup,
    })

    if (seeds.length >= minimumExercises) {
      return seeds
    }
  }

  for (const selection of allSelections) {
    for (const fallback of selection.fallbacks) {
      addUniqueSeed(seeds, seenNames, {
        exerciseName: canonicalizeExerciseName(fallback),
        tier: selection.tier,
        muscleGroup: selection.muscleGroup,
      })

      if (seeds.length >= minimumExercises) {
        return seeds
      }
    }
  }

  return seeds
}

function normalizeSelectionCount(
  selections: AIExerciseSelection[],
  requiredCount: number,
): AIExerciseSelection[] {
  if (selections.length === requiredCount) {
    return selections
  }

  if (selections.length > requiredCount) {
    return selections.slice(0, requiredCount)
  }

  const expanded = [...selections]
  let cursor = 0

  while (expanded.length < requiredCount) {
    expanded.push(selections[cursor % selections.length])
    cursor += 1
  }

  return expanded
}

function buildGlobalFallbackPool(selections: AIExerciseSelection[]): AIFallbackExercise[] {
  const seenNames = new Set<string>()
  const pooledFallbacks: AIFallbackExercise[] = []

  for (const selection of selections) {
    const primaryExercise = canonicalizeExerciseName(selection.primaryExercise)

    for (const fallback of selection.fallbacks) {
      const canonicalFallback = canonicalizeExerciseName(fallback)
      const normalizedFallback = normalizeExerciseName(canonicalFallback)

      if (normalizedFallback.length === 0 || seenNames.has(normalizedFallback)) {
        continue
      }

      seenNames.add(normalizedFallback)
      pooledFallbacks.push({
        exerciseName: canonicalFallback,
        reason: `Fallback for ${primaryExercise}`,
      })
    }
  }

  return pooledFallbacks
}

export function generateLocalMacrocycle(
  selections: AIExerciseSelection[],
  settings: V11AppSettingsSchema,
): AIGeneratedMacrocycle {
  if (selections.length === 0) {
    throw new Error('AIExerciseSelection list is empty. Cannot build local macrocycle.')
  }

  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const requiredSelectionCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const normalizedSelections = normalizeSelectionCount(selections, requiredSelectionCount)
  const globalFallbackPool = buildGlobalFallbackPool(normalizedSelections)
  const dayBuckets = buildDayBuckets(normalizedSelections, daysPerWeek)
  const localTrainingGoal = resolveLocalMacrocycleGoal(settings)
  const weeks: AIPlannedWeek[] = []

  for (let weekNumber = 1; weekNumber <= MACROCYCLE_WEEKS; weekNumber += 1) {
    const days: AIPlannedDay[] = []

    for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex += 1) {
      const dayNumber = dayIndex + 1
      const daySelections = dayBuckets[dayIndex]
      const dayExerciseSeeds = buildExpandedDaySeeds(daySelections, normalizedSelections, MIN_EXERCISES_PER_DAY)

      const workoutTitle = daySelections
        .map((selection) => selection.workoutTitle.trim())
        .find((title) => title.length > 0)

      const focusLabel = daySelections
        .map((selection) => selection.muscleGroup.trim())
        .filter((label) => label.length > 0)
        .slice(0, 2)
        .join('/')

      const dayLabel = workoutTitle || (focusLabel.length > 0 ? `Day ${dayNumber} (${focusLabel})` : `Day ${dayNumber}`)

      const plannedExercises = dayExerciseSeeds.map((seed, exerciseIndex) => {
        const targetPrescription = resolveLocalTargetPrescription(seed.tier, localTrainingGoal)
        const plannedExerciseId = `w${weekNumber}d${dayNumber}e${exerciseIndex + 1}`

        return {
          plannedExerciseId,
          exerciseName: seed.exerciseName,
          targetSets: targetPrescription.targetSets,
          targetReps: targetPrescription.targetReps,
        }
      })

      days.push({
        dayNumber,
        dayLabel,
        plannedExercises,
      })
    }

    weeks.push({
      weekNumber,
      days,
    })
  }

  return {
    blueprint: {
      durationWeeks: MACROCYCLE_WEEKS,
      weeks,
    },
    fallbackPool: {
      global: globalFallbackPool,
    },
  }
}

export function buildSystemPrompt(settings: V11AppSettingsSchema): string {
  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const expectedPrimaryCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const specificTargets = settings.primaryGoals.specificLiftTargets.length > 0
    ? settings.primaryGoals.specificLiftTargets.map((target) => `- ${formatSpecificLiftTarget(target)}`).join('\n')
    : '- none'

  const injuryConstraints = settings.injuryConstraints.hasActiveConstraints
    ? settings.injuryConstraints.constraints
      .map((constraint) => constraint.structuralAversion.trim())
      .filter((constraint) => constraint.length > 0)
      .map((constraint) => `- ${constraint}`)
      .join('\n')
    : '- none'

  const settingsJson = JSON.stringify(settings, null, 2)

  return [
    '[ROLE]',
    'You are the IronProtocol Lab AI selector.',
    'Select only the best core exercise list for the user profile; do not create a macrocycle.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON only as a top-level array. No markdown fences and no extra prose.',
    'The JSON must match this TypeScript contract exactly:',
    AI_EXERCISE_SELECTION_INTERFACE,
    `MUST return exactly ${expectedPrimaryCount} objects (${daysPerWeek} days x ${AI_PRIMARY_EXERCISES_PER_DAY} primary exercises per day).`,
    "Use tier exactly as 'T1', 'T2', or 'T3'.",
    `Each object MUST include exactly ${EXACT_FALLBACKS_PER_PRIMARY} fallback exercise names in fallbacks.`,
    'Each object MUST include workoutTitle.',
    `Order the array in day blocks: first ${AI_PRIMARY_EXERCISES_PER_DAY} objects are Day 1, next ${AI_PRIMARY_EXERCISES_PER_DAY} are Day 2, etc.`,
    `Within each day block, use the same workoutTitle for all ${AI_PRIMARY_EXERCISES_PER_DAY} entries.`,
    'Workout titles must be goal-specific and biomechanically relevant (example patterns: "Explosive Vertical Power", "Hypertrophy Push").',
    'The object count and fallback count are mandatory; do not return more or less.',
    'The local app will expand this baseline for QoS scaling; preserve meaningful movement diversity and focus alignment.',
    '',
    '[SELECTION RULES]',
    'primaryGoals.primaryFocus is the highest-priority optimization signal for biomechanical relevance.',
    'Every primaryExercise must clearly serve primaryGoals.primaryFocus first.',
    'Respect equipment availability and injury constraints strictly.',
    'Prioritize compounds for T1, key accessory patterns for T2, and lower-load/isolations for T3.',
    'Use concise muscleGroup labels like Chest, Back, Legs, Shoulders, Arms, Core, Full Body.',
    '',
    '[ARCHITECTURE CONSTRAINTS]',
    'The app is Hybrid Offline-First.',
    'The local app will build the 12-week schedule from your selected exercises.',
    '',
    '[V11 USER CONSTRAINTS]',
    `physiologicalBaselines.ageYears: ${formatValue(settings.physiologicalBaselines.ageYears)}`,
    `physiologicalBaselines.bodyWeightKg: ${formatValue(settings.physiologicalBaselines.bodyWeightKg)}`,
    `physiologicalBaselines.gender: ${formatValue(settings.physiologicalBaselines.gender)}`,
    `trainingExperienceLevel: ${formatValue(settings.trainingExperienceLevel)}`,
    `logisticalConstraints.targetDaysPerWeek: ${formatValue(settings.logisticalConstraints.targetDaysPerWeek)}`,
    `logisticalConstraints.hardSessionLimitMinutes: ${formatValue(settings.logisticalConstraints.hardSessionLimitMinutes)}`,
    `equipmentAvailability: ${formatValue(settings.equipmentAvailability)}`,
    `primaryGoals.primaryFocus: ${formatValue(settings.primaryGoals.primaryFocus)}`,
    'primaryGoals.specificLiftTargets:',
    specificTargets,
    `injuryConstraints.hasActiveConstraints: ${formatValue(settings.injuryConstraints.hasActiveConstraints)}`,
    'injuryConstraints.constraints:',
    injuryConstraints,
    '',
    '[RAW V11 SETTINGS JSON]',
    settingsJson,
  ].join('\n')
}

const NUMERIC_TIER_TO_AI: Record<ExerciseTier, AIExerciseTier> = {
  1: 'T1',
  2: 'T2',
  3: 'T3',
}

const GOAL_QUERY_TEXT: Record<string, string> = {
  hypertrophy: 'muscle hypertrophy size bodybuilding volume',
  strength: 'strength power compound heavy barbell',
  endurance: 'endurance muscular stamina high rep cardio',
  'specific-lift-target': 'powerlifting strength peak specific lift',
}

async function findExercisesForGoal(settings: V11AppSettingsSchema): Promise<AIExerciseSelection[]> {
  const focus = settings.primaryGoals.primaryFocus
  const goalText = GOAL_QUERY_TEXT[focus] ?? focus
  const goalEmbedding = await getEmbedding(goalText)

  const exercises = await ironDB.exercises.toArray()
  const withEmbeddings = exercises.filter((e): e is Exercise & { embedding: number[] } =>
    Array.isArray(e.embedding) && e.embedding.length > 0,
  )

  if (withEmbeddings.length === 0) {
    throw new Error('No exercises with embeddings found. Run seedEmbeddings() before onboarding.')
  }

  const scored = withEmbeddings
    .map((exercise) => ({ exercise, score: cosineSimilarity(goalEmbedding, exercise.embedding) }))
    .sort((a, b) => b.score - a.score)

  const byMuscleGroup: Record<string, Exercise[]> = {}
  for (const { exercise } of scored) {
    const group = exercise.muscleGroup
    if (!byMuscleGroup[group]) {
      byMuscleGroup[group] = []
    }
    byMuscleGroup[group].push(exercise)
  }

  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const needed = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const topExercises = scored.slice(0, needed)
  const usedIds = new Set<string>()
  const selections: AIExerciseSelection[] = []

  for (const { exercise } of topExercises) {
    usedIds.add(exercise.id)
    const fallbacks = (byMuscleGroup[exercise.muscleGroup] ?? [])
      .filter((e) => !usedIds.has(e.id))
      .slice(0, EXACT_FALLBACKS_PER_PRIMARY)
      .map((e) => e.name)
    while (fallbacks.length < EXACT_FALLBACKS_PER_PRIMARY) {
      fallbacks.push(exercise.name)
    }
    selections.push({
      workoutTitle: `${exercise.muscleGroup} Focus`,
      primaryExercise: exercise.name,
      muscleGroup: exercise.muscleGroup,
      tier: NUMERIC_TIER_TO_AI[exercise.tier as ExerciseTier] ?? 'T2',
      fallbacks,
    })
  }

  return selections
}

export async function generateWorkoutBlueprint(settings: V11AppSettingsSchema): Promise<AIGeneratedMacrocycle> {
  const selections = await findExercisesForGoal(settings)
  const canonicalized = selections.map((selection) => ({
    workoutTitle: selection.workoutTitle.trim(),
    primaryExercise: canonicalizeExerciseName(selection.primaryExercise),
    muscleGroup: selection.muscleGroup.trim(),
    tier: selection.tier,
    fallbacks: selection.fallbacks.map((f) => canonicalizeExerciseName(f.trim())),
  }))
  return generateLocalMacrocycle(canonicalized, settings)
}
