import { describe, it, expect, vi } from 'vitest'
import { subscribe, publish } from '../events/setCommitEvents'
import type { SetCommitEvent } from '../events/setCommitEvents'

const BASE: SetCommitEvent = {
  exerciseId: 'ex-1',
  weight: 100,
  reps: 10,
  volume: 1000,
  timestamp: 1000,
  source: 'mid-session',
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('setCommitEvents', () => {
  it('calls listener when event is published', async () => {
    const listener = vi.fn()
    const unsub = subscribe(listener)
    publish(BASE)
    await flush()
    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith(BASE)
    unsub()
  })

  it('does not call listener after unsubscribe', async () => {
    const listener = vi.fn()
    const unsub = subscribe(listener)
    unsub()
    publish(BASE)
    await flush()
    expect(listener).not.toHaveBeenCalled()
  })

  it('calls multiple listeners independently', async () => {
    const a = vi.fn()
    const b = vi.fn()
    const ua = subscribe(a)
    const ub = subscribe(b)
    publish(BASE)
    await flush()
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
    ua()
    ub()
  })

  it('swallows throwing listener so remaining listeners still run', async () => {
    const throwing = vi.fn(() => { throw new Error('boom') })
    const safe = vi.fn()
    const u1 = subscribe(throwing)
    const u2 = subscribe(safe)
    publish(BASE)
    await flush()
    expect(safe).toHaveBeenCalledOnce()
    u1()
    u2()
  })

  it('publish is non-blocking – synchronous code after publish runs first', () => {
    const order: string[] = []
    const listener = vi.fn(() => order.push('listener'))
    const unsub = subscribe(listener)
    publish(BASE)
    order.push('sync')
    expect(order).toEqual(['sync'])
    unsub()
  })
})
