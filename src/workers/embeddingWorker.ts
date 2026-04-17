import { pipeline } from '@xenova/transformers'

type FeatureExtractionPipeline = Awaited<ReturnType<typeof pipeline>>

let extractor: FeatureExtractionPipeline | null = null

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      progress_callback: (info: { progress?: number }) => {
        self.postMessage({ type: 'loading', progress: info.progress ?? 0 })
      },
    })
    self.postMessage({ type: 'ready' })
  }
  return extractor
}

self.onmessage = async (event: MessageEvent<string>) => {
  const text = event.data
  try {
    const pipe = await getExtractor()
    const output = await pipe(text, { pooling: 'mean', normalize: true })
    const embedding = Array.from(output.data as Float32Array)
    self.postMessage({ ok: true, embedding })
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) })
  }
}
