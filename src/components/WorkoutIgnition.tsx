import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
}

const PHASES = [
  { text: 'WORKOUT.', durationMs: 500 },
  { text: 'BEGIN.',   durationMs: 900 },
] as const
const EXIT_DELAY_MS = 360
const TICK_VIBRATION_MS = 70
const FINAL_VIBRATION_MS = 120

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

    vibrate(TICK_VIBRATION_MS)

    let elapsed = 0
    for (let index = 1; index < PHASES.length; index += 1) {
      elapsed += PHASES[index - 1].durationMs
      const firedAt = elapsed
      timers.push(
        setTimeout(() => {
          setPhaseIndex(index)
          vibrate(TICK_VIBRATION_MS)
        }, firedAt),
      )
    }

    const totalDuration = PHASES.reduce((sum, phase) => sum + phase.durationMs, 0) + EXIT_DELAY_MS
    timers.push(
      setTimeout(() => {
        vibrate(FINAL_VIBRATION_MS)
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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="combat-skin fixed inset-0 z-[85] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
      aria-label="workout ignition"
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative mx-auto flex w-full max-w-[430px] flex-col items-center px-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activePhase}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 1.04 }}
            transition={{
              opacity: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
              y:       { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
              scale:   { duration: 0.5,  ease: [0.22, 1, 0.36, 1] },
            }}
            className="text-display text-center"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: '3.25rem',
              letterSpacing: '0.02em',
            }}
          >
            {activePhase}
          </motion.p>
        </AnimatePresence>
      </motion.section>
    </motion.main>
  )
}
