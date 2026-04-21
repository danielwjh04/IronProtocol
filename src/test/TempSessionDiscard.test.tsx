// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
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

describe('TempSession handoff', () => {
  it('renders Home with a resume affordance when a draft exists', async () => {
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
      expect(screen.getByRole('button', { name: /resume /i })).toBeInTheDocument()
    })

    // The dashboard remains the rendered surface — no takeover hijack, no splash.
    expect(screen.queryByRole('heading', { name: /baselines/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/calibrate/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unfinished Session/i)).not.toBeInTheDocument()
  })

  it('removes the resume affordance when the draft is cleared', async () => {
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
      expect(screen.getByRole('button', { name: /resume /i })).toBeInTheDocument()
    })

    await db.tempSessions.delete(TEMP_SESSION_ID)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /resume /i })).not.toBeInTheDocument()
    })

    // Never regresses to the onboarding / calibration branch.
    expect(screen.queryByRole('heading', { name: /baselines/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/calibrate/i)).not.toBeInTheDocument()
  })
})
