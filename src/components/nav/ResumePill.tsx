import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import {
  TEMP_SESSION_ID,
  type IronProtocolDB,
  type TempSession,
} from '../../db/schema'
import { getRoutineSessionLabel } from '../../planner/autoPlanner'
import { parseTempSessionDraft } from '../../validation/tempSessionSchema'

interface ResumePillProps {
  db: IronProtocolDB
  onResume: () => void
  hidden?: boolean
}

function totalSets(draft: TempSession): number {
  return draft.exercises.reduce((acc, ex) => acc + ex.sets, 0)
}

function safeLabel(draft: TempSession): string {
  try {
    return getRoutineSessionLabel(draft.routineType, draft.sessionIndex)
  } catch {
    return 'Workout'
  }
}

export default function ResumePill({ db, onResume, hidden }: ResumePillProps) {
  const rawTempSession = useLiveQuery<TempSession | null>(
    async () => (await db.tempSessions.get(TEMP_SESSION_ID)) ?? null,
    [db],
  )

  const tempSession = useMemo<TempSession | null>(() => {
    if (!rawTempSession) return null
    try {
      return parseTempSessionDraft(rawTempSession)
    } catch {
      return null
    }
  }, [rawTempSession])

  const shouldShow = !hidden && tempSession !== null

  return (
    <AnimatePresence>
      {shouldShow && tempSession && (
        <motion.button
          key="resume-pill"
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          whileTap={{ scale: 0.98 }}
          onClick={onResume}
          aria-label={`Resume ${safeLabel(tempSession)}`}
          className="fixed left-0 right-0 z-50 mx-auto flex max-w-[406px] items-center gap-3 rounded-2xl border px-3 text-left"
          style={{
            bottom: 'calc(var(--space-tabbar) + env(safe-area-inset-bottom, 0px) + 8px)',
            height: 'var(--space-pill)',
            marginLeft: 'var(--space-3)',
            marginRight: 'var(--space-3)',
            backgroundColor: 'color-mix(in srgb, var(--color-surface-overlay) 88%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'var(--color-border-strong)',
            boxShadow: '0 12px 36px -12px rgba(0, 0, 0, 0.9)',
          }}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--color-accent-soft)',
              color: 'var(--color-accent-primary)',
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>

          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className="truncate"
              style={{
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '-0.005em',
              }}
            >
              Resume · {safeLabel(tempSession)}
            </span>
            <span
              className="text-label truncate"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
              }}
            >
              {tempSession.completedSets.length} of {totalSets(tempSession)} sets
            </span>
          </span>

          <span
            aria-hidden
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-accent-on)',
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
