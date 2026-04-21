import { Reorder, useDragControls } from 'framer-motion'
import type { ExerciseCardModel } from '../../services/exerciseQoS'
import TierIcon from './TierIcon'
import type { ExerciseTier } from '../../db/schema'

interface ExerciseListProps {
  cards: ExerciseCardModel[]
  orderedIds: string[]
  onReorder: (nextOrderIds: string[]) => void
  onSelectCard: (card: ExerciseCardModel) => void
}

function formatTarget(weight: number, reps: number, sets: number) {
  const setsReps = `${sets} × ${reps}`
  if (weight > 0) {
    return { weight: `${weight} kg`, setsReps }
  }
  return { weight: null, setsReps }
}

function tierColors(tier: ExerciseTier): { bg: string; fg: string } {
  if (tier === 1) {
    return {
      bg: 'var(--color-accent-soft)',
      fg: 'var(--color-accent-primary)',
    }
  }
  if (tier === 2) {
    return {
      bg: 'var(--color-surface-overlay)',
      fg: 'var(--color-text-primary)',
    }
  }
  return {
    bg: 'var(--color-surface-overlay)',
    fg: 'var(--color-text-muted)',
  }
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" />
    </svg>
  )
}

function SwapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 4 L4 7 L7 10" />
      <path d="M4 7 h12 a4 4 0 0 1 4 4" />
      <path d="M17 20 L20 17 L17 14" />
      <path d="M20 17 h-12 a4 4 0 0 1 -4 -4" />
    </svg>
  )
}

function ExerciseRow({
  card,
  onSelect,
}: {
  card: ExerciseCardModel
  onSelect: (card: ExerciseCardModel) => void
}) {
  const dragControls = useDragControls()
  const tier = card.exercise.tier
  const { bg, fg } = tierColors(tier)
  const { weight, setsReps } = formatTarget(
    card.exercise.weight,
    card.exercise.reps,
    card.exercise.sets,
  )

  return (
    <Reorder.Item
      value={card.instanceId}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        backgroundColor: 'var(--color-surface-overlay)',
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
      onClick={() => onSelect(card)}
      role="button"
      aria-label={`Open ${card.exercise.exerciseName} options`}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: bg, color: fg }}
      >
        <TierIcon tier={tier} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className="truncate"
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '-0.005em',
          }}
        >
          {card.exercise.exerciseName}
        </span>
        <span
          className="text-label"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
            display: 'inline-flex',
            gap: '8px',
            alignItems: 'baseline',
          }}
        >
          {weight && (
            <>
              <b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{weight}</b>
              <span style={{ color: 'var(--color-text-muted)' }}>·</span>
            </>
          )}
          <span>{setsReps}</span>
        </span>
      </div>
      <button
        type="button"
        aria-label={`Swap ${card.exercise.exerciseName}`}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(card)
        }}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          color: 'var(--color-text-secondary)',
          backgroundColor: 'transparent',
        }}
      >
        <SwapIcon />
      </button>
      <button
        type="button"
        aria-label={`Reorder ${card.exercise.exerciseName}`}
        onPointerDown={(event) => {
          event.stopPropagation()
          dragControls.start(event)
        }}
        onClick={(event) => event.stopPropagation()}
        className="flex h-11 w-8 items-center justify-center touch-none"
        style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
      >
        <DragHandleIcon />
      </button>
    </Reorder.Item>
  )
}

export default function ExerciseList({
  cards,
  orderedIds,
  onReorder,
  onSelectCard,
}: ExerciseListProps) {
  if (cards.length === 0) {
    return null
  }

  const cardById = new Map(cards.map((card) => [card.instanceId, card]))

  return (
    <div className="flex w-full flex-col px-5">
      <div className="flex items-center justify-between pb-2 pt-4">
        <span
          className="text-label"
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Exercises
        </span>
        <span
          className="text-label"
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '12px',
          }}
        >
          {cards.length} today
        </span>
      </div>

      <Reorder.Group
        axis="y"
        values={orderedIds}
        onReorder={onReorder}
        className="flex w-full flex-col gap-2.5"
      >
        {orderedIds.map((id) => {
          const card = cardById.get(id)
          if (!card) return null
          return <ExerciseRow key={id} card={card} onSelect={onSelectCard} />
        })}
      </Reorder.Group>
    </div>
  )
}
