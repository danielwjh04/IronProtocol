import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { IronProtocolDB } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

// The four T1 compound anchors that drive all progression math.
// Keys are stored lowercased in the baselines table (PK = exerciseName).
const T1_COMPOUNDS = [
  { key: 'back squat',      label: 'Squat',    hint: 'kg' },
  { key: 'bench press',     label: 'Bench',    hint: 'kg' },
  { key: 'deadlift',        label: 'Deadlift', hint: 'kg' },
  { key: 'overhead press',  label: 'OHP',      hint: 'kg' },
] as const

type CompoundKey = typeof T1_COMPOUNDS[number]['key']
type WeightMap = Record<CompoundKey, string>

const EMPTY_WEIGHTS: WeightMap = {
  'back squat':     '',
  'bench press':    '',
  'deadlift':       '',
  'overhead press': '',
}

export default function CalibrateBaselinesCard({ db }: Props) {
  const [weights, setWeights] = useState<WeightMap>(EMPTY_WEIGHTS)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load any previously saved baselines on mount.
  useEffect(() => {
    async function load() {
      const rows = await db.baselines.toArray()
      if (rows.length === 0) return
      const next = { ...EMPTY_WEIGHTS }
      for (const row of rows) {
        const key = row.exerciseName as CompoundKey
        if (key in next) {
          next[key] = String(row.weight)
        }
      }
      setWeights(next)
    }
    void load()
  }, [db])

  function handleChange(key: CompoundKey, raw: string) {
    setWeights((prev) => ({ ...prev, [key]: raw }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)

    const rows = T1_COMPOUNDS
      .map(({ key }) => ({ key, kg: Number(weights[key]) }))
      .filter(({ kg }) => Number.isFinite(kg) && kg > 0)
      .map(({ key, kg }) => ({ exerciseName: key, weight: kg }))

    // Atomic put — replaces any existing entry for each compound.
    await db.baselines.bulkPut(rows)

    setSaving(false)
    setSaved(true)
  }

  return (
    <motion.section
      whileTap={{ scale: 0.98 }}
      className="rounded-3xl border border-[#3B71FE]/20 bg-[#0D1626] p-6 shadow-[0_18px_38px_-24px_rgba(59,113,254,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3B71FE]">
            T1 Calibration
          </p>
          <h2 className="mt-1 text-2xl font-black text-zinc-100">
            Calibrate Baselines
          </h2>
        </div>
        <span className="rounded-xl border border-[#3B71FE]/20 bg-[#091020] px-2 py-1 text-xs font-black uppercase tracking-widest text-zinc-400">
          Day 1
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Enter your current working weights. The planner ignores the 20 kg default and starts you at your real numbers.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {T1_COMPOUNDS.map(({ key, label, hint }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
              {label}
            </span>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={2.5}
                value={weights[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="—"
                className="w-full rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-4 py-3 pr-10 text-center text-2xl font-black text-white placeholder-zinc-600 transition-colors focus:border-[#3B71FE] focus:outline-none focus:ring-1 focus:ring-[#3B71FE]/30"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                {hint}
              </span>
            </div>
          </label>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => { void handleSave() }}
        disabled={saving}
        className="mt-5 h-14 w-full cursor-pointer rounded-3xl bg-[#3B71FE] px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_-18px_rgba(59,113,254,0.7)] transition-all hover:bg-[#5585ff] active:scale-[0.98] active:bg-[#2860ee] disabled:cursor-not-allowed disabled:bg-[#3B71FE]/20 disabled:text-zinc-600 disabled:shadow-none"
      >
        {saving ? 'Locking In…' : 'Lock In Baselines'}
      </motion.button>

      <AnimatePresence>
        {saved && (
          <motion.p
            key="saved"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mt-3 text-center text-sm font-semibold text-[#3B71FE]"
          >
            ✓ Baselines locked in — planner updated.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
