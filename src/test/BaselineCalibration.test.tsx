// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import BaselineCalibration from '../components/BaselineCalibration'
import { APP_SETTINGS_ID, type AppSettings, IronProtocolDB } from '../db/schema'

afterEach(() => cleanup())

describe('BaselineCalibration', () => {
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

  it('renders three baseline dials with conservative defaults and enabled CTA', () => {
    render(<BaselineCalibration db={db} />)

    expect(screen.getByRole('heading', { name: /set your starting weights/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /squat baseline/i })).toHaveValue('20')
    expect(screen.getByRole('slider', { name: /bench press baseline/i })).toHaveValue('20')
    expect(screen.getByRole('slider', { name: /deadlift baseline/i })).toHaveValue('20')
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeEnabled()
  })

  it('fires light haptic when dial snaps to a new increment', () => {
    const vibrateSpy = vi.fn()
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
    })

    render(<BaselineCalibration db={db} />)
    fireEvent.change(screen.getByRole('slider', { name: /squat baseline/i }), { target: { value: '25' } })

    expect(vibrateSpy).toHaveBeenCalledWith(50)
  })

  it('persists default baselines and safely marks onboarding complete', async () => {
    const vibrateSpy = vi.fn()
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
    })

    const seeded: AppSettings = {
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: false,
      preferredRoutineType: 'PPL',
      daysPerWeek: 4,
      userName: 'Atlas',
      northStar: 'Build elite strength',
      purposeChip: 'strength',
      qosMinutes: 60,
    }

    await db.settings.put(seeded)

    render(<BaselineCalibration db={db} />)
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const baselines = await db.baselines.toArray()
      expect(baselines).toHaveLength(3)

      const byName = new Map(baselines.map((row) => [row.exerciseName, row.weight]))
      expect(byName.get('back squat')).toBe(20)
      expect(byName.get('bench press')).toBe(20)
      expect(byName.get('deadlift')).toBe(20)

      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(true)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.northStar).toBe('Build elite strength')
      expect(settings?.purposeChip).toBe('strength')
      expect(settings?.qosMinutes).toBe(60)
      expect(settings?.daysPerWeek).toBe(4)
    })

    expect(vibrateSpy).toHaveBeenCalledWith(100)
  })
})
