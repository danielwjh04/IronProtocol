// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { v4 as uuidv4 } from 'uuid'
import { IronProtocolDB } from '../db/schema'
import { generateWorkout } from '../planner/autoPlanner'
import HistoryPage from '../pages/HistoryPage'

// RTL auto-cleanup doesn't fire in per-file jsdom environments without globals.
afterEach(() => cleanup())

// ── Full Loop ──────────────────────────────────────────────────────────────────
// Validates the complete data pipeline end-to-end:
//   autoPlanner (cold start) → ActiveLogger DB commit → autoPlanner (overloaded)
//
// Nothing is mocked. The same fake-IndexedDB that the real app would use
// is exercised through the same code paths — autoPlanner reads, ActiveLogger writes.

describe('Full Loop — Planner → Commit → Planner', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('applies +2.5 kg progressive overload to Bench Press on the second plan', async () => {
    // ── Step 1: Seed the exercise library ──────────────────────────────────────
    const exId = uuidv4()
    await db.exercises.add({
      id: exId,
      name: 'Bench Press',
      muscleGroup: 'Chest',
      tier: 1,
      tags: ['push', 'compound'],
      mediaType: 'webp',
      mediaRef: 'bench.webp',
    })

    // ── Step 2: Generate Plan 1 — cold start, expects 20 kg baseline ───────────
    const plan1 = await generateWorkout({
      db,
      routineType: 'FullBody',
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
    })

    const bench1 = plan1.exercises.find(ex => ex.exerciseId === exId)
    expect(bench1).toBeDefined()
    expect(bench1!.weight).toBe(20) // upper-body baseline

    // ── Step 3: Simulate ActiveLogger's atomic DB commit ───────────────────────
    // Mirrors exactly what ActiveLogger.handleCompleteSet does on the final set:
    //   one Workout record + one WorkoutSet per set, all UUIDs, all at plan weight.
    const workoutId = uuidv4()
    await db.workouts.add({ id: workoutId, date: Date.now(), routineType: 'FullBody', sessionIndex: 0, notes: '' })

    let orderIndex = 0
    for (const ex of plan1.exercises) {
      for (let s = 0; s < ex.sets; s++) {
        await db.sets.add({
          id: uuidv4(),
          workoutId,
          exerciseId: ex.exerciseId,
          weight:     ex.weight,
          reps:       ex.reps,
          orderIndex: orderIndex++,
        })
      }
    }

    // ── Step 4: Generate Plan 2 — must read the committed session ──────────────
    const plan2 = await generateWorkout({
      db,
      routineType: 'FullBody',
      trainingGoal: 'Hypertrophy',
      timeAvailable: 60,
    })

    const bench2 = plan2.exercises.find(ex => ex.exerciseId === exId)
    expect(bench2).toBeDefined()
    // Upper-body overload increment is +2.5 kg (docs/auto_planner_logic.md)
    expect(bench2!.weight).toBe(bench1!.weight + 2.5) // 22.5 kg
  })
})

// ── History Page ───────────────────────────────────────────────────────────────
// The History page is the read-only view of every committed workout session.
// It must load from IndexedDB on mount and display sessions newest-first.

describe('HistoryPage', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('shows an empty-state message when there are no workouts logged', async () => {
    render(<HistoryPage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/no workouts/i)).toBeInTheDocument()
    })
  })

  it('lists both saved workouts with the most recent session appearing first', async () => {
    // Seed two workouts on clearly distinct calendar dates so the month names
    // in the rendered output are unambiguous (January vs June cannot collide).
    const olderDate = new Date('2025-01-10').getTime()
    const newerDate = new Date('2025-06-20').getTime()

    await db.workouts.bulkAdd([
      { id: uuidv4(), date: olderDate, routineType: 'PPL', sessionIndex: 0, notes: '' },
      { id: uuidv4(), date: newerDate, routineType: 'PPL', sessionIndex: 1, notes: '' },
    ])

    render(<HistoryPage db={db} />)

    // Wait for async data load — both items must appear
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    const items = screen.getAllByRole('listitem')

    // The rendered date text must contain the month name so we can identify
    // which item is which without coupling to a specific format.
    const newerIdx = items.findIndex(el => /jun/i.test(el.textContent ?? ''))
    const olderIdx = items.findIndex(el => /jan/i.test(el.textContent ?? ''))

    expect(newerIdx).toBeGreaterThanOrEqual(0) // June 2025 item exists
    expect(olderIdx).toBeGreaterThanOrEqual(0) // January 2025 item exists
    expect(newerIdx).toBeLessThan(olderIdx)    // newer renders before older
  })
})
