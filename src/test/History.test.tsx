// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { v4 as uuidv4 } from 'uuid'
import { IronProtocolDB } from '../db/schema'
import HistoryPage from '../pages/HistoryPage'

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

describe('HistoryPage rich rows + detail sheet', () => {
  it('renders rich row with routine + session + volume + top lift', async () => {
    const exerciseId = uuidv4()
    const workoutId = uuidv4()

    await db.exercises.put({
      id: exerciseId,
      name: 'Bench Press',
      muscleGroup: 'chest',
      mediaType: 'none',
      mediaRef: '',
      tags: [],
      tier: 1,
    })
    await db.workouts.put({
      id: workoutId,
      date: new Date('2025-06-20').getTime(),
      routineType: 'PPL',
      sessionIndex: 1,
      notes: '',
    })
    await db.sets.bulkAdd([
      { id: uuidv4(), workoutId, exerciseId, weight: 80, reps: 8, orderIndex: 0 },
      { id: uuidv4(), workoutId, exerciseId, weight: 80, reps: 8, orderIndex: 1 },
    ])

    render(<HistoryPage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/PPL/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Day 2/i)).toBeInTheDocument()
    expect(screen.getByText(/2 sets/i)).toBeInTheDocument()
    expect(screen.getByText(/1,280 kg/i)).toBeInTheDocument()
    expect(screen.getByText(/Bench Press 80×8/i)).toBeInTheDocument()
  })

  it('opens detail sheet on row tap and deletes workout after confirm', async () => {
    const exerciseId = uuidv4()
    const workoutId = uuidv4()

    await db.exercises.put({
      id: exerciseId,
      name: 'Squat',
      muscleGroup: 'legs',
      mediaType: 'none',
      mediaRef: '',
      tags: [],
      tier: 1,
    })
    await db.workouts.put({
      id: workoutId,
      date: Date.now(),
      routineType: 'Upper/Lower',
      sessionIndex: 0,
      notes: '',
    })
    await db.sets.add({ id: uuidv4(), workoutId, exerciseId, weight: 100, reps: 5, orderIndex: 0 })

    render(<HistoryPage db={db} />)

    await waitFor(() => {
      expect(screen.getByText(/Upper\/Lower/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('listitem'))

    const dialog = await screen.findByRole('dialog', { name: /workout detail/i })
    await waitFor(() => {
      expect(within(dialog).getByText(/Squat/)).toBeInTheDocument()
    })

    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))

    const confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent(/delete this workout/i)

    fireEvent.click(within(confirm).getByRole('button', { name: /^delete$/i }))

    await waitFor(async () => {
      const remaining = await db.workouts.count()
      expect(remaining).toBe(0)
    })
  })
})
