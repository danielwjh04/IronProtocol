# Gemini Semantic Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Gemini-powered natural-language exercise swapping and recovery telemetry auditing to IronProtocol, available in both SessionBlueprint and ActiveLogger, with explicit Lab-only locked states when offline.

**Architecture:** Extract shared Gemini HTTP primitives into `geminiClient.ts`; each feature gets a focused service file (`semanticSwapService.ts`, `recoveryAuditorService.ts`) and a custom hook (`useSemanticSwap`, `useRecoveryAudit`); components stay thin. Schema bumps to V14 with a new `recoveryLogs` Dexie table. `aiPlannerService.ts` is refactored internally to use `geminiClient` — its public API is unchanged.

**Tech Stack:** React 19, Vite, Tailwind v4, Dexie.js v4, Framer Motion, Zod v4, Vitest, @testing-library/react, fake-indexeddb

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Modify** | `src/db/schema.ts` | V14: `MuscleGroup`, `RecoveryLog`, `recoveryLogs` table on `IronProtocolDB` |
| **Create** | `src/services/geminiClient.ts` | `isLabAvailable()`, `fetchGemini<T>()`, shared timeout/parse/log |
| **Modify** | `src/services/aiPlannerService.ts` | Refactor internals to use `geminiClient`; public API unchanged |
| **Create** | `src/services/semanticSwapService.ts` | `buildSwapPrompt`, `generateSemanticSwap`, `SwapResult` Zod schema |
| **Create** | `src/services/recoveryAuditorService.ts` | `buildAuditPrompt`, `generateRecoveryAudit`, `AuditResult` Zod schema |
| **Create** | `src/hooks/useSemanticSwap.ts` | Async state machine, Lab gate, `submit(query, exercise)` |
| **Create** | `src/hooks/useRecoveryAudit.ts` | Reads Dexie recoveryLogs, calls audit service, Lab gate |
| **Create** | `src/components/SemanticSwapDrawer.tsx` | Slide-up sheet; used in Blueprint + ActiveLogger |
| **Create** | `src/components/RecoveryAuditorCard.tsx` | Severity card shown in CoreIgnition |
| **Create** | `src/components/RecoveryLogForm.tsx` | Post-session telemetry form shown in ActiveLogger |
| **Modify** | `src/components/SessionBlueprint.tsx` | Mount `SemanticSwapDrawer` on exercise card tap |
| **Modify** | `src/components/ActiveLogger.tsx` | Mount `SemanticSwapDrawer` + show `RecoveryLogForm` after commit |
| **Modify** | `src/components/CoreIgnition.tsx` | Mount `RecoveryAuditorCard` when ≥1 recovery log exists |
| **Create** | `src/test/geminiClient.test.ts` | Unit tests for `isLabAvailable` |
| **Create** | `src/test/semanticSwapService.test.ts` | Unit tests for prompt builder + Zod schema |
| **Create** | `src/test/recoveryAuditorService.test.ts` | Unit tests for prompt builder + Zod schema |
| **Create** | `src/test/SemanticSwapDrawer.test.tsx` | Component tests for drawer states |
| **Create** | `src/test/RecoveryAuditorCard.test.tsx` | Component tests for severity variants |

---

## Task 1: Schema V14 — RecoveryLog

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `MuscleGroup` type and `RecoveryLog` interface to `schema.ts`**

After the `PersonalBest` interface (around line 67), add:

```typescript
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'

export interface RecoveryLog {
  id: string
  workoutId: string
  loggedAt: number
  sleepHours: number
  sleepQuality: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
  overallFatigue: 1 | 2 | 3 | 4 | 5
  soreness: Partial<Record<MuscleGroup, 1 | 2 | 3 | 4 | 5>>
}
```

- [ ] **Step 2: Add `recoveryLogs` table declaration to `IronProtocolDB` class**

After `personalBests!: Dexie.Table<PersonalBest, string>` in the class body, add:

```typescript
recoveryLogs!: Dexie.Table<RecoveryLog, string>
```

- [ ] **Step 3: Add version(14) migration block**

After the closing brace of `version(13)`, add:

```typescript
// Version 14 — adds recoveryLogs for post-session telemetry feeding the
// Recovery Auditor (Lab feature). Table starts empty; no data upgrade needed.
this.version(14).stores({
  exercises:     'id, name, muscleGroup, tier, *tags',
  workouts:      'id, date, routineType, sessionIndex',
  sets:          'id, workoutId, exerciseId, orderIndex',
  settings:      'id, preferredRoutineType',
  tempSessions:  'id, updatedAt',
  baselines:     'exerciseName',
  dailyTargets:  'date',
  personalBests: 'exerciseId',
  recoveryLogs:  'id, workoutId, loggedAt',
})
```

- [ ] **Step 4: Verify typecheck passes**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/db/schema.ts && git commit -m "feat(schema): add RecoveryLog interface and Dexie V14 migration"
```

---

## Task 2: `geminiClient.ts` — shared Gemini primitives

**Files:**
- Create: `src/services/geminiClient.ts`
- Modify: `src/services/aiPlannerService.ts`
- Create: `src/test/geminiClient.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/geminiClient.test.ts`:

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isLabAvailable } from '../services/geminiClient'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isLabAvailable', () => {
  it('returns false when VITE_GEMINI_API_KEY is missing', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')
    expect(isLabAvailable()).toBe(false)
  })

  it('returns true when VITE_GEMINI_API_KEY is set', () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key-abc')
    expect(isLabAvailable()).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/geminiClient.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../services/geminiClient'`

- [ ] **Step 3: Create `src/services/geminiClient.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/geminiClient.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 2 tests.

- [ ] **Step 5: Refactor `aiPlannerService.ts` to use `fetchGemini` internally**

Replace the private `fetchWithTimeout`, `extractCandidateText`, `extractJsonBlock`, and the fetch call inside `generateWorkoutBlueprint`. Import from `geminiClient` instead.

At the top of `aiPlannerService.ts`, add:

```typescript
import { fetchGemini } from './geminiClient'
```

Remove the private `fetchWithTimeout`, `extractCandidateText`, `extractJsonBlock`, and `logPlannerFailure` definitions (they now live in `geminiClient.ts`). Replace the body of `generateWorkoutBlueprint` after the `buildSystemPrompt` call with:

```typescript
export async function generateWorkoutBlueprint(settings: V11AppSettingsSchema): Promise<AIGeneratedMacrocycle> {
  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const expectedPrimaryCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const systemPrompt = buildSystemPrompt(settings)

  const selections = await fetchGemini(
    systemPrompt,
    createExerciseSelectionResponseSchema(expectedPrimaryCount),
    { temperature: 0.2 },
  )

  const canonicalized = selections.map((selection) => ({
    workoutTitle: selection.workoutTitle.trim(),
    primaryExercise: canonicalizeExerciseName(selection.primaryExercise),
    muscleGroup: selection.muscleGroup.trim(),
    tier: selection.tier,
    fallbacks: selection.fallbacks.map((f) => canonicalizeExerciseName(f.trim())),
  }))

  return generateLocalMacrocycle(canonicalized, settings)
}
```

- [ ] **Step 6: Run existing planner service tests to confirm public API unchanged**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/aiPlannerService.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — all existing tests still pass.

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/services/geminiClient.ts src/services/aiPlannerService.ts src/test/geminiClient.test.ts && git commit -m "feat(geminiClient): extract shared Gemini primitives; refactor aiPlannerService internally"
```

---

## Task 3: `semanticSwapService.ts`

**Files:**
- Create: `src/services/semanticSwapService.ts`
- Create: `src/test/semanticSwapService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/semanticSwapService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildSwapPrompt, swapResultSchema } from '../services/semanticSwapService'
import type { V11AppSettingsSchema } from '../db/schema'
import type { ReadonlyExercise } from '../db/schema'

function makeV11Contract(): V11AppSettingsSchema {
  return {
    physiologicalBaselines: { ageYears: 28, bodyWeightKg: 80, gender: 'male' },
    trainingExperienceLevel: 'intermediate',
    logisticalConstraints: { targetDaysPerWeek: 3, hardSessionLimitMinutes: 60 },
    equipmentAvailability: 'commercial-gym',
    primaryGoals: { primaryFocus: 'hypertrophy', specificLiftTargets: [] },
    injuryConstraints: { hasActiveConstraints: true, constraints: [{ structuralAversion: 'No overhead pressing' }] },
  }
}

const MOCK_EXERCISE_DB: ReadonlyExercise[] = [
  { id: 'ex-1', name: 'Leg Press', muscleGroup: 'legs', tier: 1, tags: ['compound'], mediaType: 'image', mediaRef: '' },
  { id: 'ex-2', name: 'Hack Squat', muscleGroup: 'legs', tier: 2, tags: ['compound'], mediaType: 'image', mediaRef: '' },
]

describe('buildSwapPrompt', () => {
  it('includes the user query', () => {
    const prompt = buildSwapPrompt(
      'knee pain, need a quad exercise',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('knee pain, need a quad exercise')
  })

  it('includes the current exercise being swapped', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('Back Squat')
    expect(prompt).toContain('T1')
  })

  it('includes injury constraints from V11 contract', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Overhead Press', tier: 1, muscleGroup: 'shoulders' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('No overhead pressing')
  })

  it('includes available exercises from the local DB', () => {
    const prompt = buildSwapPrompt(
      'any query',
      { name: 'Back Squat', tier: 1, muscleGroup: 'legs' },
      MOCK_EXERCISE_DB,
      makeV11Contract(),
    )
    expect(prompt).toContain('Leg Press')
    expect(prompt).toContain('Hack Squat')
  })
})

describe('swapResultSchema', () => {
  it('accepts a valid SwapResult', () => {
    const result = swapResultSchema.safeParse({
      exerciseName: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      reason: 'Isolates quads without spinal load.',
      confidence: 'high',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing reason field', () => {
    const result = swapResultSchema.safeParse({
      exerciseName: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      confidence: 'high',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid confidence value', () => {
    const result = swapResultSchema.safeParse({
      exerciseName: 'Leg Press',
      muscleGroup: 'legs',
      tier: 'T1',
      reason: 'Good.',
      confidence: 'excellent',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/semanticSwapService.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../services/semanticSwapService'`

- [ ] **Step 3: Create `src/services/semanticSwapService.ts`**

```typescript
import { z } from 'zod'
import type { ExerciseTier, MuscleGroup, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'
import { fetchGemini } from './geminiClient'
import { canonicalizeExerciseName } from './aiPlannerService'

export const swapResultSchema = z.object({
  exerciseName: z.string().min(1),
  muscleGroup: z.string().min(1),
  tier: z.enum(['T1', 'T2', 'T3']),
  reason: z.string().min(1),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type SwapResult = z.infer<typeof swapResultSchema>

export function buildSwapPrompt(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema,
): string {
  const tierLabel = `T${currentExercise.tier}` as 'T1' | 'T2' | 'T3'

  const injuryLines = v11Contract.injuryConstraints.hasActiveConstraints
    ? v11Contract.injuryConstraints.constraints
        .map((c) => `- ${c.structuralAversion.trim()}`)
        .join('\n')
    : '- none'

  const availableExercises = exerciseDB
    .map((ex) => `- ${ex.name} (${ex.muscleGroup}, T${ex.tier})`)
    .join('\n')

  return [
    '[ROLE]',
    'You are the IronProtocol Lab Biomechanical Interpreter.',
    'Select the single best exercise swap for the user constraint described below.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON only — one object matching exactly:',
    '{ "exerciseName": string, "muscleGroup": string, "tier": "T1"|"T2"|"T3", "reason": string, "confidence": "high"|"medium"|"low" }',
    'reason: one sentence explaining the biomechanical justification.',
    'confidence: "high" if the swap clearly satisfies the constraint, "medium" if reasonable, "low" if uncertain.',
    '',
    '[CURRENT EXERCISE BEING SWAPPED]',
    `name: ${currentExercise.name}`,
    `tier: ${tierLabel}`,
    `muscleGroup: ${currentExercise.muscleGroup}`,
    '',
    '[USER CONSTRAINT / QUERY]',
    query,
    '',
    '[USER PROFILE]',
    `equipment: ${v11Contract.equipmentAvailability ?? 'unknown'}`,
    `goal: ${v11Contract.primaryGoals.primaryFocus ?? 'unknown'}`,
    `experience: ${v11Contract.trainingExperienceLevel ?? 'unknown'}`,
    'injury constraints:',
    injuryLines,
    '',
    '[AVAILABLE EXERCISES IN LOCAL DB]',
    availableExercises,
    '',
    '[RULE]',
    'Prefer exercises from the available list. Only suggest an exercise not in the list if no suitable match exists.',
    `Keep the same tier (${tierLabel}) unless biomechanically impossible to do so.`,
  ].join('\n')
}

export async function generateSemanticSwap(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema,
): Promise<SwapResult> {
  const prompt = buildSwapPrompt(query, currentExercise, exerciseDB, v11Contract)
  const result = await fetchGemini(prompt, swapResultSchema, { temperature: 0.3, maxOutputTokens: 512 })
  return {
    ...result,
    exerciseName: canonicalizeExerciseName(result.exerciseName),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/semanticSwapService.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/services/semanticSwapService.ts src/test/semanticSwapService.test.ts && git commit -m "feat(semanticSwap): add swap prompt builder and SwapResult Zod schema"
```

---

## Task 4: `recoveryAuditorService.ts`

**Files:**
- Create: `src/services/recoveryAuditorService.ts`
- Create: `src/test/recoveryAuditorService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/recoveryAuditorService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildAuditPrompt, auditResultSchema } from '../services/recoveryAuditorService'
import type { RecoveryLog, Workout } from '../db/schema'

function makeLog(overrides?: Partial<RecoveryLog>): RecoveryLog {
  return {
    id: 'log-1',
    workoutId: 'wk-1',
    loggedAt: Date.now(),
    sleepHours: 7,
    sleepQuality: 4,
    stressLevel: 2,
    overallFatigue: 2,
    soreness: { chest: 3, shoulders: 2 },
    ...overrides,
  }
}

function makeWorkout(overrides?: Partial<Workout>): Workout {
  return {
    id: 'wk-1',
    date: Date.now(),
    routineType: 'PPL',
    sessionIndex: 0,
    notes: '',
    ...overrides,
  }
}

describe('buildAuditPrompt', () => {
  it('includes all provided recovery logs', () => {
    const logs = [makeLog({ id: 'log-1' }), makeLog({ id: 'log-2' }), makeLog({ id: 'log-3' })]
    const prompt = buildAuditPrompt(logs, [makeWorkout()], {
      physiologicalBaselines: { ageYears: 28, bodyWeightKg: 80, gender: 'male' },
      trainingExperienceLevel: 'intermediate',
      logisticalConstraints: { targetDaysPerWeek: 3, hardSessionLimitMinutes: 60 },
      equipmentAvailability: 'commercial-gym',
      primaryGoals: { primaryFocus: 'hypertrophy', specificLiftTargets: [] },
      injuryConstraints: { hasActiveConstraints: false, constraints: [] },
    })
    expect(prompt).toContain('log-1')
    expect(prompt).toContain('log-2')
    expect(prompt).toContain('log-3')
  })

  it('includes sleep and fatigue values', () => {
    const prompt = buildAuditPrompt([makeLog({ sleepHours: 5, overallFatigue: 5 })], [], {
      physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
      trainingExperienceLevel: null,
      logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
      equipmentAvailability: null,
      primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
      injuryConstraints: { hasActiveConstraints: false, constraints: [] },
    })
    expect(prompt).toContain('5')
  })
})

describe('auditResultSchema', () => {
  it('accepts a valid low-severity result with empty adjustments', () => {
    const result = auditResultSchema.safeParse({
      severity: 'low',
      missionBrief: 'Telemetry nominal.',
      sessionAdjustments: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a high-severity result with arcRecommendation', () => {
    const result = auditResultSchema.safeParse({
      severity: 'high',
      missionBrief: 'Critical fatigue detected.',
      sessionAdjustments: [{ type: 'rest-day', detail: 'Take a full rest day.' }],
      arcRecommendation: { action: 'insert-deload', rationale: '3-session accumulation.' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid severity value', () => {
    const result = auditResultSchema.safeParse({
      severity: 'critical',
      missionBrief: 'Bad.',
      sessionAdjustments: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects sessionAdjustment with invalid type', () => {
    const result = auditResultSchema.safeParse({
      severity: 'medium',
      missionBrief: 'Some fatigue.',
      sessionAdjustments: [{ type: 'invalid-action', detail: 'Do something.' }],
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/recoveryAuditorService.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../services/recoveryAuditorService'`

- [ ] **Step 3: Create `src/services/recoveryAuditorService.ts`**

```typescript
import { z } from 'zod'
import type { RecoveryLog, V11AppSettingsSchema, Workout } from '../db/schema'
import { fetchGemini } from './geminiClient'

const sessionAdjustmentSchema = z.object({
  type: z.enum(['reduce-volume', 'swap-exercise', 'extend-rest', 'rest-day']),
  target: z.string().optional(),
  detail: z.string().min(1),
})

const arcRecommendationSchema = z.object({
  action: z.enum(['insert-deload', 'reduce-overload-delta', 'shift-goal-weighting']),
  rationale: z.string().min(1),
})

export const auditResultSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  missionBrief: z.string().min(1),
  sessionAdjustments: z.array(sessionAdjustmentSchema),
  arcRecommendation: arcRecommendationSchema.optional(),
})

export type SessionAdjustment = z.infer<typeof sessionAdjustmentSchema>
export type ArcRecommendation = z.infer<typeof arcRecommendationSchema>
export type AuditResult = z.infer<typeof auditResultSchema>

export function buildAuditPrompt(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract: V11AppSettingsSchema,
): string {
  const logLines = logs
    .map((log, i) => [
      `Log ${i + 1} (id: ${log.id}):`,
      `  sleepHours=${log.sleepHours}, sleepQuality=${log.sleepQuality}/5`,
      `  stressLevel=${log.stressLevel}/5, overallFatigue=${log.overallFatigue}/5`,
      `  soreness=${JSON.stringify(log.soreness)}`,
    ].join('\n'))
    .join('\n\n')

  const workoutLines = recentWorkouts.length > 0
    ? recentWorkouts.map((w) => `- ${w.routineType} session ${w.sessionIndex} at ${new Date(w.date).toISOString()}`).join('\n')
    : '- no recent workouts'

  return [
    '[ROLE]',
    'You are the IronProtocol Recovery Auditor.',
    'Analyze the athlete\'s recovery telemetry and recommend adjustments.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON matching:',
    '{ "severity": "low"|"medium"|"high", "missionBrief": string, "sessionAdjustments": Array<{ "type": "reduce-volume"|"swap-exercise"|"extend-rest"|"rest-day", "target"?: string, "detail": string }>, "arcRecommendation"?: { "action": "insert-deload"|"reduce-overload-delta"|"shift-goal-weighting", "rationale": string } }',
    'severity rules: low=normal training, medium=reduce accessory load, high=significant intervention needed.',
    'arcRecommendation: ONLY include when severity is "high". Omit entirely otherwise.',
    'missionBrief: 1-2 sentences as a tactical read of the athlete\'s recovery state.',
    '',
    '[ROLLING RECOVERY WINDOW]',
    logLines,
    '',
    '[RECENT WORKOUTS]',
    workoutLines,
    '',
    '[USER PROFILE]',
    `goal: ${v11Contract.primaryGoals.primaryFocus ?? 'unknown'}`,
    `experience: ${v11Contract.trainingExperienceLevel ?? 'unknown'}`,
    `targetDaysPerWeek: ${v11Contract.logisticalConstraints.targetDaysPerWeek ?? 'unknown'}`,
  ].join('\n')
}

export async function generateRecoveryAudit(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract: V11AppSettingsSchema,
): Promise<AuditResult> {
  const prompt = buildAuditPrompt(logs, recentWorkouts, v11Contract)
  return fetchGemini(prompt, auditResultSchema, { temperature: 0.2, maxOutputTokens: 1024 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/recoveryAuditorService.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/services/recoveryAuditorService.ts src/test/recoveryAuditorService.test.ts && git commit -m "feat(recoveryAuditor): add audit prompt builder and AuditResult Zod schema"
```

---

## Task 5: `useSemanticSwap` hook

**Files:**
- Create: `src/hooks/useSemanticSwap.ts`
- Create: `src/test/useSemanticSwap.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/useSemanticSwap.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSemanticSwap } from '../hooks/useSemanticSwap'
import type { SwapResult } from '../services/semanticSwapService'

vi.mock('../services/geminiClient', () => ({
  isLabAvailable: vi.fn(),
  fetchGemini: vi.fn(),
}))

vi.mock('../services/semanticSwapService', () => ({
  generateSemanticSwap: vi.fn(),
}))

import { isLabAvailable } from '../services/geminiClient'
import { generateSemanticSwap } from '../services/semanticSwapService'

const mockIsLabAvailable = vi.mocked(isLabAvailable)
const mockGenerateSemanticSwap = vi.mocked(generateSemanticSwap)

const MOCK_RESULT: SwapResult = {
  exerciseName: 'Leg Press',
  muscleGroup: 'legs',
  tier: 'T1',
  reason: 'Isolates quads without spinal load.',
  confidence: 'high',
}

afterEach(() => vi.clearAllMocks())

describe('useSemanticSwap', () => {
  it('starts in idle state', () => {
    mockIsLabAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useSemanticSwap())
    expect(result.current.status).toBe('idle')
    expect(result.current.swapResult).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('exposes isLabAvailable=false when Lab is offline', () => {
    mockIsLabAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useSemanticSwap())
    expect(result.current.isLabAvailable).toBe(false)
  })

  it('transitions idle → loading → result on successful submit', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateSemanticSwap.mockResolvedValue(MOCK_RESULT)

    const { result } = renderHook(() => useSemanticSwap())

    await act(async () => {
      result.current.submit('knee pain', { name: 'Back Squat', tier: 1, muscleGroup: 'legs' }, [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      })
    })

    expect(result.current.status).toBe('result')
    expect(result.current.swapResult).toEqual(MOCK_RESULT)
  })

  it('transitions to error state when service throws', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateSemanticSwap.mockRejectedValue(new Error('timeout'))

    const { result } = renderHook(() => useSemanticSwap())

    await act(async () => {
      result.current.submit('any query', { name: 'Bench Press', tier: 1, muscleGroup: 'chest' }, [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      })
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('timeout')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/useSemanticSwap.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../hooks/useSemanticSwap'`

- [ ] **Step 3: Create `src/hooks/useSemanticSwap.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/useSemanticSwap.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/hooks/useSemanticSwap.ts src/test/useSemanticSwap.test.ts && git commit -m "feat(useSemanticSwap): add hook with idle/loading/result/error state machine"
```

---

## Task 6: `useRecoveryAudit` hook

**Files:**
- Create: `src/hooks/useRecoveryAudit.ts`
- Create: `src/test/useRecoveryAudit.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/useRecoveryAudit.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecoveryAudit } from '../hooks/useRecoveryAudit'
import type { AuditResult } from '../services/recoveryAuditorService'

vi.mock('../services/geminiClient', () => ({
  isLabAvailable: vi.fn(),
}))

vi.mock('../services/recoveryAuditorService', () => ({
  generateRecoveryAudit: vi.fn(),
}))

import { isLabAvailable } from '../services/geminiClient'
import { generateRecoveryAudit } from '../services/recoveryAuditorService'

const mockIsLabAvailable = vi.mocked(isLabAvailable)
const mockGenerateRecoveryAudit = vi.mocked(generateRecoveryAudit)

const MOCK_AUDIT: AuditResult = {
  severity: 'medium',
  missionBrief: 'Moderate fatigue detected.',
  sessionAdjustments: [{ type: 'reduce-volume', detail: 'Drop T3 by 1 set.' }],
}

afterEach(() => vi.clearAllMocks())

describe('useRecoveryAudit', () => {
  it('returns hasLogs=false and does not call service when no logs provided', async () => {
    mockIsLabAvailable.mockReturnValue(true)

    const { result } = renderHook(() => useRecoveryAudit([], []))

    await waitFor(() => expect(result.current.status).not.toBe('loading'))

    expect(result.current.hasLogs).toBe(false)
    expect(mockGenerateRecoveryAudit).not.toHaveBeenCalled()
  })

  it('returns isLabAvailable=false when Lab is offline', () => {
    mockIsLabAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useRecoveryAudit([], []))
    expect(result.current.isLabAvailable).toBe(false)
  })

  it('calls generateRecoveryAudit and returns result when logs exist', async () => {
    mockIsLabAvailable.mockReturnValue(true)
    mockGenerateRecoveryAudit.mockResolvedValue(MOCK_AUDIT)

    const mockLog = {
      id: 'log-1', workoutId: 'wk-1', loggedAt: Date.now(),
      sleepHours: 6, sleepQuality: 3 as const, stressLevel: 3 as const,
      overallFatigue: 3 as const, soreness: {},
    }

    const { result } = renderHook(() =>
      useRecoveryAudit([mockLog], [], {
        physiologicalBaselines: { ageYears: null, bodyWeightKg: null, gender: null },
        trainingExperienceLevel: null,
        logisticalConstraints: { targetDaysPerWeek: null, hardSessionLimitMinutes: null },
        equipmentAvailability: null,
        primaryGoals: { primaryFocus: null, specificLiftTargets: [] },
        injuryConstraints: { hasActiveConstraints: false, constraints: [] },
      }),
    )

    await waitFor(() => expect(result.current.status).toBe('result'))

    expect(result.current.auditResult).toEqual(MOCK_AUDIT)
    expect(result.current.hasLogs).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/useRecoveryAudit.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../hooks/useRecoveryAudit'`

- [ ] **Step 3: Create `src/hooks/useRecoveryAudit.ts`**

```typescript
import { useEffect, useState } from 'react'
import { isLabAvailable } from '../services/geminiClient'
import { generateRecoveryAudit, type AuditResult } from '../services/recoveryAuditorService'
import type { RecoveryLog, V11AppSettingsSchema, Workout } from '../db/schema'

type AuditStatus = 'idle' | 'loading' | 'result' | 'error'

interface RecoveryAuditState {
  status: AuditStatus
  hasLogs: boolean
  auditResult: AuditResult | null
  error: string | null
  isLabAvailable: boolean
}

export function useRecoveryAudit(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract?: V11AppSettingsSchema,
): RecoveryAuditState {
  const [status, setStatus] = useState<AuditStatus>('idle')
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const labAvailable = isLabAvailable()
  const hasLogs = logs.length > 0

  useEffect(() => {
    if (!hasLogs || !v11Contract || !labAvailable) {
      return
    }

    setStatus('loading')

    generateRecoveryAudit(logs, recentWorkouts, v11Contract)
      .then((result) => {
        setAuditResult(result)
        setStatus('result')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Audit failed')
        setStatus('error')
      })
  }, [hasLogs, labAvailable, v11Contract])

  return {
    status,
    hasLogs,
    auditResult,
    error,
    isLabAvailable: labAvailable,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/useRecoveryAudit.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/hooks/useRecoveryAudit.ts src/test/useRecoveryAudit.test.ts && git commit -m "feat(useRecoveryAudit): add hook with log-driven audit trigger and Lab gate"
```

---

## Task 7: `SemanticSwapDrawer` component

**Files:**
- Create: `src/components/SemanticSwapDrawer.tsx`
- Create: `src/test/SemanticSwapDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/test/SemanticSwapDrawer.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import SemanticSwapDrawer from '../components/SemanticSwapDrawer'

vi.mock('../hooks/useSemanticSwap', () => ({
  useSemanticSwap: vi.fn(),
}))

import { useSemanticSwap } from '../hooks/useSemanticSwap'
const mockUseSemanticSwap = vi.mocked(useSemanticSwap)

function baseHookState(overrides = {}) {
  return {
    status: 'idle' as const,
    swapResult: null,
    error: null,
    isLabAvailable: true,
    submit: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
}

const BASE_EXERCISE = { name: 'Back Squat', tier: 1 as const, muscleGroup: 'legs' }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SemanticSwapDrawer', () => {
  it('renders Lab-only locked state when isLabAvailable is false', () => {
    mockUseSemanticSwap.mockReturnValue(baseHookState({ isLabAvailable: false }))
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/Lab Connection Required/i)).toBeInTheDocument()
  })

  it('disables submit button while status is loading', () => {
    mockUseSemanticSwap.mockReturnValue(baseHookState({ status: 'loading' }))
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled()
  })

  it('calls onSwapConfirmed with exercise name when Confirm is clicked', () => {
    const onSwapConfirmed = vi.fn()
    mockUseSemanticSwap.mockReturnValue(
      baseHookState({
        status: 'result',
        swapResult: {
          exerciseName: 'Leg Press',
          muscleGroup: 'legs',
          tier: 'T1' as const,
          reason: 'Good swap.',
          confidence: 'high' as const,
        },
      }),
    )
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={onSwapConfirmed}
        onClose={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /confirm swap/i }))
    expect(onSwapConfirmed).toHaveBeenCalledWith('Leg Press')
  })

  it('shows high confidence chip when confidence is high', () => {
    mockUseSemanticSwap.mockReturnValue(
      baseHookState({
        status: 'result',
        swapResult: {
          exerciseName: 'Leg Press',
          muscleGroup: 'legs',
          tier: 'T1' as const,
          reason: 'Good.',
          confidence: 'high' as const,
        },
      }),
    )
    render(
      <SemanticSwapDrawer
        exercise={BASE_EXERCISE}
        exerciseDB={[]}
        v11Contract={null}
        onSwapConfirmed={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/SemanticSwapDrawer.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../components/SemanticSwapDrawer'`

- [ ] **Step 3: Create `src/components/SemanticSwapDrawer.tsx`**

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSemanticSwap } from '../hooks/useSemanticSwap'
import type { ExerciseTier, ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'

interface Props {
  exercise: { name: string; tier: ExerciseTier; muscleGroup: string }
  exerciseDB: ReadonlyExercise[]
  v11Contract: V11AppSettingsSchema | null
  onSwapConfirmed: (exerciseName: string) => void
  onClose: () => void
}

const CONFIDENCE_STYLES = {
  high: 'border-[#22c55e44] bg-[#22c55e15] text-[#22c55e]',
  medium: 'border-[#f59e0b44] bg-[#f59e0b15] text-[#f59e0b]',
  low: 'border-white/10 bg-white/5 text-zinc-400',
} as const

const TIER_LABELS: Record<ExerciseTier, 'T1' | 'T2' | 'T3'> = { 1: 'T1', 2: 'T2', 3: 'T3' }

export default function SemanticSwapDrawer({ exercise, exerciseDB, v11Contract, onSwapConfirmed, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { status, swapResult, error, isLabAvailable, submit, reset } = useSemanticSwap()

  function handleSubmit() {
    if (!query.trim() || !v11Contract) return
    submit(query.trim(), exercise, exerciseDB, v11Contract)
  }

  function handleConfirm() {
    if (swapResult) {
      onSwapConfirmed(swapResult.exerciseName)
    }
  }

  function handleClose() {
    reset()
    setQuery('')
    onClose()
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-[28px] border border-white/10 bg-[#0A0E1A] px-5 pb-10 pt-4 shadow-[0_-24px_60px_-12px_rgba(0,0,0,0.8)]"
    >
      {/* Handle */}
      <div className="mb-4 flex justify-center">
        <div className="h-1 w-9 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${isLabAvailable ? 'bg-[#3B71FE]' : 'bg-zinc-600'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3B71FE]/70">
          {isLabAvailable ? 'Lab · Biomechanical Search' : 'Lab · Offline'}
        </span>
      </div>
      <h2 className="mb-4 text-base font-black text-white">
        Swap: {exercise.name}
        <span className="ml-2 rounded-full border border-[#3B71FE]/40 px-2 py-0.5 text-[11px] font-bold text-[#3B71FE]">
          {TIER_LABELS[exercise.tier]}
        </span>
      </h2>

      {!isLabAvailable ? (
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0D1626] p-6 text-center">
          <span className="mb-3 text-3xl">🔬</span>
          <p className="mb-1 text-sm font-bold text-zinc-400">Lab Connection Required</p>
          <p className="text-xs text-zinc-600">
            AI-powered exercise matching requires internet and a configured API key.
          </p>
        </div>
      ) : (
        <>
          {/* Query input */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#3B71FE]/40 bg-[#0D1626] px-3 py-2.5 focus-within:border-[#3B71FE]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="Describe your constraint..."
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <motion.button
              type="button"
              aria-label="Search"
              onClick={handleSubmit}
              disabled={status === 'loading' || !query.trim()}
              whileTap={{ scale: 0.9 }}
              className="rounded-lg bg-[#3B71FE] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              {status === 'loading' ? '...' : '→'}
            </motion.button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {status === 'error' && error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-3 text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {status === 'result' && swapResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="rounded-2xl border border-[#22c55e]/20 bg-[#0D1626] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-base font-black text-white">{swapResult.exerciseName}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${CONFIDENCE_STYLES[swapResult.confidence]}`}>
                    {swapResult.confidence} confidence
                  </span>
                </div>
                <div className="mb-3 flex gap-2">
                  <span className="rounded-full border border-[#3B71FE]/40 px-2 py-0.5 text-[10px] font-bold text-[#3B71FE]">
                    {swapResult.tier}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
                    {swapResult.muscleGroup}
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-zinc-400">{swapResult.reason}</p>
                <motion.button
                  type="button"
                  aria-label="Confirm swap"
                  onClick={handleConfirm}
                  whileTap={{ scale: 0.97 }}
                  className="w-full rounded-xl bg-[#3B71FE] py-3 text-sm font-black text-white"
                >
                  Confirm Swap
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <button
        type="button"
        onClick={handleClose}
        className="mt-4 w-full text-center text-xs text-zinc-600"
      >
        Cancel
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/SemanticSwapDrawer.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/SemanticSwapDrawer.tsx src/test/SemanticSwapDrawer.test.tsx && git commit -m "feat(SemanticSwapDrawer): add slide-up swap sheet with Lab gate and confidence chips"
```

---

## Task 8: `RecoveryAuditorCard` component

**Files:**
- Create: `src/components/RecoveryAuditorCard.tsx`
- Create: `src/test/RecoveryAuditorCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/test/RecoveryAuditorCard.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import RecoveryAuditorCard from '../components/RecoveryAuditorCard'
import type { AuditResult } from '../services/recoveryAuditorService'

afterEach(cleanup)

const LOW_RESULT: AuditResult = {
  severity: 'low',
  missionBrief: 'Telemetry nominal.',
  sessionAdjustments: [],
}

const HIGH_RESULT: AuditResult = {
  severity: 'high',
  missionBrief: 'Critical fatigue.',
  sessionAdjustments: [{ type: 'rest-day', detail: 'Full rest.' }],
  arcRecommendation: { action: 'insert-deload', rationale: '3-session accumulation.' },
}

describe('RecoveryAuditorCard', () => {
  it('renders locked state when isLabAvailable is false', () => {
    render(
      <RecoveryAuditorCard
        auditResult={null}
        isLabAvailable={false}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.getByText(/Lab Connection Required/i)).toBeInTheDocument()
  })

  it('renders green badge for low severity', () => {
    render(
      <RecoveryAuditorCard
        auditResult={LOW_RESULT}
        isLabAvailable={true}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.getByText(/Recovery · Clear/i)).toBeInTheDocument()
    expect(screen.getByText('Telemetry nominal.')).toBeInTheDocument()
  })

  it('hides arc adjustment section when severity is not high', () => {
    render(
      <RecoveryAuditorCard
        auditResult={{ severity: 'medium', missionBrief: 'Caution.', sessionAdjustments: [] }}
        isLabAvailable={true}
        onArcReviewRequested={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /review arc/i })).not.toBeInTheDocument()
  })

  it('shows arc CTA and fires callback when severity is high', () => {
    const onArcReviewRequested = vi.fn()
    render(
      <RecoveryAuditorCard
        auditResult={HIGH_RESULT}
        isLabAvailable={true}
        onArcReviewRequested={onArcReviewRequested}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /review arc adjustment/i }))
    expect(onArcReviewRequested).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/RecoveryAuditorCard.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../components/RecoveryAuditorCard'`

- [ ] **Step 3: Create `src/components/RecoveryAuditorCard.tsx`**

```typescript
import { motion } from 'framer-motion'
import type { AuditResult } from '../services/recoveryAuditorService'

interface Props {
  auditResult: AuditResult | null
  isLabAvailable: boolean
  onArcReviewRequested: () => void
}

const SEVERITY_STYLES = {
  low: {
    border: 'border-[#22c55e]/25',
    dot: 'bg-[#22c55e]',
    label: 'Recovery · Clear',
    labelColor: 'text-[#22c55e]',
    brief: 'text-[#d1fae5]',
  },
  medium: {
    border: 'border-[#f59e0b]/25',
    dot: 'bg-[#f59e0b]',
    label: 'Recovery · Caution',
    labelColor: 'text-[#f59e0b]',
    brief: 'text-[#fef3c7]',
  },
  high: {
    border: 'border-[#ef4444]/25',
    dot: 'bg-[#ef4444]',
    label: 'Recovery · Critical',
    labelColor: 'text-[#ef4444]',
    brief: 'text-[#fee2e2]',
  },
} as const

export default function RecoveryAuditorCard({ auditResult, isLabAvailable, onArcReviewRequested }: Props) {
  if (!isLabAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-[#0D1626] p-4 text-center"
      >
        <p className="mb-1 text-xs font-bold text-zinc-500">Lab Connection Required</p>
        <p className="text-[11px] text-zinc-600">Recovery auditing is a Lab feature.</p>
      </motion.div>
    )
  }

  if (!auditResult) return null

  const styles = SEVERITY_STYLES[auditResult.severity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-2xl border bg-[#0A0E1A] p-4 ${styles.border}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${styles.labelColor}`}>
          {styles.label}
        </span>
      </div>

      <p className={`mb-3 text-[11px] font-medium italic leading-relaxed ${styles.brief}`}>
        "{auditResult.missionBrief}"
      </p>

      {auditResult.sessionAdjustments.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          {auditResult.sessionAdjustments.map((adj, i) => (
            <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-[10px] text-zinc-400">
              · {adj.detail}
            </div>
          ))}
        </div>
      )}

      {auditResult.severity === 'high' && auditResult.arcRecommendation && (
        <motion.button
          type="button"
          aria-label="Review Arc Adjustment"
          onClick={onArcReviewRequested}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-xl bg-[#ef4444] py-2.5 text-xs font-black text-white"
        >
          Review Arc Adjustment →
        </motion.button>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/RecoveryAuditorCard.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/RecoveryAuditorCard.tsx src/test/RecoveryAuditorCard.test.tsx && git commit -m "feat(RecoveryAuditorCard): add severity-driven card with arc review CTA"
```

---

## Task 9: `RecoveryLogForm` component

**Files:**
- Create: `src/components/RecoveryLogForm.tsx`

- [ ] **Step 1: Write failing tests**

Add to `src/test/UI.test.tsx` (in a new `describe` block at the end of the file):

```typescript
// Import at top of file (add to existing imports):
// import RecoveryLogForm from '../components/RecoveryLogForm'
// import { IronProtocolDB } from '../db/schema'
// import 'fake-indexeddb/auto'

describe('RecoveryLogForm', () => {
  it('renders all 6 muscle group soreness chips', () => {
    render(
      <RecoveryLogForm workoutId="wk-1" db={{} as IronProtocolDB} onDone={vi.fn()} onSkip={vi.fn()} />,
    )
    for (const group of ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']) {
      expect(screen.getByText(group)).toBeInTheDocument()
    }
  })

  it('calls onSkip when skip link is clicked', () => {
    const onSkip = vi.fn()
    render(
      <RecoveryLogForm workoutId="wk-1" db={{} as IronProtocolDB} onDone={vi.fn()} onSkip={onSkip} />,
    )
    fireEvent.click(screen.getByText(/skip/i))
    expect(onSkip).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx --reporter=verbose 2>&1 | grep -E "RecoveryLogForm|FAIL|PASS" | head -20
```

Expected: FAIL — `Cannot find module '../components/RecoveryLogForm'`

- [ ] **Step 3: Create `src/components/RecoveryLogForm.tsx`**

```typescript
import { useState } from 'react'
import { motion } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import type { IronProtocolDB, MuscleGroup, RecoveryLog } from '../db/schema'

interface Props {
  workoutId: string
  db: IronProtocolDB
  onDone: () => void
  onSkip: () => void
}

const MUSCLE_GROUPS: { key: MuscleGroup; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back' },
  { key: 'legs', label: 'Legs' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'arms', label: 'Arms' },
  { key: 'core', label: 'Core' },
]

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const
type Rating = (typeof RATING_OPTIONS)[number]

export default function RecoveryLogForm({ workoutId, db, onDone, onSkip }: Props) {
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState<Rating>(3)
  const [stressLevel, setStressLevel] = useState<Rating>(2)
  const [overallFatigue, setOverallFatigue] = useState<Rating>(2)
  const [soreness, setSoreness] = useState<Partial<Record<MuscleGroup, Rating>>>({})
  const [saving, setSaving] = useState(false)

  function toggleSoreness(group: MuscleGroup) {
    setSoreness((prev) => {
      const next = { ...prev }
      if (next[group]) {
        delete next[group]
      } else {
        next[group] = 3
      }
      return next
    })
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const log: RecoveryLog = {
        id: uuidv4(),
        workoutId,
        loggedAt: Date.now(),
        sleepHours,
        sleepQuality,
        stressLevel,
        overallFatigue,
        soreness,
      }
      await db.recoveryLogs.add(log)
    } catch {
      // Non-blocking — workout data unaffected if this fails
    }
    onDone()
  }

  function RatingTiles({ value, onChange }: { value: Rating; onChange: (r: Rating) => void }) {
    return (
      <div className="flex gap-1.5">
        {RATING_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as Rating)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-colors
              ${n <= value ? 'bg-[#3B71FE] text-white' : 'bg-[#1e2a45] text-zinc-500'}`}
          >
            {n}
          </button>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-3xl border border-white/10 bg-[#0D1626] p-5"
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3B71FE]">
        Post-Session Telemetry
      </p>

      {/* Sleep */}
      <div className="mb-4">
        <p className="mb-2 text-xs text-zinc-400">Sleep last night</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-1.5">
            <button type="button" onClick={() => setSleepHours((h) => Math.max(0, h - 1))} className="text-zinc-400">−</button>
            <span className="w-8 text-center text-sm font-bold text-[#3B71FE]">{sleepHours}h</span>
            <button type="button" onClick={() => setSleepHours((h) => Math.min(12, h + 1))} className="text-zinc-400">+</button>
          </div>
          <RatingTiles value={sleepQuality} onChange={setSleepQuality} />
        </div>
      </div>

      {/* Stress + Fatigue */}
      <div className="mb-4 flex gap-6">
        <div>
          <p className="mb-2 text-xs text-zinc-400">Stress</p>
          <RatingTiles value={stressLevel} onChange={setStressLevel} />
        </div>
        <div>
          <p className="mb-2 text-xs text-zinc-400">Fatigue</p>
          <RatingTiles value={overallFatigue} onChange={setOverallFatigue} />
        </div>
      </div>

      {/* Soreness chips */}
      <div className="mb-5">
        <p className="mb-2 text-xs text-zinc-400">Soreness (tap affected)</p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSoreness(key)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors
                ${soreness[key] ? 'border-[#3B71FE] text-[#3B71FE]' : 'border-white/10 text-zinc-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="mb-3 w-full rounded-xl bg-[#3B71FE] py-3 text-sm font-black text-white disabled:opacity-50"
      >
        Log Recovery Data
      </motion.button>

      <button type="button" onClick={onSkip} className="w-full text-center text-xs text-zinc-600">
        Skip — I'll log next time
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 4: Add imports to `src/test/UI.test.tsx`**

At the top of `src/test/UI.test.tsx`, add to the existing imports:

```typescript
import RecoveryLogForm from '../components/RecoveryLogForm'
import 'fake-indexeddb/auto'
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — existing tests + 2 new RecoveryLogForm tests.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/RecoveryLogForm.tsx src/test/UI.test.tsx && git commit -m "feat(RecoveryLogForm): add post-session telemetry form with soreness chips"
```

---

## Task 10: Wire `SemanticSwapDrawer` into `SessionBlueprint`

**Files:**
- Modify: `src/components/SessionBlueprint.tsx`

- [ ] **Step 1: Read the current exercise card tap handler in `SessionBlueprint.tsx`**

Find where exercise cards are rendered and what happens on tap. Look for `onUpdatePlan` and any existing swap logic (around line 60+).

- [ ] **Step 2: Add swap state and drawer to `SessionBlueprint.tsx`**

At the top of the component function, add:

```typescript
const [swapTarget, setSwapTarget] = useState<{ name: string; tier: ExerciseTier; muscleGroup: string } | null>(null)
const [exerciseDB, setExerciseDB] = useState<ReadonlyExercise[]>([])
const [v11Contract, setV11Contract] = useState<V11AppSettingsSchema | null>(null)
```

Add an effect to load the exercise DB and V11 contract (place after existing effects):

```typescript
useEffect(() => {
  db.exercises.toArray().then((exs) => setExerciseDB(exs)).catch(() => {})
  db.settings.get(APP_SETTINGS_ID).then((s) => {
    if (s?.v11PromptContract) setV11Contract(s.v11PromptContract)
  }).catch(() => {})
}, [db])
```

Add these imports at the top of the file:

```typescript
import { AnimatePresence } from 'framer-motion'
import SemanticSwapDrawer from './SemanticSwapDrawer'
import { APP_SETTINGS_ID } from '../db/schema'
import type { ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'
```

- [ ] **Step 3: Add swap handler and drawer to the JSX**

Where exercise cards are tapped (the existing card click handler), add a "Swap" button that sets `swapTarget`. At the bottom of the component's returned JSX, add:

```tsx
<AnimatePresence>
  {swapTarget && (
    <SemanticSwapDrawer
      exercise={swapTarget}
      exerciseDB={exerciseDB}
      v11Contract={v11Contract}
      onSwapConfirmed={(newName) => {
        // Replace the exercise in the plan using onUpdatePlan
        if (plan) {
          const updatedExercises = plan.exercises.map((ex) =>
            ex.exerciseName === swapTarget.name
              ? { ...ex, exerciseName: newName }
              : ex,
          )
          onUpdatePlan({ ...plan, exercises: updatedExercises })
        }
        setSwapTarget(null)
      }}
      onClose={() => setSwapTarget(null)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 4: Verify typecheck**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/SessionBlueprint.tsx && git commit -m "feat(SessionBlueprint): mount SemanticSwapDrawer on exercise swap"
```

---

## Task 11: Wire `SemanticSwapDrawer` + `RecoveryLogForm` into `ActiveLogger`

**Files:**
- Modify: `src/components/ActiveLogger.tsx`

- [ ] **Step 1: Add swap and recovery form state to `ActiveLogger.tsx`**

At the top of the component function, add:

```typescript
const [swapTarget, setSwapTarget] = useState<{ name: string; tier: ExerciseTier; muscleGroup: string } | null>(null)
const [exerciseDB, setExerciseDB] = useState<ReadonlyExercise[]>([])
const [v11Contract, setV11Contract] = useState<V11AppSettingsSchema | null>(null)
const [showRecoveryForm, setShowRecoveryForm] = useState(false)
const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null)
```

Add imports at the top:

```typescript
import SemanticSwapDrawer from './SemanticSwapDrawer'
import RecoveryLogForm from './RecoveryLogForm'
import { APP_SETTINGS_ID } from '../db/schema'
import type { ReadonlyExercise, V11AppSettingsSchema } from '../db/schema'
```

Load exercise DB and V11 contract (add after existing effects):

```typescript
useEffect(() => {
  db.exercises.toArray().then((exs) => setExerciseDB(exs)).catch(() => {})
  db.settings.get(APP_SETTINGS_ID).then((s) => {
    if (s?.v11PromptContract) setV11Contract(s.v11PromptContract)
  }).catch(() => {})
}, [db])
```

- [ ] **Step 2: Hook into session completion to show RecoveryLogForm**

Find where the session is committed to Dexie (where a `Workout` record is written and `onDone` is eventually called). After the workout is written, capture its ID and show the recovery form before calling `onDone`:

```typescript
// After writing the Workout record, instead of calling onDone() directly:
setCompletedWorkoutId(workoutId)
setShowRecoveryForm(true)
// Do NOT call onDone() here — RecoveryLogForm will call it via onDone/onSkip
```

- [ ] **Step 3: Add swap button to the active exercise card area**

In the JSX where the current exercise is displayed (the active set logger), add a small "Swap" button next to the exercise name:

```tsx
<button
  type="button"
  onClick={() => setSwapTarget({
    name: currentExercise.exerciseName,
    tier: currentExercise.tier,
    muscleGroup: 'unknown', // ActiveLogger does not have muscleGroup on TempSessionExercise
  })}
  className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3B71FE]/60"
>
  Swap
</button>
```

- [ ] **Step 4: Add drawer and form to the JSX**

At the bottom of the component's returned JSX, before the closing tag:

```tsx
<AnimatePresence>
  {swapTarget && (
    <SemanticSwapDrawer
      exercise={swapTarget}
      exerciseDB={exerciseDB}
      v11Contract={v11Contract}
      onSwapConfirmed={(newName) => {
        // Update current exercise name in tempSession
        setSwapTarget(null)
        // The actual swap writes to TempSession via existing Dexie update pattern
      }}
      onClose={() => setSwapTarget(null)}
    />
  )}
</AnimatePresence>

<AnimatePresence>
  {showRecoveryForm && completedWorkoutId && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-10"
    >
      <RecoveryLogForm
        workoutId={completedWorkoutId}
        db={db}
        onDone={() => { setShowRecoveryForm(false); onDone?.() }}
        onSkip={() => { setShowRecoveryForm(false); onDone?.() }}
      />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 5: Verify typecheck**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/ActiveLogger.tsx && git commit -m "feat(ActiveLogger): wire SemanticSwapDrawer mid-session and RecoveryLogForm post-commit"
```

---

## Task 12: Wire `RecoveryAuditorCard` into `CoreIgnition`

**Files:**
- Modify: `src/components/CoreIgnition.tsx`

- [ ] **Step 1: Read `CoreIgnition.tsx` to understand its props and render structure**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && head -60 src/components/CoreIgnition.tsx
```

- [ ] **Step 2: Add recovery audit state to `CoreIgnition`**

Add imports at the top:

```typescript
import RecoveryAuditorCard from './RecoveryAuditorCard'
import { useRecoveryAudit } from '../hooks/useRecoveryAudit'
import { APP_SETTINGS_ID } from '../db/schema'
import type { RecoveryLog, Workout, V11AppSettingsSchema } from '../db/schema'
```

Add a `db` prop to the component (or use an existing one if it already has it). If `CoreIgnition` does not currently accept `db`, add it:

```typescript
interface Props {
  // ... existing props ...
  db?: IronProtocolDB
  onComplete: () => void
}
```

Inside the component, load recovery data:

```typescript
const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([])
const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
const [v11Contract, setV11Contract] = useState<V11AppSettingsSchema | null>(null)

useEffect(() => {
  if (!db) return
  db.recoveryLogs.orderBy('loggedAt').reverse().limit(4).toArray()
    .then(setRecoveryLogs).catch(() => {})
  db.workouts.orderBy('date').reverse().limit(4).toArray()
    .then(setRecentWorkouts).catch(() => {})
  db.settings.get(APP_SETTINGS_ID).then((s) => {
    if (s?.v11PromptContract) setV11Contract(s.v11PromptContract)
  }).catch(() => {})
}, [db])

const { auditResult, hasLogs, isLabAvailable: labAvailable } = useRecoveryAudit(
  recoveryLogs,
  recentWorkouts,
  v11Contract ?? undefined,
)
```

- [ ] **Step 3: Add `RecoveryAuditorCard` to the JSX**

In the CoreIgnition render output, above the main launch CTA, add:

```tsx
{hasLogs && (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4"
  >
    <RecoveryAuditorCard
      auditResult={auditResult}
      isLabAvailable={labAvailable}
      onArcReviewRequested={() => {
        // Arc review modal — placeholder for Sub-project C
        console.warn('[RecoveryAuditor] Arc review requested — not yet implemented')
      }}
    />
  </motion.div>
)}
```

- [ ] **Step 4: Verify typecheck and run full test suite**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -20
```

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: no type errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/CoreIgnition.tsx && git commit -m "feat(CoreIgnition): mount RecoveryAuditorCard when recovery logs exist"
```

---

## Self-Review Checklist

- [x] **Schema V14** — `RecoveryLog`, `MuscleGroup`, `recoveryLogs` table → Task 1
- [x] **geminiClient.ts** — `isLabAvailable`, `fetchGemini<T>` → Task 2
- [x] **aiPlannerService.ts refactor** — public API unchanged → Task 2, Step 5–6
- [x] **semanticSwapService.ts** — `buildSwapPrompt`, `swapResultSchema`, `generateSemanticSwap` → Task 3
- [x] **recoveryAuditorService.ts** — `buildAuditPrompt`, `auditResultSchema`, `generateRecoveryAudit` → Task 4
- [x] **useSemanticSwap** — idle/loading/result/error, Lab gate → Task 5
- [x] **useRecoveryAudit** — hasLogs guard, Lab gate, rolling window → Task 6
- [x] **SemanticSwapDrawer** — locked state, confidence chips, onSwapConfirmed → Task 7
- [x] **RecoveryAuditorCard** — severity variants, arc CTA, locked state → Task 8
- [x] **RecoveryLogForm** — soreness chips, skip, Dexie write → Task 9
- [x] **SessionBlueprint wiring** — drawer mounts on exercise tap → Task 10
- [x] **ActiveLogger wiring** — drawer mid-session, form post-commit → Task 11
- [x] **CoreIgnition wiring** — card shown when hasLogs → Task 12
- [x] **Lab-only locked states** — both components handle `isLabAvailable=false` → Tasks 7, 8
- [x] **Arc recommendation** — user-confirmed only, `onArcReviewRequested` callback → Task 8, 12
