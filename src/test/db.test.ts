import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'
import type { DailyTarget, PersonalBest } from '../db/schema'

// Happy Path — these tests define the contract the DB implementation must satisfy.
// This contract guards schema availability and migration versioning.

describe('IronProtocolDB — Happy Path', () => {
  let db: IronProtocolDB

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close()
    }
    await db.delete()
  })

  it('opens at schema version 13', async () => {
    db = new IronProtocolDB()
    await db.open()
    expect(db.verno).toBe(13)
  })

  it('exposes exercises, workouts, sets, settings, tempSessions, baselines, dailyTargets, and personalBests tables', async () => {
    db = new IronProtocolDB()
    await db.open()
    const tableNames = db.tables.map((t) => t.name)
    expect(tableNames).toContain('exercises')
    expect(tableNames).toContain('workouts')
    expect(tableNames).toContain('sets')
    expect(tableNames).toContain('settings')
    expect(tableNames).toContain('tempSessions')
    expect(tableNames).toContain('baselines')
    expect(tableNames).toContain('dailyTargets')
    expect(tableNames).toContain('personalBests')
  })

  it('creates default onboarding settings as not completed', async () => {
    db = new IronProtocolDB()
    await db.open()

    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings).toBeDefined()
    expect(settings?.hasCompletedOnboarding).toBe(false)
    expect(settings?.preferredRoutineType).toBe('PPL')
    expect(settings?.daysPerWeek).toBe(3)
    expect(settings?.activeFallbackPool).toEqual({})
  })
})

describe('v10 schema — DailyTargets and PersonalBests', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  it('can write and read a DailyTarget record', async () => {
    await db.open()
    const target: DailyTarget = {
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 10000,
      actualKcal: 850,
      actualSteps: 4200,
    }
    await db.dailyTargets.put(target)
    const retrieved = await db.dailyTargets.get('2026-04-11')
    expect(retrieved).toEqual(target)
  })

  it('can write and read a PersonalBest record', async () => {
    await db.open()
    const pb: PersonalBest = {
      exerciseId: 'ex-bench-001',
      bestWeight: 102.5,
      bestReps: 5,
      achievedAt: Date.now(),
      flagged: true,
    }
    await db.personalBests.put(pb)
    const retrieved = await db.personalBests.get('ex-bench-001')
    expect(retrieved).toEqual(pb)
  })
})

describe('v11 schema — onboarding fields', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  it('persists northStar, purposeChip, and qosMinutes on AppSettings', async () => {
    await db.open()
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: false,
      preferredRoutineType: 'PPL',
      daysPerWeek: 4,
      userName: 'Atlas',
      northStar: 'Build elite strength',
      purposeChip: 'strength',
      qosMinutes: 60,
    })
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.userName).toBe('Atlas')
    expect(settings?.northStar).toBe('Build elite strength')
    expect(settings?.purposeChip).toBe('strength')
    expect(settings?.qosMinutes).toBe(60)
  })

  it('existing settings rows without new fields remain valid (fields are optional)', async () => {
    await db.open()
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings).toBeDefined()
    expect(settings?.northStar).toBeUndefined()
    expect(settings?.purposeChip).toBeUndefined()
    expect(settings?.qosMinutes).toBeUndefined()
  })
})
