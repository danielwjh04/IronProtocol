import type { IronProtocolDB } from '../db/schema'
import { ProgressIndicator } from './progressIndicator'

// IProgressShape is the raw, serialisable data contract for a progress value.
// Components consume this — never the ProgressIndicator class directly.
export interface IProgressShape {
  readonly percent: number
  readonly remaining: number
  readonly isComplete: boolean
}

// IDashboardMetrics is the central contract for all daily progress data.
// Components consume this interface only — they never compute progress directly.
export interface IDashboardMetrics {
  readonly date: string
  readonly targetKcal: number
  readonly actualKcal: number
  readonly remainingKcal: number
  readonly kcalProgress: IProgressShape
  readonly targetSteps: number
  readonly actualSteps: number
  readonly remainingSteps: number
  readonly stepsProgress: IProgressShape
}

// ActivityManager encapsulates all daily progress calculations.
// Instantiate once per session (e.g. in a React context or hook) and call
// its methods instead of reading dailyTargets directly from components.
export class ActivityManager {
  private readonly db: IronProtocolDB

  constructor(db: IronProtocolDB) {
    this.db = db
  }

  // Returns a fully computed IDashboardMetrics snapshot for the given date.
  // If no DailyTarget row exists, all values are zero.
  async getMetricsForDate(date: string): Promise<IDashboardMetrics> {
    const row = await this.db.dailyTargets.get(date)

    const targetKcal  = row?.targetKcal  ?? 0
    const actualKcal  = row?.actualKcal  ?? 0
    const targetSteps = row?.targetSteps ?? 0
    const actualSteps = row?.actualSteps ?? 0

    const kcalIndicator  = new ProgressIndicator(targetKcal,  actualKcal)
    const stepsIndicator = new ProgressIndicator(targetSteps, actualSteps)

    return {
      date,
      targetKcal,
      actualKcal,
      remainingKcal: kcalIndicator.remaining,
      kcalProgress: {
        percent:    kcalIndicator.percent,
        remaining:  kcalIndicator.remaining,
        // target=0 means no goal is set — not "complete"
        isComplete: targetKcal > 0 && kcalIndicator.isComplete,
      },
      targetSteps,
      actualSteps,
      remainingSteps: stepsIndicator.remaining,
      stepsProgress: {
        percent:    stepsIndicator.percent,
        remaining:  stepsIndicator.remaining,
        isComplete: targetSteps > 0 && stepsIndicator.isComplete,
      },
    }
  }

  // Updates only the actualKcal field for the given date.
  // Throws if no DailyTarget row exists for that date.
  async updateKcal(date: string, kcal: number): Promise<void> {
    await this.db.dailyTargets
      .where('date')
      .equals(date)
      .modify({ actualKcal: kcal })
  }

  // Updates only the actualSteps field for the given date.
  // Throws if no DailyTarget row exists for that date.
  async updateSteps(date: string, steps: number): Promise<void> {
    await this.db.dailyTargets
      .where('date')
      .equals(date)
      .modify({ actualSteps: steps })
  }
}
