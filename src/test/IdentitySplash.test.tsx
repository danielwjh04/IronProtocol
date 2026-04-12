// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import IdentitySplash from '../components/IdentitySplash'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'

afterEach(() => cleanup())

describe('IdentitySplash', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('renders name input, north star textarea, purpose chips, slider, and frequency toggles', () => {
    render(<IdentitySplash db={db} />)
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/train to/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^strength$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^hypertrophy$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^fat loss$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^endurance$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^health$/i })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^3x$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^4x$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^5x$/i })).toBeInTheDocument()
  })

  it('submit is disabled when name is empty', () => {
    render(<IdentitySplash db={db} />)
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeDisabled()
  })

  it('submit is disabled when name is filled but no purpose chip is selected', () => {
    render(<IdentitySplash db={db} />)
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeDisabled()
  })

  it('submit is enabled when name and a purpose chip are both provided', () => {
    render(<IdentitySplash db={db} />)
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    expect(screen.getByRole('button', { name: /initialize protocol/i })).toBeEnabled()
  })

  it('fires haptic thud on valid protocol initialization', async () => {
    const vibrateSpy = vi.fn()
    Object.defineProperty(window.navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
    })

    render(<IdentitySplash db={db} />)
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.userName).toBe('Atlas')
    })
    expect(vibrateSpy).toHaveBeenCalledWith(100)
  })

  it('saves all onboarding fields to db.settings on submit', async () => {
    render(<IdentitySplash db={db} />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.change(screen.getByPlaceholderText(/train to/i), { target: { value: 'Build elite strength' } })
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^4x$/i }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.northStar).toBe('Build elite strength')
      expect(settings?.purposeChip).toBe('strength')
      expect(settings?.qosMinutes).toBe(60)
      expect(settings?.daysPerWeek).toBe(4)
    })
  })

  it('preserves existing system flags via merge-safe settings.put()', async () => {
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'UpperLower',
      daysPerWeek: 3,
    })

    render(<IdentitySplash db={db} />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^endurance$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^5x$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.hasCompletedOnboarding).toBe(true)
      expect(settings?.preferredRoutineType).toBe('UpperLower')
      expect(settings?.daysPerWeek).toBe(5)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.purposeChip).toBe('endurance')
    })
  })

  it('northStar is optional — submits successfully with empty north star', async () => {
    render(<IdentitySplash db={db} />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^hypertrophy$/i }))
    fireEvent.click(screen.getByRole('button', { name: /initialize protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.purposeChip).toBe('hypertrophy')
      expect(settings?.northStar).toBe('')
    })
  })
})
