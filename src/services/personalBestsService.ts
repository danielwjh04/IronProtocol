import type { IronProtocolDB, PersonalBest } from '../db/schema'

// PersonalBestsService encapsulates all personal-best detection and flagging.
// Uses weight-primary, reps-secondary comparison: a heavier lift is always
// a new PB; equal weight but more reps also counts.
// flagged=true is the "Achievement Pattern" signal — the UI reads this to show
// an instant badge until the user acknowledges it.
export class PersonalBestsService {
  private readonly db: IronProtocolDB

  constructor(db: IronProtocolDB) {
    this.db = db
  }

  // Check whether the completed set beats the stored personal best for this
  // exercise. If it does, upsert the record with flagged=true and return true.
  // Returns false when the set does not improve on the existing best.
  async checkAndUpdate(exerciseId: string, weight: number, reps: number): Promise<boolean> {
    const existing = await this.db.personalBests.get(exerciseId)

    const isNewPB =
      !existing
      || weight > existing.bestWeight
      || (weight === existing.bestWeight && reps > existing.bestReps)

    if (isNewPB) {
      await this.db.personalBests.put({
        exerciseId,
        bestWeight: weight,
        bestReps:   reps,
        achievedAt: Date.now(),
        flagged:    true,
      } satisfies PersonalBest)
    }

    return isNewPB
  }

  // Returns all personal bests that have been newly achieved and not yet seen
  // by the user (flagged=true).
  async getFlagged(): Promise<PersonalBest[]> {
    return this.db.personalBests.filter(pb => pb.flagged).toArray()
  }

  // Clears the achievement flag for a single exercise once the user has seen it.
  async clearFlag(exerciseId: string): Promise<void> {
    await this.db.personalBests
      .where('exerciseId')
      .equals(exerciseId)
      .modify({ flagged: false })
  }
}
