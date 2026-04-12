import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import type { PlannedWorkout } from '../planner/autoPlanner'

interface Props {
  plan: PlannedWorkout
  onStartWorkout: () => void
  onModifyBlueprint: () => void
}

export default function DraftBlueprintReview({
  plan,
  onStartWorkout,
  onModifyBlueprint,
}: Props) {
  const exerciseCount = plan.exercises.length

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-navy px-4 pb-28 pt-8 text-zinc-100">
      <header className="px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Final Check</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-50">Blueprint Gantry</h1>
      </header>

      <section className="rounded-3xl border border-electric/20 bg-navy-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Session Length</p>
          <p className="text-sm font-black text-electric">{Math.round(plan.estimatedMinutes)} min</p>
        </div>
        <p className="mt-2 text-xs font-semibold text-zinc-300">
          Read-only final check before ignition.
        </p>
      </section>

      {exerciseCount === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-electric/20 bg-navy-card p-6 text-center">
          <ClipboardList size={28} className="text-electric/80" />
          <p className="mt-3 text-lg font-black text-zinc-100">Blueprint is empty</p>
          <p className="mt-2 text-sm font-semibold text-zinc-300">Return to the Drafting Lab to configure your workout.</p>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {plan.exercises.map((exercise) => (
            <article
              key={`${exercise.exerciseId}-${exercise.tier}`}
              className="rounded-2xl border border-electric/20 bg-navy-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-black text-zinc-100">{exercise.exerciseName}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-300">
                    {exercise.sets} sets x {exercise.reps} reps
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-electric">{exercise.weight} kg</p>
                  <p className="text-xs font-semibold text-zinc-300">Tier {exercise.tier}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-3 border-t border-electric/20 bg-navy/85 p-4 pb-8 backdrop-blur-md">
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onStartWorkout}
          disabled={exerciseCount === 0}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-electric text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] disabled:cursor-not-allowed disabled:bg-electric/25 disabled:text-zinc-500 disabled:shadow-none"
        >
          <CheckCircle2 size={22} />
          Start Workout
        </motion.button>

        <button
          type="button"
          onClick={onModifyBlueprint}
          className="h-12 w-full rounded-3xl border border-electric/20 bg-navy-card text-sm font-bold text-zinc-200 transition-colors hover:border-electric/40 hover:text-zinc-100"
        >
          Modify Blueprint
        </button>
      </div>
    </main>
  )
}
