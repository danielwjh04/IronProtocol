import { motion } from 'framer-motion'
import { useState } from 'react'
import { APP_SETTINGS_ID, type IronProtocolDB } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY

export default function IdentitySplash({ db }: Props) {
  const [name, setName] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(3)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    const existing = await db.settings.get(APP_SETTINGS_ID)
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: existing?.hasCompletedOnboarding ?? false,
      preferredRoutineType: existing?.preferredRoutineType ?? 'PPL',
      daysPerWeek,
      userName: name.trim(),
    })
    // useLiveQuery in parent reactively re-renders — no explicit callback needed
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center gap-8 bg-[#0A0E1A] px-6 pb-16 pt-16">
      {/* ── TextReveal: IRONPROTOCOL ─────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-[1px]" aria-label={TITLE}>
        {CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * CHAR_DELAY,
              duration: 0.48,
              ease: [0.23, 1, 0.32, 1],
            }}
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
        className="text-center text-sm leading-relaxed text-blue-300/60"
      >
        Zero-friction progressive overload.
        <br />
        Identify yourself to initialize the engine.
      </motion.p>

      {/* ── Identity Form ────────────────────────────────────────────────── */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.28, duration: 0.4 }}
        onSubmit={(e) => { void handleSubmit(e) }}
        className="flex w-full flex-col gap-4"
      >
        {/* Gradient border card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#ec4899]/20 to-[#3B71FE]/20 p-[1px]">
          <div className="flex flex-col gap-5 rounded-3xl bg-[#0D1626] p-5">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">
                Call Sign
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={32}
                autoFocus
                className="w-full rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 transition-colors focus:border-[#3B71FE] focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">
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
                        ? 'border-[#3B71FE] bg-[#3B71FE]/15 text-[#3B71FE]'
                        : 'border-[#3B71FE]/20 bg-[#091020] text-zinc-400 hover:border-[#3B71FE]/40'
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
          disabled={!name.trim() || submitting}
          className="h-14 w-full cursor-pointer rounded-3xl bg-[#3B71FE] px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-[#5585ff] active:bg-[#2860ee] disabled:cursor-not-allowed disabled:bg-blue-900/30 disabled:text-blue-900/50 disabled:shadow-none"
        >
          {submitting ? 'Initializing…' : 'Enter Protocol'}
        </motion.button>
      </motion.form>
    </main>
  )
}
