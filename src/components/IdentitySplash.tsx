import { motion, type Variants } from 'framer-motion'
import { type CSSProperties, useState } from 'react'
import { APP_SETTINGS_ID, type IronProtocolDB, type PurposeChip } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY

const FORM_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: POST_TITLE_DELAY + 0.24,
      staggerChildren: 0.08,
    },
  },
}

const FORM_SECTION: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

const PURPOSE_CHIPS: { value: PurposeChip; label: string }[] = [
  { value: 'strength',    label: 'Strength'    },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'fat-loss',    label: 'Fat Loss'    },
  { value: 'endurance',   label: 'Endurance'   },
  { value: 'health',      label: 'Health'      },
]

export default function IdentitySplash({ db }: Props) {
  const [name,        setName]        = useState('')
  const [northStar,   setNorthStar]   = useState('')
  const [purposeChip, setPurposeChip] = useState<PurposeChip | null>(null)
  const [qosMinutes,  setQosMinutes]  = useState(45)
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(3)
  const [submitting,  setSubmitting]  = useState(false)

  const canSubmit = name.trim().length > 0 && purposeChip !== null && !submitting
  const sliderProgress = ((qosMinutes - 15) / (120 - 15)) * 100

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!canSubmit || purposeChip === null) return

    if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
      window.navigator.vibrate(100)
    }

    setSubmitting(true)
    try {
      const existing = await db.settings.get(APP_SETTINGS_ID)
      await db.settings.put({
        ...(existing ?? {
          id: APP_SETTINGS_ID,
          hasCompletedOnboarding: false,
          preferredRoutineType: 'PPL',
          daysPerWeek: 3,
        }),
        id: APP_SETTINGS_ID,
        daysPerWeek,
        userName: name.trim(),
        northStar: northStar.trim(),
        purposeChip,
        qosMinutes,
      })
      // useLiveQuery in HomePage reactively re-renders — no callback needed
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center bg-navy px-6 pb-12 pt-10">

      {/* ── TextReveal: IRONPROTOCOL ──────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-[1px]" aria-label={TITLE}>
        {CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * CHAR_DELAY, duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
            className="text-4xl font-black tracking-tight text-white"
          >
            {char}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.1, duration: 0.4 }}
        className="mt-6 text-center text-sm leading-relaxed text-electric/60"
      >
        Zero-friction progressive overload.
        <br />
        Identify yourself to initialize the engine.
      </motion.p>

      {/* ── Identity Form ─────────────────────────────────────────────────── */}
      <motion.form
        variants={FORM_STAGGER}
        initial="hidden"
        animate="visible"
        onSubmit={(e) => { void handleSubmit(e) }}
        className="mt-6 flex w-full flex-col"
      >
        <motion.section
          variants={FORM_SECTION}
          className="flex flex-col gap-5 rounded-3xl border border-electric/20 bg-navy-card p-5"
        >

          {/* Call Sign ───────────────────────────────────────────────────── */}
          <motion.label variants={FORM_SECTION} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
              Athlete Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={32}
              autoFocus
              className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
            />
          </motion.label>

          {/* North Star ──────────────────────────────────────────────────── */}
          <motion.label variants={FORM_SECTION} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
              Primary Target
            </span>
            <textarea
              value={northStar}
              onChange={(e) => setNorthStar(e.target.value)}
              placeholder="Train to..."
              maxLength={140}
              rows={2}
              className="w-full resize-none rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
            />
          </motion.label>

          {/* Purpose Chips ───────────────────────────────────────────────── */}
          <motion.div variants={FORM_SECTION} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
              Purpose
            </span>
            <div className="flex flex-wrap gap-2">
              {PURPOSE_CHIPS.map(({ value, label }) => (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={value}
                  type="button"
                  onClick={() => setPurposeChip(value)}
                  className={`cursor-pointer rounded-2xl border px-4 py-2 text-sm font-black transition-all ${
                    purposeChip === value
                      ? 'border-electric bg-electric/15 text-electric'
                      : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                  }`}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Session Budget Slider ───────────────────────────────────────── */}
          <motion.div variants={FORM_SECTION} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Default Workout Length
              </span>
              <span className="text-sm font-black text-electric">{qosMinutes} min</span>
            </div>
            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={qosMinutes}
              onChange={(e) => setQosMinutes(Number(e.target.value))}
              className="qos-slider w-full cursor-pointer appearance-none"
              style={{ '--slider-progress': `${sliderProgress}%` } as CSSProperties}
            />
            <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </motion.div>

          {/* Frequency Toggle ─────────────────────────────────────────────── */}
          <motion.div variants={FORM_SECTION} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
              Frequency
            </span>
            <div className="grid grid-cols-3 gap-2">
              {([3, 4, 5] as const).map((d) => (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  className={`cursor-pointer rounded-2xl border py-3 text-sm font-black transition-all ${
                    daysPerWeek === d
                      ? 'border-electric bg-electric/15 text-electric'
                      : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                  }`}
                >
                  {d}x
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.button
            variants={FORM_SECTION}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!canSubmit}
            className="h-14 w-full cursor-pointer rounded-3xl bg-electric px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-electric/90 active:bg-electric/80 disabled:cursor-not-allowed disabled:bg-electric/30 disabled:text-zinc-500 disabled:shadow-none"
          >
            {submitting ? 'Initializing…' : 'Initialize Protocol'}
          </motion.button>
        </motion.section>

      </motion.form>
    </main>
  )
}
