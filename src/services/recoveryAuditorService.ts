import { z } from 'zod'
import type { RecoveryLog, V11AppSettingsSchema, Workout } from '../db/schema'
import { fetchGemini } from './geminiClient'

const sessionAdjustmentSchema = z.object({
  type: z.enum(['reduce-volume', 'swap-exercise', 'extend-rest', 'rest-day']),
  target: z.string().optional(),
  detail: z.string().min(1),
})

const arcRecommendationSchema = z.object({
  action: z.enum(['insert-deload', 'reduce-overload-delta', 'shift-goal-weighting']),
  rationale: z.string().min(1),
})

export const auditResultSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  missionBrief: z.string().min(1),
  sessionAdjustments: z.array(sessionAdjustmentSchema),
  arcRecommendation: arcRecommendationSchema.optional(),
})

export type SessionAdjustment = z.infer<typeof sessionAdjustmentSchema>
export type ArcRecommendation = z.infer<typeof arcRecommendationSchema>
export type AuditResult = z.infer<typeof auditResultSchema>

export function buildAuditPrompt(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract: V11AppSettingsSchema,
): string {
  const logLines = logs
    .map((log, i) => [
      `Log ${i + 1} (id: ${log.id}):`,
      `  sleepHours=${log.sleepHours}, sleepQuality=${log.sleepQuality}/5`,
      `  stressLevel=${log.stressLevel}/5, overallFatigue=${log.overallFatigue}/5`,
      `  soreness=${JSON.stringify(log.soreness)}`,
    ].join('\n'))
    .join('\n\n')

  const workoutLines = recentWorkouts.length > 0
    ? recentWorkouts.map((w) => `- ${w.routineType} session ${w.sessionIndex} at ${new Date(w.date).toISOString()}`).join('\n')
    : '- no recent workouts'

  return [
    '[ROLE]',
    'You are the IronProtocol Recovery Auditor.',
    'Analyze the athlete\'s recovery telemetry and recommend adjustments.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON matching:',
    '{ "severity": "low"|"medium"|"high", "missionBrief": string, "sessionAdjustments": Array<{ "type": "reduce-volume"|"swap-exercise"|"extend-rest"|"rest-day", "target"?: string, "detail": string }>, "arcRecommendation"?: { "action": "insert-deload"|"reduce-overload-delta"|"shift-goal-weighting", "rationale": string } }',
    'severity rules: low=normal training, medium=reduce accessory load, high=significant intervention needed.',
    'arcRecommendation: ONLY include when severity is "high". Omit entirely otherwise.',
    'missionBrief: 1-2 sentences as a tactical read of the athlete\'s recovery state.',
    '',
    '[ROLLING RECOVERY WINDOW]',
    logLines,
    '',
    '[RECENT WORKOUTS]',
    workoutLines,
    '',
    '[USER PROFILE]',
    `goal: ${v11Contract.primaryGoals.primaryFocus ?? 'unknown'}`,
    `experience: ${v11Contract.trainingExperienceLevel ?? 'unknown'}`,
    `targetDaysPerWeek: ${v11Contract.logisticalConstraints.targetDaysPerWeek ?? 'unknown'}`,
  ].join('\n')
}

export async function generateRecoveryAudit(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract: V11AppSettingsSchema,
): Promise<AuditResult> {
  const prompt = buildAuditPrompt(logs, recentWorkouts, v11Contract)
  return fetchGemini(prompt, auditResultSchema, { temperature: 0.2, maxOutputTokens: 1024 })
}
