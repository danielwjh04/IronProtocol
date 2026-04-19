import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { IronProtocolDB, Workout, WorkoutSet } from '../../db/schema'
import ConfirmDialog from '../UI/ConfirmDialog'

interface Props {
  workout:   Workout | null
  db:        IronProtocolDB
  onClose:   () => void
  onDeleted: () => void
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month:   'short',
  day:     'numeric',
  year:    'numeric',
}

function formatFullDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', DATE_FORMAT).format(new Date(ts))
}

export default function WorkoutDetailSheet({ workout, db, onClose, onDeleted }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sets = useLiveQuery(async (): Promise<Array<WorkoutSet & { exerciseName: string }> | null> => {
    if (!workout) return null
    const workoutSets = await db.sets.where('workoutId').equals(workout.id).toArray()
    const byExerciseId = new Map<string, string>()
    for (const s of workoutSets) {
      if (!byExerciseId.has(s.exerciseId)) {
        const exercise = await db.exercises.get(s.exerciseId)
        byExerciseId.set(s.exerciseId, exercise?.name ?? 'Unknown lift')
      }
    }
    return workoutSets
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({ ...s, exerciseName: byExerciseId.get(s.exerciseId) ?? 'Unknown lift' }))
  }, [db, workout?.id])

  async function handleDelete() {
    if (!workout) return
    setDeleting(true)
    try {
      await db.transaction('rw', db.workouts, db.sets, async () => {
        await db.sets.where('workoutId').equals(workout.id).delete()
        await db.workouts.delete(workout.id)
      })
      onDeleted()
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <AnimatePresence>
      {workout && (
        <motion.div
          key="workout-detail-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Workout detail"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-t-3xl border-t p-5"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor:     'var(--color-border-subtle)',
              maxHeight:       '80svh',
              overflowY:       'auto',
            }}
          >
            <div className="mb-4">
              <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
                {workout.routineType} · Session {workout.sessionIndex + 1}
              </p>
              <h2
                className="text-display mt-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {formatFullDate(workout.date)}
              </h2>
            </div>

            <div className="mb-5 flex flex-col gap-2">
              {sets === null && (
                <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
                  Loading sets...
                </p>
              )}
              {sets?.length === 0 && (
                <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
                  No sets logged in this workout.
                </p>
              )}
              {sets?.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ backgroundColor: 'var(--color-surface-base)' }}
                >
                  <span className="text-body" style={{ color: 'var(--color-text-primary)' }}>
                    {i + 1}. {s.exerciseName}
                  </span>
                  <span
                    className="text-label"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {s.weight}kg × {s.reps}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border py-3 text-body"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  color:       'var(--color-text-secondary)',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
                className="flex-1 rounded-xl py-3 text-body font-black disabled:opacity-50"
                style={{
                  backgroundColor: '#B91C1C',
                  color:           '#FFFFFF',
                }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <ConfirmDialog
        open={showConfirm}
        title="Delete this workout?"
        message="All logged sets will be removed permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowConfirm(false)}
      />
    </AnimatePresence>
  )
}
