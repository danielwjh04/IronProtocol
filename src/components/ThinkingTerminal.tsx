import type { PlannedWorkout } from '../planner/autoPlanner'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

interface Props {
  plan: PlannedWorkout
  onComplete: () => void
}

interface TerminalLine {
  id: string
  text: string
  type: 'system' | 'data' | 'success'
}

function buildTerminalLines(plan: PlannedWorkout): TerminalLine[] {
  const t1Count = plan.exercises.filter(e => e.tier === 1).length
  const t2Count = plan.exercises.filter(e => e.tier === 2).length
  const t3Count = plan.exercises.filter(e => e.tier === 3).length
  const leadExercise = plan.exercises[0]

  return [
    { id: 'l1', type: 'system',  text: '> Initializing IronProtocol engine...' },
    { id: 'l2', type: 'data',    text: `> Routine loaded: ${plan.routineType} · Session ${plan.sessionIndex + 1}` },
    { id: 'l3', type: 'system',  text: `> QoS scan complete — ${plan.exercises.length} exercises selected` },
    { id: 'l4', type: 'data',    text: `> Tier composition: T1×${t1Count}  T2×${t2Count}  T3×${t3Count}` },
    { id: 'l5', type: 'system',  text: `> Computing progressive overload delta...` },
    { id: 'l6', type: 'data',    text: leadExercise
        ? `> Lead lift: ${leadExercise.exerciseName} — ${leadExercise.weight}kg × ${leadExercise.reps} (${leadExercise.sets} sets)`
        : '> Lead lift: Bodyweight circuit' },
    { id: 'l7', type: 'system',  text: `> Est. session duration: ${Math.round(plan.estimatedMinutes)} min` },
    { id: 'l8', type: 'success', text: '> Blueprint ready. Zero friction mode: ON.' },
  ]
}

export default function ThinkingTerminal({ plan, onComplete }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  
  const lines = useMemo(() => buildTerminalLines(plan), [plan])

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setVisibleCount(i)
      if (i >= lines.length) {
        clearInterval(interval)
        setTimeout(() => { onComplete() }, 400)
      }
    }, 220)

    return () => { clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center gap-0 bg-[#0A0E1A] px-6 pb-28 pt-6 font-mono text-sm">
      {/* ── Terminal chrome header ── */}
      <div className="mb-6 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-amber-400/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          ironprotocol — engine v3
        </span>
      </div>

      {/* ── Terminal lines ── */}
      <div className="flex flex-col gap-2">
        {lines.map((line, index) => (
          <AnimatePresence key={line.id}>
            {index < visibleCount && (
              <motion.p
                key={line.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={`leading-relaxed ${
                  line.type === 'success'
                    ? 'text-emerald-400'
                    : line.type === 'system'
                      ? 'text-blue-400/80'
                      : 'text-zinc-300'
                }`}
              >
                {line.text}
              </motion.p>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* ── Blinking cursor ── */}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        className="mt-3 inline-block h-4 w-2 bg-[#3B71FE]"
      />
    </main>
  )
}
