import { describe, it, expect } from 'vitest'
import { buildAuditPrompt, auditResultSchema } from '../services/recoveryAuditorService'
import type { RecoveryLog, Workout } from '../db/schema'

function makeLog(overrides?: Partial<RecoveryLog>): RecoveryLog {
  return {
    id: 'log-1',
    workoutId: 'wk-1',
    loggedAt: Date.now(),
    sleepHours: 7,
    sleepQuality: 4,
    stressLevel: 2,
    overallFatigue: 2,
    soreness: { chest: 3, shoulders: 2 },
    ...overrides,
  }
}

function makeWorkout(overrides?: Partial<Workout>): Workout {
  return {
    id: 'wk-1',
    date: Date.now(),
    routineType: 'PPL',
    sessionIndex: 0,
    notes: '',
    ...overrides,
  }
}

describe('buildAuditPrompt', () => {
  it('includes all provided recovery logs', () => {
    const logs = [makeLog({ id: 'log-1' }), makeLog({ id: 'log-2' }), makeLog({ id: 'log-3' })]
    const prompt = buildAuditPrompt(logs, [makeWorkout()], {
      physiologicalBaselines: { ageYears: 28, bodyWeightKg: 80, gender: 'male' },
      trainingExperienceLevel: 'intermediate',
      logisticalConstraints: { targetDaysPerWeek: 3, hardSessionLimitMinutes: 60 },
      equipmentAvailability: 'commercial-gym',
      primaryGoals: { primaryFocus: 'hypertrophy', specificLiftTargets: [] },
      injuryConstraints: { hasActiveConstraints: false, constraints: [] },
    })
    expect(prompt).toContain('log-1')
    expect(prompt).toContain('log-2')
    expect(prompt).toContain('log-3')
  })

  it('includes sleep and fatigue values', () => {
    const prompt = buildAuditPrompt([makeLog({ sleepHours: 5, overallFatigue: 5 })], [], {
      physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
      trainingExperienceLevel: null,
      logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
      equipmentAvailability: null,
      primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
      injuryConstraints: { hasActiveConstraints: false, constraints: [] },
    })
    expect(prompt).toContain('5')
  })
})

describe('auditResultSchema', () => {
  it('accepts a valid low-severity result with empty adjustments', () => {
    const result = auditResultSchema.safeParse({
      severity: 'low',
      missionBrief: 'Telemetry nominal.',
      sessionAdjustments: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a high-severity result with arcRecommendation', () => {
    const result = auditResultSchema.safeParse({
      severity: 'high',
      missionBrief: 'Critical fatigue detected.',
      sessionAdjustments: [{ type: 'rest-day', detail: 'Take a full rest day.' }],
      arcRecommendation: { action: 'insert-deload', rationale: '3-session accumulation.' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid severity value', () => {
    const result = auditResultSchema.safeParse({
      severity: 'critical',
      missionBrief: 'Bad.',
      sessionAdjustments: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects sessionAdjustment with invalid type', () => {
    const result = auditResultSchema.safeParse({
      severity: 'medium',
      missionBrief: 'Some fatigue.',
      sessionAdjustments: [{ type: 'invalid-action', detail: 'Do something.' }],
    })
    expect(result.success).toBe(false)
  })
})
