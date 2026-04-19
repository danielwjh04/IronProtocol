import { describe, it, expect } from 'vitest'
import type { RecoveryLog, Workout } from '../db/schema'
import { auditRecoveryOffline } from '../planner/recoveryAuditorHeuristics'

function makeLog(overrides: Partial<RecoveryLog> = {}): RecoveryLog {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    workoutId: overrides.workoutId ?? 'w',
    loggedAt: overrides.loggedAt ?? Date.now(),
    sleepQuality: overrides.sleepQuality ?? 4,
    overallFatigue: overrides.overallFatigue ?? 2,
    soreness: overrides.soreness ?? {},
  }
}

describe('auditRecoveryOffline', () => {
  const noWorkouts: Workout[] = []

  it('returns clear with empty logs', () => {
    const result = auditRecoveryOffline([], noWorkouts)
    expect(result.severity).toBe('clear')
  })

  it('returns clear for healthy sleep, low fatigue, no soreness', () => {
    const logs = [
      makeLog({ loggedAt: 3, sleepQuality: 4, overallFatigue: 2 }),
      makeLog({ loggedAt: 2, sleepQuality: 5, overallFatigue: 1 }),
      makeLog({ loggedAt: 1, sleepQuality: 4, overallFatigue: 2 }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('clear')
  })

  it('returns critical when 3+ muscle groups hit soreness ≥4 in latest log', () => {
    const logs = [
      makeLog({
        loggedAt: 3,
        soreness: { chest: 4, legs: 5, back: 4 },
      }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('critical')
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('returns critical when fatigue ≥4 for two consecutive most-recent logs', () => {
    const logs = [
      makeLog({ loggedAt: 3, overallFatigue: 5 }),
      makeLog({ loggedAt: 2, overallFatigue: 4 }),
      makeLog({ loggedAt: 1, overallFatigue: 1 }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('critical')
  })

  it('returns caution when sleep ≤2 across last 3 logs', () => {
    const logs = [
      makeLog({ loggedAt: 3, sleepQuality: 2, overallFatigue: 2 }),
      makeLog({ loggedAt: 2, sleepQuality: 1, overallFatigue: 2 }),
      makeLog({ loggedAt: 1, sleepQuality: 2, overallFatigue: 2 }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('caution')
  })

  it('returns caution on a single muscle group ≥4 soreness', () => {
    const logs = [
      makeLog({ loggedAt: 3, soreness: { legs: 4 } }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('caution')
    expect(result.missionBrief.toLowerCase()).toContain('legs')
  })

  it('prefers critical over caution when both conditions trigger', () => {
    const logs = [
      makeLog({ loggedAt: 3, overallFatigue: 5, soreness: { chest: 4, legs: 4, back: 4 } }),
      makeLog({ loggedAt: 2, overallFatigue: 4, sleepQuality: 2 }),
      makeLog({ loggedAt: 1, sleepQuality: 1 }),
    ]
    const result = auditRecoveryOffline(logs, noWorkouts)
    expect(result.severity).toBe('critical')
  })
})
