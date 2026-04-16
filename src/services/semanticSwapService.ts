import { z } from 'zod'
import type { ExerciseTier, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'
import { fetchGemini } from './geminiClient'
import { canonicalizeExerciseName } from './aiPlannerService'

export const swapResultSchema = z.object({
  exerciseName: z.string().min(1),
  muscleGroup: z.string().min(1),
  tier: z.enum(['T1', 'T2', 'T3']),
  reason: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type SwapResult = z.infer<typeof swapResultSchema>

export function buildSwapPrompt(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema,
): string {
  const tierLabel = `T${currentExercise.tier}` as 'T1' | 'T2' | 'T3'

  const injuryLines = v11Contract.injuryConstraints.hasActiveConstraints
    ? v11Contract.injuryConstraints.constraints
        .map((c) => `- ${c.structuralAversion.trim()}`)
        .join('\n')
    : '- none'

  const availableExercises = exerciseDB
    .map((ex) => `- ${ex.name} (${ex.muscleGroup}, T${ex.tier})`)
    .join('\n')

  return [
    '[ROLE]',
    'You are the IronProtocol Lab Biomechanical Interpreter.',
    'Select the single best exercise swap for the user constraint described below.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON only — one object matching exactly:',
    '{ "exerciseName": string, "muscleGroup": string, "tier": "T1"|"T2"|"T3", "reason": string, "confidence": "high"|"medium"|"low" }',
    'reason: one sentence explaining the biomechanical justification.',
    'confidence: "high" if the swap clearly satisfies the constraint, "medium" if reasonable, "low" if uncertain.',
    '',
    '[CURRENT EXERCISE BEING SWAPPED]',
    `name: ${currentExercise.name}`,
    `tier: ${tierLabel}`,
    `muscleGroup: ${currentExercise.muscleGroup}`,
    '',
    '[USER CONSTRAINT / QUERY]',
    query,
    '',
    '[USER PROFILE]',
    `equipment: ${v11Contract.equipmentAvailability ?? 'unknown'}`,
    `goal: ${v11Contract.primaryGoals.primaryFocus ?? 'unknown'}`,
    `experience: ${v11Contract.trainingExperienceLevel ?? 'unknown'}`,
    'injury constraints:',
    injuryLines,
    '',
    '[AVAILABLE EXERCISES IN LOCAL DB]',
    availableExercises,
    '',
    '[RULE]',
    'Prefer exercises from the available list. Only suggest an exercise not in the list if no suitable match exists.',
    `Keep the same tier (${tierLabel}) unless biomechanically impossible to do so.`,
  ].join('\n')
}

export async function generateSemanticSwap(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema,
): Promise<SwapResult> {
  const prompt = buildSwapPrompt(query, currentExercise, exerciseDB, v11Contract)
  const result = await fetchGemini(prompt, swapResultSchema, { temperature: 0.3, maxOutputTokens: 512 })
  return {
    ...result,
    exerciseName: canonicalizeExerciseName(result.exerciseName),
  }
}
