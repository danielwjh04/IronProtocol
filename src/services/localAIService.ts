import EmbeddingWorker from '../workers/embeddingWorker?worker'

type WorkerResponse =
  | { ok: true; embedding: number[] }
  | { ok: false; error: string }
  | { type: 'loading'; progress: number }
  | { type: 'ready' }

type LoadingListener = (isLoading: boolean, progress?: number) => void

let worker: Worker | null = null
let modelReady = false
let loadingListeners: LoadingListener[] = []

function getWorker(): Worker {
  if (!worker) {
    worker = new EmbeddingWorker()
    worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
      if (!('type' in e.data)) return
      if (e.data.type === 'loading') {
        loadingListeners.forEach(fn => fn(true, (e.data as { type: 'loading'; progress: number }).progress))
      } else if (e.data.type === 'ready') {
        modelReady = true
        loadingListeners.forEach(fn => fn(false))
      }
    })
  }
  return worker
}

export function subscribeToModelLoading(fn: LoadingListener): () => void {
  if (modelReady) { fn(false); return () => {} }
  loadingListeners = [...loadingListeners, fn]
  return () => { loadingListeners = loadingListeners.filter(l => l !== fn) }
}

export function getEmbedding(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const w = getWorker()
    const handler = (e: MessageEvent<WorkerResponse>) => {
      if ('type' in e.data) return
      w.removeEventListener('message', handler)
      if (e.data.ok) resolve(e.data.embedding)
      else reject(new Error(e.data.error))
    }
    w.addEventListener('message', handler)
    w.postMessage(text)
  })
}
