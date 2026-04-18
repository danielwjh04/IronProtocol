// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  APP_SETTINGS_ID,
  IronProtocolDB,
} from '../db/schema'
import { ascend, forgeMasterwork } from '../services/heroMathService'

describe('completedAscensions live badge update', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    await db.settings.clear()
    await db.workouts.clear()
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      completedAscensions: 0,
      lifetimeHeroLevel: 0,
      activeTrack: 'power',
    })
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('useLiveQuery returns 0 before any ascend', async () => {
    const { result } = renderHook(() =>
      useLiveQuery(
        () => db.settings.get(APP_SETTINGS_ID).then((s) => s?.completedAscensions ?? 0),
        [db],
      ),
    )
    await waitFor(() => expect(result.current).toBe(0))
  })

  it('useLiveQuery re-fires with completedAscensions=1 after ascend(db)', async () => {
    const { result } = renderHook(() =>
      useLiveQuery(
        () => db.settings.get(APP_SETTINGS_ID).then((s) => s?.completedAscensions ?? 0),
        [db],
      ),
    )

    await waitFor(() => expect(result.current).toBe(0))

    await act(async () => {
      await ascend(db)
    })

    await waitFor(() => expect(result.current).toBe(1))
  })

  it('useLiveQuery re-fires with completedAscensions=1 after forgeMasterwork(db)', async () => {
    await db.settings.update(APP_SETTINGS_ID, { activeTrack: 'hypertrophy' })

    const { result } = renderHook(() =>
      useLiveQuery(
        () => db.settings.get(APP_SETTINGS_ID).then((s) => s?.completedAscensions ?? 0),
        [db],
      ),
    )

    await waitFor(() => expect(result.current).toBe(0))

    await act(async () => {
      await forgeMasterwork(db)
    })

    await waitFor(() => expect(result.current).toBe(1))
  })

  it('useLiveQuery increments correctly on two consecutive ascends', async () => {
    const { result } = renderHook(() =>
      useLiveQuery(
        () => db.settings.get(APP_SETTINGS_ID).then((s) => s?.completedAscensions ?? 0),
        [db],
      ),
    )

    await waitFor(() => expect(result.current).toBe(0))

    await act(async () => {
      await ascend(db)
    })
    await waitFor(() => expect(result.current).toBe(1))

    await act(async () => {
      await ascend(db)
    })
    await waitFor(() => expect(result.current).toBe(2))
  })
})
