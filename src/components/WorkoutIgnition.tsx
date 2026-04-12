import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onComplete: () => void
}

interface CountdownStep {
  count: 3 | 2 | 1
  label: 'LOAD' | 'SET' | 'GO'
}

const COUNTDOWN_STEPS: readonly CountdownStep[] = [
  { count: 3, label: 'LOAD' },
  { count: 2, label: 'SET' },
  { count: 1, label: 'GO' },
]

const STEP_DURATION_MS = 1000
const EXIT_DELAY_MS = 320
const TICK_VIBRATION_MS = 70
const FINAL_VIBRATION_MS = 120

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

export default function WorkoutIgnition({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    vibrate(TICK_VIBRATION_MS)

    for (let index = 1; index < COUNTDOWN_STEPS.length; index += 1) {
      timers.push(
        setTimeout(() => {
          setStepIndex(index)
          vibrate(TICK_VIBRATION_MS)
        }, index * STEP_DURATION_MS),
      )
    }

    timers.push(
      setTimeout(() => {
        vibrate(FINAL_VIBRATION_MS)
        onCompleteRef.current()
      }, (COUNTDOWN_STEPS.length * STEP_DURATION_MS) + EXIT_DELAY_MS),
    )

    return () => timers.forEach(clearTimeout)
  }, [])

  const activeStep = COUNTDOWN_STEPS[stepIndex]

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.32, ease: 'easeInOut' }}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-navy"
      aria-label="Workout ignition countdown"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric/18 blur-[90px]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative mx-auto flex w-full max-w-[430px] flex-col items-center px-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-electric/75">Workout Ignition</p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeStep.count}
            initial={{ opacity: 0, y: 18, scale: 0.82, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, scale: 1.08, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="mt-5 flex flex-col items-center"
          >
            <p className="font-display text-[110px] font-black leading-none tracking-tight text-zinc-50">{activeStep.count}</p>
            <p className="-mt-2 text-xl font-black uppercase tracking-[0.3em] text-electric">{activeStep.label}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center gap-2.5">
          {COUNTDOWN_STEPS.map((step, index) => (
            <motion.span
              key={step.label}
              animate={{
                opacity: index === stepIndex ? 1 : (index < stepIndex ? 0.65 : 0.22),
                scale: index === stepIndex ? 1.18 : 1,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="h-2.5 w-10 rounded-full bg-electric"
            />
          ))}
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-electric/55">
          Priming active logger
        </p>
      </motion.section>
    </motion.main>
  )
}