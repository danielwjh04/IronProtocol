import { db } from '../db/db'
import { getEmbedding } from '../services/localAIService'
import type { Exercise } from '../db/schema'

function buildExerciseText(exercise: Exercise): string {
  return `${exercise.name} ${exercise.muscleGroup} ${exercise.tags.join(' ')}`
}

export async function seedEmbeddings(): Promise<void> {
  const exercises = await db.exercises.toArray()
  const missing = exercises.filter((e) => !e.embedding || e.embedding.length === 0)

  for (const exercise of missing) {
    const text = buildExerciseText(exercise)
    const embedding = await getEmbedding(text)
    await db.exercises.update(exercise.id, { embedding })
  }
}
