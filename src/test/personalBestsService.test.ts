import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IronProtocolDB } from '../db/schema'
import { PersonalBestsService } from '../services/personalBestsService'

describe('PersonalBestsService', () => {
  let db: IronProtocolDB
  let service: PersonalBestsService

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    service = new PersonalBestsService(db)
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  // ── First set ever ──────────────────────────────────────────────────────────

  it('creates a flagged PB record on the very first set for an exercise', async () => {
    const isNew = await service.checkAndUpdate('ex-bench', 80, 10)
    expect(isNew).toBe(true)

    const pb = await db.personalBests.get('ex-bench')
    expect(pb).toBeDefined()
    expect(pb?.bestWeight).toBe(80)
    expect(pb?.bestReps).toBe(10)
    expect(pb?.flagged).toBe(true)
    expect(pb?.achievedAt).toBeGreaterThan(0)
  })

  // ── Weight-primary progression ──────────────────────────────────────────────

  it('records a new PB and flags it when weight strictly increases', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    const isNew = await service.checkAndUpdate('ex-bench', 82.5, 8)
    expect(isNew).toBe(true)

    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(82.5)
    expect(pb?.bestReps).toBe(8)
    expect(pb?.flagged).toBe(true)
  })

  it('returns false and leaves record unchanged when weight is lower', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    const isNew = await service.checkAndUpdate('ex-bench', 75, 12)
    expect(isNew).toBe(false)

    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(80)
    expect(pb?.bestReps).toBe(10)
  })

  // ── Reps-secondary progression ──────────────────────────────────────────────

  it('records a new PB when weight is equal but reps increase', async () => {
    await service.checkAndUpdate('ex-bench', 80, 8)
    const isNew = await service.checkAndUpdate('ex-bench', 80, 10)
    expect(isNew).toBe(true)

    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(80)
    expect(pb?.bestReps).toBe(10)
  })

  it('returns false when weight is equal and reps are the same', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    const isNew = await service.checkAndUpdate('ex-bench', 80, 10)
    expect(isNew).toBe(false)
  })

  it('returns false when weight is equal and reps are lower', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    const isNew = await service.checkAndUpdate('ex-bench', 80, 8)
    expect(isNew).toBe(false)
  })

  // ── Flag management ─────────────────────────────────────────────────────────

  it('clearFlag sets flagged to false for the given exercise', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    await service.clearFlag('ex-bench')

    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.flagged).toBe(false)
  })

  it('getFlagged returns only records with flagged=true', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    await service.checkAndUpdate('ex-squat', 100, 5)
    await service.clearFlag('ex-bench')

    const flagged = await service.getFlagged()
    expect(flagged).toHaveLength(1)
    expect(flagged[0].exerciseId).toBe('ex-squat')
  })

  it('PBs for different exercises are tracked independently', async () => {
    await service.checkAndUpdate('ex-bench', 80, 10)
    await service.checkAndUpdate('ex-squat', 100, 5)

    const bench = await db.personalBests.get('ex-bench')
    const squat = await db.personalBests.get('ex-squat')
    expect(bench?.bestWeight).toBe(80)
    expect(squat?.bestWeight).toBe(100)
  })
})
