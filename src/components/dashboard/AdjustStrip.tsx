import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import type { PlannedExercise } from '../../planner/autoPlanner'

type TrainingGoal = 'Hypertrophy' | 'Power'

interface AdjustStripProps {
  trainingGoal: TrainingGoal
  workoutLengthMinutes: number
  trimmedExercises: PlannedExercise[]
  onTrainingGoalToggle: (goal: TrainingGoal) => void
  onWorkoutLengthChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPinTrimmed?: (exerciseId: string) => void
}

const GOAL_OPTIONS: TrainingGoal[] = ['Hypertrophy', 'Power']

export default function AdjustStrip({
  trainingGoal,
  workoutLengthMinutes,
  trimmedExercises,
  onTrainingGoalToggle,
  onWorkoutLengthChange,
  onPinTrimmed,
}: AdjustStripProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="w-full px-4 pt-4 pb-8">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-center gap-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <ChevronDown size={16} strokeWidth={2} />
        </motion.span>
        <span className="text-label uppercase">Adjust</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="adjust-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col gap-2">
                <span
                  className="text-label uppercase"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Training Goal
                </span>
                <div
                  className="flex w-full rounded-xl p-1"
                  style={{ backgroundColor: 'var(--color-surface-raised)' }}
                >
                  {GOAL_OPTIONS.map((goal) => {
                    const active = goal === trainingGoal
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => onTrainingGoalToggle(goal)}
                        className="text-label flex-1 rounded-lg py-2 transition-colors"
                        style={{
                          backgroundColor: active
                            ? 'var(--color-accent-primary)'
                            : 'transparent',
                          color: active
                            ? 'var(--color-accent-on)'
                            : 'var(--color-text-secondary)',
                        }}
                      >
                        {goal}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-label uppercase"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Time Available
                  </span>
                  <span
                    className="text-body"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {workoutLengthMinutes} min
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={5}
                  value={workoutLengthMinutes}
                  onChange={onWorkoutLengthChange}
                  className="w-full"
                  aria-label="Time available in minutes"
                />
              </div>

              {trimmedExercises.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span
                    className="text-label uppercase"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Trimmed
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {trimmedExercises.map((exercise) => (
                      <button
                        key={`${exercise.exerciseId}-${exercise.exerciseName}`}
                        type="button"
                        onClick={() => onPinTrimmed?.(exercise.exerciseId)}
                        className="text-label shrink-0 rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: 'var(--color-surface-raised)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        {exercise.exerciseName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
