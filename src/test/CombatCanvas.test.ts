// src/test/CombatCanvas.test.ts
import { describe, it, expect } from 'vitest'
import { buildSequence } from '../components/hero/CombatCanvas'

describe('buildSequence', () => {
  it('returns exactly 10 frames', () => {
    expect(buildSequence(0.5)).toHaveLength(10)
  })

  it('windup frames 0 and 1 have negative attacker offset', () => {
    const seq = buildSequence(0.5)
    expect(seq[0].attackerOffsetX).toBeLessThan(0)
    expect(seq[1].attackerOffsetX).toBeLessThan(0)
  })

  it('strike frame (3) attacker offset equals 20 + intensity * 50', () => {
    expect(buildSequence(0).at(3)!.attackerOffsetX).toBe(20)
    expect(buildSequence(1).at(3)!.attackerOffsetX).toBe(70)
    expect(buildSequence(0.5).at(3)!.attackerOffsetX).toBe(45)
  })

  it('hit-stop frame (4) flash alpha equals intensity * 0.8', () => {
    expect(buildSequence(0).at(4)!.flashAlpha).toBeCloseTo(0)
    expect(buildSequence(1).at(4)!.flashAlpha).toBeCloseTo(0.8)
    expect(buildSequence(0.5).at(4)!.flashAlpha).toBeCloseTo(0.4)
  })

  it('hit-stop frames 4 and 5 have opposite shake directions', () => {
    const seq = buildSequence(1)
    expect(seq[4].shakeX).toBeGreaterThan(0)
    expect(seq[5].shakeX).toBeLessThan(0)
  })

  it('recoil frame (6) mob offset equals intensity * 28', () => {
    expect(buildSequence(0).at(6)!.mobOffsetX).toBe(0)
    expect(buildSequence(1).at(6)!.mobOffsetX).toBe(28)
  })

  it('final settle frame has both sprites at offset 0', () => {
    const seq = buildSequence(0.8)
    const last = seq[seq.length - 1]
    expect(last.attackerOffsetX).toBe(0)
    expect(last.mobOffsetX).toBe(0)
  })

  it('intensity 0 produces no flash and no shake', () => {
    const seq = buildSequence(0)
    expect(seq.every(f => f.flashAlpha === 0)).toBe(true)
    expect(seq.every(f => f.shakeX === 0)).toBe(true)
  })
})

describe('CombatCanvas strike frame', () => {
  it('frame 4 is the first frame with flashAlpha > 0', () => {
    const seq = buildSequence(1.0)
    expect(seq[3].flashAlpha).toBe(0)
    expect(seq[4].flashAlpha).toBeGreaterThan(0)
  })

  it('frame 4 has shakeX > 0', () => {
    const seq = buildSequence(1.0)
    expect(seq[4].shakeX).toBeGreaterThan(0)
  })
})
