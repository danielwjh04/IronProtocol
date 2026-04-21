import { v4 as uuidv4 } from 'uuid'
import { db } from '../db/db'
import type { Workout, WorkoutSet } from '../db/schema'

const TWELVE_WEEKS_MS = 12 * 7 * 24 * 60 * 60 * 1000

function sessionTimestamp(sessionIndex: number, totalSessions: number): number {
  const spacing = TWELVE_WEEKS_MS / (totalSessions - 1)
  return Math.floor(Date.now() - TWELVE_WEEKS_MS + sessionIndex * spacing)
}

function progressedWeight(baseKg: number, weekFraction: number, weeklyIncrement: number): number {
  return Math.round((baseKg + weekFraction * 12 * weeklyIncrement) * 2) / 2
}

type ExTemplate = {
  name: string
  setsCount: number
  baseWeight: number
  weeklyIncrement: number
  baseReps: number
}

type DayTemplate = {
  label: string
  sessionIndex: number
  exercises: ExTemplate[]
}

const PUSH: DayTemplate = {
  label: 'PPL',
  sessionIndex: 0,
  exercises: [
    { name: 'Bench Press',         setsCount: 4, baseWeight: 70,  weeklyIncrement: 1.25, baseReps: 6  },
    { name: 'Overhead Press',      setsCount: 3, baseWeight: 45,  weeklyIncrement: 0.75, baseReps: 6  },
    { name: 'Incline Press',       setsCount: 3, baseWeight: 55,  weeklyIncrement: 1.0,  baseReps: 8  },
    { name: 'Triceps Pushdown',    setsCount: 3, baseWeight: 25,  weeklyIncrement: 0.5,  baseReps: 12 },
    { name: 'Lateral Raise',       setsCount: 3, baseWeight: 10,  weeklyIncrement: 0.25, baseReps: 15 },
  ],
}

const PULL: DayTemplate = {
  label: 'PPL',
  sessionIndex: 1,
  exercises: [
    { name: 'Barbell Row',         setsCount: 4, baseWeight: 65,  weeklyIncrement: 1.25, baseReps: 6  },
    { name: 'Lat Pulldown',        setsCount: 3, baseWeight: 55,  weeklyIncrement: 1.0,  baseReps: 8  },
    { name: 'Seated Cable Row',    setsCount: 3, baseWeight: 50,  weeklyIncrement: 0.75, baseReps: 10 },
    { name: 'Biceps Curl',         setsCount: 3, baseWeight: 15,  weeklyIncrement: 0.5,  baseReps: 12 },
    { name: 'Face Pull',           setsCount: 3, baseWeight: 20,  weeklyIncrement: 0.25, baseReps: 15 },
  ],
}

const LEGS: DayTemplate = {
  label: 'PPL',
  sessionIndex: 2,
  exercises: [
    { name: 'Back Squat',          setsCount: 4, baseWeight: 90,  weeklyIncrement: 1.5,  baseReps: 5  },
    { name: 'Romanian Deadlift',   setsCount: 3, baseWeight: 75,  weeklyIncrement: 1.25, baseReps: 8  },
    { name: 'Leg Press',           setsCount: 3, baseWeight: 130, weeklyIncrement: 2.5,  baseReps: 10 },
    { name: 'Leg Extension',       setsCount: 3, baseWeight: 40,  weeklyIncrement: 0.5,  baseReps: 15 },
    { name: 'Standing Calf Raise', setsCount: 4, baseWeight: 50,  weeklyIncrement: 0.5,  baseReps: 15 },
  ],
}

const HEAVY_PULL: DayTemplate = {
  label: 'PPL',
  sessionIndex: 1,
  exercises: [
    { name: 'Deadlift',            setsCount: 4, baseWeight: 110, weeklyIncrement: 2.0,  baseReps: 4  },
    { name: 'Pull Up',             setsCount: 4, baseWeight: 0,   weeklyIncrement: 0,    baseReps: 6  },
    { name: 'Dumbbell Row',        setsCount: 3, baseWeight: 28,  weeklyIncrement: 0.5,  baseReps: 10 },
    { name: 'Hammer Curl',         setsCount: 3, baseWeight: 14,  weeklyIncrement: 0.25, baseReps: 12 },
    { name: 'Rear Delt Fly',       setsCount: 3, baseWeight: 8,   weeklyIncrement: 0.25, baseReps: 15 },
  ],
}

const ROTATION: DayTemplate[] = [
  PUSH, PULL, LEGS,
  PUSH, HEAVY_PULL, LEGS,
  PUSH, PULL, LEGS,
  PUSH, HEAVY_PULL, LEGS,
  PUSH, PULL, LEGS,
  PUSH, HEAVY_PULL, LEGS,
  PUSH, PULL,
]

export async function seedSessionHistory(clear = false): Promise<void> {
  if (clear) {
    await db.transaction('rw', [db.workouts, db.sets], async () => {
      await db.workouts.clear()
      await db.sets.clear()
    })
    console.log('[seedSessionHistory] Cleared existing workouts and sets.')
  }

  const exercises = await db.exercises.toArray()
  if (exercises.length === 0) {
    console.error('[seedSessionHistory] No exercises found — run the app first to seed the exercise library.')
    return
  }

  const byName = new Map(exercises.map(e => [e.name, e]))

  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []

  for (let i = 0; i < 20; i++) {
    const weekFraction = i / 19
    const template = ROTATION[i]
    const date = sessionTimestamp(i, 20)
    const workoutId = uuidv4()

    workouts.push({
      id: workoutId,
      date,
      routineType: template.label,
      sessionIndex: template.sessionIndex,
      notes: '',
    })

    let orderIndex = 0
    for (const ex of template.exercises) {
      const exercise = byName.get(ex.name)
      if (!exercise) continue

      const weight = progressedWeight(ex.baseWeight, weekFraction, ex.weeklyIncrement)

      for (let s = 0; s < ex.setsCount; s++) {
        const reps = Math.max(ex.baseReps - Math.floor(s / 2), ex.baseReps - 2)
        sets.push({
          id: uuidv4(),
          workoutId,
          exerciseId: exercise.id,
          weight,
          reps,
          orderIndex: orderIndex++,
        })
      }
    }
  }

  await db.transaction('rw', [db.workouts, db.sets], async () => {
    await db.workouts.bulkAdd(workouts)
    await db.sets.bulkAdd(sets)
  })

  const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  console.log(
    `[seedSessionHistory] ✓ ${workouts.length} workouts · ${sets.length} sets · ${totalVolume.toLocaleString()} kg total volume`
  )
}
