import { motion } from 'framer-motion'
import type { PlannedWorkout } from '../../planner/autoPlanner'

interface HeroCardProps {
  plan: PlannedWorkout | null
  sessionLabel: string
  error: string | null
  primaryActionLabel: string
  disabled?: boolean
  onStart: () => void
}

function formatVolume(totalKg: number): string {
  if (totalKg <= 0) return '0 kg'
  return `${Math.round(totalKg).toLocaleString('en-US')} kg`
}

export default function HeroCard({
  plan,
  sessionLabel,
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

  return (
    <section
      className="w-full"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
    >
      <div className="flex flex-col gap-5 px-4 py-6">
        <h1
          className="text-display"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {sessionLabel}
        </h1>

        <p
          className="text-label"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          {totalVolumeKg > 0 ? ` · ${formatVolume(totalVolumeKg)} total` : ''}
        </p>

        <div className="flex items-baseline gap-2">
          <span
            className="text-display"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {estimatedMinutes > 0 ? `${estimatedMinutes} min` : '—'}
          </span>
          <span
            className="text-label"
            style={{ color: 'var(--color-text-muted)' }}
          >
            estimated
          </span>
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
          className="text-body h-14 w-full rounded-2xl font-bold"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-accent-on)',
            opacity: canStart ? 1 : 0.4,
          }}
        >
          {primaryActionLabel}
        </motion.button>
      </div>
    </section>
  )
}
