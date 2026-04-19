import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import type { IronProtocolDB } from '../db/schema'
import { auditRecoveryOffline, type RecoveryAuditResult } from '../planner/recoveryAuditorHeuristics'

interface Props {
  db: IronProtocolDB
}

const SEVERITY_STYLES = {
  clear: {
    dotColor:       '#22c55e',
    labelText:      'Recovery · Clear',
  },
  caution: {
    dotColor:       '#f59e0b',
    labelText:      'Recovery · Caution',
  },
  critical: {
    dotColor:       '#ef4444',
    labelText:      'Recovery · Critical',
  },
} as const

export default function RecoveryAuditorCard({ db }: Props) {
  const data = useLiveQuery(async (): Promise<RecoveryAuditResult | null> => {
    const [logs, workouts] = await Promise.all([
      db.recoveryLogs.orderBy('loggedAt').reverse().limit(5).toArray(),
      db.workouts.orderBy('date').reverse().limit(5).toArray(),
    ])
    if (logs.length < 3) return null
    return auditRecoveryOffline(logs, workouts)
  }, [db])

  if (!data) return null

  const styles = SEVERITY_STYLES[data.severity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        borderColor:     'var(--color-border-subtle)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: styles.dotColor }}
        />
        <span
          className="text-label"
          style={{ color: styles.dotColor }}
        >
          {styles.labelText}
        </span>
      </div>

      <p
        className="text-body mb-3"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {data.missionBrief}
      </p>

      {data.recommendations.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.recommendations.map((rec, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-1.5 text-label"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                color:           'var(--color-text-secondary)',
              }}
            >
              · {rec}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
