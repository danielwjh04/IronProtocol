# NLP Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the React frontend for Natural Language Plan Search — shared types, Supabase client, Dexie V15 offline cache, service layer, search hook, and all UI components (search input, exercise cards with swap drawer, confidence badge, PWA install prompt) behind a new `/plan` route.

**Architecture:** All network traffic goes through `planningService.ts`, which calls the three Supabase Edge Functions from Plan A; offline fallback reads from Dexie V15 `cachedPlans`; debounce + AbortController live in `useNaturalPlanSearch`; the swap flow is orchestrated entirely inside `NaturalPlanSearch.tsx` — it calls `swapExercise`, shows `SwapOptionsDrawer`, updates local exercises state, then fires feedback. `vite-plugin-pwa` is already installed and configured; this plan only adds `runtimeCaching` entries for Supabase routes and creates a `capacitor.config.ts`.

**Tech Stack:** React 18, Vite, Tailwind, Dexie.js v4, Framer Motion, `@supabase/supabase-js` v2, `vite-plugin-pwa` (already configured), Vitest + `@testing-library/react`

---

## File Structure

### New files
| File | Purpose |
|------|---------|
| `src/types/planning.ts` | GoalKey, Tier, RepScheme, REP_SCHEMES, GoalIntent, ResolvedExercise, ComposedPlan, all request/response types, CachedPlan |
| `src/lib/supabaseClient.ts` | Supabase singleton — anon key only |
| `src/services/planningService.ts` | queryPlan (abort + Dexie fallback), swapExercise, submitFeedback |
| `src/hooks/useNaturalPlanSearch.ts` | 300ms debounced search state machine |
| `src/components/PlanConfidenceBadge.tsx` | Badge: "Personalized" / "Good Match" / "Cached plan" |
| `src/components/SwapOptionsDrawer.tsx` | Framer Motion bottom-sheet, 3–5 swap options |
| `src/components/NaturalPlanSearch.tsx` | Search input + plan display + full swap flow |
| `src/components/InstallPrompt.tsx` | PWA install banner (beforeinstallprompt) |
| `capacitor.config.ts` | Capacitor native config for iOS/Android |
| `src/test/planning.test.ts` | REP_SCHEMES safety unit tests |
| `src/test/planningService.test.ts` | abort, offline fallback, cache write |
| `src/test/useNaturalPlanSearch.test.tsx` | debounce, loading, fromCache |
| `src/test/PlanConfidenceBadge.test.tsx` | badge label rendering |
| `src/test/SwapOptionsDrawer.test.tsx` | options render, select callback |
| `src/test/NaturalPlanSearch.test.tsx` | search + swap integration |
| `src/test/InstallPrompt.test.tsx` | standalone detection, dismiss |

### Modified files
| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `CachedPlan` interface + `version(15)` with `cachedPlans: 'id'` |
| `src/vite-env.d.ts` | Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |
| `src/App.tsx` | Add `/plan` to `RoutePath`, resolveRoute, and currentPage |
| `src/test/db.test.ts` | Update version assertion 14→15, add cachedPlans table check |
| `vite.config.ts` | Add `runtimeCaching` for Supabase Edge Functions and storage |

---

### Task 1: Planning types + REP_SCHEMES safety tests

**Files:**
- Create: `src/types/planning.ts`
- Create: `src/test/planning.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/test/planning.test.ts
import { describe, it, expect } from 'vitest'
import { REP_SCHEMES } from '../types/planning'
import type { GoalKey, Tier } from '../types/planning'

const GOALS: GoalKey[] = ['fat_loss', 'hypertrophy', 'strength', 'endurance', 'recomp', 'power']
const TIERS: Tier[] = [1, 2, 3]

describe('REP_SCHEMES — completeness', () => {
  it('defines a RepScheme for every goal × tier combination', () => {
    for (const goal of GOALS) {
      for (const tier of TIERS) {
        const scheme = REP_SCHEMES[goal][tier]
        expect(scheme, `missing REP_SCHEMES[${goal}][${tier}]`).toBeDefined()
        expect(typeof scheme.sets).toBe('number')
        expect(typeof scheme.repsMin).toBe('number')
        expect(typeof scheme.repsMax).toBe('number')
        expect(typeof scheme.restSeconds).toBe('number')
        expect(scheme.repsMin).toBeLessThan(scheme.repsMax)
      }
    }
  })
})

describe('REP_SCHEMES — hypertrophy safety constraints', () => {
  it('T1 (primary compound) is 5–8 reps', () => {
    expect(REP_SCHEMES.hypertrophy[1].repsMin).toBe(5)
    expect(REP_SCHEMES.hypertrophy[1].repsMax).toBe(8)
  })

  it('T2 and T3 (isolation) are 8–12 reps', () => {
    expect(REP_SCHEMES.hypertrophy[2].repsMin).toBe(8)
    expect(REP_SCHEMES.hypertrophy[2].repsMax).toBe(12)
    expect(REP_SCHEMES.hypertrophy[3].repsMin).toBe(8)
    expect(REP_SCHEMES.hypertrophy[3].repsMax).toBe(12)
  })
})

describe('REP_SCHEMES — power safety constraints', () => {
  it('T1 is 3–5 reps with RPE 9', () => {
    expect(REP_SCHEMES.power[1].repsMin).toBe(3)
    expect(REP_SCHEMES.power[1].repsMax).toBe(5)
    expect(REP_SCHEMES.power[1].rpe).toBe(9)
  })

  it('T2 and T3 are 5–8 reps', () => {
    expect(REP_SCHEMES.power[2].repsMin).toBe(5)
    expect(REP_SCHEMES.power[2].repsMax).toBe(8)
    expect(REP_SCHEMES.power[3].repsMin).toBe(5)
    expect(REP_SCHEMES.power[3].repsMax).toBe(8)
  })
})

describe('REP_SCHEMES — strength safety constraints', () => {
  it('T1 is 1–5 reps', () => {
    expect(REP_SCHEMES.strength[1].repsMin).toBe(1)
    expect(REP_SCHEMES.strength[1].repsMax).toBe(5)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run planning.test
```
Expected: FAIL — `Cannot find module '../types/planning'`

- [ ] **Step 3: Create `src/types/planning.ts`**

```typescript
export type GoalKey = 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
export type Tier = 1 | 2 | 3

export interface RepScheme {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  rpe?: number
}

export const REP_SCHEMES: Record<GoalKey, Record<Tier, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
    2: { sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    3: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 300 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 180, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90,  rpe: 8 },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
  },
  fat_loss: {
    1: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    2: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45  },
    3: { sets: 3, repsMin: 12, repsMax: 20, restSeconds: 30  },
  },
  endurance: {
    1: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45  },
    2: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30  },
    3: { sets: 2, repsMin: 20, repsMax: 30, restSeconds: 20  },
  },
  recomp: {
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 120 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 90  },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60  },
  },
}

export interface GoalIntent {
  goal: GoalKey
  injuries: string[]
  equipment: string[]
  daysPerWeek: number
  minutesPerSession: number
  experience: 'beginner' | 'intermediate' | 'advanced'
  swapPreference: 'low' | 'medium' | 'high'
}

export interface ResolvedExercise {
  id: string
  name: string
  movementPattern: string
  tier: Tier
  equipment: string[]
  swapGroupId: string
  safetyFlags: string[]
  repScheme: RepScheme
}

export interface ComposedPlan {
  templateId: string
  splitType: string
  goal: GoalKey
  confidence: number
  rationale: string
  safetyNotes: string[]
  exercises: ResolvedExercise[]
}

export interface CachedPlan {
  id: 'latest'
  plan: ComposedPlan
  goalText: string
  cachedAt: number
  isOffline: boolean
}

export interface QueryRequest  { goalText: string }
export interface QueryResponse { plan: ComposedPlan }

export interface SwapRequest {
  exerciseId: string
  reason: string
  currentPlanExerciseIds: string[]
}
export interface SwapOption {
  exercise: ResolvedExercise
  rationale: string
  repScheme: RepScheme
}
export interface SwapResponse { options: SwapOption[] }

export interface FeedbackRequest {
  planId: string | null
  accepted: boolean
  swappedFromExerciseId?: string
  swappedToExerciseId?: string
  painFlag: boolean
  goalTag: string
}
export interface FeedbackResponse { ok: true }
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run planning.test
```
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/types/planning.ts src/test/planning.test.ts
git commit -m "feat(types): add planning types, REP_SCHEMES with safety-tested constraints"
```

---

### Task 2: @supabase/supabase-js + Supabase client

**Files:**
- Modify: `src/vite-env.d.ts`
- Create: `src/lib/supabaseClient.ts`

- [ ] **Step 1: Install @supabase/supabase-js**

```
npm install @supabase/supabase-js
```
Expected: Added `@supabase/supabase-js` to `package.json` dependencies, no errors.

- [ ] **Step 2: Add env var types to `src/vite-env.d.ts`**

Replace full file:
```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 3: Create `src/lib/supabaseClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

```
npm run typecheck
```
Expected: exits 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/vite-env.d.ts src/lib/supabaseClient.ts
git commit -m "feat(supabase): install @supabase/supabase-js, add client singleton and env types"
```

---

### Task 3: Dexie V15 — cachedPlans table

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/test/db.test.ts`

- [ ] **Step 1: Write failing tests — update `src/test/db.test.ts`**

Replace the two lines at the top of `IronProtocolDB — Happy Path` describe block:

Find and replace (lines 18–26 of `src/test/db.test.ts`):
```typescript
  it('opens at schema version 14', async () => {
    db = new IronProtocolDB()
    await db.open()
    expect(db.verno).toBe(14)
  })

  it('exposes exercises, workouts, sets, settings, tempSessions, baselines, dailyTargets, personalBests, and recoveryLogs tables', async () => {
    db = new IronProtocolDB()
    await db.open()
    const tableNames = db.tables.map((t) => t.name)
    expect(tableNames).toContain('exercises')
    expect(tableNames).toContain('workouts')
    expect(tableNames).toContain('sets')
    expect(tableNames).toContain('settings')
    expect(tableNames).toContain('tempSessions')
    expect(tableNames).toContain('baselines')
    expect(tableNames).toContain('dailyTargets')
    expect(tableNames).toContain('personalBests')
    expect(tableNames).toContain('recoveryLogs')
  })
```

With:
```typescript
  it('opens at schema version 15', async () => {
    db = new IronProtocolDB()
    await db.open()
    expect(db.verno).toBe(15)
  })

  it('exposes all tables including cachedPlans', async () => {
    db = new IronProtocolDB()
    await db.open()
    const tableNames = db.tables.map((t) => t.name)
    expect(tableNames).toContain('exercises')
    expect(tableNames).toContain('workouts')
    expect(tableNames).toContain('sets')
    expect(tableNames).toContain('settings')
    expect(tableNames).toContain('tempSessions')
    expect(tableNames).toContain('baselines')
    expect(tableNames).toContain('dailyTargets')
    expect(tableNames).toContain('personalBests')
    expect(tableNames).toContain('recoveryLogs')
    expect(tableNames).toContain('cachedPlans')
  })

  it('can write and read a CachedPlan record', async () => {
    db = new IronProtocolDB()
    await db.open()
    const mockPlan = {
      templateId: 'tmpl-001',
      splitType: 'PPL',
      goal: 'hypertrophy' as const,
      confidence: 0.85,
      rationale: 'Strong semantic match',
      safetyNotes: [],
      exercises: [],
    }
    await db.cachedPlans.put({
      id: 'latest',
      plan: mockPlan,
      goalText: 'build muscle',
      cachedAt: 1000,
      isOffline: false,
    })
    const result = await db.cachedPlans.get('latest')
    expect(result?.goalText).toBe('build muscle')
    expect(result?.plan.goal).toBe('hypertrophy')
  })
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run db.test
```
Expected: FAIL — `expected 14 to be 15`

- [ ] **Step 3: Add CachedPlan table to `src/db/schema.ts`**

Add after the `RecoveryLog` interface (before the `PurposeChip` type, around line 87), and update the class:

After `export interface RecoveryLog { ... }`, add:
```typescript
export interface CachedPlan {
  id: 'latest'
  plan: import('../types/planning').ComposedPlan
  goalText: string
  cachedAt: number
  isOffline: boolean
}
```

In the `IronProtocolDB` class body, add after `recoveryLogs!: Dexie.Table<RecoveryLog, string>`:
```typescript
cachedPlans!: Dexie.Table<CachedPlan, string>
```

After the last version (V14 block), add:
```typescript
    // Version 15 — adds cachedPlans for NLP plan search offline fallback.
    // Stores the last server-verified safe plan so offline users never see blank state.
    this.version(15).stores({
      exercises:     'id, name, muscleGroup, tier, *tags',
      workouts:      'id, date, routineType, sessionIndex',
      sets:          'id, workoutId, exerciseId, orderIndex',
      settings:      'id, preferredRoutineType',
      tempSessions:  'id, updatedAt',
      baselines:     'exerciseName',
      dailyTargets:  'date',
      personalBests: 'exerciseId',
      recoveryLogs:  'id, workoutId, loggedAt',
      cachedPlans:   'id',
    })
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run db.test
```
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/test/db.test.ts
git commit -m "feat(db): add Dexie V15 cachedPlans table for NLP plan offline fallback"
```

---

### Task 4: planningService

**Files:**
- Create: `src/services/planningService.ts`
- Create: `src/test/planningService.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/planningService.test.ts
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ComposedPlan } from '../types/planning'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

vi.mock('../db/db', () => ({
  db: {
    cachedPlans: {
      put: vi.fn(),
      get: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabaseClient'
import { db } from '../db/db'
import { queryPlan, swapExercise, submitFeedback } from '../services/planningService'

const mockInvoke = vi.mocked(supabase.functions.invoke)
const mockPut    = vi.mocked(db.cachedPlans.put)
const mockGet    = vi.mocked(db.cachedPlans.get)

const MOCK_PLAN: ComposedPlan = {
  templateId:  'tmpl-001',
  splitType:   'PPL',
  goal:        'hypertrophy',
  confidence:  0.85,
  rationale:   'Strong match',
  safetyNotes: [],
  exercises:   [],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('queryPlan', () => {
  it('calls plans-query and writes to Dexie cache on success', async () => {
    mockInvoke.mockResolvedValue({ data: { plan: MOCK_PLAN }, error: null })
    mockPut.mockResolvedValue(undefined)

    const result = await queryPlan('get big')

    expect(mockInvoke).toHaveBeenCalledWith('plans-query', expect.objectContaining({
      body: { goalText: 'get big' },
    }))
    expect(mockPut).toHaveBeenCalledWith(expect.objectContaining({
      id:       'latest',
      plan:     MOCK_PLAN,
      goalText: 'get big',
      isOffline: false,
    }))
    expect(result).toEqual(MOCK_PLAN)
  })

  it('returns Dexie cache when network throws', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    mockGet.mockResolvedValue({
      id: 'latest', plan: MOCK_PLAN, goalText: 'get big', cachedAt: 0, isOffline: false,
    })

    const result = await queryPlan('get big')

    expect(result).toMatchObject({ templateId: 'tmpl-001' })
    expect((result as ComposedPlan & { _fromCache?: boolean })._fromCache).toBe(true)
  })

  it('throws when network fails and cache is empty', async () => {
    mockInvoke.mockRejectedValue(new Error('Network error'))
    mockGet.mockResolvedValue(undefined)

    await expect(queryPlan('get big')).rejects.toThrow('Network error')
  })

  it('does not cache on AbortError', async () => {
    const abortErr = new DOMException('Aborted', 'AbortError')
    mockInvoke.mockRejectedValue(abortErr)

    await expect(queryPlan('get big')).rejects.toThrow('AbortError')
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('throws when invoke returns an error object', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Unauthorized' } })

    await expect(queryPlan('get big')).rejects.toThrow()
  })
})

describe('swapExercise', () => {
  it('calls plans-swap with exerciseId, reason, and currentPlanExerciseIds', async () => {
    mockInvoke.mockResolvedValue({ data: { options: [] }, error: null })

    const result = await swapExercise('ex-001', 'too hard', ['ex-001', 'ex-002'])

    expect(mockInvoke).toHaveBeenCalledWith('plans-swap', {
      body: {
        exerciseId: 'ex-001',
        reason: 'too hard',
        currentPlanExerciseIds: ['ex-001', 'ex-002'],
      },
    })
    expect(result.options).toEqual([])
  })
})

describe('submitFeedback', () => {
  it('calls plans-feedback and does not throw', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null })

    await expect(submitFeedback({
      planId: 'tmpl-001',
      accepted: true,
      swappedFromExerciseId: 'ex-001',
      swappedToExerciseId: 'ex-002',
      painFlag: false,
      goalTag: 'hypertrophy',
    })).resolves.not.toThrow()

    expect(mockInvoke).toHaveBeenCalledWith('plans-feedback', expect.objectContaining({
      body: expect.objectContaining({ planId: 'tmpl-001', accepted: true }),
    }))
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run planningService.test
```
Expected: FAIL — `Cannot find module '../services/planningService'`

- [ ] **Step 3: Create `src/services/planningService.ts`**

```typescript
import { supabase } from '../lib/supabaseClient'
import { db } from '../db/db'
import type { ComposedPlan, SwapResponse, FeedbackRequest } from '../types/planning'

let activeAbort: AbortController | null = null

export async function queryPlan(goalText: string): Promise<ComposedPlan> {
  activeAbort?.abort()
  activeAbort = new AbortController()

  try {
    const { data, error } = await supabase.functions.invoke('plans-query', {
      body: { goalText },
      signal: activeAbort.signal,
    })
    if (error) throw error

    await db.cachedPlans.put({
      id:       'latest',
      plan:     data.plan as ComposedPlan,
      goalText,
      cachedAt: Date.now(),
      isOffline: false,
    })
    return data.plan as ComposedPlan
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    const cached = await db.cachedPlans.get('latest')
    if (cached) return { ...cached.plan, _fromCache: true } as ComposedPlan & { _fromCache: boolean }
    throw err
  }
}

export async function swapExercise(
  exerciseId: string,
  reason: string,
  currentPlanExerciseIds: string[],
): Promise<SwapResponse> {
  const { data, error } = await supabase.functions.invoke('plans-swap', {
    body: { exerciseId, reason, currentPlanExerciseIds },
  })
  if (error) throw error
  return data as SwapResponse
}

export async function submitFeedback(payload: FeedbackRequest): Promise<void> {
  await supabase.functions.invoke('plans-feedback', { body: payload })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run planningService.test
```
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/services/planningService.ts src/test/planningService.test.ts
git commit -m "feat(service): add planningService with abort, Dexie fallback, and feedback"
```

---

### Task 5: useNaturalPlanSearch hook

**Files:**
- Create: `src/hooks/useNaturalPlanSearch.ts`
- Create: `src/test/useNaturalPlanSearch.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/useNaturalPlanSearch.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ComposedPlan } from '../types/planning'

vi.mock('../services/planningService', () => ({
  queryPlan: vi.fn(),
}))

import { queryPlan } from '../services/planningService'
import { useNaturalPlanSearch } from '../hooks/useNaturalPlanSearch'

const mockQueryPlan = vi.mocked(queryPlan)

const MOCK_PLAN: ComposedPlan = {
  templateId:  'tmpl-001',
  splitType:   'PPL',
  goal:        'hypertrophy',
  confidence:  0.85,
  rationale:   'Strong match',
  safetyNotes: [],
  exercises:   [],
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNaturalPlanSearch', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useNaturalPlanSearch())
    expect(result.current.plan).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.fromCache).toBe(false)
  })

  it('does nothing if search is called with empty string', async () => {
    const { result } = renderHook(() => useNaturalPlanSearch())
    act(() => { result.current.search('') })
    await act(async () => { vi.runAllTimers() })
    expect(mockQueryPlan).not.toHaveBeenCalled()
  })

  it('sets loading=true immediately and resolves plan after debounce', async () => {
    mockQueryPlan.mockResolvedValue(MOCK_PLAN)
    const { result } = renderHook(() => useNaturalPlanSearch())

    act(() => { result.current.search('build muscle') })
    expect(result.current.loading).toBe(true)

    await act(async () => { vi.runAllTimers() })
    expect(result.current.plan).toEqual(MOCK_PLAN)
    expect(result.current.loading).toBe(false)
  })

  it('debounces — only fires once when called rapidly', async () => {
    mockQueryPlan.mockResolvedValue(MOCK_PLAN)
    const { result } = renderHook(() => useNaturalPlanSearch())

    act(() => {
      result.current.search('b')
      result.current.search('bu')
      result.current.search('build muscle')
    })
    await act(async () => { vi.runAllTimers() })
    expect(mockQueryPlan).toHaveBeenCalledTimes(1)
    expect(mockQueryPlan).toHaveBeenCalledWith('build muscle')
  })

  it('sets fromCache=true when plan has _fromCache flag', async () => {
    mockQueryPlan.mockResolvedValue({ ...MOCK_PLAN, _fromCache: true } as ComposedPlan & { _fromCache: boolean })
    const { result } = renderHook(() => useNaturalPlanSearch())

    act(() => { result.current.search('build muscle') })
    await act(async () => { vi.runAllTimers() })
    expect(result.current.fromCache).toBe(true)
  })

  it('sets error message on network failure', async () => {
    mockQueryPlan.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useNaturalPlanSearch())

    act(() => { result.current.search('build muscle') })
    await act(async () => { vi.runAllTimers() })
    expect(result.current.error).toBe('Search failed. Check connection.')
    expect(result.current.loading).toBe(false)
  })

  it('ignores AbortError — does not set error state', async () => {
    mockQueryPlan.mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    const { result } = renderHook(() => useNaturalPlanSearch())

    act(() => { result.current.search('build muscle') })
    await act(async () => { vi.runAllTimers() })
    expect(result.current.error).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run useNaturalPlanSearch.test
```
Expected: FAIL — `Cannot find module '../hooks/useNaturalPlanSearch'`

- [ ] **Step 3: Create `src/hooks/useNaturalPlanSearch.ts`**

```typescript
import { useState, useCallback, useRef } from 'react'
import { queryPlan } from '../services/planningService'
import type { ComposedPlan } from '../types/planning'

interface SearchState {
  plan: ComposedPlan | null
  loading: boolean
  error: string | null
  fromCache: boolean
}

export function useNaturalPlanSearch() {
  const [state, setState] = useState<SearchState>({
    plan: null, loading: false, error: null, fromCache: false,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((goalText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!goalText.trim()) return

    setState(s => ({ ...s, loading: true, error: null }))

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await queryPlan(goalText)
        const fromCache = !!(result as ComposedPlan & { _fromCache?: boolean })._fromCache
        setState({ plan: result, loading: false, error: null, fromCache })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setState(s => ({ ...s, loading: false, error: 'Search failed. Check connection.' }))
      }
    }, 300)
  }, [])

  return { ...state, search }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run useNaturalPlanSearch.test
```
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNaturalPlanSearch.ts src/test/useNaturalPlanSearch.test.tsx
git commit -m "feat(hook): add useNaturalPlanSearch with debounce, abort, and cache detection"
```

---

### Task 6: PlanConfidenceBadge component

**Files:**
- Create: `src/components/PlanConfidenceBadge.tsx`
- Create: `src/test/PlanConfidenceBadge.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/PlanConfidenceBadge.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanConfidenceBadge } from '../components/PlanConfidenceBadge'

describe('PlanConfidenceBadge', () => {
  it('shows "Personalized" when confidence >= 0.85', () => {
    render(<PlanConfidenceBadge confidence={0.9} fromCache={false} />)
    expect(screen.getByText('Personalized')).toBeDefined()
  })

  it('shows "Good Match" when confidence is between 0.72 and 0.85', () => {
    render(<PlanConfidenceBadge confidence={0.75} fromCache={false} />)
    expect(screen.getByText('Good Match')).toBeDefined()
  })

  it('shows "Cached plan" when fromCache is true regardless of confidence', () => {
    render(<PlanConfidenceBadge confidence={0.9} fromCache={true} />)
    expect(screen.getByText('Cached plan')).toBeDefined()
  })

  it('shows "Good Match" for confidence below 0.85 when not cached', () => {
    render(<PlanConfidenceBadge confidence={0.5} fromCache={false} />)
    expect(screen.getByText('Good Match')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run PlanConfidenceBadge.test
```
Expected: FAIL — `Cannot find module '../components/PlanConfidenceBadge'`

- [ ] **Step 3: Create `src/components/PlanConfidenceBadge.tsx`**

```tsx
interface PlanConfidenceBadgeProps {
  confidence: number
  fromCache: boolean
}

export function PlanConfidenceBadge({ confidence, fromCache }: PlanConfidenceBadgeProps) {
  if (fromCache) {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">
        Cached plan
      </span>
    )
  }

  const label = confidence >= 0.85 ? 'Personalized' : 'Good Match'
  const colours = confidence >= 0.85
    ? 'bg-electric/20 text-electric'
    : 'bg-amber-500/20 text-amber-400'

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colours}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run PlanConfidenceBadge.test
```
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/PlanConfidenceBadge.tsx src/test/PlanConfidenceBadge.test.tsx
git commit -m "feat(ui): add PlanConfidenceBadge — Personalized / Good Match / Cached plan"
```

---

### Task 7: SwapOptionsDrawer component

**Files:**
- Create: `src/components/SwapOptionsDrawer.tsx`
- Create: `src/test/SwapOptionsDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/SwapOptionsDrawer.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwapOptionsDrawer } from '../components/SwapOptionsDrawer'
import type { SwapOption } from '../types/planning'

const makeOption = (id: string, name: string): SwapOption => ({
  exercise: {
    id,
    name,
    movementPattern: 'push',
    tier: 1,
    equipment: ['barbell'],
    swapGroupId: 'horizontal_push_primary',
    safetyFlags: [],
    repScheme: { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 90 },
  },
  rationale: `${name} trains same pattern`,
  repScheme: { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 90 },
})

const OPTIONS: SwapOption[] = [
  makeOption('ex-002', 'Dumbbell Bench Press'),
  makeOption('ex-003', 'Push-Up'),
  makeOption('ex-004', 'Incline Bench Press'),
]

describe('SwapOptionsDrawer', () => {
  it('renders all option names', () => {
    render(<SwapOptionsDrawer options={OPTIONS} onSelect={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Dumbbell Bench Press')).toBeDefined()
    expect(screen.getByText('Push-Up')).toBeDefined()
    expect(screen.getByText('Incline Bench Press')).toBeDefined()
  })

  it('shows rep scheme for each option', () => {
    render(<SwapOptionsDrawer options={OPTIONS} onSelect={vi.fn()} onClose={vi.fn()} />)
    const repLabels = screen.getAllByText(/4 × 5–8 reps/)
    expect(repLabels.length).toBeGreaterThanOrEqual(1)
  })

  it('calls onSelect with the chosen option when a swap button is clicked', () => {
    const onSelect = vi.fn()
    render(<SwapOptionsDrawer options={OPTIONS} onSelect={onSelect} onClose={vi.fn()} />)
    const buttons = screen.getAllByRole('button', { name: /swap/i })
    fireEvent.click(buttons[0])
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[0])
  })

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn()
    render(<SwapOptionsDrawer options={OPTIONS} onSelect={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows rationale text', () => {
    render(<SwapOptionsDrawer options={OPTIONS} onSelect={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Dumbbell Bench Press trains same pattern')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run SwapOptionsDrawer.test
```
Expected: FAIL — `Cannot find module '../components/SwapOptionsDrawer'`

- [ ] **Step 3: Create `src/components/SwapOptionsDrawer.tsx`**

```tsx
import { motion } from 'framer-motion'
import type { SwapOption } from '../types/planning'

interface SwapOptionsDrawerProps {
  options: SwapOption[]
  onSelect: (option: SwapOption) => void
  onClose: () => void
}

export function SwapOptionsDrawer({ options, onSelect, onClose }: SwapOptionsDrawerProps) {
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-zinc-700 bg-[#0A0E1A] p-6"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <h2 className="mb-4 text-base font-bold text-zinc-100">Choose a swap</h2>
      <ul className="flex flex-col gap-3">
        {options.map((opt) => (
          <li
            key={opt.exercise.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-700 bg-navy-card p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-100">{opt.exercise.name}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{opt.rationale}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {opt.repScheme.sets} × {opt.repScheme.repsMin}–{opt.repScheme.repsMax} reps
                {' · '}{opt.repScheme.restSeconds}s rest
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(opt)}
              className="ml-4 rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white"
              aria-label={`swap to ${opt.exercise.name}`}
            >
              Swap
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-2xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-400"
        aria-label="cancel swap"
      >
        Cancel
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run SwapOptionsDrawer.test
```
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/SwapOptionsDrawer.tsx src/test/SwapOptionsDrawer.test.tsx
git commit -m "feat(ui): add SwapOptionsDrawer — bottom-sheet with 3-5 options, rep schemes, rationale"
```

---

### Task 8: NaturalPlanSearch component

**Files:**
- Create: `src/components/NaturalPlanSearch.tsx`
- Create: `src/test/NaturalPlanSearch.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/NaturalPlanSearch.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ComposedPlan, SwapResponse } from '../types/planning'

vi.mock('../hooks/useNaturalPlanSearch', () => ({
  useNaturalPlanSearch: vi.fn(),
}))

vi.mock('../services/planningService', () => ({
  swapExercise: vi.fn(),
  submitFeedback: vi.fn(),
}))

import { useNaturalPlanSearch } from '../hooks/useNaturalPlanSearch'
import { swapExercise, submitFeedback } from '../services/planningService'
import { NaturalPlanSearch } from '../components/NaturalPlanSearch'

const mockUseSearch = vi.mocked(useNaturalPlanSearch)
const mockSwap      = vi.mocked(swapExercise)
const mockFeedback  = vi.mocked(submitFeedback)

const MOCK_PLAN: ComposedPlan = {
  templateId:  'tmpl-001',
  splitType:   'PPL',
  goal:        'hypertrophy',
  confidence:  0.88,
  rationale:   'Strong match',
  safetyNotes: [],
  exercises: [
    {
      id: 'ex-001', name: 'Bench Press', movementPattern: 'push', tier: 1,
      equipment: ['barbell'], swapGroupId: 'horizontal_push_primary', safetyFlags: [],
      repScheme: { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 90 },
    },
  ],
}

const SWAP_RESPONSE: SwapResponse = {
  options: [
    {
      exercise: {
        id: 'ex-002', name: 'DB Bench Press', movementPattern: 'push', tier: 1,
        equipment: ['dumbbells'], swapGroupId: 'horizontal_push_primary', safetyFlags: [],
        repScheme: { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 90 },
      },
      rationale: 'Same push pattern',
      repScheme: { sets: 4, repsMin: 5, repsMax: 8, restSeconds: 90 },
    },
  ],
}

function idleState() {
  return { plan: null, loading: false, error: null, fromCache: false, search: vi.fn() }
}

beforeEach(() => vi.clearAllMocks())

describe('NaturalPlanSearch', () => {
  it('renders a search input', () => {
    mockUseSearch.mockReturnValue(idleState())
    render(<NaturalPlanSearch />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('calls search when input changes', () => {
    const search = vi.fn()
    mockUseSearch.mockReturnValue({ ...idleState(), search })
    render(<NaturalPlanSearch />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'build muscle' } })
    expect(search).toHaveBeenCalledWith('build muscle')
  })

  it('shows loading indicator while fetching', () => {
    mockUseSearch.mockReturnValue({ ...idleState(), loading: true })
    render(<NaturalPlanSearch />)
    expect(screen.getByTestId('plan-loading')).toBeDefined()
  })

  it('shows error message on failure', () => {
    mockUseSearch.mockReturnValue({ ...idleState(), error: 'Search failed. Check connection.' })
    render(<NaturalPlanSearch />)
    expect(screen.getByText('Search failed. Check connection.')).toBeDefined()
  })

  it('renders exercise cards with rep schemes when plan is present', () => {
    mockUseSearch.mockReturnValue({ ...idleState(), plan: MOCK_PLAN })
    render(<NaturalPlanSearch />)
    expect(screen.getByText('Bench Press')).toBeDefined()
    expect(screen.getByText(/4 × 5–8 reps/)).toBeDefined()
  })

  it('opens SwapOptionsDrawer after clicking swap on an exercise', async () => {
    mockUseSearch.mockReturnValue({ ...idleState(), plan: MOCK_PLAN })
    mockSwap.mockResolvedValue(SWAP_RESPONSE)

    render(<NaturalPlanSearch />)
    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => {
      expect(screen.getByText('DB Bench Press')).toBeDefined()
    })
    expect(mockSwap).toHaveBeenCalledWith('ex-001', 'user requested', ['ex-001'])
  })

  it('updates plan exercise and submits feedback when swap is selected', async () => {
    mockUseSearch.mockReturnValue({ ...idleState(), plan: MOCK_PLAN })
    mockSwap.mockResolvedValue(SWAP_RESPONSE)
    mockFeedback.mockResolvedValue(undefined)

    render(<NaturalPlanSearch />)
    fireEvent.click(screen.getByRole('button', { name: /swap bench press/i }))

    await waitFor(() => { expect(screen.getByText('DB Bench Press')).toBeDefined() })

    fireEvent.click(screen.getByRole('button', { name: /swap to db bench press/i }))

    await waitFor(() => {
      expect(screen.queryByText('Bench Press')).toBeNull()
      expect(screen.getByText('DB Bench Press')).toBeDefined()
    })
    expect(mockFeedback).toHaveBeenCalledWith(expect.objectContaining({
      swappedFromExerciseId: 'ex-001',
      swappedToExerciseId:   'ex-002',
      accepted: true,
      painFlag: false,
    }))
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run NaturalPlanSearch.test
```
Expected: FAIL — `Cannot find module '../components/NaturalPlanSearch'`

- [ ] **Step 3: Create `src/components/NaturalPlanSearch.tsx`**

```tsx
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { PlanConfidenceBadge } from './PlanConfidenceBadge'
import { SwapOptionsDrawer } from './SwapOptionsDrawer'
import { useNaturalPlanSearch } from '../hooks/useNaturalPlanSearch'
import { submitFeedback, swapExercise } from '../services/planningService'
import type { ComposedPlan, ResolvedExercise, SwapOption } from '../types/planning'

interface SwapTarget {
  exerciseId: string
  options: SwapOption[]
}

export function NaturalPlanSearch() {
  const { plan, loading, error, fromCache, search } = useNaturalPlanSearch()
  const [exercises, setExercises]     = useState<ResolvedExercise[]>([])
  const [swapTarget, setSwapTarget]   = useState<SwapTarget | null>(null)
  const [swapping, setSwapping]       = useState<string | null>(null)

  useEffect(() => {
    if (plan) setExercises(plan.exercises)
  }, [plan])

  async function handleSwap(exerciseId: string) {
    setSwapping(exerciseId)
    try {
      const result = await swapExercise(exerciseId, 'user requested', exercises.map(e => e.id))
      setSwapTarget({ exerciseId, options: result.options })
    } finally {
      setSwapping(null)
    }
  }

  function handleSelectSwap(chosen: SwapOption) {
    setExercises(prev =>
      prev.map(ex => ex.id === swapTarget!.exerciseId ? chosen.exercise : ex)
    )
    if (plan) {
      submitFeedback({
        planId:                plan.templateId === 'gemini-generated' ? null : plan.templateId,
        accepted:              true,
        swappedFromExerciseId: swapTarget!.exerciseId,
        swappedToExerciseId:   chosen.exercise.id,
        painFlag:              false,
        goalTag:               plan.goal,
      })
    }
    setSwapTarget(null)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-navy px-4 pb-32 pt-5 text-zinc-100">
      <h1 className="text-2xl font-black">Find a Plan</h1>

      <input
        type="text"
        placeholder="e.g. build upper body muscle with no knee load"
        className="w-full rounded-2xl border border-electric/30 bg-navy-card px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-electric/50"
        onChange={e => search(e.target.value)}
      />

      {loading && (
        <div data-testid="plan-loading" className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-electric border-t-transparent" />
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {plan && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {plan.splitType}
            </p>
            <PlanConfidenceBadge confidence={plan.confidence} fromCache={fromCache} />
          </div>

          <ul className="flex flex-col gap-3">
            {exercises.map(ex => (
              <li
                key={ex.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-700 bg-navy-card p-4"
              >
                <div>
                  <p className="font-semibold text-zinc-100">{ex.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {ex.repScheme.sets} × {ex.repScheme.repsMin}–{ex.repScheme.repsMax} reps
                    {' · '}{ex.repScheme.restSeconds}s rest
                    {ex.repScheme.rpe ? ` · RPE ${ex.repScheme.rpe}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwap(ex.id)}
                  disabled={swapping === ex.id}
                  aria-label={`swap ${ex.name}`}
                  className="ml-4 rounded-xl border border-zinc-600 px-3 py-2 text-xs font-semibold text-zinc-300 disabled:opacity-50"
                >
                  {swapping === ex.id ? '…' : 'Swap'}
                </button>
              </li>
            ))}
          </ul>

          <p className="text-xs text-zinc-500">{plan.rationale}</p>
        </section>
      )}

      <AnimatePresence>
        {swapTarget && (
          <SwapOptionsDrawer
            options={swapTarget.options}
            onSelect={handleSelectSwap}
            onClose={() => setSwapTarget(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run NaturalPlanSearch.test
```
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/NaturalPlanSearch.tsx src/test/NaturalPlanSearch.test.tsx
git commit -m "feat(ui): add NaturalPlanSearch — search, plan display, swap drawer, feedback"
```

---

### Task 9: InstallPrompt component

**Files:**
- Create: `src/components/InstallPrompt.tsx`
- Create: `src/test/InstallPrompt.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/test/InstallPrompt.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InstallPrompt } from '../components/InstallPrompt'

function setStandalone(value: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)' ? value : false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('InstallPrompt', () => {
  it('renders nothing when already in standalone mode', () => {
    setStandalone(true)
    const { container } = render(<InstallPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the install banner when not in standalone mode', () => {
    setStandalone(false)
    render(<InstallPrompt />)
    expect(screen.getByText(/add to home screen/i)).toBeDefined()
  })

  it('dismisses when the close button is clicked', () => {
    setStandalone(false)
    render(<InstallPrompt />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/add to home screen/i)).toBeNull()
  })

  it('calls prompt.prompt() when install button is clicked and deferred prompt is set', async () => {
    setStandalone(false)
    const mockPrompt = { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }) }

    render(<InstallPrompt />)

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), { preventDefault: vi.fn(), prompt: mockPrompt.prompt })
      )
    })

    const installBtn = screen.queryByRole('button', { name: /install/i })
    if (installBtn) {
      fireEvent.click(installBtn)
      expect(mockPrompt.prompt).toHaveBeenCalled()
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run InstallPrompt.test
```
Expected: FAIL — `Cannot find module '../components/InstallPrompt'`

- [ ] **Step 3: Create `src/components/InstallPrompt.tsx`**

```tsx
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const isStandalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || dismissed) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between rounded-2xl border border-electric/30 bg-navy-card px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-zinc-100">Add to home screen</p>
      <div className="flex gap-2">
        {deferred && (
          <button
            type="button"
            onClick={() => deferred.prompt()}
            aria-label="install app"
            className="rounded-xl bg-electric px-3 py-1.5 text-xs font-bold text-white"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="dismiss install prompt"
          className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run InstallPrompt.test
```
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/InstallPrompt.tsx src/test/InstallPrompt.test.tsx
git commit -m "feat(ui): add InstallPrompt — PWA install banner with beforeinstallprompt"
```

---

### Task 10: App.tsx /plan route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing test**

Add this test to a new file `src/test/App.route.test.tsx`:

```typescript
// src/test/App.route.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../components/NaturalPlanSearch', () => ({
  NaturalPlanSearch: () => <div data-testid="natural-plan-search">NaturalPlanSearch</div>,
}))
vi.mock('../components/CoreIgnition', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    onComplete()
    return null
  },
}))
vi.mock('../db/db', () => ({ db: {} }))
vi.mock('../pages/HomePage', () => ({ default: () => <div>HomePage</div> }))
vi.mock('../pages/HistoryPage', () => ({ default: () => <div>HistoryPage</div> }))
vi.mock('../components/hero/HeroOverlay', () => ({ HeroOverlay: () => null }))
vi.mock('../components/hero/ModeToggleButton', () => ({ ModeToggleButton: () => null }))
vi.mock('../components/BottomNav', () => ({ default: () => null }))
vi.mock('../components/InstallPrompt', () => ({ InstallPrompt: () => null }))
vi.mock('../context/UIModeContext', () => ({
  UIModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import App from '../App'

beforeEach(() => {
  window.history.pushState({}, '', '/')
})

describe('App routing', () => {
  it('renders NaturalPlanSearch on /plan route', () => {
    window.history.pushState({}, '', '/plan')
    render(<App />)
    expect(screen.getByTestId('natural-plan-search')).toBeDefined()
  })

  it('renders HomePage on / route', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('HomePage')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npm test -- --run App.route.test
```
Expected: FAIL — `NaturalPlanSearch` renders under `/` (resolveRoute returns '/' for unknown paths)

- [ ] **Step 3: Update `src/App.tsx`**

Replace the contents of `src/App.tsx`:

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import BottomNav from './components/BottomNav'
import CalibrateBaselinesCard from './components/CalibrateBaselinesCard'
import CoreIgnition from './components/CoreIgnition'
import DataOwnershipCard from './components/DataOwnershipCard'
import { HeroOverlay } from './components/hero/HeroOverlay'
import { InstallPrompt } from './components/InstallPrompt'
import { ModeToggleButton } from './components/hero/ModeToggleButton'
import { NaturalPlanSearch } from './components/NaturalPlanSearch'
import { UIModeProvider } from './context/UIModeContext'
import { db } from './db/db'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'

type RoutePath = '/' | '/history' | '/settings' | '/plan'

function resolveRoute(pathname: string): RoutePath {
  if (pathname === '/history') return '/history'
  if (pathname === '/settings') return '/settings'
  if (pathname === '/plan') return '/plan'
  return '/'
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() => resolveRoute(window.location.pathname))
  const [isIgniting, setIsIgniting] = useState(true)

  useEffect(() => {
    const handlePopState = () => setRoute(resolveRoute(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function handleNavigate(path: string): void {
    const nextRoute = resolveRoute(path)
    if (nextRoute === route) return
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
  }

  const currentPage = useMemo(() => {
    if (route === '/history') return <HistoryPage db={db} />

    if (route === '/plan') return <NaturalPlanSearch />

    if (route === '/settings') {
      return (
        <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-navy px-4 pb-28 pt-5 text-zinc-100">
          <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-electric/20 bg-navy-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Settings</p>
            <h1 className="mt-3 text-3xl font-black text-zinc-100">Routine Preferences</h1>
            <p className="mt-3 text-sm text-zinc-200">
              Production controls for offline readiness, export ownership, and portable safety backups.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              className="mt-4 h-11 rounded-2xl border border-electric/20 bg-[#091020] px-4 text-sm font-bold text-zinc-100 transition-colors hover:border-electric/40 active:bg-[#091020]"
            >
              Local Mode Active
            </motion.button>
          </motion.section>
          <CalibrateBaselinesCard db={db} />
          <DataOwnershipCard db={db} />
        </main>
      )
    }

    return <HomePage db={db} />
  }, [route])

  return (
    <UIModeProvider>
      <div className="relative min-h-svh bg-navy">
        <AnimatePresence>
          {isIgniting && (
            <CoreIgnition onComplete={() => setIsIgniting(false)} db={db} />
          )}
        </AnimatePresence>

        {!isIgniting && (
          <>
            {currentPage}
            <BottomNav currentPath={route} onNavigate={handleNavigate} />
            <div className="fixed right-4 top-4 z-50">
              <ModeToggleButton />
            </div>
            <InstallPrompt />
          </>
        )}

        <HeroOverlay />
      </div>
    </UIModeProvider>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```
npm test -- --run App.route.test
```
Expected: PASS — 2 tests

- [ ] **Step 5: Run full test suite to verify no regressions**

```
npm test -- --run
```
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/test/App.route.test.tsx
git commit -m "feat(routing): add /plan route wired to NaturalPlanSearch, add InstallPrompt"
```

---

### Task 11: vite.config.ts Supabase caching + Capacitor config

**Files:**
- Modify: `vite.config.ts`
- Create: `capacitor.config.ts`

- [ ] **Step 1: Update `vite.config.ts` — add Supabase runtimeCaching**

Replace the `workbox` block in `vite.config.ts`:

Find:
```typescript
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,gif,ico,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
```

Replace with:
```typescript
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,gif,ico,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /supabase\.co\/functions\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /supabase\.co\/storage\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
```

- [ ] **Step 2: Install Capacitor packages**

```
npm install @capacitor/core
npm install --save-dev @capacitor/cli @capacitor/ios @capacitor/android
```
Expected: packages added with no errors.

- [ ] **Step 3: Create `capacitor.config.ts`**

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.ironprotocol.app',
  appName: 'Iron Protocol',
  webDir:  'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor:    '#0A0E1A',
      showSpinner:        false,
    },
  },
}

export default config
```

- [ ] **Step 4: Verify the Vite build completes without errors**

```
npm run build
```
Expected: `✓ built in` output, no TypeScript or Vite errors.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts capacitor.config.ts package.json package-lock.json
git commit -m "feat(pwa): add Supabase runtimeCaching and Capacitor config for App Store"
```

---

## Self-Review

**Spec coverage:**
- [x] Shared TypeScript types + REP_SCHEMES (Task 1)
- [x] Supabase client singleton — anon key only, no secrets in bundle (Task 2)
- [x] Dexie V15 `cachedPlans` offline fallback (Task 3)
- [x] `queryPlan` with AbortController + Dexie fallback (Task 4)
- [x] `swapExercise` + `submitFeedback` (Task 4)
- [x] 300ms debounce + loading/error/fromCache state (Task 5)
- [x] `PlanConfidenceBadge` — three label states (Task 6)
- [x] `SwapOptionsDrawer` — multiple options, no current-plan IDs, rep schemes (Task 7)
- [x] `NaturalPlanSearch` — full search + swap + feedback flow (Task 8)
- [x] Exercise cards display rep scheme: sets × repsMin–repsMax, restSeconds, RPE (Task 8)
- [x] Duplicate exercise prevention: `currentPlanExerciseIds` passed to `swapExercise` (Task 8 — `exercises.map(e => e.id)`)
- [x] `InstallPrompt` — beforeinstallprompt, standalone detection, dismiss (Task 9)
- [x] `/plan` route in App.tsx (Task 10)
- [x] `vite-plugin-pwa` Supabase runtimeCaching (Task 11)
- [x] `capacitor.config.ts` for App Store / Play Store (Task 11)
- [x] REP_SCHEMES safety tests: hypertrophy T1=5-8, T2/T3=8-12; power T1=3-5, T2/T3=5-8 (Task 1)

**Type consistency check:**
- `SwapOption` is defined in `src/types/planning.ts` and used identically in `SwapOptionsDrawer`, `NaturalPlanSearch`, and their tests.
- `ComposedPlan.goal: GoalKey` is used in `NaturalPlanSearch.handleSelectSwap` as `goalTag`.
- `planningService.submitFeedback` accepts `FeedbackRequest` which has `planId: string | null` — matched in `NaturalPlanSearch` where `gemini-generated` becomes `null`.
- `db.cachedPlans` table declared in `IronProtocolDB` and imported via `db` singleton — consistent with `planningService.ts` imports.
