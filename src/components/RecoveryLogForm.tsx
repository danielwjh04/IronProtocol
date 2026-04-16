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

export default function RecoveryLogForm({ workoutId, db, onDone, onSkip }: Props) {
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState<Rating>(3)
  const [stressLevel, setStressLevel] = useState<Rating>(2)
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
        sleepHours,
        sleepQuality,
        stressLevel,
        overallFatigue,
        soreness,
      }
      await db.recoveryLogs.add(log)
    } catch {
    }
    onDone()
  }

  function RatingTiles({ value, onChange }: { value: Rating; onChange: (r: Rating) => void }) {
    return (
      <div className="flex gap-1.5">
        {RATING_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as Rating)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-colors
              ${n <= value ? 'bg-[#3B71FE] text-white' : 'bg-[#1e2a45] text-zinc-500'}`}
          >
            {n}
          </button>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-3xl border border-white/10 bg-[#0D1626] p-5"
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3B71FE]">
        Post-Session Telemetry
      </p>

      <div className="mb-4">
        <p className="mb-2 text-xs text-zinc-400">Sleep last night</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-1.5">
            <button type="button" onClick={() => setSleepHours((h) => Math.max(0, h - 1))} className="text-zinc-400">−</button>
            <span className="w-8 text-center text-sm font-bold text-[#3B71FE]">{sleepHours}h</span>
            <button type="button" onClick={() => setSleepHours((h) => Math.min(12, h + 1))} className="text-zinc-400">+</button>
          </div>
          <RatingTiles value={sleepQuality} onChange={setSleepQuality} />
        </div>
      </div>

      <div className="mb-4 flex gap-6">
        <div>
          <p className="mb-2 text-xs text-zinc-400">Stress</p>
          <RatingTiles value={stressLevel} onChange={setStressLevel} />
        </div>
        <div>
          <p className="mb-2 text-xs text-zinc-400">Fatigue</p>
          <RatingTiles value={overallFatigue} onChange={setOverallFatigue} />
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-xs text-zinc-400">Soreness (tap affected)</p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSoreness(key)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors
                ${soreness[key] ? 'border-[#3B71FE] text-[#3B71FE]' : 'border-white/10 text-zinc-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="mb-3 w-full rounded-xl bg-[#3B71FE] py-3 text-sm font-black text-white disabled:opacity-50"
      >
        Log Recovery Data
      </motion.button>

      <button type="button" onClick={onSkip} className="w-full text-center text-xs text-zinc-600">
        Skip — I'll log next time
      </button>
    </motion.div>
  )
}
