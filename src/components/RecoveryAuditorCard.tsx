import { motion } from 'framer-motion'

export interface AuditResult {
  severity: 'low' | 'medium' | 'high'
  missionBrief: string
  sessionAdjustments: { detail: string }[]
  arcRecommendation?: { action: string; rationale: string } | null
}

interface Props {
  auditResult: AuditResult | null
  isLabAvailable: boolean
  onArcReviewRequested: () => void
}

const SEVERITY_STYLES = {
  low: {
    border: 'border-[#22c55e]/25',
    dot: 'bg-[#22c55e]',
    label: 'Recovery · Clear',
    labelColor: 'text-[#22c55e]',
    brief: 'text-[#d1fae5]',
  },
  medium: {
    border: 'border-[#f59e0b]/25',
    dot: 'bg-[#f59e0b]',
    label: 'Recovery · Caution',
    labelColor: 'text-[#f59e0b]',
    brief: 'text-[#fef3c7]',
  },
  high: {
    border: 'border-[#ef4444]/25',
    dot: 'bg-[#ef4444]',
    label: 'Recovery · Critical',
    labelColor: 'text-[#ef4444]',
    brief: 'text-[#fee2e2]',
  },
} as const

export default function RecoveryAuditorCard({ auditResult, isLabAvailable, onArcReviewRequested }: Props) {
  if (!isLabAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-[#0D1626] p-4 text-center"
      >
        <p className="mb-1 text-xs font-bold text-zinc-500">Lab Connection Required</p>
        <p className="text-[11px] text-zinc-600">Recovery auditing is a Lab feature.</p>
      </motion.div>
    )
  }

  if (!auditResult) return null

  const styles = SEVERITY_STYLES[auditResult.severity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-2xl border bg-[#0A0E1A] p-4 ${styles.border}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${styles.labelColor}`}>
          {styles.label}
        </span>
      </div>

      <p className={`mb-3 text-[11px] font-medium italic leading-relaxed ${styles.brief}`}>
        {auditResult.missionBrief}
      </p>

      {auditResult.sessionAdjustments.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          {auditResult.sessionAdjustments.map((adj, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] text-zinc-400">
              · {adj.detail}
            </div>
          ))}
        </div>
      )}

      {auditResult.severity === 'high' && auditResult.arcRecommendation && (
        <motion.button
          type="button"
          aria-label="Review Arc Adjustment"
          onClick={onArcReviewRequested}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-xl bg-[#ef4444] py-2.5 text-xs font-black text-white"
        >
          Review Arc Adjustment →
        </motion.button>
      )}
    </motion.div>
  )
}
