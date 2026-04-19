import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise } from '../../db/schema'
import type { ExerciseCardModel } from '../../services/exerciseQoS'

interface ExerciseSwapSheetProps {
  open: boolean
  target: ExerciseCardModel | null
  candidates: Exercise[]
  isLoading: boolean
  isPending: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => Promise<void> | void
}

export default function ExerciseSwapSheet({
  open,
  target,
  candidates,
  isLoading,
  isPending,
  onClose,
  onSelect,
}: ExerciseSwapSheetProps) {
  return (
    <AnimatePresence>
      {open && target && (
        <>
          <motion.div
            key="swap-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!isPending) {
                onClose()
              }
            }}
            className="fixed inset-0 z-40 bg-black/60"
            aria-hidden
          />
          <motion.aside
            key="swap-sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[78vh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-3xl border-t p-5"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-strong)',
            }}
            role="dialog"
            aria-label={`Swap ${target.exercise.exerciseName}`}
          >
            <header className="mb-4 flex flex-col gap-1">
              <p
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Swap
              </p>
              <h2
                className="text-display"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {target.exercise.exerciseName}
              </h2>
              <p className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                Siblings in the same muscle group and tier.
              </p>
            </header>

            {isLoading && (
              <p
                className="text-body py-4 text-center"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Loading alternatives…
              </p>
            )}

            {!isLoading && candidates.length === 0 && (
              <p
                className="text-body py-4 text-center"
                style={{ color: 'var(--color-text-muted)' }}
              >
                No sibling exercises available.
              </p>
            )}

            {!isLoading && candidates.length > 0 && (
              <ul className="flex flex-col gap-2">
                {candidates.map((candidate) => (
                  <li key={candidate.id}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => { void onSelect(candidate) }}
                      disabled={isPending}
                      className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left"
                      style={{
                        backgroundColor: 'var(--color-surface-base)',
                        borderColor: 'var(--color-border-subtle)',
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      <div className="flex flex-col">
                        <span
                          className="text-body"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {candidate.name}
                        </span>
                        <span
                          className="text-label mt-0.5"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {candidate.muscleGroup}
                        </span>
                      </div>
                      <span
                        className="text-label rounded-full px-2 py-1"
                        style={{
                          backgroundColor: 'var(--color-surface-raised)',
                          color: 'var(--color-accent-primary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        Tier {candidate.tier}
                      </span>
                    </motion.button>
                  </li>
                ))}
              </ul>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-label mt-4 h-12 rounded-3xl border px-4"
              style={{
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </motion.button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
