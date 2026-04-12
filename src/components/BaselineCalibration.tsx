import { animate, motion, useMotionValue, type Variants } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { APP_SETTINGS_ID, type IronProtocolDB } from '../db/schema'

interface Props {
  db: IronProtocolDB
  onCalibrationComplete?: () => void
}

type LiftKey = 'back squat' | 'bench press' | 'deadlift'

interface DialConfig {
  key: LiftKey
  label: string
}

const DIALS: DialConfig[] = [
  { key: 'back squat', label: 'Squat' },
  { key: 'bench press', label: 'Bench Press' },
  { key: 'deadlift', label: 'Deadlift' },
]

const DEFAULT_BASELINE_KG = 20
const MIN_BASELINE_KG = 20
const MAX_BASELINE_KG = 300
const STEP_KG = 2.5

const TRACK_WIDTH_PX = 240
const KNOB_SIZE_PX = 44
const TRAVEL_PX = TRACK_WIDTH_PX - KNOB_SIZE_PX

const HEAVY_DIAL_SNAP = {
  type: 'spring' as const,
  stiffness: 900,
  damping: 58,
  mass: 1.15,
}

const FORM_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.08,
    },
  },
}

const SECTION_VARIANT: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function snapToStep(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round(value / step) * step
  const rounded = Number(snapped.toFixed(1))
  return clamp(rounded, min, max)
}

function valueToX(value: number): number {
  const progress = (value - MIN_BASELINE_KG) / (MAX_BASELINE_KG - MIN_BASELINE_KG)
  return clamp(progress * TRAVEL_PX, 0, TRAVEL_PX)
}

function xToValue(x: number): number {
  const progress = clamp(x, 0, TRAVEL_PX) / TRAVEL_PX
  return MIN_BASELINE_KG + (MAX_BASELINE_KG - MIN_BASELINE_KG) * progress
}

function formatKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

interface BaselineDialProps {
  id: LiftKey
  label: string
  value: number
  onChange: (next: number) => void
}

function BaselineDial({ id, label, value, onChange }: BaselineDialProps) {
  const knobX = useMotionValue(valueToX(value))
  const isDraggingRef = useRef(false)
  const lastSnappedRef = useRef(value)

  useEffect(() => {
    if (isDraggingRef.current) {
      return
    }
    lastSnappedRef.current = value
    void animate(knobX, valueToX(value), HEAVY_DIAL_SNAP)
  }, [knobX, value])

  function announceIncrement(next: number): void {
    if (next !== lastSnappedRef.current) {
      lastSnappedRef.current = next
      vibrate(50)
    }
  }

  function updateFromKnob(rawX: number, commit: boolean): void {
    const next = snapToStep(xToValue(rawX), STEP_KG, MIN_BASELINE_KG, MAX_BASELINE_KG)
    announceIncrement(next)
    if (next !== value) {
      onChange(next)
    }
    if (commit) {
      void animate(knobX, valueToX(next), HEAVY_DIAL_SNAP)
    }
  }

  function handleRangeChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const next = snapToStep(Number(event.target.value), STEP_KG, MIN_BASELINE_KG, MAX_BASELINE_KG)
    announceIncrement(next)
    onChange(next)
    void animate(knobX, valueToX(next), HEAVY_DIAL_SNAP)
  }

  const progress = ((value - MIN_BASELINE_KG) / (MAX_BASELINE_KG - MIN_BASELINE_KG)) * 100

  return (
    <motion.section
      variants={SECTION_VARIANT}
      className="rounded-3xl border border-electric/20 bg-navy p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">{label}</p>
        <p className="text-lg font-black text-electric">{formatKg(value)} kg</p>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="relative h-14 w-[240px] select-none">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full border border-white/10 bg-[#1E253A]" />
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-electric"
            style={{ width: `${progress}%` }}
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            drag="x"
            dragConstraints={{ left: 0, right: TRAVEL_PX }}
            dragElastic={0.04}
            dragMomentum={false}
            style={{ x: knobX }}
            onDragStart={() => {
              isDraggingRef.current = true
            }}
            onDrag={() => {
              updateFromKnob(knobX.get(), false)
            }}
            onDragEnd={() => {
              isDraggingRef.current = false
              updateFromKnob(knobX.get(), true)
            }}
            className="absolute left-0 top-1/2 flex h-[44px] w-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-navy bg-electric shadow-[0_0_0_4px_rgba(59,113,254,0.24),0_0_18px_rgba(59,113,254,0.62)]"
            aria-label={`${label} baseline dial`}
          >
            <span className="h-4 w-[2px] rounded-full bg-white" />
          </motion.button>

          <input
            id={`baseline-${id}`}
            aria-label={`${label} baseline`}
            type="range"
            min={MIN_BASELINE_KG}
            max={MAX_BASELINE_KG}
            step={STEP_KG}
            value={value}
            onChange={handleRangeChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500">
        <span>{MIN_BASELINE_KG} kg</span>
        <span>{MAX_BASELINE_KG} kg</span>
      </div>
    </motion.section>
  )
}

export default function BaselineCalibration({ db, onCalibrationComplete }: Props) {
  const [weights, setWeights] = useState<Record<LiftKey, number>>({
    'back squat': DEFAULT_BASELINE_KG,
    'bench press': DEFAULT_BASELINE_KG,
    'deadlift': DEFAULT_BASELINE_KG,
  })
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = !submitting

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!canSubmit) return

    vibrate(100)
    setSubmitting(true)

    try {
      const rows = DIALS.map(({ key }) => ({
        exerciseName: key,
        weight: snapToStep(weights[key], STEP_KG, MIN_BASELINE_KG, MAX_BASELINE_KG),
      }))

      await db.transaction('rw', db.baselines, db.settings, async () => {
        await db.baselines.bulkPut(rows)

        const updates = await db.settings.update(APP_SETTINGS_ID, {
          hasCompletedOnboarding: true,
        })

        if (updates === 0) {
          const existing = await db.settings.get(APP_SETTINGS_ID)
          await db.settings.put({
            ...(existing ?? {
              id: APP_SETTINGS_ID,
              preferredRoutineType: 'PPL',
              daysPerWeek: 3,
            }),
            id: APP_SETTINGS_ID,
            hasCompletedOnboarding: true,
          })
        }
      })

      onCalibrationComplete?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-navy px-4 pb-16 pt-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="rounded-3xl border border-electric/20 bg-navy-card p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Baseline Calibration</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-100">Set Your Starting Weights</h1>
        <p className="mt-2 text-sm text-zinc-300">
          These dials set your baseline only. If untouched, each lift starts at 20 kg (45 lb).
        </p>

        <motion.form
          variants={FORM_STAGGER}
          initial="hidden"
          animate="visible"
          onSubmit={(event) => { void handleSubmit(event) }}
          className="mt-5 flex flex-col gap-3"
        >
          {DIALS.map(({ key, label }) => (
            <BaselineDial
              key={key}
              id={key}
              label={label}
              value={weights[key]}
              onChange={(next) => {
                setWeights((current) => ({
                  ...current,
                  [key]: next,
                }))
              }}
            />
          ))}

          <motion.button
            variants={SECTION_VARIANT}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!canSubmit}
            className="mt-2 h-14 w-full cursor-pointer rounded-3xl bg-electric px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-electric/90 active:bg-electric/80 disabled:cursor-not-allowed disabled:bg-electric/30 disabled:text-zinc-500 disabled:shadow-none"
          >
            {submitting ? 'Initializing...' : 'Initialize Protocol'}
          </motion.button>
        </motion.form>
      </motion.section>
    </main>
  )
}
