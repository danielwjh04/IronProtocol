import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  ascend,
  computeMacrocycleProgress,
  computeTrackProgress,
  forgeMasterwork,
} from '../services/heroMathService'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from '../services/macrocyclePersistence'
import { APP_SETTINGS_ID, IronProtocolDB, type Workout } from '../db/schema'

function macroWorkout(id: string, date: number): Workout {
  return {
    id,
    date,
    routineType: 'PPL',
    sessionIndex: 0,
    notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1d1|Push`,
  }
}

describe('computeMacrocycleProgress', () => {
  it('returns 0 when no macrocycle workouts exist', () => {
    expect(computeMacrocycleProgress([], 1000)).toBe(0)
  })

  it('ignores non-macrocycle workouts', () => {
    const workouts: Workout[] = [{
      id: 'w1', date: 500, routineType: 'PPL', sessionIndex: 0, notes: 'ad-hoc log',
    }]
    expect(computeMacrocycleProgress(workouts, 1000)).toBe(0)
  })

  it('returns the fraction of elapsed macrocycle workouts clamped to 1', () => {
    const workouts = [
      macroWorkout('a', 100),
      macroWorkout('b', 200),
      macroWorkout('c', 5000),
      macroWorkout('d', 6000),
    ]
    expect(computeMacrocycleProgress(workouts, 300)).toBeCloseTo(0.5)
    expect(computeMacrocycleProgress(workouts, 10_000)).toBe(1)
  })
})

describe('computeTrackProgress', () => {
  const workouts = [macroWorkout('a', 100), macroWorkout('b', 200)]

  it('returns the macrocycle progress when track matches active', () => {
    expect(computeTrackProgress(workouts, 'power', 'power', 1000)).toBe(1)
  })

  it('returns 0 when track does not match active', () => {
    expect(computeTrackProgress(workouts, 'power', 'hypertrophy', 1000)).toBe(0)
    expect(computeTrackProgress(workouts, 'hypertrophy', 'power', 1000)).toBe(0)
  })

  it('excludes workouts at or before closedAt when computing progress', () => {
    const scoped = [macroWorkout('a', 100), macroWorkout('b', 200), macroWorkout('c', 500)]
    expect(computeMacrocycleProgress(scoped, 1000, 200)).toBe(1)
    expect(computeMacrocycleProgress(scoped, 1000, 500)).toBe(0)
    expect(computeTrackProgress(scoped, 'power', 'power', 1000, 200)).toBe(1)
  })
})

describe('ascend / forgeMasterwork', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    await db.settings.clear()
    await db.workouts.clear()
    await db.sets.clear()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  async function seedMacrocycleWorkouts(count: number) {
    const now = Date.now()
    const rows: Workout[] = Array.from({ length: count }, (_, i) => ({
      id: `macro-${i}`,
      date: now - (count - i) * 1000,
      routineType: 'PPL',
      sessionIndex: i,
      notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1d${i}|Push`,
    }))
    await db.workouts.bulkAdd(rows)
  }

  it('ascend increments completedAscensions, adds to lifetimeHeroLevel, and closes the power macrocycle', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      activeTrack: 'power',
      lifetimeHeroLevel: 0,
      completedAscensions: 0,
    })
    await seedMacrocycleWorkouts(10)
    const workoutsBefore = await db.workouts.count()
    const setsBefore = await db.sets.count()

    await ascend(db)

    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.completedAscensions).toBe(1)
    expect(settings?.lifetimeHeroLevel).toBe(100)
    expect(typeof settings?.macrocycleClosedAt).toBe('number')
    expect(settings?.macrocycleClosedAt).toBeGreaterThan(0)

    expect(await db.workouts.count()).toBe(workoutsBefore)
    expect(await db.sets.count()).toBe(setsBefore)

    const workouts = await db.workouts.toArray()
    expect(computeTrackProgress(workouts, 'power', 'power', Date.now(), settings?.macrocycleClosedAt)).toBe(0)
  })

  it('forgeMasterwork mirrors ascend for the hypertrophy track', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      activeTrack: 'hypertrophy',
      lifetimeHeroLevel: 42,
      completedAscensions: 2,
    })
    await seedMacrocycleWorkouts(4)

    await forgeMasterwork(db)

    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.completedAscensions).toBe(3)
    expect(settings?.lifetimeHeroLevel).toBe(142)
    expect(typeof settings?.macrocycleClosedAt).toBe('number')

    const workouts = await db.workouts.toArray()
    expect(computeTrackProgress(workouts, 'hypertrophy', 'hypertrophy', Date.now(), settings?.macrocycleClosedAt)).toBe(0)
  })

  it('ascend on a fresh (settings-absent) DB still increments and persists', async () => {
    await seedMacrocycleWorkouts(2)

    await ascend(db)

    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.completedAscensions).toBe(1)
    expect(typeof settings?.macrocycleClosedAt).toBe('number')
  })
})
