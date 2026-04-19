import { useState } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import type { IronProtocolDB, MuscleGroup, RecoveryLog } from '../db/schema'

interface Props {
  workoutId: string
  db: IronProtocolDB
  onDone: () => void
  onSkip: () => void
}

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'legs', label: 'Legs' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'arms', label: 'Arms' },
  { key: 'core', label: 'Core' },
]

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const
type Rating = (typeof RATING_OPTIONS)[number]

function RatingTiles({ value, onChange }: { value: Rating; onChange: (r: Rating) => void }) {
  return (
    <div className="flex gap-2">
      {RATING_OPTIONS.map((n) => {
        const active = n <= value
        return (
          <motion.button
            key={n}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(n as Rating)}
            className="text-label flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors"
            style={{
              backgroundColor: active
                ? 'var(--color-accent-primary)'
                : 'var(--color-surface-base)',
              borderColor: active
                ? 'var(--color-accent-primary)'
                : 'var(--color-border-subtle)',
              color: active
                ? 'var(--color-accent-on)'
                : 'var(--color-text-secondary)',
            }}
          >
            {n}
          </motion.button>
        )
      })}
    </div>
  )
}

export default function RecoveryLogForm({ workoutId, db, onDone, onSkip }: Props) {
  const [sleepQuality, setSleepQuality] = useState<Rating>(3)
  const [overallFatigue, setOverallFatigue] = useState<Rating>(2)
  const [soreness, setSoreness] = useState<Partial<Record<MuscleGroup, Rating>>>({})
  const [saving, setSaving] = useState(false)

  function toggleSoreness(group: MuscleGroup) {
    setSoreness((prev) => {
      const next = { ...prev }
      if (next[group]) {
        delete next[group]
      } else {
        next[group] = 3
      }
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const log: RecoveryLog = {
        id: uuidv4(),
        workoutId,
        loggedAt: Date.now(),
        sleepQuality,
        overallFatigue,
        soreness,
      }
      await db.recoveryLogs.add(log)
    } catch {
    } finally {
      setSaving(false)
    }
    onDone()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-3xl border p-5"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        borderColor:     'var(--color-border-subtle)',
      }}
    >
      <p
        className="text-label mb-4 uppercase"
        style={{ color: 'var(--color-accent-primary)' }}
      >
        Post-Session Telemetry
      </p>

      <div className="mb-5">
        <p className="text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Sleep quality
        </p>
        <RatingTiles value={sleepQuality} onChange={setSleepQuality} />
      </div>

      <div className="mb-5">
        <p className="text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Overall fatigue
        </p>
        <RatingTiles value={overallFatigue} onChange={setOverallFatigue} />
      </div>

      <div className="mb-6">
        <p className="text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Soreness (tap affected)
        </p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map(({ key, label }) => {
            const active = Boolean(soreness[key])
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => toggleSoreness(key)}
                className="text-label rounded-full border px-3 py-1.5 transition-colors"
                style={{
                  backgroundColor: active
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-surface-base)',
                  borderColor: active
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-border-subtle)',
                  color: active
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="text-label mb-3 h-12 w-full rounded-2xl disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-accent-primary)',
          color:           'var(--color-accent-on)',
        }}
      >
        {saving ? 'Logging…' : 'Log Recovery Data'}
      </motion.button>

      <button
        type="button"
        onClick={onSkip}
        className="text-label w-full text-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Skip — I'll log next time
      </button>
    </motion.div>
  )
}
