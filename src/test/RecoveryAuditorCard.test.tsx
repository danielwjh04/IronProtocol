// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { IronProtocolDB } from '../db/schema'
import RecoveryAuditorCard from '../components/RecoveryAuditorCard'

let db: IronProtocolDB

beforeEach(async () => {
  db = new IronProtocolDB()
  await db.open()
})

afterEach(async () => {
  cleanup()
  if (db.isOpen()) await db.close()
  await db.delete()
})

describe('RecoveryAuditorCard', () => {
  it('renders nothing when fewer than 3 recovery logs exist', async () => {
    const { container } = render(<RecoveryAuditorCard db={db} />)
    await new Promise(r => setTimeout(r, 50))
    expect(container.firstChild).toBeNull()
  })

  it('renders Clear severity when 3 healthy logs exist', async () => {
    const now = Date.now()
    await db.recoveryLogs.bulkAdd([
      { id: 'a', workoutId: 'w', loggedAt: now - 3_000, sleepQuality: 4, overallFatigue: 2, soreness: {} },
      { id: 'b', workoutId: 'w', loggedAt: now - 2_000, sleepQuality: 5, overallFatigue: 1, soreness: {} },
      { id: 'c', workoutId: 'w', loggedAt: now - 1_000, sleepQuality: 4, overallFatigue: 2, soreness: {} },
    ])
    render(<RecoveryAuditorCard db={db} />)
    await waitFor(() => expect(screen.getByText(/Recovery · Clear/i)).toBeInTheDocument())
  })

  it('renders Critical severity when latest log has 3 muscle groups ≥4 soreness', async () => {
    const now = Date.now()
    await db.recoveryLogs.bulkAdd([
      { id: 'a', workoutId: 'w', loggedAt: now - 3_000, sleepQuality: 4, overallFatigue: 2, soreness: {} },
      { id: 'b', workoutId: 'w', loggedAt: now - 2_000, sleepQuality: 4, overallFatigue: 2, soreness: {} },
      { id: 'c', workoutId: 'w', loggedAt: now - 1_000, sleepQuality: 4, overallFatigue: 2, soreness: { chest: 4, legs: 5, back: 4 } },
    ])
    render(<RecoveryAuditorCard db={db} />)
    await waitFor(() => expect(screen.getByText(/Recovery · Critical/i)).toBeInTheDocument())
  })
})
