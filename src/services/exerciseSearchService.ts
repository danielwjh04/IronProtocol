import { getEmbedding } from './localAIService'
import { db } from '../db/db'
import { cosineSimilarity } from '../utils/vectorMath'
import type { Exercise } from '../db/schema'

type ExerciseWithEmbedding = Exercise & { embedding: number[] }

let cache: ExerciseWithEmbedding[] | null = null

async function loadEmbedded(): Promise<ExerciseWithEmbedding[]> {
  if (!cache) {
    const all = await db.exercises.toArray()
    cache = all.filter((e): e is ExerciseWithEmbedding => Array.isArray(e.embedding) && e.embedding.length > 0)
  }
  return cache
}

export function invalidateSearchCache() { cache = null }

export async function searchExercises(query: string, topN = 20) {
  const queryVec = await getEmbedding(query)
  const embedded = await loadEmbedded()
  const scored = embedded.map(e => ({
    exerciseId:  e.id,
    name:        e.name,
    muscleGroup: e.muscleGroup,
    tier:        e.tier,
    score:       cosineSimilarity(queryVec, e.embedding),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topN)
}
