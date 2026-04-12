import type { Exercise, IronProtocolDB, PurposeChip } from '../db/schema'
import type { PlannedExercise } from '../planner/autoPlanner'
import { getExerciseCategory } from '../data/functionalMapping'

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function dedupeExercises(exercises: readonly Exercise[]): Exercise[] {
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const uniqueExercises: Exercise[] = []

  for (const exercise of exercises) {
    const normalizedName = normalizeExerciseName(exercise.name)
    if (seenIds.has(exercise.id) || seenNames.has(normalizedName)) {
      continue
    }
    seenIds.add(exercise.id)
    seenNames.add(normalizedName)
    uniqueExercises.push(exercise)
  }

  return uniqueExercises
}

export function hasExerciseOrderChanged(
  previous: readonly PlannedExercise[],
  next: readonly PlannedExercise[],
): boolean {
  if (previous.length !== next.length) {
    return true
  }

  return previous.some((exercise, index) => exercise.exerciseId !== next[index]?.exerciseId)
}

export function reorderExercisesById(
  currentExercises: readonly PlannedExercise[],
  orderedExerciseIds: readonly string[],
): PlannedExercise[] {
  if (currentExercises.length !== orderedExerciseIds.length) {
    return [...currentExercises]
  }

  const currentUniqueIds = new Set(currentExercises.map((exercise) => exercise.exerciseId))
  const orderedUniqueIds = new Set(orderedExerciseIds)
  if (currentUniqueIds.size !== currentExercises.length || orderedUniqueIds.size !== orderedExerciseIds.length) {
    return [...currentExercises]
  }

  const byId = new Map(currentExercises.map((exercise) => [exercise.exerciseId, exercise]))
  const reordered: PlannedExercise[] = []

  for (const exerciseId of orderedExerciseIds) {
    const resolved = byId.get(exerciseId)
    if (!resolved) {
      return [...currentExercises]
    }
    reordered.push(resolved)
  }

  if (new Set(reordered.map((exercise) => exercise.exerciseId)).size !== reordered.length) {
    return [...currentExercises]
  }

  return reordered
}

/**
 * Goal-first category utility.
 * Given an exercise name and an exercise pool, returns all other exercises
 * that belong to the exact same biomechanical category.
 */
export function getExercisesInSameCategory(
  exerciseName: string,
  exercises: readonly Exercise[],
): Exercise[] {
  const sourceCategory = getExerciseCategory(exerciseName)
  if (!sourceCategory) {
    return []
  }

  const normalizedSourceName = normalizeExerciseName(exerciseName)

  return dedupeExercises(exercises.filter((exercise) => (
    normalizeExerciseName(exercise.name) !== normalizedSourceName
    && getExerciseCategory(exercise.name) === sourceCategory
  )))
}

interface SwapRepTargetInput {
  sourceExerciseName: string
  sourceTags?: readonly string[]
  targetExerciseName: string
  currentReps: number
  purposeChip?: PurposeChip | null
}

function isCompoundExercise(exerciseName: string, sourceTags: readonly string[] = []): boolean {
  if (sourceTags.some((tag) => tag.trim().toLowerCase() === 'compound')) {
    return true
  }

  const category = getExerciseCategory(exerciseName)
  if (!category) {
    return false
  }

  return category !== 'Accessory' && category !== 'Core'
}

function purposeRepRange(purposeChip?: PurposeChip | null): { min: number; max: number } {
  if (purposeChip === 'strength') {
    return { min: 8, max: 10 }
  }

  // Hypertrophy and all endurance-biased goals default to higher-rep accessory work.
  return { min: 12, max: 15 }
}

/**
 * Intensity guard for Smart Swap.
 * Compound -> Compound keeps reps unchanged.
 * Compound -> Accessory lifts reps into purpose-aligned ranges.
 */
export function getSwapRepTarget({
  sourceExerciseName,
  sourceTags = [],
  targetExerciseName,
  currentReps,
  purposeChip,
}: SwapRepTargetInput): number {
  const sourceIsCompound = isCompoundExercise(sourceExerciseName, sourceTags)
  const targetCategory = getExerciseCategory(targetExerciseName)

  if (!sourceIsCompound || targetCategory !== 'Accessory') {
    return currentReps
  }

  const { min, max } = purposeRepRange(purposeChip)
  if (currentReps < min) {
    return min
  }
  if (currentReps > max) {
    return max
  }

  return currentReps
}

/**
 * Finds alternative exercises for a given source exercise.
 * Criteria:
 * 1. Matches the source exercise's tier.
 * 2. Matches at least one tag (e.g., 'push', 'upper').
 * 3. Not the source exercise itself.
 * 4. Limited to top 3 based on tag-matching score.
 */
export async function getAlternatives(
  db: IronProtocolDB,
  sourceExercise: PlannedExercise,
  limit: number = 3
): Promise<Exercise[]> {
  const allExercises = await db.exercises.toArray()

  // PlannedExercise might not have tags directly, so we might need to fetch the original exercise
  const sourceOriginal = await db.exercises.get(sourceExercise.exerciseId)
  const tagsToMatch = sourceOriginal ? sourceOriginal.tags : []

  const alternatives = allExercises
    .filter((e) => e.tier === sourceExercise.tier && e.id !== sourceExercise.exerciseId)
    .map((e) => {
      const matchCount = e.tags.filter((t) => tagsToMatch.includes(t)).length
      return { exercise: e, matchCount }
    })
    .filter((entry) => entry.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((entry) => entry.exercise)

  return dedupeExercises(alternatives).slice(0, limit)
}

function rankGoalFirstCandidates(
  candidates: Exercise[],
  sourceTier: PlannedExercise['tier'],
  sourceTags: string[],
): Exercise[] {
  return candidates
    .map((exercise) => {
      const tierMatch = exercise.tier === sourceTier ? 1 : 0
      const matchCount = exercise.tags.filter((tag) => sourceTags.includes(tag)).length
      return { exercise, tierMatch, matchCount }
    })
    .sort((a, b) => {
      if (b.tierMatch !== a.tierMatch) {
        return b.tierMatch - a.tierMatch
      }
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount
      }
      return a.exercise.name.localeCompare(b.exercise.name)
    })
    .map((entry) => entry.exercise)
}

interface SmartSwapGuards {
  blockedExerciseIds?: readonly string[]
  blockedExerciseNames?: readonly string[]
}

function applySmartSwapGuards(
  candidates: readonly Exercise[],
  sourceExercise: PlannedExercise,
  guards: SmartSwapGuards,
): Exercise[] {
  const blockedIds = new Set(guards.blockedExerciseIds ?? [])
  const blockedNames = new Set(
    (guards.blockedExerciseNames ?? []).map((name) => normalizeExerciseName(name)),
  )
  const normalizedSourceName = normalizeExerciseName(sourceExercise.exerciseName)

  return candidates.filter((exercise) => {
    const normalizedCandidateName = normalizeExerciseName(exercise.name)

    if (exercise.id === sourceExercise.exerciseId || normalizedCandidateName === normalizedSourceName) {
      return false
    }
    if (blockedIds.has(exercise.id)) {
      return false
    }
    if (blockedNames.has(normalizedCandidateName)) {
      return false
    }

    return true
  })
}

interface SmartSwapOptions extends SmartSwapGuards {
  limit?: number
}

/**
 * Category-first alternatives for the Smart Swap drawer.
 *
 * Priority order:
 * 1) Same biomechanical category and same tier
 * 2) Ranked by tag overlap
 * 3) Fallback to existing tag-based alternatives when category is unavailable
 */
export async function getSmartSwapAlternatives(
  db: IronProtocolDB,
  sourceExercise: PlannedExercise,
  options: SmartSwapOptions = {},
): Promise<Exercise[]> {
  const limit = options.limit ?? 4
  const allExercises = dedupeExercises(await db.exercises.toArray())
  const sourceOriginal = await db.exercises.get(sourceExercise.exerciseId)
  const sourceName = sourceOriginal?.name ?? sourceExercise.exerciseName
  const sourceCategory = getExerciseCategory(sourceName)
  const sourceTags = sourceOriginal?.tags ?? []

  let candidates: Exercise[]

  if (!sourceCategory) {
    candidates = await getAlternatives(db, sourceExercise, limit * 3)
  } else {
    const sameCategory = getExercisesInSameCategory(sourceName, allExercises)
    const rankedCategoryMatches = rankGoalFirstCandidates(
      sameCategory,
      sourceExercise.tier,
      sourceTags,
    )
    candidates = rankedCategoryMatches.length > 0
      ? rankedCategoryMatches
      : await getAlternatives(db, sourceExercise, limit * 3)
  }

  const withoutSourceExercise = candidates.filter((exercise) => exercise.id !== sourceExercise.exerciseId)
  const guardedCandidates = applySmartSwapGuards(withoutSourceExercise, sourceExercise, options)
  return dedupeExercises(guardedCandidates).slice(0, limit)
}
