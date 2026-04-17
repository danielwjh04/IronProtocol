import type { PlannedWorkout } from '../planner/autoPlanner'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  mode?: 'planning' | 'onboarding'
  plan?: PlannedWorkout
  onComplete: () => void
}

interface TerminalLine {
  id: string
  text: string
  atMs: number
  type: 'system' | 'data' | 'success'
}

const PLANNING_LINE_INTERVAL_MS = 220
const PLANNING_EXIT_DELAY_MS = 400
const ONBOARDING_LINE_INTERVAL_MS = 260
const ONBOARDING_QUOTE_ROTATE_MS = 3_000

const ONBOARDING_QUOTES = [
  'Discipline compounds quietly before it looks obvious.',
  'Precision today is momentum tomorrow.',
  'Consistency beats intensity when no one is watching.',
  'Strong systems create strong sessions.',
  'Small increments become massive outcomes.',
  'Your next rep is a vote for your future self.',
] as const

const ONBOARDING_LINES: Array<Omit<TerminalLine, 'atMs'>> = [
  { id: 'o1', type: 'system', text: '> Architect core online. Entering adaptive synthesis loop...' },
  { id: 'o2', type: 'data', text: '> Folding constraints into progression-safe macrocycle graph...' },
  { id: 'o3', type: 'system', text: '> Resolving exercise substitutions for offline gantry continuity...' },
  { id: 'o4', type: 'data', text: '> Locking week-to-week load pathways against available QoS...' },
  { id: 'o5', type: 'success', text: '> Blueprint forge active. Awaiting final convergence signal.' },
]

function buildPlanningLines(plan: PlannedWorkout): TerminalLine[] {
  const t1Count = plan.exercises.filter(e => e.tier === 1).length
  const t2Count = plan.exercises.filter(e => e.tier === 2).length
  const t3Count = plan.exercises.filter(e => e.tier === 3).length
  const leadExercise = plan.exercises[0]

  return [
    { id: 'l1', atMs: 0 * PLANNING_LINE_INTERVAL_MS, type: 'system', text: '> Initializing IronProtocol engine...' },
    { id: 'l2', atMs: 1 * PLANNING_LINE_INTERVAL_MS, type: 'data', text: `> Routine loaded: ${plan.routineType} · Session ${plan.sessionIndex + 1}` },
    { id: 'l3', atMs: 2 * PLANNING_LINE_INTERVAL_MS, type: 'system', text: `> QoS scan complete — ${plan.exercises.length} exercises selected` },
    { id: 'l4', atMs: 3 * PLANNING_LINE_INTERVAL_MS, type: 'data', text: `> Tier composition: T1×${t1Count}  T2×${t2Count}  T3×${t3Count}` },
    { id: 'l5', atMs: 4 * PLANNING_LINE_INTERVAL_MS, type: 'system', text: '> Computing progressive overload delta...' },
    { id: 'l6', atMs: 5 * PLANNING_LINE_INTERVAL_MS, type: 'data', text: leadExercise
        ? `> Lead lift: ${leadExercise.exerciseName} — ${leadExercise.weight}kg × ${leadExercise.reps} (${leadExercise.sets} sets)`
        : '> Lead lift: Bodyweight circuit' },
    { id: 'l7', atMs: 6 * PLANNING_LINE_INTERVAL_MS, type: 'system', text: `> Est. session duration: ${Math.round(plan.estimatedMinutes)} min` },
    { id: 'l8', atMs: 7 * PLANNING_LINE_INTERVAL_MS, type: 'success', text: '> Blueprint ready. Zero friction mode: ON.' },
  ]
}

function buildOnboardingLines(): TerminalLine[] {
  return ONBOARDING_LINES.map((line, index) => ({
    ...line,
    atMs: index * ONBOARDING_LINE_INTERVAL_MS,
  }))
}

function BreathingBarbell({ cycle }: { cycle: number }) {
  const pulseScale = 1.08 + ((cycle % 3) * 0.01)
  const pulseOpacity = 0.8 + ((cycle % 2) * 0.08)
  const pulseDuration = 1.15 + ((cycle % 3) * 0.08)

  return (
    <motion.svg
      width="196"
      height="52"
      viewBox="0 0 196 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Architect Engine barbell"
      animate={{ scale: [1, pulseScale, 1], opacity: [0.7, pulseOpacity, 0.7] }}
      transition={{ duration: pulseDuration, ease: 'easeInOut', repeat: Infinity }}
    >
      <rect x="8" y="8" width="16" height="36" rx="4" fill="#3B71FE" opacity="0.95" />
      <rect x="24" y="14" width="8" height="24" rx="2" fill="#3B71FE" />
      <rect x="32" y="23" width="132" height="6" rx="3" fill="#3B71FE" />
      <rect x="164" y="14" width="8" height="24" rx="2" fill="#3B71FE" />
      <rect x="172" y="8" width="16" height="36" rx="4" fill="#3B71FE" opacity="0.95" />
      <rect x="52" y="21" width="5" height="10" rx="2" fill="white" opacity="0.2" />
      <rect x="138" y="21" width="5" height="10" rx="2" fill="white" opacity="0.2" />
    </motion.svg>
  )
}

export default function ThinkingTerminal({ mode = 'planning', plan, onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const onCompleteRef = useRef(onComplete)

  const isOnboarding = mode === 'onboarding'

  if (!isOnboarding && !plan) {
    throw new Error('ThinkingTerminal requires a plan in planning mode.')
  }

  const lines = useMemo(
    () => (isOnboarding ? buildOnboardingLines() : buildPlanningLines(plan as PlannedWorkout)),
    [isOnboarding, plan],
  )

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(
      setTimeout(() => {
        setVisibleCount(0)
      }, 0),
    )

    lines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(index + 1)
        }, line.atMs),
      )
    })

    if (!isOnboarding) {
      timers.push(
        setTimeout(() => {
          onCompleteRef.current()
        }, (lines.length * PLANNING_LINE_INTERVAL_MS) + PLANNING_EXIT_DELAY_MS),
      )
    }

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [isOnboarding, lines])

  useEffect(() => {
    if (!isOnboarding) {
      return
    }

    const quoteResetTimer = setTimeout(() => {
      setQuoteIndex(0)
    }, 0)

    const quoteTimer = setInterval(() => {
      setQuoteIndex((current) => ((current + 1) % ONBOARDING_QUOTES.length))
    }, ONBOARDING_QUOTE_ROTATE_MS)

    return () => {
      clearTimeout(quoteResetTimer)
      clearInterval(quoteTimer)
    }
  }, [isOnboarding])

  const phaseStyles: Record<TerminalLine['type'], string> = {
    success: 'text-electric',
    system: 'text-electric/75',
    data: 'text-zinc-200',
  }

  const edgeGlowOpacity = isOnboarding ? 0.38 : 0.2
  const edgeGlowScale = isOnboarding ? 1.08 + ((quoteIndex % 3) * 0.01) : 1

  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center overflow-hidden bg-navy px-5 pb-24 pt-8 font-mono text-sm">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: edgeGlowOpacity, scale: edgeGlowScale }}
        transition={{ type: 'spring', stiffness: 180, damping: 26 }}
      >
        <div className="absolute inset-8 rounded-[34px] border border-electric/40 bg-electric/20 blur-[52px]" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: isOnboarding ? 0.22 : 0.08, scale: isOnboarding ? 1.14 : 1.02 }}
        transition={{ type: 'spring', stiffness: 210, damping: 22 }}
      >
        <div className="absolute inset-[52px] rounded-[26px] border border-electric/70 bg-electric/45 blur-[68px]" />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="relative rounded-[30px] border border-electric/30 bg-navy-card/95 p-5 shadow-[0_28px_60px_-36px_rgba(59,113,254,0.9)]"
        aria-label={isOnboarding ? 'Architect Engine reasoning sequence' : 'Planner thinking terminal'}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-electric/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-electric/45" />
          <span className="h-2.5 w-2.5 rounded-full bg-electric/25" />
          <span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-electric/70">
            ironprotocol architect engine
          </span>
        </div>

        {isOnboarding && (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-electric/65">Reasoning Protocol</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-100">Architect Engine</h1>
              </div>
              <BreathingBarbell cycle={quoteIndex} />
            </div>

            <div className="mb-5 rounded-2xl border border-electric/25 bg-navy/70 p-3.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/70">
                Strategic Directive
              </p>
              <div className="min-h-[72px] rounded-xl border border-white/10 bg-navy/85 px-3 py-2.5">
                <motion.blockquote
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="text-sm font-semibold leading-relaxed text-zinc-100"
                >
                  "{ONBOARDING_QUOTES[quoteIndex]}"
                </motion.blockquote>
              </div>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-electric/55">
                Rotating every 3s while your blueprint converges.
              </p>
            </div>
          </>
        )}

        <div className="flex max-h-[290px] flex-col gap-2 overflow-hidden rounded-2xl border border-white/10 bg-navy/80 px-3.5 py-3">
          <AnimatePresence initial={false}>
            {lines.map((line, index) => (
              index < visibleCount ? (
                <motion.p
                  key={line.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className={`leading-relaxed ${phaseStyles[line.type]}`}
                >
                  {line.text}
                </motion.p>
              ) : null
            ))}
          </AnimatePresence>

          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            className="inline-block h-4 w-2 bg-electric"
          />
        </div>
      </motion.section>

      <div className="relative mt-4 px-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-electric/55">
        {isOnboarding ? 'Live synthesis loop active' : 'Assembling your session blueprint'}
      </div>
    </main>
  )
}
