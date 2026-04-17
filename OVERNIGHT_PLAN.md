# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining unchecked TODO.md items (Phases 1–5) with TDD, one commit per task, zero inline comments.

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. Search in `src/components/Search/`. Error boundary in `src/components/UI/`. Tests in `src/test/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict, @xenova/transformers. Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #14)

---

## 0. Live-state snapshot (pass #14, 2026-04-18 — file-verified)

| Item | State | Commit |
|---|---|---|
| P0 schema + Forge + track progress | **DONE** | `69473be` |
| PrestigeBadge in HomePage | **DONE** | `c7d3eb1` |
| useSensoryFeedback scaffold | **DONE** | `da34b7c` |
| heavyDouble/lightTap tests | **DONE** | `898111c` |
| ObsidianStairs 3-layer parallax | **DONE** | `49365f8` |
| Lightning Strike (useLightningOnPR) | **DONE** | `60a3dc4` |
| SummitModal | **DONE** | `ba67a46` |
| tonnage field on PendingBash | **DONE** | `4331069` |
| Phase 6.2 HitCombo counter | **DONE** | `a5df8aa` |
| Phase 6.3 DamageNumber floating | **DONE** | `f45a94c` |
| Phase 6.4 HeavyBash sensory sync at strike frame | **DONE** | `64bd56c` |
| Phase 4.1–4.5 raw exercise JSONs (5 files) | **DONE** | `59ee7c1` |
| Phase 4.6 mergeExercises utility | **DONE** | — |
| Phase 4.7 execute merge + delete raw dir | **MISSING** | — |
| Phase 4.8 chunked seedEmbeddings | **MISSING** | — |
| Phase 1.0 embeddingWorker progress callback | **MISSING** | — |
| Phase 3.1 NLPSearchBar scaffold | **MISSING** | — |
| Phase 3.2 useDebouncedValue hook | **MISSING** | — |
| Phase 3.3 exerciseSearchService + full NLPSearchBar | **MISSING** | — |
| Phase 3.5 ExerciseCard confidence badge | **MISSING** | — |
| Phase 5.1 prestige wiring + 2s particle flash | **MISSING** | — |
| Phase 5.2 ObsidianStairs→TheForge cross-fade | **MISSING** | — |
| Phase 5.3 Brain Initializing state | **MISSING — integrated into Phase 3.3** | — |
| Phase 8.1 HeroErrorBoundary | **MISSING** | — |
| Phase 8.2 Wrap overlay + RAF safety | **MISSING** | — |
| Phase 7.1 verify completedAscensions badge | **MISSING** | — |

### Critical verified facts (pass #14 — read from disk, 2026-04-18)

| Assumption | Reality |
|---|---|
| `TheForge.tsx` exists | **Confirmed** — `src/components/hero/TheForge.tsx` exists; just not rendered in HeroOverlay |
| `HeroOverlay` renders TheForge | **Does NOT** — line 59 renders only `<ObsidianStairs>` when `track.active === 'power'`; no else branch |
| `HeroOverlay` passes `onPrestige` to `MasterworkModal` | **Does NOT** — line 67: `<MasterworkModal />` no props; Phase 5.1 must add the prop |
| `HeroOverlay` passes `onAscend` to `SummitModal` | **Does NOT** — line 66: `<SummitModal />` no props; Phase 5.1 must add the prop |
| `MasterworkModal.handlePrestige` calls `forgeMasterwork()` | **Does NOT** — calls `onPrestige?.()` then `setDismissed(true)` only |
| `SummitModal` calls `ascend()` directly | **Confirmed** — `ba67a46` |
| `UIMode` is `'focus' \| 'hero'` | Confirmed — use `setUIMode('focus')` not `'professional'` |
| `db.embeddings` table exists | **No** — embeddings stored as `exercise.embedding: number[]` |
| `cosineSimilarity` exists | **Yes** — `src/utils/vectorMath.ts` |
| `getEmbedding` is named export | `import { getEmbedding } from './localAIService'` |
| `dispatchCombat` signature | `dispatchCombat(intensity: number, tonnage?: number)` |
| `src/components/Search/` exists | **No** — created in Phase 3.1 |
| `src/components/UI/` exists | **No** — created in Phase 8.1 |
| `src/data/raw/` exists | **Confirmed** — all 5 JSON files present |
| `exercises.json` format | **Wrapped** (not plain array); Phase 4.7 overwrites with plain 300-entry array |
| `embeddingWorker.ts` has progress_callback | **Does NOT** — bare `pipeline()` call, no callback; Phase 1.0 adds it |
| `seedEmbeddings.ts` is chunked | **Does NOT** — sequential loop, no batch size, no console.log; Phase 4.8 replaces it |
| `ExerciseTier` is `'T1'\|'T2'\|'T3'` | **No** — `1 \| 2 \| 3` (numeric) |
| `STRIKE_FRAME = 4` | **Confirmed** — frame index 4 is first with `flashAlpha > 0` |
| `DamageNumber.tsx` exists | **Confirmed** — `f45a94c` |
| `useDebouncedValue` hook exists | **No** — Phase 3.2 creates it |
| `exerciseSearchService.ts` exists | **No** — Phase 3.3 creates it |
| `localAIService.ts` exports `subscribeToModelLoading` | **No** — Phase 1.0 adds this export |
| `HeroOverlay` imports `AnimatePresence` | **Confirmed** — already imported (line 2) |

---

## 0.1 Automation Contract (ENFORCED — Stitch required for [STITCH UI] tasks)

For every task marked **[STITCH UI]**:

1. Call `mcp__stitch__generate_screen_from_text` **twice** (Prompt A and Prompt B listed per task).
2. Inspect both variants.
3. Before writing any code, update the **Stitch Selection** block in that task section with the chosen variant ID and one sentence of reasoning.
4. Code must match the chosen variant's layout and color decisions.
5. If Stitch MCP is unavailable, stop and fix connectivity. **Do not skip Stitch.**

| Phase | [STITCH UI] task | Stitch calls required |
|---|---|---|
| 3.1 | NLPSearchBar scaffold | 2 × `mcp__stitch__generate_screen_from_text` |
| 3.3 | exerciseSearchService + full NLPSearchBar | 2 × dropdown variant |
| 3.5 | ExerciseCard confidence badge | 2 × card variant |
| 5.1 | Prestige wiring + PrestigeFlash | 2 × flash overlay variant |
| 5.2 | ObsidianStairs → TheForge cross-fade | 2 × background cross-fade variant |

---

## 1. Dependency graph

```
4.1–4.5 (parallel) → 4.6 → 4.7 → 4.8
1.0                        (independent)
4.8 + 1.0 → 3.1 → 3.2 → 3.3 → 3.5
5.1                        (independent — fixes broken MasterworkModal)
5.2                        (independent — adds TheForge to HeroOverlay)
3.1 + 1.0 → 5.3            (Brain loading state, already inside Phase 3.3)
8.1 → 8.2                  (error boundary, last)
7.1                        (verify, after 5.1)
```

**Critical path:** 4.1–4.5 → 4.6 → 4.7 → 4.8 → 3.1 → 3.3 → 3.5

---

## 2. Per-item execution plan

---

### Phase 4.1–4.5: Generate five raw exercise JSON files

> **These five can run as parallel subagents.** Each writes one file to `src/data/raw/`.

**Schema (all five files, strict):**

```ts
{
  id: string            // kebab-case prefix (see table below) + sequential number
  name: string          // unique (case-insensitive)
  technical_cues: string[]   // 3–6 imperative strings
  biomechanical_why: string  // ≥ 3 sentences: primary movers, origin/insertion, leverage
}
```

| File | ID prefix | Focus |
|---|---|---|
| `src/data/raw/chest_back.json` | `cb-` | Chest + Back (30 chest, 30 back) |
| `src/data/raw/legs_core.json` | `lc-` | Quads, Hamstrings, Glutes, Calves, Core |
| `src/data/raw/shoulders_arms.json` | `sa-` | Deltoids, Biceps, Triceps, Forearms |
| `src/data/raw/functional_cables.json` | `fc-` | Unilateral, Cable, Functional mobility |
| `src/data/raw/power_strongman.json` | `ps-` | Olympic lifts, Strongman, Heavy compounds |

**Steps per file (repeat for each):**

- [ ] **Step 1: Generate 60 unique exercises following schema**

  Top-level structure must be a JSON array (not wrapped in an object). 60 entries per file. IDs use the file's prefix + sequential number (e.g., `cb-001`, `cb-002`…).

- [ ] **Step 2: Validate**

  ```bash
  node -e "const d=require('./src/data/raw/<file>.json'); console.log('count:', d.length, 'ok:', d.every(e=>e.id&&e.name&&Array.isArray(e.technical_cues)&&e.biomechanical_why))"
  ```

  Expected: `count: 60 ok: true`

- [ ] **Step 3: Commit**

  ```bash
  git add src/data/raw/<file>.json
  git commit -m "feat(data): seed 60 <category> exercises"
  ```

**Acceptance per file:** Exactly 60 entries. No duplicate `id`. No duplicate lowercased `name`. `biomechanical_why` ≥ 3 sentences. `technical_cues` has 3–6 entries. Valid JSON array.

---

### Phase 4.6: `mergeExercises.ts` utility

**Depends on:** 4.1–4.5 all committed.
**Files:**
- Create: `src/utils/mergeExercises.ts`
- Create: `src/test/mergeExercises.test.ts`

**Important:** `Exercise` type (`src/db/schema.ts`) fields: `id, name, muscleGroup, mediaType, mediaRef, tags, tier (1|2|3 numeric), embedding?`. Raw JSON has `technical_cues` and `biomechanical_why` — the merge script **drops** these.

- [ ] **Step 1: Write failing test**

  Create `src/test/mergeExercises.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest'
  import { mergeRawExercises } from '../utils/mergeExercises'

  describe('mergeRawExercises', () => {
    it('returns exactly 300 entries', async () => {
      const result = await mergeRawExercises()
      expect(result).toHaveLength(300)
    })

    it('has no duplicate ids', async () => {
      const result = await mergeRawExercises()
      expect(new Set(result.map(e => e.id)).size).toBe(300)
    })

    it('has no duplicate lowercased names', async () => {
      const result = await mergeRawExercises()
      expect(new Set(result.map(e => e.name.toLowerCase())).size).toBe(300)
    })

    it('all entries have numeric tier and no raw-only fields', async () => {
      const result = await mergeRawExercises()
      for (const e of result) {
        expect([1, 2, 3]).toContain(e.tier)
        expect('technical_cues' in e).toBe(false)
        expect('biomechanical_why' in e).toBe(false)
      }
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm run test -- mergeExercises
  ```

- [ ] **Step 3: Implement `mergeExercises.ts`**

  Create `src/utils/mergeExercises.ts`:

  ```ts
  import fs from 'fs'
  import path from 'path'
  import type { Exercise } from '../db/schema'

  const RAW_DIR  = path.resolve('src/data/raw')
  const OUT_FILE = path.resolve('src/data/exercises.json')

  type RawEntry = { id: string; name: string; technical_cues: string[]; biomechanical_why: string }

  const FILE_META: Record<string, { baseMuscleGroup: string; tags: string[] }> = {
    'chest_back.json':        { baseMuscleGroup: 'chest',     tags: [] },
    'legs_core.json':         { baseMuscleGroup: 'legs',      tags: [] },
    'shoulders_arms.json':    { baseMuscleGroup: 'shoulders', tags: [] },
    'functional_cables.json': { baseMuscleGroup: 'back',      tags: ['functional', 'cable'] },
    'power_strongman.json':   { baseMuscleGroup: 'back',      tags: ['compound', 'power'] },
  }

  function inferMuscleGroup(filename: string, name: string): string {
    const lc = name.toLowerCase()
    if (filename === 'chest_back.json') {
      return /row|pull|lat|deadlift/.test(lc) ? 'back' : 'chest'
    }
    if (filename === 'legs_core.json') {
      return /crunch|plank|\bab\b|core/.test(lc) ? 'core' : 'legs'
    }
    if (filename === 'shoulders_arms.json') {
      return /curl|tricep|hammer|pressdown|pushdown/.test(lc) ? 'arms' : 'shoulders'
    }
    return FILE_META[filename]?.baseMuscleGroup ?? 'other'
  }

  function inferTier(name: string, tags: string[]): 1 | 2 | 3 {
    const lc = name.toLowerCase()
    const isT1 = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row',
      'clean', 'snatch', 'jerk', 'log press', 'yoke'].some(k => lc.includes(k))
    if (isT1 || tags.includes('power')) return 1
    if (tags.includes('compound') || tags.includes('cable') || tags.includes('functional')) return 2
    return 3
  }

  export async function mergeRawExercises(): Promise<Exercise[]> {
    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json')).sort()
    const allRaw: Array<RawEntry & { _file: string }> = []

    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8')) as RawEntry[]
      raw.forEach(e => allRaw.push({ ...e, _file: file }))
    }

    const seenIds   = new Set<string>()
    const seenNames = new Set<string>()

    return allRaw.map(raw => {
      if (seenIds.has(raw.id)) throw new Error(`Duplicate id: ${raw.id}`)
      if (seenNames.has(raw.name.toLowerCase())) throw new Error(`Duplicate name: ${raw.name}`)
      seenIds.add(raw.id)
      seenNames.add(raw.name.toLowerCase())
      const tags        = [...(FILE_META[raw._file]?.tags ?? [])]
      const muscleGroup = inferMuscleGroup(raw._file, raw.name)
      const tier        = inferTier(raw.name, tags)
      return {
        id: raw.id, name: raw.name,
        muscleGroup, mediaType: 'none', mediaRef: '',
        tags, tier,
      } satisfies Exercise
    })
  }

  if (process.argv[1]?.replace(/\\/g, '/').endsWith('mergeExercises.ts')) {
    mergeRawExercises().then(merged => {
      fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2))
      console.log(`Written ${merged.length} exercises to ${OUT_FILE}`)
    }).catch(e => { console.error(e); process.exit(1) })
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  npm run test -- mergeExercises
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/mergeExercises.ts src/test/mergeExercises.test.ts
  git commit -m "feat(data): mergeExercises utility with cross-file dedup and tier inference"
  ```

**Acceptance:** 300 entries, no dup ids/names, numeric tier 1/2/3, no raw-only fields.

---

### Phase 4.7: Execute merge + overwrite `exercises.json`

**Depends on:** 4.6 committed; all 5 raw files exist.
**Note:** `src/data/exercises.json` currently has 53 old entries in wrapped format — this step replaces it with a plain 300-entry array.

- [ ] **Step 1: Execute merge script**

  ```bash
  npx tsx src/utils/mergeExercises.ts
  ```

  Expected output: `Written 300 exercises to src/data/exercises.json`

- [ ] **Step 2: Verify count**

  ```bash
  node -e "const d=require('./src/data/exercises.json'); console.log('count:', d.length, 'isArray:', Array.isArray(d))"
  ```

  Expected: `count: 300 isArray: true`

- [ ] **Step 3: Delete raw dir**

  ```bash
  rm -rf src/data/raw
  ```

- [ ] **Step 4: Run full tests**

  ```bash
  npm run test
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/data/exercises.json
  git rm -r src/data/raw
  git commit -m "chore(data): generate 300-exercise library, delete raw partitions"
  ```

**Acceptance:** `exercises.json` is a plain 300-entry array (not wrapped). `src/data/raw/` gone. Tests green.

---

### Phase 4.8: Refactor `seedEmbeddings.ts` to chunked batches

**Depends on:** 4.7 committed.
**Files:**
- Modify: `src/utils/seedEmbeddings.ts`
- Create: `src/test/seedEmbeddings.test.ts`

- [ ] **Step 1: Write failing test**

  Create `src/test/seedEmbeddings.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  const mockGetEmbedding = vi.fn().mockResolvedValue(new Array(384).fill(0))
  vi.mock('../services/localAIService', () => ({ getEmbedding: mockGetEmbedding }))

  const mockUpdate = vi.fn().mockResolvedValue(1)
  const fakeExercises = Array.from({ length: 10 }, (_, i) => ({
    id: `e${i}`, name: `Ex ${i}`, muscleGroup: 'chest', tags: [], tier: 3 as const,
    mediaType: 'none', mediaRef: '', embedding: undefined,
  }))
  vi.mock('../db/db', () => ({
    db: { exercises: { toArray: vi.fn().mockResolvedValue(fakeExercises), update: mockUpdate } },
  }))

  import { seedEmbeddings } from '../utils/seedEmbeddings'

  describe('seedEmbeddings chunked', () => {
    beforeEach(() => mockGetEmbedding.mockClear())

    it('calls getEmbedding once per exercise with missing embedding', async () => {
      await seedEmbeddings()
      expect(mockGetEmbedding).toHaveBeenCalledTimes(10)
    })

    it('logs batch progress to console', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await seedEmbeddings()
      const calls = spy.mock.calls.map(c => c[0] as string)
      expect(calls.some(s => s.startsWith('Processed batch'))).toBe(true)
      spy.mockRestore()
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm run test -- seedEmbeddings
  ```

- [ ] **Step 3: Replace `seedEmbeddings.ts`**

  ```ts
  import { db } from '../db/db'
  import { getEmbedding } from '../services/localAIService'
  import type { Exercise } from '../db/schema'

  const BATCH_SIZE = 5

  function buildExerciseText(exercise: Exercise): string {
    return `${exercise.name} ${exercise.muscleGroup} ${exercise.tags.join(' ')}`
  }

  export async function seedEmbeddings(): Promise<void> {
    const exercises = await db.exercises.toArray()
    const missing   = exercises.filter(e => !e.embedding || e.embedding.length === 0)
    const total     = Math.ceil(missing.length / BATCH_SIZE)

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch    = missing.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      await Promise.all(batch.map(async ex => {
        const embedding = await getEmbedding(buildExerciseText(ex))
        await db.exercises.update(ex.id, { embedding })
      }))
      console.log(`Processed batch ${batchNum} of ${total}`)
      await new Promise(r => setTimeout(r, 0))
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  npm run test -- seedEmbeddings
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/utils/seedEmbeddings.ts src/test/seedEmbeddings.test.ts
  git commit -m "feat(data): seed embeddings in chunks of 5 with OOM guard and batch logging"
  ```

**Acceptance:** 300 exercises → 60 batches; console shows "Processed batch X of 60"; skips exercises with existing embeddings.

---

### Phase 1.0: `embeddingWorker.ts` progress callback

**Depends on:** Nothing (independent).
**Files:**
- Modify: `src/workers/embeddingWorker.ts`
- Modify: `src/services/localAIService.ts`

Needed so `NLPSearchBar` can show "Brain Initializing…" while the 22MB model downloads.

- [ ] **Step 1: Replace `embeddingWorker.ts` with progress-aware version**

  ```ts
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
  ```

- [ ] **Step 2: Replace `localAIService.ts` with subscription-aware version**

  ```ts
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
          loadingListeners.forEach(fn => fn(true, e.data.progress))
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
  ```

- [ ] **Step 3: Run full tests**

  ```bash
  npm run test
  ```

  All existing tests that mock `localAIService` mock `getEmbedding` by name — still works.

- [ ] **Step 4: Commit**

  ```bash
  git add src/workers/embeddingWorker.ts src/services/localAIService.ts
  git commit -m "feat(nlp): embeddingWorker progress callback + subscribeToModelLoading export"
  ```

**Acceptance:** Worker sends `{ type: 'loading', progress }` during model download; `{ type: 'ready' }` once loaded; `getEmbedding` callers unaffected.

---

### Phase 3.1: `NLPSearchBar.tsx` scaffold [STITCH UI]

**Depends on:** 4.8 committed (rich exercise embeddings available).
**Files:**
- Create: `src/components/Search/NLPSearchBar.tsx`
- Create: `src/test/NLPSearchBar.test.tsx`

#### Stitch Selection — Phase 3.1
- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Dark workout app NLP search bar component, slate-900 background, indigo accent border on focus, placeholder 'Try: upper chest with shoulder injury…', floating dropdown list beneath with exercise name + green/amber/red percentage match badge on right, mobile width 430px"
  - **Prompt B:** "AI exercise search bar for dark RPG fitness app, obsidian/navy background, subtle glow on input, dropdown shows ranked results with colored match score pill, clean minimalist typography, mobile-first"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Write failing test**

  Create `src/test/NLPSearchBar.test.tsx`:

  ```tsx
  // @vitest-environment jsdom
  import { render, screen, fireEvent } from '@testing-library/react'
  import { describe, it, expect, vi } from 'vitest'

  vi.mock('../services/localAIService', () => ({ subscribeToModelLoading: vi.fn(() => () => {}) }))
  vi.mock('../services/exerciseSearchService', () => ({ searchExercises: vi.fn().mockResolvedValue([]) }))
  vi.mock('../hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: string) => v }))

  import { NLPSearchBar } from '../components/Search/NLPSearchBar'

  describe('NLPSearchBar', () => {
    it('renders with placeholder', () => {
      render(<NLPSearchBar onSelect={vi.fn()} placeholder="Search exercises..." />)
      expect(screen.getByPlaceholderText('Search exercises...')).toBeTruthy()
    })

    it('updates value on change', () => {
      render(<NLPSearchBar onSelect={vi.fn()} placeholder="Search" />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'bench' } })
      expect((input as HTMLInputElement).value).toBe('bench')
    })
  })
  ```

- [ ] **Step 3: Implement scaffold `NLPSearchBar.tsx`** (match selected Stitch variant layout)

  Create `src/components/Search/NLPSearchBar.tsx`:

  ```tsx
  import { useState } from 'react'

  interface NLPSearchBarProps {
    onSelect: (exerciseId: string) => void
    placeholder?: string
  }

  export function NLPSearchBar({ onSelect: _onSelect, placeholder = 'Try: upper chest with shoulder injury…' }: NLPSearchBarProps) {
    const [query, setQuery] = useState('')

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
          aria-label={placeholder}
        />
      </div>
    )
  }
  ```

- [ ] **Step 4: Run test + commit**

  ```bash
  npm run test -- NLPSearchBar
  git add src/components/Search/NLPSearchBar.tsx src/test/NLPSearchBar.test.tsx
  git commit -m "feat(search): NLPSearchBar scaffold with controlled input"
  ```

**Acceptance:** Input renders with placeholder; value updates on change; no crash without search service.

---

### Phase 3.2: `useDebouncedValue` hook

**Depends on:** Nothing (independent).
**Files:**
- Create: `src/hooks/useDebouncedValue.ts`
- Create: `src/test/useDebouncedValue.test.ts`

- [ ] **Step 1: Write failing test**

  Create `src/test/useDebouncedValue.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { renderHook, act } from '@testing-library/react'
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
  import { useDebouncedValue } from '../hooks/useDebouncedValue'

  describe('useDebouncedValue', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('does not update before delay', () => {
      const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
      rerender({ val: 'bench' })
      expect(result.current).toBe('a')
    })

    it('updates after delay', () => {
      const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
      rerender({ val: 'bench' })
      act(() => vi.advanceTimersByTime(300))
      expect(result.current).toBe('bench')
    })

    it('coalesces rapid changes', () => {
      const { result, rerender } = renderHook(({ val }) => useDebouncedValue(val, 300), { initialProps: { val: 'a' } })
      rerender({ val: 'b' })
      rerender({ val: 'c' })
      act(() => vi.advanceTimersByTime(300))
      expect(result.current).toBe('c')
    })
  })
  ```

- [ ] **Step 2: Implement `useDebouncedValue.ts`**

  Create `src/hooks/useDebouncedValue.ts`:

  ```ts
  import { useEffect, useState } from 'react'

  export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay)
      return () => clearTimeout(id)
    }, [value, delay])
    return debounced
  }
  ```

- [ ] **Step 3: Run test + commit**

  ```bash
  npm run test -- useDebouncedValue
  git add src/hooks/useDebouncedValue.ts src/test/useDebouncedValue.test.ts
  git commit -m "feat(search): useDebouncedValue hook (300ms)"
  ```

**Acceptance:** Value not updated before delay; updated exactly at delay boundary; rapid changes coalesce to final value.

---

### Phase 3.3: `exerciseSearchService.ts` + full `NLPSearchBar` wiring [STITCH UI]

**Depends on:** 3.1, 3.2, 4.8 committed.
**Note:** Phase 5.3 (Brain Initializing loading state) is integrated here — no separate task needed.
**Files:**
- Create: `src/services/exerciseSearchService.ts`
- Create: `src/test/exerciseSearchService.test.ts`
- Modify: `src/components/Search/NLPSearchBar.tsx`

#### Stitch Selection — Phase 3.3
- [ ] **Step 1: Generate Stitch variants for dropdown**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Dark dropdown search results for workout app, slate-900 panel, each row: exercise name left-aligned + percentage badge right (green ≥85%, amber 60-84%, red <60%), smooth hover highlight, max-height 60vh scrollable, rounded-xl shadow"
  - **Prompt B:** "AI cosine-ranked exercise results dropdown, dark navy theme, each item shows exercise name + muscle group tag + match score badge, clean rows with subtle dividers, keyboard-navigable"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Write failing service test**

  Create `src/test/exerciseSearchService.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { describe, it, expect, vi } from 'vitest'

  vi.mock('../services/localAIService', () => ({ getEmbedding: vi.fn().mockResolvedValue([1, 0, 0]) }))
  vi.mock('../db/db', () => ({
    db: {
      exercises: {
        toArray: vi.fn().mockResolvedValue([
          { id: 'e1', name: 'Bench Press', muscleGroup: 'chest', tags: [], tier: 1, mediaType: 'none', mediaRef: '', embedding: [1, 0, 0] },
          { id: 'e2', name: 'Squat',       muscleGroup: 'legs',  tags: [], tier: 1, mediaType: 'none', mediaRef: '', embedding: [0, 1, 0] },
        ]),
      },
    },
  }))

  import { searchExercises } from '../services/exerciseSearchService'

  describe('searchExercises', () => {
    it('returns exercises sorted by cosine similarity, best first', async () => {
      const results = await searchExercises('bench press')
      expect(results[0].exerciseId).toBe('e1')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })

    it('result shape has exerciseId, name, muscleGroup, tier, score', async () => {
      const results = await searchExercises('bench press')
      const r = results[0]
      expect(typeof r.exerciseId).toBe('string')
      expect(typeof r.name).toBe('string')
      expect(typeof r.muscleGroup).toBe('string')
      expect(typeof r.score).toBe('number')
    })
  })
  ```

- [ ] **Step 3: Run test to verify it fails**

  ```bash
  npm run test -- exerciseSearchService
  ```

- [ ] **Step 4: Implement `exerciseSearchService.ts`**

  Create `src/services/exerciseSearchService.ts`:

  ```ts
  import { getEmbedding } from './localAIService'
  import { db } from '../db/db'
  import { cosineSimilarity } from '../utils/vectorMath'
  import type { Exercise } from '../db/schema'

  type ExerciseWithEmbedding = Exercise & { embedding: number[] }

  let cache: ExerciseWithEmbedding[] | null = null

  async function loadEmbedded(): Promise<ExerciseWithEmbedding[]> {
    if (!cache) {
      const all = await db.exercises.toArray()
      cache = all.filter((e): e is ExerciseWithEmbedding => Array.isArray(e.embedding) && e.embedding.length > 0)
    }
    return cache
  }

  export function invalidateSearchCache() { cache = null }

  export async function searchExercises(query: string, topN = 20) {
    const queryVec = await getEmbedding(query)
    const embedded = await loadEmbedded()
    const scored = embedded.map(e => ({
      exerciseId:  e.id,
      name:        e.name,
      muscleGroup: e.muscleGroup,
      tier:        e.tier,
      score:       cosineSimilarity(queryVec, e.embedding),
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topN)
  }
  ```

- [ ] **Step 5: Run service test to verify it passes**

  ```bash
  npm run test -- exerciseSearchService
  ```

- [ ] **Step 6: Replace `NLPSearchBar.tsx` with fully wired version** (use layout from selected Stitch variant)

  Replace `src/components/Search/NLPSearchBar.tsx`:

  ```tsx
  import { useEffect, useRef, useState } from 'react'
  import { subscribeToModelLoading } from '../../services/localAIService'
  import { searchExercises } from '../../services/exerciseSearchService'
  import { useDebouncedValue } from '../../hooks/useDebouncedValue'

  type SearchResult = Awaited<ReturnType<typeof searchExercises>>[number]

  interface NLPSearchBarProps {
    onSelect: (exerciseId: string) => void
    placeholder?: string
  }

  export function NLPSearchBar({ onSelect, placeholder = 'Try: upper chest with shoulder injury…' }: NLPSearchBarProps) {
    const [query, setQuery]             = useState('')
    const [results, setResults]         = useState<SearchResult[]>([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [modelLoading, setModelLoading] = useState(false)
    const activeQuery                   = useRef('')
    const debouncedQuery                = useDebouncedValue(query, 300)

    useEffect(() => subscribeToModelLoading((loading) => setModelLoading(loading)), [])

    useEffect(() => {
      if (!debouncedQuery.trim()) { setResults([]); return }
      activeQuery.current = debouncedQuery
      searchExercises(debouncedQuery).then(res => {
        if (activeQuery.current === debouncedQuery) setResults(res)
      })
    }, [debouncedQuery])

    useEffect(() => setActiveIndex(-1), [results])

    function handleSelect(id: string) {
      onSelect(id)
      setQuery('')
      setResults([])
    }

    return (
      <div className="relative w-full">
        {modelLoading && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Brain Initializing…</span>
          </div>
        )}
        <input
          type="text"
          value={query}
          disabled={modelLoading}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setQuery(''); setResults([]) }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
            if (e.key === 'Enter' && activeIndex >= 0) handleSelect(results[activeIndex].exerciseId)
          }}
          placeholder={modelLoading ? 'Loading AI model…' : placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
          aria-label={placeholder}
        />
        {results.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
            style={{ maxHeight: '60vh' }}
          >
            {results.map((r, idx) => {
              const pct    = Math.round(((r.score + 1) / 2) * 100)
              const colour = pct >= 85 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
              const active = idx === activeIndex
              return (
                <li
                  key={r.exerciseId}
                  role="option"
                  aria-selected={active}
                  tabIndex={0}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 outline-none ${active ? 'bg-slate-700' : 'hover:bg-slate-800 focus:bg-slate-800'}`}
                  onClick={() => handleSelect(r.exerciseId)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSelect(r.exerciseId) }}
                >
                  <span className="truncate text-sm font-semibold text-white">{r.name}</span>
                  <span className={`ml-3 shrink-0 text-xs font-bold ${colour}`}>{pct}% Match</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 7: Run full tests + commit**

  ```bash
  npm run test
  git add src/services/exerciseSearchService.ts src/test/exerciseSearchService.test.ts src/components/Search/NLPSearchBar.tsx
  git commit -m "feat(search): exerciseSearchService cosine ranking + NLPSearchBar with dropdown, Brain Initializing state, arrow-key nav"
  ```

**Acceptance:** Debounce 300ms; dropdown shows cosine-ranked results; Match % badge green/amber/red; Esc closes; arrow keys navigate; "Brain Initializing…" banner visible while model loads; input disabled during load. This commit also closes TODO Phase 5.3.

---

### Phase 3.5: `ExerciseCard` confidence score badge [STITCH UI]

**Depends on:** 3.3 committed.
**Files:**
- Modify: `src/components/ExerciseCard.tsx`

#### Stitch Selection — Phase 3.5
- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Workout exercise card component, dark slate background, exercise name + tier badge + optional green/amber/red percentage match pill in top-right corner, match pill only visible when score provided"
  - **Prompt B:** "Dark fitness app exercise card, compact match score badge (e.g. '95% Match') shown as small colored pill below the exercise name when a score is passed, RPG dark aesthetic"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Add `matchScore` prop to `ExerciseCard.tsx`**

  In `src/components/ExerciseCard.tsx`, update the props interface:

  ```tsx
  interface ExerciseCardProps {
    exercise: ExerciseData
    onSelect: (exercise: ExerciseData) => void
    matchScore?: number
  }

  export default function ExerciseCard({ exercise, onSelect, matchScore }: ExerciseCardProps) {
  ```

  Inside the name/tier row, after the tier badge span, add:

  ```tsx
  {matchScore !== undefined && (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
      matchScore >= 0.85 ? 'bg-emerald-500/15 text-emerald-400' :
      matchScore >= 0.60 ? 'bg-amber-500/15 text-amber-400' :
                           'bg-rose-500/15 text-rose-400'
    }`}>
      {Math.round(matchScore * 100)}% Match
    </span>
  )}
  ```

- [ ] **Step 3: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/ExerciseCard.tsx
  git commit -m "feat(search): optional matchScore confidence badge on ExerciseCard"
  ```

**Acceptance:** `matchScore` undefined → no badge (no regression to existing callers). `matchScore=0.92` → green "92% Match" pill. `matchScore=0.65` → amber. `matchScore=0.40` → red.

---

### Phase 5.1: Prestige wiring + 2s particle flash [STITCH UI]

**Depends on:** Nothing (independent). Fixes the broken `MasterworkModal` prestige button.
**Files:**
- Create: `src/components/hero/PrestigeFlash.tsx`
- Modify: `src/components/hero/MasterworkModal.tsx`
- Modify: `src/components/hero/SummitModal.tsx`
- Modify: `src/components/hero/HeroOverlay.tsx`

#### Stitch Selection — Phase 5.1
- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Full-screen prestige celebration flash overlay, 2-second animation, radial golden burst from center, dark RPG game feel, white-to-gold gradient dissolving outward, particles optional, pointer-events none"
  - **Prompt B:** "Full-screen ascension flash effect, 2 seconds, radial white core expanding to amber-orange ring then fading to black, RPG game aesthetic, fixed overlay on top of all content"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Implement `PrestigeFlash.tsx`** (match selected variant's colors/timing)

  Create `src/components/hero/PrestigeFlash.tsx`:

  ```tsx
  import { useEffect } from 'react'
  import { AnimatePresence, motion } from 'framer-motion'

  interface PrestigeFlashProps {
    active: boolean
    onDone: () => void
  }

  export function PrestigeFlash({ active, onDone }: PrestigeFlashProps) {
    useEffect(() => {
      if (!active) return
      const timer = setTimeout(onDone, 2000)
      return () => clearTimeout(timer)
    }, [active, onDone])

    return (
      <AnimatePresence>
        {active && (
          <motion.div
            key="prestige-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.85, 0] }}
            transition={{ duration: 2, times: [0, 0.08, 0.45, 1], ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.95) 0%, rgba(255,100,0,0.75) 35%, rgba(10,14,26,0.9) 80%)',
            }}
          />
        )}
      </AnimatePresence>
    )
  }
  ```

- [ ] **Step 3: Wire `forgeMasterwork()` into `MasterworkModal.tsx`**

  Add import to `src/components/hero/MasterworkModal.tsx`:
  ```tsx
  import { forgeMasterwork } from '../../services/heroMathService'
  ```

  Change `handlePrestige` inside `MasterworkModal`:
  ```tsx
  function handlePrestige() {
    void forgeMasterwork()
    onPrestige?.()
    setDismissed(true)
  }
  ```

- [ ] **Step 4: Add `onAscend` notification prop to `SummitModal.tsx`**

  Update interface and `handleAscend` in `src/components/hero/SummitModal.tsx`:

  ```tsx
  interface SummitModalProps {
    onAscend?: () => void
  }

  export function SummitModal({ onAscend }: SummitModalProps) {
    // ...
    function handleAscend() {
      setDismissed(true)
      ascend()
      onAscend?.()
    }
  ```

- [ ] **Step 5: Wire flash + updated modals into `HeroOverlay.tsx`**

  Add import:
  ```tsx
  import { PrestigeFlash } from './PrestigeFlash'
  ```

  Add state inside `HeroOverlay()`:
  ```tsx
  const [prestigeFlashActive, setPrestigeFlashActive] = useState(false)
  ```

  Update modal renders:
  ```tsx
  <SummitModal onAscend={() => setPrestigeFlashActive(true)} />
  <MasterworkModal onPrestige={() => setPrestigeFlashActive(true)} />
  <PrestigeFlash active={prestigeFlashActive} onDone={() => setPrestigeFlashActive(false)} />
  ```

- [ ] **Step 6: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/hero/PrestigeFlash.tsx src/components/hero/MasterworkModal.tsx src/components/hero/SummitModal.tsx src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): wire forgeMasterwork to MasterworkModal + 2s PrestigeFlash on ascend/forge"
  ```

**Acceptance:** Clicking "Forge Masterwork" now calls `forgeMasterwork()` (was broken); 2s radial golden flash covers full screen on both prestige paths; flash auto-dismisses after 2s; `PrestigeFlash` uses `pointer-events: none`.

---

### Phase 5.2: ObsidianStairs → TheForge 500ms cross-fade [STITCH UI]

**Depends on:** Nothing (independent). Adds TheForge render path to HeroOverlay (currently missing).
**Files:**
- Modify: `src/components/hero/HeroOverlay.tsx`

#### Stitch Selection — Phase 5.2
- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Full-screen dark RPG background cross-fade transition: left state is dark obsidian dungeon stairs, right state is orange forge fire embers. 500ms opacity cross-fade between the two backgrounds."
  - **Prompt B:** "Smooth 500ms background transition in a dark fitness RPG app, fading between a cool slate/indigo staircase scene and a warm amber/orange forge fire scene, full-screen fixed overlay"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Add TheForge + AnimatePresence cross-fade to `HeroOverlay.tsx`**

  Add import to `src/components/hero/HeroOverlay.tsx`:
  ```tsx
  import { TheForge } from './TheForge'
  ```

  Find the current line rendering ObsidianStairs (conditional on power track) and replace it with:
  ```tsx
  <AnimatePresence mode="wait">
    {track.active === 'power' ? (
      <motion.div
        key="stairs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ObsidianStairs progress={track.power} />
      </motion.div>
    ) : (
      <motion.div
        key="forge"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TheForge />
      </motion.div>
    )}
  </AnimatePresence>
  ```

- [ ] **Step 3: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch"
  ```

**Acceptance:** TheForge renders when `track.active === 'hypertrophy'` (was missing entirely); ObsidianStairs renders when `track.active === 'power'`; switching Primary Goal in settings cross-fades over 500ms; both backgrounds never visible simultaneously.

---

### Phase 8.1: `HeroErrorBoundary.tsx`

**Depends on:** Nothing (independent, but deploy after hero components are stable).
**Files:**
- Create: `src/components/UI/HeroErrorBoundary.tsx`
- Create: `src/test/HeroErrorBoundary.test.tsx`

- [ ] **Step 1: Write failing test**

  Create `src/test/HeroErrorBoundary.test.tsx`:

  ```tsx
  // @vitest-environment jsdom
  import React from 'react'
  import { render, screen } from '@testing-library/react'
  import { describe, it, expect, vi } from 'vitest'
  import { HeroErrorBoundary } from '../components/UI/HeroErrorBoundary'

  const Boom = () => { throw new Error('canvas crash') }

  describe('HeroErrorBoundary', () => {
    it('renders nothing and calls onFallback when child throws', () => {
      const onFallback = vi.fn()
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { container } = render(
        <HeroErrorBoundary onFallback={onFallback}><Boom /></HeroErrorBoundary>
      )
      expect(container.firstChild).toBeNull()
      expect(onFallback).toHaveBeenCalledOnce()
      spy.mockRestore()
    })

    it('renders children when no error', () => {
      render(<HeroErrorBoundary onFallback={vi.fn()}><span>ok</span></HeroErrorBoundary>)
      expect(screen.getByText('ok')).toBeTruthy()
    })
  })
  ```

- [ ] **Step 2: Implement `HeroErrorBoundary.tsx`**

  Create `src/components/UI/HeroErrorBoundary.tsx`:

  ```tsx
  import { Component, type ErrorInfo, type ReactNode } from 'react'

  interface Props {
    children: ReactNode
    onFallback: () => void
  }

  interface State { caught: boolean }

  export class HeroErrorBoundary extends Component<Props, State> {
    state: State = { caught: false }

    static getDerivedStateFromError(): State { return { caught: true } }

    componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFallback() }

    render() {
      if (this.state.caught) return null
      return this.props.children
    }
  }
  ```

- [ ] **Step 3: Run test + commit**

  ```bash
  npm run test -- HeroErrorBoundary
  git add src/components/UI/HeroErrorBoundary.tsx src/test/HeroErrorBoundary.test.tsx
  git commit -m "feat(ui): HeroErrorBoundary class component calls onFallback on canvas crash"
  ```

**Acceptance:** Child throw → renders null + calls `onFallback` once; healthy children render normally.

---

### Phase 8.2: Wrap `HeroOverlay` in boundary + RAF try/catch

**Depends on:** 8.1 committed.
**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/hero/TheForge.tsx`
- Modify: `src/components/hero/CombatCanvas.tsx`

- [ ] **Step 1: Read `src/App.tsx` to confirm `<HeroOverlay />` location**

  Confirm `<HeroOverlay />` is inside `UIModeProvider`. `useUIMode()` must be called inside the provider.

- [ ] **Step 2: Add `HeroOverlayWithBoundary` wrapper to `App.tsx`**

  Add imports:
  ```tsx
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Add before the default export:
  ```tsx
  function HeroOverlayWithBoundary() {
    const { setUIMode } = useUIMode()
    return (
      <HeroErrorBoundary onFallback={() => setUIMode('focus')}>
        <HeroOverlay />
      </HeroErrorBoundary>
    )
  }
  ```

  Replace `<HeroOverlay />` with `<HeroOverlayWithBoundary />`.

- [ ] **Step 3: Add RAF try/catch in `TheForge.tsx`**

  Read `src/components/hero/TheForge.tsx`. Find the `tick()` function inside the animation useEffect. Wrap the draw body:

  ```ts
  function tick() {
    try {
      // ... existing draw code unchanged ...
    } catch (e) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      throw e
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  ```

- [ ] **Step 4: Add RAF try/catch in `CombatCanvas.tsx`**

  Apply the same pattern to the `step()` function in `CombatCanvas.tsx`:

  ```ts
  function step(ts: number) {
    try {
      if (ts - last >= FRAME_MS) {
        if (frameIdx < sequence.length) {
          drawFrame(ctx, sequence[frameIdx])
          if (frameIdx === STRIKE_FRAME) onStrike?.(intensity)
          frameIdx++
          last = ts
        }
      }
    } catch (e) {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
      throw e
    }
    if (frameIdx < sequence.length) {
      animRef.current = requestAnimationFrame(step)
    } else {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
      animRef.current = null
    }
  }
  ```

- [ ] **Step 5: Run full tests + commit**

  ```bash
  npm run test
  git add src/App.tsx src/components/hero/TheForge.tsx src/components/hero/CombatCanvas.tsx
  git commit -m "feat(ui): wrap HeroOverlay in HeroErrorBoundary, add RAF error rethrow for canvas fallback"
  ```

**Acceptance:** Forced throw in RAF → overlay collapses → `uiMode` snaps to `'focus'`; Blueprint/Logger remain interactive; `'professional'` mode never used.

---

### Phase 7.1: Verify `completedAscensions` Roman numeral badge updates in real-time

**Depends on:** 5.1 committed (prestige wiring live).
**Files:**
- Read: `src/components/SessionBlueprint.tsx`
- Possibly modify: `src/components/SessionBlueprint.tsx`

- [ ] **Step 1: Confirm wiring in `SessionBlueprint.tsx`**

  ```bash
  grep -n "PrestigeBadge\|completedAscensions" src/components/SessionBlueprint.tsx
  ```

  Expected: `PrestigeBadge` rendered with `completedAscensions` prop from `HomePage`. If missing, proceed to Step 2.

- [ ] **Step 2: If `PrestigeBadge` is missing from `SessionBlueprint.tsx`**

  Add to imports:
  ```tsx
  import { PrestigeBadge } from './PrestigeBadge'
  ```

  Add to props interface:
  ```tsx
  completedAscensions?: number
  ```

  Add in header JSX (next to user name or session label):
  ```tsx
  <PrestigeBadge ascensions={completedAscensions ?? 0} />
  ```

- [ ] **Step 3: Confirm reactivity (no code needed if already using `useLiveQuery`)**

  `onboardingRecord` in `HomePage.tsx` comes from `useLiveQuery`. When `ascend()` or `forgeMasterwork()` calls `db.settings.update(APP_SETTINGS_ID, { completedAscensions: n+1 })`, Dexie fires a reactive update. `useLiveQuery` re-runs, `onboardingRecord.completedAscensions` increments, and `SessionBlueprint` re-renders with the new badge. No page refresh needed.

- [ ] **Step 4: Write or update `PrestigeBadge` test**

  Add to `src/test/PrestigeBadge.test.tsx` (create if missing):

  ```tsx
  // @vitest-environment jsdom
  import { render, screen } from '@testing-library/react'
  import { describe, it, expect } from 'vitest'
  import { PrestigeBadge } from '../components/PrestigeBadge'

  describe('PrestigeBadge', () => {
    it('renders nothing at 0 ascensions', () => {
      const { container } = render(<PrestigeBadge ascensions={0} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders Roman numeral I at 1 ascension', () => {
      render(<PrestigeBadge ascensions={1} />)
      expect(screen.getByText('I')).toBeTruthy()
    })

    it('renders IV at 4 ascensions', () => {
      render(<PrestigeBadge ascensions={4} />)
      expect(screen.getByText('IV')).toBeTruthy()
    })
  })
  ```

- [ ] **Step 5: Run tests + commit if changes made**

  ```bash
  npm run test -- PrestigeBadge
  # If SessionBlueprint was modified:
  git add src/components/SessionBlueprint.tsx src/test/PrestigeBadge.test.tsx
  git commit -m "feat(hero): verify + wire completedAscensions Roman numeral badge via useLiveQuery"
  ```

**Acceptance:** PrestigeBadge renders with value from `useLiveQuery`; after prestige fires, badge increments without page refresh; 0 ascensions → no badge rendered.

---

## 3. Global acceptance criteria

- [ ] `npm run test` green — zero regressions.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] `src/data/exercises.json` is a plain 300-entry array; `src/data/raw/` deleted.
- [ ] Embeddings seed in batches of 5; console shows "Processed batch X of 60".
- [ ] Clicking "Forge Masterwork" calls `forgeMasterwork()` (was previously broken).
- [ ] 2s golden radial flash covers full screen on both prestige paths.
- [ ] TheForge renders when `track.active === 'hypertrophy'` (was previously missing).
- [ ] Hero overlay survives forced canvas error → snaps to `uiMode = 'focus'`.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `UIMode` has no `'professional'` | Use `setUIMode('focus')` in Phase 8.2 |
| `MasterworkModal.onPrestige` was never called | Phase 5.1 adds `forgeMasterwork()` import directly into modal |
| TheForge not rendered in HeroOverlay | Phase 5.2 adds it; `TheForge.tsx` file confirmed to exist |
| `exercises.json` wrapped format breaks Phase 4.7 | Phase 4.7 overwrites it entirely with plain array via `mergeExercises.ts` |
| `@xenova/transformers` progress_callback API may vary | Wrap in try/catch in worker; if it throws, worker sends no progress (graceful) |
| RAF errors don't reach React error boundary natively | `try/catch` + rethrow pattern in Phase 8.2 resolves this |
| `mergeExercises` test needs raw files on disk | Run test only after Phases 4.1–4.5 are done |
| Both prestige modals at 1.0 simultaneously | Each is independently dismissed; flash fires for whichever button is pressed first |
| `ExerciseCard` used in `ActiveLogger` without `matchScore` | `matchScore` is optional — no prop → no badge rendered (no regression) |
| Stitch MCP unavailable | Stop and fix connectivity; never skip Stitch for [STITCH UI] tasks |
| Phase 5.3 (Brain Initializing) appears separately in TODO | Confirmed integrated into Phase 3.3; checking off Phase 3.3 closes Phase 5.3 |

---

## 5. Execution order

| Step | Task | State |
|---|---|---|
| 1–11 | P0 → Phase 6.4 combat | ~~DONE~~ |
| 12–16 | 4.1–4.5 — 5 raw JSON files (parallel) | ~~DONE~~ |
| 17 | 4.6 — mergeExercises utility | ~~DONE~~ |
| **18** | **4.7 — execute merge + delete raw** | **← NEXT** |
| 19 | 4.8 — chunked seedEmbeddings | seedEmbeddings.ts confirmed sequential; needs full replace |
| 20 | 1.0 — embeddingWorker progress callback | embeddingWorker.ts confirmed bare pipeline; needs full replace |
| 21 | 5.1 — Prestige wiring + PrestigeFlash [STITCH UI] | HeroOverlay passes NO onPrestige/onAscend to either modal; Phase 5.1 adds both |
| 22 | 5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI] | HeroOverlay has no else branch for hypertrophy; Phase 5.2 adds it |
| 23 | 3.1 — NLPSearchBar scaffold [STITCH UI] |  |
| 24 | 3.2 — useDebouncedValue |  |
| 25 | 3.3 — exerciseSearchService + full NLPSearchBar [STITCH UI] (closes Phase 5.3) |  |
| 26 | 3.5 — ExerciseCard confidence badge [STITCH UI] |  |
| 27 | 8.1 — HeroErrorBoundary |  |
| 28 | 8.2 — Wrap overlay + RAF safety |  |
| 29 | 7.1 — Verify completedAscensions badge |  |

Check the corresponding `TODO.md` checkbox in the same commit as each implementation.

---

## 6. Exact next task

> **NEXT: Phase 4.7 — Execute merge script, verify 300-entry plain array, delete `src/data/raw/`, run tests, commit.**
> `mergeExercises.ts` is now committed. Run `npx tsx src/utils/mergeExercises.ts`, verify `exercises.json` is a plain 300-entry array, delete raw dir, run full tests.
> Depends on: 4.6 committed (✓).
