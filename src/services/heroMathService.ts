import { db as defaultDb } from '../db/db'
import {
  APP_SETTINGS_ID,
  type AppSettings,
  type HeroTrack,
  type IronProtocolDB,
  type Workout,
} from '../db/schema'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from './macrocyclePersistence'

export function computeMacrocycleProgress(
  workouts: readonly Workout[],
  now: number = Date.now(),
  closedAt?: number,
): number {
  const macrocycleWorkouts = workouts.filter((w) => w.notes.startsWith(MACROCYCLE_WORKOUT_NOTE_PREFIX))
  if (macrocycleWorkouts.length === 0) return 0
  const openWorkouts =
    typeof closedAt === 'number'
      ? macrocycleWorkouts.filter((w) => w.date > closedAt)
      : macrocycleWorkouts
  if (openWorkouts.length === 0) return 0
  const elapsed = openWorkouts.filter((w) => w.date <= now).length
  return Math.min(1, elapsed / openWorkouts.length)
}

export function computeTrackProgress(
  workouts: readonly Workout[],
  activeTrack: HeroTrack,
  track: HeroTrack,
  now: number = Date.now(),
  closedAt?: number,
): number {
  if (track !== activeTrack) return 0
  return computeMacrocycleProgress(workouts, now, closedAt)
}

async function closeMacrocycle(track: HeroTrack, dbInstance: IronProtocolDB): Promise<void> {
  await dbInstance.transaction('rw', dbInstance.settings, dbInstance.workouts, async () => {
    const [settings, workouts] = await Promise.all([
      dbInstance.settings.get(APP_SETTINGS_ID),
      dbInstance.workouts.toArray(),
    ])

    const active: HeroTrack = settings?.activeTrack ?? 'power'
    const previousClosedAt = settings?.macrocycleClosedAt
    const progress = computeTrackProgress(workouts, active, track, Date.now(), previousClosedAt)
    const levelGained = Math.floor(progress * 100)
    const previousLifetime = settings?.lifetimeHeroLevel ?? 0
    const previousAscensions = settings?.completedAscensions ?? 0

    const patch: Partial<AppSettings> = {
      lifetimeHeroLevel: previousLifetime + levelGained,
      completedAscensions: previousAscensions + 1,
      macrocycleClosedAt: Date.now(),
    }

    const updated = await dbInstance.settings.update(APP_SETTINGS_ID, patch)
    if (updated === 0) {
      await dbInstance.settings.put({
        id: APP_SETTINGS_ID,
        hasCompletedOnboarding: false,
        preferredRoutineType: 'PPL',
        daysPerWeek: 3,
        activeTrack: active,
        ...patch,
      })
    }
  })
}

export async function ascend(dbInstance: IronProtocolDB = defaultDb): Promise<void> {
  await closeMacrocycle('power', dbInstance)
}

export async function forgeMasterwork(dbInstance: IronProtocolDB = defaultDb): Promise<void> {
  await closeMacrocycle('hypertrophy', dbInstance)
}
