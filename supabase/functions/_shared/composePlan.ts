import { REP_SCHEMES, type GoalKey, type Tier } from './repSchemes.ts'

interface Slot { movement_pattern: string; tier: Tier; intensity_band: string }
interface ExerciseRow {
  id: string; name: string; movement_pattern: string; tier: number
  safety_flags: string[]; equipment: string[]; intensity_band: string; swap_group_id: string
}
export interface ResolvedExercise extends ExerciseRow {
  repScheme: RepScheme
}

type RepScheme = typeof REP_SCHEMES[GoalKey][Tier]

export function composePlan(
  template: { id: string; split_type: string; slots: Slot[] },
  exercisePool: ExerciseRow[],
  goal: GoalKey,
): ResolvedExercise[] {
  const usedIds = new Set<string>()

  return template.slots.map(slot => {
    const candidate = exercisePool.find(ex =>
      ex.movement_pattern === slot.movement_pattern &&
      ex.tier             === slot.tier             &&
      ex.intensity_band   === slot.intensity_band   &&
      !usedIds.has(ex.id)
    ) ?? exercisePool.find(ex =>
      ex.movement_pattern === slot.movement_pattern &&
      ex.tier             === slot.tier             &&
      !usedIds.has(ex.id)
    )

    if (!candidate) {
      throw new Error(`No safe candidate for slot: ${slot.movement_pattern} T${slot.tier}`)
    }

    usedIds.add(candidate.id)
    return {
      ...candidate,
      repScheme: REP_SCHEMES[goal][slot.tier as Tier],
    }
  })
}
