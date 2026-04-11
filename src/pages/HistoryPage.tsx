import { liveQuery } from 'dexie'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { IronProtocolDB, Workout } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

export default function HistoryPage({ db }: Props) {
  const [workouts, setWorkouts] = useState<Workout[] | null>(null)

  useEffect(() => {
    const subscription = liveQuery(async () => (
      db.workouts.orderBy('date').reverse().toArray()
    )).subscribe({
      next: setWorkouts,
      error: () => setWorkouts([]),
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [db])

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(timestamp))

  async function handleDeleteWorkout(workout: Workout): Promise<void> {
    await db.transaction('rw', db.workouts, db.sets, async () => {
      await db.sets.where('workoutId').equals(workout.id).delete()
      await db.workouts.delete(workout.id)
    })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0A0A] px-4 pb-28 pt-5 text-zinc-100">
      <motion.header whileTap={{ scale: 0.95 }} className="rounded-3xl border border-zinc-800 bg-[#171717] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">Session History</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-100">Logged Workouts</h1>
      </motion.header>

      {workouts !== null && workouts.length === 0 && (
        <motion.p whileTap={{ scale: 0.95 }} className="rounded-3xl border border-zinc-800 bg-[#171717] py-12 text-center text-zinc-400">No workouts found</motion.p>
      )}

      {workouts !== null && workouts.length > 0 && (
        <ul className="flex flex-col gap-3">
          {workouts.map(workout => (
            <motion.li
              whileTap={{ scale: 0.95 }}
              key={workout.id}
              className="rounded-3xl border border-zinc-800 bg-[#171717] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-white">{formatDate(workout.date)}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-300">
                    {workout.routineType} • Session {workout.sessionIndex + 1}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => void handleDeleteWorkout(workout)}
                  className="cursor-pointer rounded-2xl border border-[#FF6B00]/40 bg-[#2a1a10] px-3 py-2 text-xs font-bold text-[#FF6B00] transition-all hover:bg-[#352215] active:scale-[0.98] active:bg-[#24180f]"
                >
                  Delete
                </motion.button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </main>
  )
}
