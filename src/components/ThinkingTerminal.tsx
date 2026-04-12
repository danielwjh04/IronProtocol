import type { PlannedWorkout } from '../planner/autoPlanner'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  mode?: 'planning' | 'onboarding'
  plan?: PlannedWorkout
  onComplete: () => void
  durationMs?: number
}

interface TerminalLine {
  id: string
  text: string
  atMs: number
  type: 'system' | 'data' | 'success'
  phase?: 'biomechanics' | 'qos' | 'routine' | 'finalize'
}

interface ProtocolMilestone {
  id: 'biomechanics' | 'qos' | 'routine'
  label: string
  startMs: number
  endMs: number
}

const PLANNING_LINE_INTERVAL_MS = 220
const PLANNING_EXIT_DELAY_MS = 400
const ONBOARDING_DURATION_MS = 10_000
const TICK_VIBRATION_MS = 50
const FINAL_THUD_VIBRATION_MS = 120
const FINAL_SURGE_START_MS = 9_000

const MILESTONES: readonly ProtocolMilestone[] = [
  { id: 'biomechanics', label: 'Biomechanical Library', startMs: 0, endMs: 3_000 },
  { id: 'qos', label: 'QoS Optimization', startMs: 3_000, endMs: 6_000 },
  { id: 'routine', label: 'Routine Selection', startMs: 6_000, endMs: 9_000 },
]

function vibrate(durationMs: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(durationMs)
  }
}

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

function buildOnboardingLines(durationMs: number): TerminalLine[] {
  const finalLineAtMs = Math.max(durationMs - 420, 0)

  return [
    { id: 'o1', atMs: 0, type: 'system', phase: 'biomechanics', text: '> Accessing Biomechanical Library...' },
    { id: 'o2', atMs: 500, type: 'data', phase: 'biomechanics', text: '> Indexing squat, bench, and deadlift vectors...' },
    { id: 'o3', atMs: 1_000, type: 'system', phase: 'biomechanics', text: '> Resolving force-curve constraints...' },
    { id: 'o4', atMs: 1_500, type: 'data', phase: 'biomechanics', text: '> Calibrating movement signatures...' },
    { id: 'o5', atMs: 2_000, type: 'success', phase: 'biomechanics', text: '> Biomechanical Library synchronized.' },

    { id: 'o6', atMs: 3_000, type: 'system', phase: 'qos', text: '> Initiating QoS Optimization...' },
    { id: 'o7', atMs: 3_500, type: 'data', phase: 'qos', text: '> Solving density under session budget...' },
    { id: 'o8', atMs: 4_000, type: 'system', phase: 'qos', text: '> Balancing fatigue and recovery envelope...' },
    { id: 'o9', atMs: 4_500, type: 'success', phase: 'qos', text: '> QoS Optimization stable.' },

    { id: 'o10', atMs: 6_000, type: 'system', phase: 'routine', text: '> Running Routine Selection lattice...' },
    { id: 'o11', atMs: 6_500, type: 'data', phase: 'routine', text: '> Scoring split candidates against baselines...' },
    { id: 'o12', atMs: 7_000, type: 'system', phase: 'routine', text: '> Locking progressive overload path...' },
    { id: 'o13', atMs: 7_500, type: 'success', phase: 'routine', text: '> Routine Selection resolved.' },

    { id: 'o14', atMs: 9_000, type: 'system', phase: 'finalize', text: '> Sealing Architect Blueprint...' },
    { id: 'o15', atMs: finalLineAtMs, type: 'success', phase: 'finalize', text: '> Ready State achieved. Dashboard release armed.' },
  ]
}

function BreathingBarbell({ intensity }: { intensity: number }) {
  const pulseScale = 1.06 + (intensity * 0.14)
  const pulseOpacity = 0.74 + (intensity * 0.2)
  const pulseDuration = Math.max(0.92, 1.45 - (intensity * 0.45))

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

export default function ThinkingTerminal({ mode = 'planning', plan, onComplete, durationMs = ONBOARDING_DURATION_MS }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const onCompleteRef = useRef(onComplete)

  const isOnboarding = mode === 'onboarding'
  const safeDurationMs = isOnboarding ? Math.max(durationMs, ONBOARDING_DURATION_MS) : 0

  if (!isOnboarding && !plan) {
    throw new Error('ThinkingTerminal requires a plan in planning mode.')
  }

  const lines = useMemo(
    () => (isOnboarding ? buildOnboardingLines(safeDurationMs) : buildPlanningLines(plan as PlannedWorkout)),
    [isOnboarding, plan, safeDurationMs],
  )

  const progress = isOnboarding
    ? Math.min(elapsedMs / safeDurationMs, 1)
    : Math.min(visibleCount / Math.max(lines.length, 1), 1)
  const finalSurgeProgress = isOnboarding
    ? Math.max(0, Math.min((elapsedMs - FINAL_SURGE_START_MS) / Math.max(safeDurationMs - FINAL_SURGE_START_MS, 1), 1))
    : 0

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setVisibleCount(0)
    setElapsedMs(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    let rafId = 0

    lines.forEach((line, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleCount(index + 1)
          if (isOnboarding) {
            vibrate(TICK_VIBRATION_MS)
          }
        }, line.atMs),
      )
    })

    if (isOnboarding) {
      const start = performance.now()

      const updateProgress = (now: number): void => {
        const nextElapsed = Math.min(now - start, safeDurationMs)
        setElapsedMs(nextElapsed)
        if (nextElapsed < safeDurationMs) {
          rafId = requestAnimationFrame(updateProgress)
        }
      }

      rafId = requestAnimationFrame(updateProgress)

      timers.push(
        setTimeout(() => {
          setElapsedMs(safeDurationMs)
          vibrate(FINAL_THUD_VIBRATION_MS)
          onCompleteRef.current()
        }, safeDurationMs),
      )
    } else {
      timers.push(
        setTimeout(() => {
          onCompleteRef.current()
        }, (lines.length * PLANNING_LINE_INTERVAL_MS) + PLANNING_EXIT_DELAY_MS),
      )
    }

    return () => {
      timers.forEach(clearTimeout)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isOnboarding, lines, safeDurationMs])

  const phaseStyles: Record<TerminalLine['type'], string> = {
    success: 'text-electric',
    system: 'text-electric/75',
    data: 'text-zinc-200',
  }

  const edgeGlowOpacity = 0.17 + (progress * 0.23) + (finalSurgeProgress * 0.5)
  const edgeGlowScale = 0.96 + (progress * 0.06) + (finalSurgeProgress * 0.12)
  const finalEdgeSurgeOpacity = Math.max(0.05, finalSurgeProgress * 0.92)

  function milestoneState(milestone: ProtocolMilestone): 'pending' | 'active' | 'complete' {
    if (elapsedMs >= milestone.endMs) {
      return 'complete'
    }
    if (elapsedMs >= milestone.startMs) {
      return 'active'
    }
    return 'pending'
  }

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
        animate={{ opacity: finalEdgeSurgeOpacity, scale: 1 + (finalSurgeProgress * 0.2) }}
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
              <BreathingBarbell intensity={Math.min(1, progress + finalSurgeProgress)} />
            </div>

            <div className="mb-5 rounded-2xl border border-electric/25 bg-navy/70 p-3">
              <div className="mb-2 h-2 rounded-full border border-white/10 bg-[#1E253A]">
                <motion.div
                  className="h-full rounded-full bg-electric shadow-[0_0_16px_rgba(59,113,254,0.7)]"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                <span>0.0s</span>
                <span className="text-electric/85">{(Math.min(elapsedMs, safeDurationMs) / 1000).toFixed(1)}s / 10.0s</span>
                <span>10.0s</span>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {MILESTONES.map((milestone) => {
                const status = milestoneState(milestone)
                return (
                  <div
                    key={milestone.id}
                    className={`rounded-xl border px-2.5 py-2 text-center transition-colors ${
                      status === 'complete'
                        ? 'border-electric/50 bg-electric/15 text-electric'
                        : status === 'active'
                          ? 'border-electric/70 bg-electric/25 text-zinc-100'
                          : 'border-white/10 bg-navy/60 text-zinc-500'
                    }`}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em]">{milestone.label}</p>
                  </div>
                )
              })}
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
        {isOnboarding ? 'Uninterruptible reasoning handshake in progress' : 'Assembling your session blueprint'}
      </div>
    </main>
  )
}
