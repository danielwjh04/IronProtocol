import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

// ── Data Interfaces ─────────────────────────────────────────────────────────────

export interface LoggedSet {
  id: string
  setNumber: number
  weight: number
  reps: number
}

export interface ExerciseData {
  id: string
  name: string
  tier: 'T1' | 'T2' | 'T3'
  goalText: string
  isActive: boolean
  isCompleted: boolean
  loggedSets: LoggedSet[]
}

// ── Props ───────────────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: ExerciseData
  onSelect: (exercise: ExerciseData) => void
}

// ── Tier badge color mapping ────────────────────────────────────────────────────

function tierBadgeClasses(tier: ExerciseData['tier']): string {
  switch (tier) {
    case 'T1':
      return 'border-[#3B71FE]/50 text-[#3B71FE]'
    case 'T2':
      return 'border-[#3B71FE]/30 text-[#3B71FE]/80'
    case 'T3':
      return 'border-[#3B71FE]/20 text-[#3B71FE]/60'
  }
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function ExerciseCard({ exercise, onSelect }: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasHistory = exercise.loggedSets.length > 0

  function handleToggleHistory(e: React.MouseEvent) {
    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }

  return (
    <motion.div
      layout
      onClick={() => onSelect(exercise)}
      className={`
        cursor-pointer rounded-xl border bg-[#0D1626] transition-shadow
        ${exercise.isActive
          ? 'border-[#3B71FE] shadow-[0_0_16px_-4px_rgba(59,113,254,0.45)]'
          : 'border-gray-800'
        }
        ${exercise.isCompleted ? 'opacity-60' : ''}
      `}
      whileTap={{ scale: 0.97 }}
    >
      {/* ── Main Card Content ─────────────────────────────────────────────── */}
      <motion.div layout="position" className="flex items-center justify-between gap-3 p-4">
        {/* Left: Exercise info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate text-base font-black text-white">
              {exercise.name}
            </h3>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${tierBadgeClasses(exercise.tier)}`}
            >
              {exercise.tier}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-zinc-400">
            {exercise.goalText}
          </p>
        </div>

        {/* Right: Chevron toggle (only visible when there is history) */}
        {hasHistory && (
          <motion.button
            type="button"
            onClick={handleToggleHistory}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={isExpanded ? 'Collapse set history' : 'Expand set history'}
            whileTap={{ scale: 0.85 }}
          >
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex items-center justify-center"
            >
              <ChevronDown size={16} />
            </motion.span>
          </motion.button>
        )}
      </motion.div>

      {/* ── History Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isExpanded && hasHistory && (
          <motion.div
            key="history-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-800 bg-gray-900/30 px-4 pb-3 pt-3">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Completed Sets
              </p>
              <div className="flex flex-wrap gap-2">
                {exercise.loggedSets.map(set => (
                  <span
                    key={set.id}
                    className="rounded-full border border-gray-800 bg-[#0A0E1A] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <span className="text-[#3B71FE]">S{set.setNumber}:</span>{' '}
                    {set.weight}kg × {set.reps}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
