import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from '../services/macrocyclePersistence'

export function useHeroProgress(): { progress: number } {
  const progress = useLiveQuery(async () => {
    const allWorkouts = await db.workouts.toArray()
    const macrocycleWorkouts = allWorkouts.filter((w) =>
      w.notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX),
    )

    if (macrocycleWorkouts.length === 0) return 0

    const now = Date.now()
    const elapsed = macrocycleWorkouts.filter((w) => w.date <= now).length
    return Math.min(1, elapsed / macrocycleWorkouts.length)
  }, [], 0)

  return { progress: progress ?? 0 }
}
