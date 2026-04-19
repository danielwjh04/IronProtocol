import type { MuscleGroup, RecoveryLog, Workout } from '../db/schema'

export type RecoverySeverity = 'clear' | 'caution' | 'critical'

export interface RecoveryAuditResult {
  severity:       RecoverySeverity
  missionBrief:   string
  recommendations: string[]
}

const HIGH_FATIGUE_THRESHOLD = 4
const HIGH_SORENESS_THRESHOLD = 4
const LOW_SLEEP_THRESHOLD = 2
const CONSECUTIVE_HIGH_FATIGUE_COUNT = 2
const HIGH_SORENESS_GROUP_COUNT = 3
const LOW_SLEEP_WINDOW_COUNT = 3

function sortedByRecent(logs: RecoveryLog[]): RecoveryLog[] {
  return [...logs].sort((a, b) => b.loggedAt - a.loggedAt)
}

function countHighSorenessGroups(log: RecoveryLog): number {
  return Object.values(log.soreness).filter(v => typeof v === 'number' && v >= HIGH_SORENESS_THRESHOLD).length
}

function mostSoreGroup(log: RecoveryLog): MuscleGroup | null {
  let top: MuscleGroup | null = null
  let topScore = 0
  for (const [group, score] of Object.entries(log.soreness) as Array<[MuscleGroup, number]>) {
    if (typeof score !== 'number') continue
    if (score > topScore) {
      top = group
      topScore = score
    }
  }
  return topScore >= HIGH_SORENESS_THRESHOLD ? top : null
}

export function auditRecoveryOffline(
  recentLogs: RecoveryLog[],
  _recentWorkouts: Workout[],
): RecoveryAuditResult {
  if (recentLogs.length === 0) {
    return {
      severity:       'clear',
      missionBrief:   'No recovery signal yet. Ship the next session as planned.',
      recommendations: [],
    }
  }

  const logs = sortedByRecent(recentLogs)
  const latest = logs[0]

  const criticalSoreness = countHighSorenessGroups(latest) >= HIGH_SORENESS_GROUP_COUNT
  const consecutiveHighFatigue =
    logs.slice(0, CONSECUTIVE_HIGH_FATIGUE_COUNT)
      .filter(l => l.overallFatigue >= HIGH_FATIGUE_THRESHOLD).length >= CONSECUTIVE_HIGH_FATIGUE_COUNT

  if (criticalSoreness || consecutiveHighFatigue) {
    return {
      severity:     'critical',
      missionBrief: consecutiveHighFatigue
        ? 'Fatigue has stacked over multiple sessions. Recovery debt is real.'
        : 'Multiple muscle groups are deep-sore. Load must drop today.',
      recommendations: [
        'Cut total sets by 30 percent.',
        'Drop one compound from the session.',
        'Keep form-priority isolation work only.',
      ],
    }
  }

  const lowSleepWindow = logs.slice(0, LOW_SLEEP_WINDOW_COUNT)
    .filter(l => l.sleepQuality <= LOW_SLEEP_THRESHOLD).length >= LOW_SLEEP_WINDOW_COUNT
  const singleHotspot = mostSoreGroup(latest)

  if (lowSleepWindow || singleHotspot !== null) {
    return {
      severity:     'caution',
      missionBrief: lowSleepWindow
        ? 'Sleep quality has been low for several sessions. Recovery is fragile.'
        : `Localized soreness on ${singleHotspot}. Route volume elsewhere.`,
      recommendations: lowSleepWindow
        ? ['Hold weights at last session. No PR attempts.', 'Cap session to scheduled time budget.']
        : [`Skip or halve work for ${singleHotspot ?? 'that muscle group'}.`, 'Keep compounds but back off accessory volume.'],
    }
  }

  return {
    severity:       'clear',
    missionBrief:   'Recovery looks green. Execute the session as planned.',
    recommendations: [],
  }
}
