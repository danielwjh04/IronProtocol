import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
}

const PHASES = [
  { text: 'READY', durationMs: 520 },
  { text: 'SET',   durationMs: 480 },
  { text: 'LIFT',  durationMs: 720 },
] as const

const EXIT_DELAY_MS = 300
const TICK_VIBRATION_MS = 60
const FINAL_VIBRATION_MS = 140

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

export default function WorkoutIgnition({ onComplete }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    // First beat.
    vibrate(TICK_VIBRATION_MS)

    // Subsequent beats.
    let elapsed = 0
    for (let index = 1; index < PHASES.length; index += 1) {
      elapsed += PHASES[index - 1].durationMs
      const firedAt = elapsed
      timers.push(
        setTimeout(() => {
          setPhaseIndex(index)
          // Final beat gets a stronger tick.
          vibrate(index === PHASES.length - 1 ? FINAL_VIBRATION_MS : TICK_VIBRATION_MS)
        }, firedAt),
      )
    }

    const totalDuration = PHASES.reduce((sum, phase) => sum + phase.durationMs, 0) + EXIT_DELAY_MS
    timers.push(
      setTimeout(() => {
        onCompleteRef.current()
      }, totalDuration),
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const activePhase = PHASES[phaseIndex].text

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="combat-skin fixed inset-0 z-[85] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
      aria-label="Workout ignition"
      role="status"
    >
      {/* Ambient halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 420,
          height: 420,
          background:
            'radial-gradient(circle, rgba(48,209,88,0.22) 0%, rgba(48,209,88,0) 62%)',
          filter: 'blur(24px)',
        }}
      />

      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative mx-auto flex w-full max-w-[430px] flex-col items-center gap-4 px-6"
      >
        {/* Mono brand kicker */}
        <span
          style={{
            fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.38em',
            color: 'var(--color-accent-primary)',
          }}
        >
          IRONPROTOCOL
        </span>

        {/* Single-word phase reveal */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activePhase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              y:       { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
            }}
            className="text-center"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '4rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {activePhase}
          </motion.p>
        </AnimatePresence>
      </motion.section>
    </motion.main>
  )
}
