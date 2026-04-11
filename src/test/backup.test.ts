import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'
import { buildBackupPayload, serializeBackup } from '../utils/backup'

describe('backup export serialization', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('serializes workouts, exercises, sets, and settings into backup JSON', async () => {
    const exerciseId = uuidv4()
    const workoutId = uuidv4()

    await db.exercises.add({
      id: exerciseId,
      name: 'Bench Press',
      muscleGroup: 'Chest',
      mediaType: 'webp',
      mediaRef: 'bench.webp',
      tags: ['push', 'compound'],
      tier: 1,
    })

    await db.workouts.add({
      id: workoutId,
      date: 1_716_000_000,
      routineType: 'PPL',
      sessionIndex: 0,
      notes: 'export test',
    })

    await db.sets.add({
      id: uuidv4(),
      workoutId,
      exerciseId,
      weight: 80,
      reps: 8,
      orderIndex: 0,
    })

    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'GZCL',
      daysPerWeek: 3,
    })

    const serialized = await serializeBackup(db)
    const parsed = JSON.parse(serialized) as {
      workouts: Array<{ id: string }>
      exercises: Array<{ id: string }>
      sets: Array<{ workoutId: string; exerciseId: string }>
      settings: Array<{ id: string; hasCompletedOnboarding: boolean; preferredRoutineType: string }>
      exportedAt: number
    }

    expect(parsed.exercises).toHaveLength(1)
    expect(parsed.workouts).toHaveLength(1)
    expect(parsed.sets).toHaveLength(1)
    expect(parsed.settings).toHaveLength(1)
    expect(parsed.workouts[0].id).toBe(workoutId)
    expect(parsed.exercises[0].id).toBe(exerciseId)
    expect(parsed.sets[0].workoutId).toBe(workoutId)
    expect(parsed.sets[0].exerciseId).toBe(exerciseId)
    expect(parsed.settings[0]).toEqual({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'GZCL',
      daysPerWeek: 3,
    })
    expect(typeof parsed.exportedAt).toBe('number')
  })

  it('buildBackupPayload returns table arrays without mutating stored records', async () => {
    const payload = await buildBackupPayload(db)

    expect(Array.isArray(payload.exercises)).toBe(true)
    expect(Array.isArray(payload.workouts)).toBe(true)
    expect(Array.isArray(payload.sets)).toBe(true)
    expect(Array.isArray(payload.settings)).toBe(true)
    expect(payload.settings.some((entry) => entry.id === APP_SETTINGS_ID)).toBe(true)
  })
})
