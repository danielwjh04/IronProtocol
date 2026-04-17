export interface RepScheme {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  rpe?: number
}

export type GoalKey = 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
export type Tier = 1 | 2 | 3

export const REP_SCHEMES: Record<GoalKey, Record<Tier, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
    2: { sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    3: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 180, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 240 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
  },
  fat_loss: {
    1: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60 },
    2: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45 },
    3: { sets: 3, repsMin: 12, repsMax: 20, restSeconds: 30 },
  },
  endurance: {
    1: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
    2: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30 },
    3: { sets: 2, repsMin: 20, repsMax: 30, restSeconds: 20 },
  },
  recomp: {
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 90 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 75 },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60 },
  },
}
