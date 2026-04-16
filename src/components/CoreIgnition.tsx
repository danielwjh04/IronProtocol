import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import RecoveryAuditorCard from './RecoveryAuditorCard'
import { useRecoveryAudit } from '../hooks/useRecoveryAudit'
import { APP_SETTINGS_ID } from '../db/schema'
import type { RecoveryLog, Workout, V11AppSettingsSchema, IronProtocolDB } from '../db/schema'

interface Props {
  /** Called once the 2.5 s boot sequence finishes */
  onComplete: () => void
  db?: IronProtocolDB
}

// Terminal log lines per vision.md § VII.1 — Core Ignition
const BOOT_LINES = [
  { id: 'init',   delay: 0.1,  text: '> Initializing...'    },
  { id: 'vault',  delay: 0.75, text: '> Checking Vault...'  },
  { id: 'ready',  delay: 1.45, text: '> System Ready.'      },
]

const TOTAL_DURATION_MS = 2500

/** Pulsing Electric-Blue barbell SVG — center-screen focal element */
function PulsingBarbell() {
  return (
    <motion.svg
      width="200"
      height="56"
      viewBox="0 0 200 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IronProtocol barbell"
      animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
    >
      {/* Left plate */}
      <rect x="8"   y="8"  width="18" height="40" rx="5" fill="#3B71FE" opacity="0.9" />
      <rect x="24"  y="16" width="10" height="24" rx="3" fill="#3B71FE" />
      {/* Bar */}
      <rect x="34"  y="25" width="132" height="6"  rx="3" fill="#3B71FE" />
      {/* Right plate */}
      <rect x="166" y="16" width="10" height="24" rx="3" fill="#3B71FE" />
      <rect x="174" y="8"  width="18" height="40" rx="5" fill="#3B71FE" opacity="0.9" />

      {/* Inner glow collar rings */}
      <rect x="52"  y="22" width="6"  height="12" rx="2" fill="white" opacity="0.18" />
      <rect x="142" y="22" width="6"  height="12" rx="2" fill="white" opacity="0.18" />
    </motion.svg>
  )
}

export default function CoreIgnition({ onComplete, db }: Props) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [v11Contract, setV11Contract] = useState<V11AppSettingsSchema | null>(null)

  useEffect(() => {
    if (!db) return
    db.recoveryLogs.orderBy('loggedAt').reverse().limit(4).toArray()
      .then(setRecoveryLogs).catch(() => {})
    db.workouts.orderBy('date').reverse().limit(4).toArray()
      .then(setRecentWorkouts).catch(() => {})
    db.settings.get(APP_SETTINGS_ID).then((s) => {
      if (s?.v11PromptContract) setV11Contract(s.v11PromptContract)
    }).catch(() => {})
  }, [db])

  const { auditResult, hasLogs, isLabAvailable: labAvailable } = useRecoveryAudit(
    recoveryLogs,
    recentWorkouts,
    v11Contract ?? undefined,
  )

  // Capture the latest onComplete in a ref so the effect never re-runs due to
  // an unstable callback reference (callers often pass an inline arrow function).
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Fire each log line on its delay, then call onComplete after total duration.
  // Empty deps: runs once on mount — the ref keeps onCompleteRef.current fresh.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    BOOT_LINES.forEach(({ id, delay }) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(prev => [...prev, id])
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(50)
          }
        }, delay * 1000),
      )
    })

    timers.push(setTimeout(() => onCompleteRef.current(), TOTAL_DURATION_MS))

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 3, opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-navy"
      aria-label="Core Ignition — booting IronProtocol"
    >
      {/* ── Ambient glow backdrop ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric opacity-10 blur-[80px]" />
      </div>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="font-display text-xs font-black uppercase tracking-[0.35em] text-electric/70"
      >
        IRONPROTOCOL
      </motion.p>

      {/* ── Barbell ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <PulsingBarbell />
      </motion.div>

      {/* ── Terminal log lines ────────────────────────────────────────────── */}
      <div className="flex min-h-[80px] w-full max-w-[320px] flex-col gap-2">
        <AnimatePresence initial={false}>
          {BOOT_LINES.map(({ id, text }) =>
            visibleLines.includes(id) ? (
              <motion.p
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`font-display text-sm font-semibold tracking-wide ${
                  id === 'ready'
                    ? 'text-electric'
                    : 'text-electric/50'
                }`}
              >
                {text}
                {id === 'ready' && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                    className="ml-0.5 inline-block"
                  >
                    ▋
                  </motion.span>
                )}
              </motion.p>
            ) : null,
          )}
        </AnimatePresence>
      </div>

      {/* ── Recovery audit card ───────────────────────────────────────────── */}
      {hasLogs && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <RecoveryAuditorCard
            auditResult={auditResult}
            isLabAvailable={labAvailable}
            onArcReviewRequested={() => {
              console.warn('[RecoveryAuditor] Arc review requested — not yet implemented')
            }}
          />
        </motion.div>
      )}
    </motion.main>
  )
}
