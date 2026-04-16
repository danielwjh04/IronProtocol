import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSemanticSwap } from '../hooks/useSemanticSwap'
import type { ExerciseTier, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'

interface Props {
  exercise: { name: string; tier: ExerciseTier; muscleGroup: string }
  exerciseDB: ReadonlyExercise[]
  v11Contract: V11AppSettingsSchema | null
  onSwapConfirmed: (exerciseName: string) => void
  onClose: () => void
}

const CONFIDENCE_STYLES = {
  high: 'border-[#22c55e44] bg-[#22c55e15] text-[#22c55e]',
  medium: 'border-[#f59e0b44] bg-[#f59e0b15] text-[#f59e0b]',
  low: 'border-white/10 bg-white/5 text-zinc-400',
} as const

const TIER_LABELS: Record<ExerciseTier, 'T1' | 'T2' | 'T3'> = { 1: 'T1', 2: 'T2', 3: 'T3' }

export default function SemanticSwapDrawer({ exercise, exerciseDB, v11Contract, onSwapConfirmed, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { status, swapResult, error, isLabAvailable, submit, reset } = useSemanticSwap()

  function handleSubmit() {
    if (!query.trim() || !v11Contract) return
    submit(query.trim(), exercise, exerciseDB, v11Contract)
  }

  function handleConfirm() {
    if (swapResult) {
      onSwapConfirmed(swapResult.exerciseName)
    }
  }

  function handleClose() {
    reset()
    setQuery('')
    onClose()
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[28px] border border-white/10 bg-[#0A0E1A] px-5 pb-10 pt-4 shadow-[0_-24px_60px_-12px_rgba(0,0,0,0.8)]"
    >
      <div className="mb-4 flex justify-center">
        <div className="h-1 w-9 rounded-full bg-white/20" />
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isLabAvailable ? 'bg-[#3B71FE]' : 'bg-zinc-600'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B71FE]/70">
          {isLabAvailable ? 'Lab · Biomechanical Search' : 'Lab · Offline'}
        </span>
      </div>
      <h2 className="mb-4 text-base font-black text-white">
        Swap: {exercise.name}
        <span className="ml-2 rounded-full border border-[#3B71FE]/40 px-2 py-0.5 text-[11px] font-bold text-[#3B71FE]">
          {TIER_LABELS[exercise.tier]}
        </span>
      </h2>

      {!isLabAvailable ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0D1626] p-6 text-center">
          <span className="mb-3 text-3xl">🔬</span>
          <p className="mb-1 text-sm font-bold text-zinc-400">Lab Connection Required</p>
          <p className="text-xs text-zinc-600">
            AI-powered exercise matching requires internet and a configured API key.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#3B71FE]/40 bg-[#0D1626] px-3 py-2.5 focus-within:border-[#3B71FE]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="Describe your constraint..."
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <motion.button
              type="button"
              aria-label="Search"
              onClick={handleSubmit}
              disabled={status === 'loading' || !query.trim()}
              whileTap={{ scale: 0.9 }}
              className="rounded-lg bg-[#3B71FE] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              {status === 'loading' ? '...' : '→'}
            </motion.button>
          </div>

          <AnimatePresence>
            {status === 'error' && error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3 text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status === 'result' && swapResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="rounded-2xl border border-[#22c55e]/20 bg-[#0D1626] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-base font-black text-white">{swapResult.exerciseName}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${CONFIDENCE_STYLES[swapResult.confidence]}`}>
                    {swapResult.confidence} confidence
                  </span>
                </div>
                <div className="mb-3 flex gap-2">
                  <span className="rounded-full border border-[#3B71FE]/40 px-2 py-0.5 text-[10px] font-bold text-[#3B71FE]">
                    {swapResult.tier}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                    {swapResult.muscleGroup}
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-zinc-400">{swapResult.reason}</p>
                <motion.button
                  type="button"
                  aria-label="Confirm swap"
                  onClick={handleConfirm}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl bg-[#3B71FE] py-3 text-sm font-black text-white"
                >
                  Confirm Swap
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <button
        type="button"
        onClick={handleClose}
        className="mt-4 w-full text-center text-xs text-zinc-600"
      >
        Cancel
      </button>
    </motion.div>
  )
}
