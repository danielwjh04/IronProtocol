import { useState, useCallback } from 'react'
import { isLabAvailable } from '../services/geminiClient'
import { generateSemanticSwap, type SwapResult } from '../services/semanticSwapService'
import type { ExerciseTier, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'

type SwapStatus = 'idle' | 'loading' | 'result' | 'error'

interface SemanticSwapState {
  status: SwapStatus
  swapResult: SwapResult | null
  error: string | null
  isLabAvailable: boolean
  submit: (
    query: string,
    exercise: { name: string; tier: ExerciseTier; muscleGroup: string },
    exerciseDB: ReadonlyExercise[],
    v11Contract: V11AppSettingsSchema,
  ) => void
  reset: () => void
}

export function useSemanticSwap(): SemanticSwapState {
  const [status, setStatus] = useState<SwapStatus>('idle')
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    (
      query: string,
      exercise: { name: string; tier: ExerciseTier; muscleGroup: string },
      exerciseDB: ReadonlyExercise[],
      v11Contract: V11AppSettingsSchema,
    ) => {
      setStatus('loading')
      setSwapResult(null)
      setError(null)

      generateSemanticSwap(query, exercise, exerciseDB, v11Contract)
        .then((result) => {
          setSwapResult(result)
          setStatus('result')
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setError(message)
          setStatus('error')
        })
    },
    [],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setSwapResult(null)
    setError(null)
  }, [])

  return {
    status,
    swapResult,
    error,
    isLabAvailable: isLabAvailable(),
    submit,
    reset,
  }
}
