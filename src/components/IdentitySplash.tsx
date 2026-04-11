import { motion } from 'framer-motion'
import { useState } from 'react'
import { APP_SETTINGS_ID, type IronProtocolDB, type PurposeChip } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY

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

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const existing = await db.settings.get(APP_SETTINGS_ID)
    await db.settings.put({
      id:                     APP_SETTINGS_ID,
      hasCompletedOnboarding: existing?.hasCompletedOnboarding ?? false,
      preferredRoutineType:   existing?.preferredRoutineType   ?? 'PPL',
      daysPerWeek,
      userName:    name.trim(),
      northStar:   northStar.trim(),
      purposeChip,
      qosMinutes,
    })
    // useLiveQuery in HomePage reactively re-renders — no callback needed
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center gap-8 bg-navy px-6 pb-16 pt-16">

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
        className="text-center text-sm leading-relaxed text-electric/60"
      >
        Zero-friction progressive overload.
        <br />
        Identify yourself to initialize the engine.
      </motion.p>

      {/* ── Identity Form ─────────────────────────────────────────────────── */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.28, duration: 0.4 }}
        onSubmit={(e) => { void handleSubmit(e) }}
        className="flex w-full flex-col gap-4"
      >
        <div className="rounded-3xl bg-gradient-to-br from-pink/20 to-electric/20 p-[1px]">
          <div className="flex flex-col gap-5 rounded-3xl bg-navy-card p-5">

            {/* Call Sign ───────────────────────────────────────────────────── */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Call Sign
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={32}
                autoFocus
                className="w-full rounded-2xl border border-electric/20 bg-[#091020] px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 transition-colors focus:border-electric focus:outline-none"
              />
            </label>

            {/* North Star ──────────────────────────────────────────────────── */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                North Star
              </span>
              <textarea
                value={northStar}
                onChange={(e) => setNorthStar(e.target.value)}
                placeholder="Train to..."
                maxLength={140}
                rows={2}
                className="w-full resize-none rounded-2xl border border-electric/20 bg-[#091020] px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 transition-colors focus:border-electric focus:outline-none"
              />
            </label>

            {/* Purpose Chips ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
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
                    className={`rounded-2xl border px-4 py-2 text-sm font-black transition-all ${
                      purposeChip === value
                        ? 'border-electric bg-electric/15 text-electric'
                        : 'border-electric/20 bg-[#091020] text-zinc-400 hover:border-electric/40'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* QoS Slider ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                  Session Budget
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
                className="w-full cursor-pointer appearance-none"
              />
              <div className="flex justify-between text-[10px] font-semibold text-zinc-600">
                <span>15 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Days / Week ─────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Training Days / Week
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 5] as const).map((d) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`rounded-2xl border py-3 text-sm font-black transition-all ${
                      daysPerWeek === d
                        ? 'border-electric bg-electric/15 text-electric'
                        : 'border-electric/20 bg-[#091020] text-zinc-400 hover:border-electric/40'
                    }`}
                  >
                    {d}×
                  </motion.button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!canSubmit}
          className="h-14 w-full cursor-pointer rounded-3xl bg-electric px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-[#5585ff] active:bg-[#2860ee] disabled:cursor-not-allowed disabled:bg-blue-900/30 disabled:text-blue-900/50 disabled:shadow-none"
        >
          {submitting ? 'Initializing…' : 'Enter Protocol'}
        </motion.button>
      </motion.form>
    </main>
  )
}
