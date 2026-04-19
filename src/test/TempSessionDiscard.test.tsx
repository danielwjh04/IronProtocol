// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { v4 as uuidv4 } from 'uuid'
import { APP_SETTINGS_ID, IronProtocolDB, TEMP_SESSION_ID } from '../db/schema'
import HomePage from '../pages/HomePage'

let db: IronProtocolDB

beforeEach(async () => {
  db = new IronProtocolDB()
  await db.open()
  await db.settings.put({
    id: APP_SETTINGS_ID,
    hasCompletedOnboarding: true,
    preferredRoutineType: 'PPL',
    daysPerWeek: 3,
  })
  await db.routines.put({
    id: uuidv4(),
    name: 'Power 3x/week',
    goal: 'Power',
    daysPerWeek: 3,
    cycleLengthWeeks: 12,
    createdAt: Date.now(),
    isActive: 1,
  })
})

afterEach(async () => {
  cleanup()
  if (db.isOpen()) await db.close()
  await db.delete()
})

describe('TempSession discard redirect', () => {
  it('lands on DashboardShell after discard — never back to IdentitySplash', async () => {
    await db.tempSessions.put({
      id: TEMP_SESSION_ID,
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 30,
      exercises: [],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 0,
      reps: 0,
      phase: 'active',
      restSecondsLeft: 0,
      completedSets: [],
      updatedAt: Date.now(),
    })

    render(<HomePage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/Unfinished Session/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^discard$/i }))

    await waitFor(async () => {
      const row = await db.tempSessions.get(TEMP_SESSION_ID)
      expect(row).toBeUndefined()
    })

    await waitFor(() => {
      expect(screen.queryByText(/Unfinished Session/i)).not.toBeInTheDocument()
    })

    expect(screen.queryByRole('heading', { name: /baselines/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/calibrate/i)).not.toBeInTheDocument()
  })
})
