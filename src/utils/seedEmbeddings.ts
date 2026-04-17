import { db } from '../db/db'
import { getEmbedding } from '../services/localAIService'
import type { Exercise } from '../db/schema'

const BATCH_SIZE = 5

function buildExerciseText(exercise: Exercise): string {
  return `${exercise.name} ${exercise.muscleGroup} ${exercise.tags.join(' ')}`
}

export async function seedEmbeddings(): Promise<void> {
  const exercises = await db.exercises.toArray()
  const missing   = exercises.filter(e => !e.embedding || e.embedding.length === 0)
  const total     = Math.ceil(missing.length / BATCH_SIZE)

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch    = missing.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    await Promise.all(batch.map(async ex => {
      const embedding = await getEmbedding(buildExerciseText(ex))
      await db.exercises.update(ex.id, { embedding })
    }))
    console.log(`Processed batch ${batchNum} of ${total}`)
    await new Promise(r => setTimeout(r, 0))
  }
}
