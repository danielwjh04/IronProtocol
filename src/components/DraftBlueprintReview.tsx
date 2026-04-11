import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Trash2, Shuffle, ChevronDown, CheckCircle2 } from 'lucide-react'
import type { PlannedWorkout, PlannedExercise } from '../planner/autoPlanner'
import { planExerciseFromHistory } from '../planner/autoPlanner'
import type { IronProtocolDB, Exercise } from '../db/schema'
import { getAlternatives } from '../services/exerciseService'

interface Props {
  plan: PlannedWorkout
  db: IronProtocolDB
  onConfirm: () => void
  onCancel: () => void
  onUpdatePlan: (updatedPlan: PlannedWorkout) => void
}

export default function DraftBlueprintReview({ plan, db, onConfirm, onCancel, onUpdatePlan }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [alternatives, setAlternatives] = useState<Record<string, Exercise[]>>({})

  useEffect(() => {
    // Pre-fetch alternatives for all exercises to make interaction snappy
    const fetchAllAlts = async () => {
      const altsMap: Record<string, Exercise[]> = {}
      for (const ex of plan.exercises) {
        const alts = await getAlternatives(db, ex)
        altsMap[ex.exerciseId] = alts
      }
      setAlternatives(altsMap)
    }
    void fetchAllAlts()
  }, [plan.exercises, db])

  const handleRemove = (exerciseId: string) => {
    const updatedExercises = plan.exercises.filter(ex => ex.exerciseId !== exerciseId)
    onUpdatePlan({ ...plan, exercises: updatedExercises })
    setExpandedId(null)
  }

  const handleSwap = async (oldExercise: PlannedExercise, newExercise: Exercise) => {
    // 1. Fetch history for the new exercise
    const previousSets = await db.sets
      .where('exerciseId')
      .equals(newExercise.id)
      .toArray()
    
    // 2. Fetch baseline if exists
    const baseline = await db.baselines.get(newExercise.name.toLowerCase())
    
    // 3. Plan the new exercise using the exported logic
    const newlyPlanned = planExerciseFromHistory(
      newExercise,
      previousSets,
      baseline?.weight
    )

    // 4. Update the plan
    const updatedExercises = plan.exercises.map(ex => 
      ex.exerciseId === oldExercise.exerciseId ? newlyPlanned : ex
    )
    
    onUpdatePlan({ ...plan, exercises: updatedExercises })
    setExpandedId(null)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-8 text-zinc-100">
      <header className="mb-2 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Finalize Session</p>
        <h1 className="mt-2 text-3xl font-black text-white decoration-[#3B71FE] decoration-4">Review Blueprint</h1>
      </header>

      {plan.exercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <p className="text-xl font-black text-zinc-500">Blueprint Empty</p>
          <p className="mt-2 text-sm text-zinc-400">Add movements to continue.</p>
          <button 
            onClick={onCancel}
            className="mt-6 rounded-2xl border border-gray-800 bg-[#0D1626] px-6 py-3 text-sm font-bold text-zinc-300 active:scale-95 transition-transform"
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plan.exercises.map((exercise) => {
            const isExpanded = expandedId === exercise.exerciseId
            const alts = alternatives[exercise.exerciseId] ?? []

            return (
              <div key={exercise.exerciseId} className="flex flex-col">
                <motion.div
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExpandedId(isExpanded ? null : exercise.exerciseId)}
                  className={`relative flex items-center justify-between overflow-hidden rounded-2xl border bg-[#0D1626] p-4 transition-all duration-300 ${isExpanded ? 'border-[#3B71FE] shadow-[0_0_16px_-4px_rgba(59,113,254,0.4)]' : 'border-gray-800'}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#3B71FE]/10 px-1.5 py-0.5 text-[10px] font-black text-blue-400">T{exercise.tier}</span>
                      <h3 className="text-base font-black text-white">{exercise.exerciseName}</h3>
                    </div>
                    <p className="text-xs font-semibold text-zinc-400">{exercise.sets} sets · {exercise.weight}kg</p>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-zinc-500"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-2 mt-2 flex flex-col gap-4 rounded-2xl border border-gray-800 bg-[#090f1d] p-4">
                        <div className="flex flex-col gap-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                            <Shuffle size={12} /> Alternative Movements
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {alts.length > 0 ? (
                              alts.map(alt => (
                                <motion.button
                                  key={alt.id}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => void handleSwap(exercise, alt)}
                                  className="rounded-full border border-[#3B71FE]/20 bg-[#3B71FE]/5 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-[#3B71FE]/10 transition-colors"
                                >
                                  {alt.name}
                                </motion.button>
                              ))
                            ) : (
                              <p className="text-[10px] italic text-zinc-600">No alternatives found in this tier.</p>
                            )}
                          </div>
                        </div>

                        <div className="h-[1px] w-full bg-gray-800/50" />

                        <button
                          onClick={() => handleRemove(exercise.exerciseId)}
                          className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                          <Trash2 size={16} /> Remove Exercise
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {plan.exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-3 border-t border-gray-800 bg-[#0A0E1A]/80 p-4 pb-8 backdrop-blur-md">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-[#3B71FE] text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)]"
          >
            <CheckCircle2 /> Start Workout
          </motion.button>
          
          <button 
            onClick={onCancel}
            className="text-center text-sm font-bold text-zinc-500 hover:text-zinc-300"
          >
            Abort Session
          </button>
        </div>
      )}
    </main>
  )
}
