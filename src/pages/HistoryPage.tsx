import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import type { IronProtocolDB, Workout } from '../db/schema'
import WorkoutDetailSheet from '../components/history/WorkoutDetailSheet'

interface Props {
  db: IronProtocolDB
}

interface RichRow {
  workout:      Workout
  setCount:     number
  totalVolume:  number
  topLift:      { name: string; weight: number; reps: number } | null
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month:   'short',
  day:     'numeric',
}

function formatShortDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', DATE_FORMAT).format(new Date(ts))
}

function estimate1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

export default function HistoryPage({ db }: Props) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  const rows = useLiveQuery(async (): Promise<RichRow[]> => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray()
    const result: RichRow[] = []
    for (const workout of workouts) {
      const sets = await db.sets.where('workoutId').equals(workout.id).toArray()
      let totalVolume = 0
      let top: RichRow['topLift'] = null
      let topScore = 0
      const exerciseNameCache = new Map<string, string>()
      for (const s of sets) {
        totalVolume += s.weight * s.reps
        const score = estimate1RM(s.weight, s.reps)
        if (score > topScore) {
          topScore = score
          let name = exerciseNameCache.get(s.exerciseId)
          if (!name) {
            const exercise = await db.exercises.get(s.exerciseId)
            name = exercise?.name ?? 'Unknown lift'
            exerciseNameCache.set(s.exerciseId, name)
          }
          top = { name, weight: s.weight, reps: s.reps }
        }
      }
      result.push({
        workout,
        setCount:    sets.length,
        totalVolume: Math.round(totalVolume),
        topLift:     top,
      })
    }
    return result
  }, [db])

  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pt-16"
      style={{
        backgroundColor: 'var(--color-surface-base)',
        paddingBottom: 'calc(var(--space-tabbar) + env(safe-area-inset-bottom, 0px) + var(--space-5))',
      }}
    >
      <header>
        <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
          Session History
        </p>
        <h1 className="text-display mt-2" style={{ color: 'var(--color-text-primary)' }}>
          Logged Workouts
        </h1>
      </header>

      {rows !== undefined && rows.length === 0 && (
        <motion.p
          whileTap={{ scale: 0.98 }}
          className="rounded-3xl border py-12 text-center text-body"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderColor:     'var(--color-border-subtle)',
            color:           'var(--color-text-secondary)',
          }}
        >
          No workouts found
        </motion.p>
      )}

      {rows !== undefined && rows.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rows.map(({ workout, setCount, totalVolume, topLift }) => (
            <motion.li
              whileTap={{ scale: 0.98 }}
              key={workout.id}
              className="rounded-3xl border p-4 cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor:     'var(--color-border-subtle)',
              }}
              onClick={() => setSelectedWorkout(workout)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body" style={{ color: 'var(--color-text-primary)' }}>
                    {formatShortDate(workout.date)}
                  </p>
                  <p className="text-label mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {workout.routineType} · Day {workout.sessionIndex + 1}
                  </p>
                </div>
                <span
                  className="rounded-full border px-2 py-0.5 text-label"
                  style={{
                    borderColor: 'var(--color-accent-primary)',
                    color:       'var(--color-accent-primary)',
                  }}
                >
                  {setCount} sets
                </span>
              </div>

              <div
                className="mt-3 flex items-center justify-between gap-3 border-t pt-3"
                style={{ borderColor: 'var(--color-border-subtle)' }}
              >
                <div>
                  <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
                    Total volume
                  </p>
                  <p className="text-body" style={{ color: 'var(--color-text-primary)' }}>
                    {totalVolume.toLocaleString()} kg
                  </p>
                </div>
                {topLift && (
                  <div className="text-right">
                    <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
                      Top lift
                    </p>
                    <p className="text-body" style={{ color: 'var(--color-text-primary)' }}>
                      {topLift.name} {topLift.weight}×{topLift.reps}
                    </p>
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <WorkoutDetailSheet
        workout={selectedWorkout}
        db={db}
        onClose={() => setSelectedWorkout(null)}
        onDeleted={() => setSelectedWorkout(null)}
      />
    </main>
  )
}
