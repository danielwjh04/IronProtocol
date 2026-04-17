import EmbeddingWorker from '../workers/embeddingWorker?worker';

type WorkerResponse = { ok: true; embedding: number[] } | { ok: false; error: string };

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new EmbeddingWorker();
  }
  return worker;
}

export function getEmbedding(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (event: MessageEvent<WorkerResponse>) => {
      w.removeEventListener('message', handler);
      if (event.data.ok) {
        resolve(event.data.embedding);
      } else {
        reject(new Error(event.data.error));
      }
    };
    w.addEventListener('message', handler);
    w.postMessage(text);
  });
}
