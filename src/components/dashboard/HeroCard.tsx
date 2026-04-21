import { motion } from 'framer-motion'
import type { PlannedWorkout } from '../../planner/autoPlanner'
import { formatVolume } from '../../utils/formatVolume'

type TrainingGoal = 'Hypertrophy' | 'Power'

interface HeroCardProps {
  plan: PlannedWorkout | null
  sessionLabel: string
  sessionIndex: number
  cycleLength: number
  trainingGoal: TrainingGoal
  error: string | null
  primaryActionLabel: string
  disabled?: boolean
  onStart: () => void
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  )
}

export default function HeroCard({
  plan,
  sessionLabel,
  sessionIndex,
  cycleLength,
  trainingGoal,
  error,
  primaryActionLabel,
  disabled = false,
  onStart,
}: HeroCardProps) {
  const exerciseCount = plan?.exercises.length ?? 0
  const totalVolumeKg = plan
    ? plan.exercises.reduce((acc, ex) => acc + ex.weight * ex.reps * ex.sets, 0)
    : 0
  const estimatedMinutes = plan?.estimatedMinutes ?? 0
  const canStart = !disabled && !error && exerciseCount > 0

  const dayPosition =
    cycleLength > 0 ? `Day ${Math.min(sessionIndex + 1, cycleLength)} / ${cycleLength}` : null

  return (
    <section
      className="w-full"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
        {/* Chip row: accent day-in-cycle chip + secondary goal label. */}
        <div className="flex items-center gap-3">
          {dayPosition && (
            <span
              className="inline-flex items-center rounded-full px-3 py-1"
              style={{
                backgroundColor: 'var(--color-accent-soft)',
                color: 'var(--color-accent-primary)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {dayPosition}
            </span>
          )}
          <span
            className="text-label"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {trainingGoal}
          </span>
        </div>

        <h1
          className="text-display"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {sessionLabel}
        </h1>

        {/* Two-metric HUD. */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex flex-col gap-0.5 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <span
              className="text-display"
              style={{
                fontSize: '28px',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {estimatedMinutes > 0 ? estimatedMinutes : '—'}
              {estimatedMinutes > 0 && (
                <span
                  className="ml-1"
                  style={{
                    fontSize: '16px',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  min
                </span>
              )}
            </span>
            <span
              className="text-label"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Estimated
            </span>
          </div>
          <div
            className="flex flex-col gap-0.5 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <span
              className="text-display"
              style={{
                fontSize: '28px',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {totalVolumeKg > 0 ? (
                (() => {
                  const formatted = formatVolume(totalVolumeKg)
                  // Split "5,200 kg" → "5,200" + " kg" so the unit can shrink.
                  const match = formatted.match(/^([\d,.]+k?)\s(.+)$/)
                  if (!match) return formatted
                  const [, num, unit] = match
                  return (
                    <>
                      {num}
                      <span
                        className="ml-1"
                        style={{
                          fontSize: '16px',
                          color: 'var(--color-text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {unit}
                      </span>
                    </>
                  )
                })()
              ) : (
                '—'
              )}
            </span>
            <span
              className="text-label"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Total volume
            </span>
          </div>
        </div>

        {error && (
          <p
            className="text-body"
            style={{ color: 'var(--color-utility-danger)' }}
          >
            {error}
          </p>
        )}

        <motion.button
          whileTap={canStart ? { scale: 0.98 } : undefined}
          type="button"
          onClick={canStart ? onStart : undefined}
          aria-disabled={!canStart}
          className="text-body flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-bold"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-accent-on)',
            opacity: canStart ? 1 : 0.4,
          }}
        >
          <PlayIcon />
          {primaryActionLabel}
        </motion.button>
      </div>
    </section>
  )
}
