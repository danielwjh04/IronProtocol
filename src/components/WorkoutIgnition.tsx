import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
}

const PHASES = ['WORKOUT.', 'BEGIN.'] as const
const PHASE_DURATION_MS = 400
const EXIT_DELAY_MS = 200
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

    for (let index = 1; index < PHASES.length; index += 1) {
      timers.push(
        setTimeout(() => {
          setPhaseIndex(index)
          vibrate(TICK_VIBRATION_MS)
        }, index * PHASE_DURATION_MS),
      )
    }

    timers.push(
      setTimeout(() => {
        vibrate(FINAL_VIBRATION_MS)
        onCompleteRef.current()
      }, (PHASES.length * PHASE_DURATION_MS) + EXIT_DELAY_MS),
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const activePhase = PHASES[phaseIndex]

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.24, ease: 'easeInOut' }}
      className="combat-skin fixed inset-0 z-[85] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
      aria-label="workout ignition"
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative mx-auto flex w-full max-w-[430px] flex-col items-center px-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activePhase}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
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
