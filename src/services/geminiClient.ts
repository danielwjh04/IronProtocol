import { z } from 'zod'

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_TIMEOUT_MS = 90_000
const GEMINI_MAX_OUTPUT_TOKENS = 8192

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> }
  finishReason?: string
}

interface GeminiResponse {
  candidates?: GeminiCandidate[]
  error?: { message?: string }
}

interface GeminiClientFailureContext {
  stage: string
  model?: string
  status?: number
  finishReason?: string
  details?: unknown
  error?: unknown
}

function logGeminiFailure(context: GeminiClientFailureContext): void {
  console.error('[geminiClient] failure', context)
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }
  return trimmed
}

function extractCandidateText(payload: GeminiResponse, model: string): string {
  const text = payload.candidates
    ?.flatMap((c) => c.content?.parts ?? [])
    .map((p) => p.text?.trim() ?? '')
    .find((t) => t.length > 0)

  if (!text) {
    const finishReason = payload.candidates?.[0]?.finishReason
    logGeminiFailure({ stage: 'extract-candidate-text', model, finishReason })
    throw new Error(
      finishReason
        ? `Gemini returned no text (finishReason: ${finishReason}).`
        : 'Gemini returned no text content.',
    )
  }

  return text
}

export function isLabAvailable(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? ''
  return key.length > 0
}

export async function fetchGemini<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<T> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('Gemini API key missing. Define VITE_GEMINI_API_KEY in .env.local.')
  }

  const model = import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  const endpoint = `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxOutputTokens ?? GEMINI_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logGeminiFailure({ stage: 'fetch', model, details: { timeoutMs: GEMINI_TIMEOUT_MS }, error })
      throw new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms.`)
    }
    logGeminiFailure({ stage: 'fetch', model, error })
    throw new Error('Gemini request failed before receiving a response.')
  } finally {
    clearTimeout(timeoutHandle)
  }

  let payload: GeminiResponse
  try {
    payload = (await response.json()) as GeminiResponse
  } catch (error) {
    logGeminiFailure({ stage: 'decode-payload', model, status: response.status, error })
    throw new Error('Gemini API returned a non-JSON response payload.')
  }

  if (!response.ok) {
    const providerError = payload.error?.message?.trim()
    logGeminiFailure({ stage: 'non-ok-response', model, status: response.status, details: providerError })
    throw new Error(
      providerError
        ? `Gemini API request failed: ${providerError}`
        : `Gemini API request failed with status ${response.status}.`,
    )
  }

  const rawText = extractCandidateText(payload, model)
  const jsonBlock = extractJsonBlock(rawText)

  let decoded: unknown
  try {
    decoded = JSON.parse(jsonBlock)
  } catch (error) {
    logGeminiFailure({ stage: 'parse-json', model, details: { snippet: jsonBlock.slice(0, 300) }, error })
    throw new Error('Gemini returned invalid JSON.')
  }

  const parsed = schema.safeParse(decoded)
  if (!parsed.success) {
    logGeminiFailure({ stage: 'validate-schema', model, details: parsed.error.flatten() })
    throw new Error('Gemini response did not match expected schema.')
  }

  return parsed.data
}
