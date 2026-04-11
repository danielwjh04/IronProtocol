import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProgressIndicator } from '../services/progressIndicator'
import { ActivityManager } from '../services/activityManager'
import { IronProtocolDB } from '../db/schema'

describe('ProgressIndicator<T>', () => {
  it('returns 0% when current is 0', () => {
    const pi = new ProgressIndicator(10000, 0)
    expect(pi.percent).toBe(0)
  })

  it('returns 50% when current is half of target', () => {
    const pi = new ProgressIndicator(10000, 5000)
    expect(pi.percent).toBe(50)
  })

  it('returns 100% when current meets target', () => {
    const pi = new ProgressIndicator(10000, 10000)
    expect(pi.percent).toBe(100)
  })

  it('clamps to 100% when current exceeds target', () => {
    const pi = new ProgressIndicator(10000, 12000)
    expect(pi.percent).toBe(100)
  })

  it('calculates remaining correctly', () => {
    const pi = new ProgressIndicator(2000, 850)
    expect(pi.remaining).toBe(1150)
  })

  it('clamps remaining to 0 when target is exceeded', () => {
    const pi = new ProgressIndicator(2000, 2500)
    expect(pi.remaining).toBe(0)
  })

  it('isComplete returns false when below target', () => {
    const pi = new ProgressIndicator(100, 99)
    expect(pi.isComplete).toBe(false)
  })

  it('isComplete returns true when at target', () => {
    const pi = new ProgressIndicator(100, 100)
    expect(pi.isComplete).toBe(true)
  })

  it('returns 0% when target is zero (guard against division by zero)', () => {
    const pi = new ProgressIndicator(0, 0)
    expect(pi.percent).toBe(0)
  })

  it('works with fractional numbers (Kcal use case)', () => {
    const pi = new ProgressIndicator(2000.5, 1000.25)
    expect(pi.percent).toBe(50)
  })
})

describe('ActivityManager', () => {
  let db: IronProtocolDB
  let manager: ActivityManager

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    manager = new ActivityManager(db)
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('returns zero metrics when no DailyTarget exists for the date', async () => {
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.targetKcal).toBe(0)
    expect(metrics.actualKcal).toBe(0)
    expect(metrics.remainingKcal).toBe(0)
    expect(metrics.targetSteps).toBe(0)
    expect(metrics.remainingSteps).toBe(0)
    expect(metrics.kcalProgress.percent).toBe(0)
  })

  it('calculates remaining Kcal correctly from stored targets', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 10000,
      actualKcal: 1200,
      actualSteps: 6000,
    })
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.remainingKcal).toBe(800)
    expect(metrics.remainingSteps).toBe(4000)
    expect(metrics.kcalProgress.percent).toBe(60)
    expect(metrics.stepsProgress.percent).toBe(60)
  })

  it('updateKcal persists new actualKcal value', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 0,
      actualSteps: 0,
    })
    await manager.updateKcal('2026-04-11', 750)
    const row = await db.dailyTargets.get('2026-04-11')
    expect(row?.actualKcal).toBe(750)
  })

  it('updateSteps persists new actualSteps value', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 0,
      actualSteps: 0,
    })
    await manager.updateSteps('2026-04-11', 3500)
    const row = await db.dailyTargets.get('2026-04-11')
    expect(row?.actualSteps).toBe(3500)
  })

  it('clamps kcalProgress to 100% when actualKcal exceeds target', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 2500,
      actualSteps: 0,
    })
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.kcalProgress.percent).toBe(100)
    expect(metrics.remainingKcal).toBe(0)
  })
})
