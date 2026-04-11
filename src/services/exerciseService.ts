import type { Exercise, IronProtocolDB } from '../db/schema'
import type { PlannedExercise } from '../planner/autoPlanner'

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
    .slice(0, limit)
    .map((entry) => entry.exercise)

  return alternatives
}
