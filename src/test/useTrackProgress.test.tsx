// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '../db/db'
import { APP_SETTINGS_ID } from '../db/schema'
import { MACROCYCLE_WORKOUT_NOTE_PREFIX } from '../services/macrocyclePersistence'
import { useTrackProgress } from '../hooks/useTrackProgress'

async function seedWorkouts(count: number, datesRelativeToNow: number[]) {
  const now = Date.now()
  const rows = datesRelativeToNow.slice(0, count).map((offset, i) => ({
    id: `macro-${i}`,
    date: now + offset,
    routineType: 'PPL',
    sessionIndex: i,
    notes: `${MACROCYCLE_WORKOUT_NOTE_PREFIX}|w1d${i}|Push`,
  }))
  await db.workouts.bulkAdd(rows)
}

describe('useTrackProgress', () => {
  beforeEach(async () => {
    if (!db.isOpen()) await db.open()
    await db.workouts.clear()
    await db.settings.clear()
  })

  afterEach(async () => {
    await db.workouts.clear()
    await db.settings.clear()
  })

  it('defaults to power-active with zero progresses when DB is empty', async () => {
    const { result } = renderHook(() => useTrackProgress())
    await waitFor(() => expect(result.current.active).toBe('power'))
    expect(result.current.power).toBe(0)
    expect(result.current.hypertrophy).toBe(0)
  })

  it('routes progress to the active track and zeros the other', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      activeTrack: 'hypertrophy',
    })
    await seedWorkouts(2, [-1000, -500])

    const { result } = renderHook(() => useTrackProgress())
    await waitFor(() => expect(result.current.active).toBe('hypertrophy'))
    expect(result.current.hypertrophy).toBe(1)
    expect(result.current.power).toBe(0)
  })
})
