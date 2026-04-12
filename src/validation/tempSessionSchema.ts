import { z } from 'zod'

const tempSessionExerciseSchema = z.object({
	exerciseId: z.string().min(1),
	exerciseName: z.string().min(1),
	weight: z.number(),
	reps: z.number().int().nonnegative(),
	sets: z.number().int().positive(),
	tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
	progressionGoal: z.string().min(1),
	supersetGroupId: z.string().min(1).optional(),
}).strict()

const tempSessionCompletedSetSchema = z.object({
	exerciseId: z.string().min(1),
	weight: z.number(),
	reps: z.number().int().nonnegative(),
	orderIndex: z.number().int().nonnegative(),
}).strict()

export const tempSessionSchema = z.object({
	id: z.string().min(1),
	routineType: z.string().min(1),
	sessionIndex: z.number().int().nonnegative(),
	estimatedMinutes: z.number().nonnegative(),
	exercises: z.array(tempSessionExerciseSchema).refine(
		(exercises) => new Set(exercises.map((exercise) => exercise.exerciseId)).size === exercises.length,
		{ message: 'Duplicate exercise ids are not allowed in temp session drafts' },
	),
	currentExIndex: z.number().int().nonnegative(),
	currentSetInEx: z.number().int().nonnegative(),
	weight: z.number(),
	reps: z.number().int().nonnegative(),
	phase: z.union([z.literal('active'), z.literal('resting')]),
	restSecondsLeft: z.number().int().nonnegative(),
	completedSets: z.array(tempSessionCompletedSetSchema),
	updatedAt: z.number().int().nonnegative(),
}).strict()

export type TempSessionDraft = z.infer<typeof tempSessionSchema>

export function parseTempSessionDraft(payload: unknown): TempSessionDraft {
	return tempSessionSchema.parse(payload)
}
