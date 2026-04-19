import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import type { ExerciseCardModel } from '../../services/exerciseQoS'

interface ExerciseListProps {
  cards: ExerciseCardModel[]
  orderedIds: string[]
  onReorder: (nextOrderIds: string[]) => void
  onSelectCard: (card: ExerciseCardModel) => void
}

function formatTarget(weight: number, reps: number, sets: number): string {
  if (weight > 0) {
    return `${weight} kg × ${reps} × ${sets}`
  }
  return `${sets} sets × ${reps}`
}

function ExerciseRow({
  card,
  onSelect,
}: {
  card: ExerciseCardModel
  onSelect: (card: ExerciseCardModel) => void
}) {
  const dragControls = useDragControls()

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
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-surface-raised)' }}
      onClick={() => onSelect(card)}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className="text-body truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {card.exercise.exerciseName}
        </span>
        <span
          className="text-label"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {formatTarget(card.exercise.weight, card.exercise.reps, card.exercise.sets)}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Reorder ${card.exercise.exerciseName}`}
        onPointerDown={(event) => {
          event.stopPropagation()
          dragControls.start(event)
        }}
        onClick={(event) => event.stopPropagation()}
        className="flex h-11 w-11 items-center justify-center touch-none"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <GripVertical size={20} strokeWidth={1.75} aria-hidden />
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
    <Reorder.Group
      axis="y"
      values={orderedIds}
      onReorder={onReorder}
      className="flex w-full flex-col gap-3 px-4 pt-5"
    >
      {orderedIds.map((id) => {
        const card = cardById.get(id)
        if (!card) return null
        return <ExerciseRow key={id} card={card} onSelect={onSelectCard} />
      })}
    </Reorder.Group>
  )
}
