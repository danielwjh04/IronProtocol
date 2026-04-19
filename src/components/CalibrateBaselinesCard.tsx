import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { IronProtocolDB } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

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
  const [focusKey, setFocusKey] = useState<CompoundKey | null>(null)

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

    await db.baselines.bulkPut(rows)

    setSaving(false)
    setSaved(true)
  }

  return (
    <motion.section
      whileTap={{ scale: 0.995 }}
      className="rounded-3xl border p-5"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        borderColor:     'var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
            T1 Calibration
          </p>
          <h2 className="text-display mt-2" style={{ color: 'var(--color-text-primary)' }}>
            Baselines
          </h2>
        </div>
        <span
          className="text-label rounded-full border px-3 py-1"
          style={{
            borderColor: 'var(--color-border-subtle)',
            color:       'var(--color-text-secondary)',
          }}
        >
          Day 1
        </span>
      </div>

      <p className="text-body mt-3" style={{ color: 'var(--color-text-secondary)' }}>
        Enter your current working weights. The planner starts you at your real numbers instead of the 20 kg default.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {T1_COMPOUNDS.map(({ key, label, hint }) => {
          const isFocused = focusKey === key
          return (
            <label key={key} className="flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
                  onFocus={() => setFocusKey(key)}
                  onBlur={() => setFocusKey(null)}
                  placeholder="—"
                  className="text-body w-full rounded-2xl border px-4 py-3 pr-10 text-center focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-surface-base)',
                    borderColor: isFocused
                      ? 'var(--color-accent-primary)'
                      : 'var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <span
                  className="text-label pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {hint}
                </span>
              </div>
            </label>
          )
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => { void handleSave() }}
        disabled={saving}
        className="text-body mt-5 h-14 w-full rounded-2xl font-bold disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-accent-primary)',
          color:           'var(--color-accent-on)',
        }}
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
            className="text-label mt-3 text-center"
            style={{ color: 'var(--color-accent-primary)' }}
          >
            ✓ Baselines locked in — planner updated.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
