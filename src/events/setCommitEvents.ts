interface SetCommitEvent {
  exerciseId: string
  weight: number
  reps: number
  volume: number
  timestamp: number
  source: 'mid-session' | 'final'
}

type SetCommitListener = (event: SetCommitEvent) => void

let listeners: SetCommitListener[] = []

function subscribe(listener: SetCommitListener): () => void {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

function publish(event: SetCommitEvent): void {
  const snapshot = listeners.slice()
  queueMicrotask(() => {
    for (const listener of snapshot) {
      try {
        listener(event)
      } catch {}
    }
  })
}

export { subscribe, publish }
export type { SetCommitEvent }
