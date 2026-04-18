# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining unchecked TODO.md items (Phases 1–5) with TDD, one commit per task, zero inline comments.

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. Search in `src/components/Search/`. Error boundary in `src/components/UI/`. Tests in `src/test/`. Hooks in `src/hooks/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict, @xenova/transformers, sonner (to install). Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #21 — file-verified, Phase 3.3 committed 174f504)

---

## 0. Live-state snapshot (pass #21, 2026-04-18 — file-verified from disk)

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
| Phase 4.6 mergeExercises utility | **DONE** | `e12a22c` |
| Phase 4.7 execute merge + delete raw dir | **DONE** | `0e22469` |
| Phase 4.8 chunked seedEmbeddings | **DONE** | `f485528` |
| Phase 1.0 embeddingWorker progress callback | **DONE** | `403ecb8` |
| Phase 3.2 useDebouncedValue | **DONE** | `ac42ee0` |
| Phase 3.1 NLPSearchBar scaffold | **DONE** | `c19352a` |
| Phase 3.3 exerciseSearchService + full NLPSearchBar | **DONE** | `174f504` |
| Phase 3.5 ExerciseCard confidence badge | **DONE** | (next commit) |
| Phase 5.1 prestige wiring + 2s particle flash | **MISSING** | — |
| Phase 5.2 ObsidianStairs→TheForge cross-fade | **MISSING** | — |
| Phase 5.3 Brain Initializing state | **DONE** | `174f504` (integrated into 3.3) |
| Phase 8.1 HeroErrorBoundary | **MISSING** | — |
| Phase 8.2 Wrap overlay + RAF safety + toast | **MISSING** | — |
| Phase 7.1 verify completedAscensions badge | **MISSING** | — |

### Critical verified facts (pass #21 — file-verified from disk, 2026-04-18)

| Assumption | Reality |
|---|---|
| `exercises.json` is plain 300-entry array | **Confirmed** — `raw/` deleted |
| `src/hooks/useDebouncedValue.ts` exists | **Confirmed** — committed `ac42ee0` |
| `src/components/Search/NLPSearchBar.tsx` is fully wired | **Confirmed** — dropdown, Brain Initializing, arrow-key nav live (commit `174f504`) |
| `exerciseSearchService.ts` exists | **Confirmed** — exports `searchExercises` + `invalidateSearchCache` (commit `174f504`) |
| `src/components/UI/` directory exists | **No** — Phase 8.1 creates it |
| `embeddingWorker.ts` has `progress_callback` | **Yes** — sends `{ type: 'loading', progress }` and `{ type: 'ready' }` |
| `localAIService.ts` exports `subscribeToModelLoading` | **Confirmed** — added by `403ecb8` |
| `PrestigeFlash.tsx` exists | **No** — Phase 5.1 creates it |
| `TheForge.tsx` exists | **Yes** — `src/components/hero/TheForge.tsx` confirmed on disk |
| `TheForge` imported in `HeroOverlay` | **No** — Phase 5.2 adds the import |
| `motion` imported in `HeroOverlay` | **No** — only `AnimatePresence` is imported; Phase 5.2 adds `motion` |
| `HeroOverlay` line 59 renders TheForge | **No** — only `{track.active === 'power' && <ObsidianStairs progress={track.power} />}`; no else branch; Phase 5.2 adds it |
| `HeroOverlay` passes props to `SummitModal`/`MasterworkModal` | **No** — both rendered with zero props at lines 66–67; Phase 5.1 wires them |
| `MasterworkModal` has `onPrestige?: () => void` prop | **Yes** — prop exists at line 6; but `handlePrestige` does NOT call `forgeMasterwork()` — only calls `onPrestige?.()` + `setDismissed(true)` |
| `SummitModal` has `onAscend` prop | **No** — takes zero props; `handleAscend` calls `ascend()` internally only; Phase 5.1 adds `onAscend` |
| Toast system (sonner/useToast) installed | **No** — zero toast imports anywhere; Phase 8.2 installs `sonner` |
| `UIMode` is `'focus' \| 'hero'` | **Confirmed** — use `setUIMode('focus')` not `'professional'` |
| `db.embeddings` table exists | **No** — embeddings stored as `exercise.embedding: number[]` |
| `cosineSimilarity` exported from `src/utils/vectorMath.ts` | **Confirmed** |
| `getEmbedding` is named export from `localAIService` | **Confirmed** |
| `forgeMasterwork` and `ascend` exported from `heroMathService` | **Confirmed** — at lines 76 and 72 respectively |
| `AnimatePresence` already imported in `HeroOverlay` | **Confirmed** — line 2 |
| `ExerciseTier` is `'T1' \| 'T2' \| 'T3'` on `ExerciseCard` | **Confirmed** — `matchScore` is independent cosine float |
| `ExerciseCard` has `matchScore` prop | **No** — Phase 3.5 adds it as optional |
| `shadcn components.json` exists | **No** — plain Tailwind; install `sonner` directly |
| `PrestigeBadge` renders in `SessionBlueprint.tsx` | **Confirmed** — line 758 with `completedAscensions`; Phase 7.1 must verify `useLiveQuery` reactivity |

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
| 3.3 | exerciseSearchService + full NLPSearchBar | 2 × dropdown variant |
| 3.5 | ExerciseCard confidence badge | 2 × card variant |
| 5.1 | Prestige wiring + PrestigeFlash | 2 × flash overlay variant |
| 5.2 | ObsidianStairs → TheForge cross-fade | 2 × background cross-fade variant |

---

## 1. Dependency graph

```
3.3 DONE ✓ (174f504)
3.5 (unblocked — 3.3 done ✓)
5.1 (independent — unblocked)
5.2 (independent — unblocked)
8.1 (independent — unblocked)

5.1 → 7.1
8.1 → 8.2
```

**Critical path:** ~~3.3 →~~ 3.5 (unblocked now)
**Parallelisable now:** 3.5, 5.1, 5.2, 8.1 are all unblocked.

---

## 2. Per-item execution plan

---

### Phase 3.3: `exerciseSearchService.ts` + full `NLPSearchBar` wiring [STITCH UI]

**Depends on:** 3.1 committed ✓ — **UNBLOCKED**
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

  _Selected variant ID:_ **`3bb444b44d204650a5b792cd0eedb6dd`** ("Search Results Dropdown")
  _Reasoning:_ Exercise name left + color-coded % badge right matches the spec exactly; avoids dividers which conflict with the design system's No-Line Rule.

- [x] **Step 2: Write failing service test**

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

  Expected: FAIL with `Cannot find module '../services/exerciseSearchService'`

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

  Expected: PASS (2 tests)

- [ ] **Step 6: Replace `NLPSearchBar.tsx` with fully wired version** (use layout from selected Stitch variant)

  Replace entire contents of `src/components/Search/NLPSearchBar.tsx`:

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
    const [query, setQuery]               = useState('')
    const [results, setResults]           = useState<SearchResult[]>([])
    const [activeIndex, setActiveIndex]   = useState(-1)
    const [modelLoading, setModelLoading] = useState(false)
    const activeQuery                     = useRef('')
    const debouncedQuery                  = useDebouncedValue(query, 300)

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

  _Selected variant ID:_ **`c3e4182d74564ff2b0b5afcc903af7fe`** ("Exercise Card Showcase")
  _Reasoning:_ Variant A places the match pill inline with the name/tier badge row, matching the plan spec exactly, and demonstrates all three color states (green/amber/red) plus the hidden-when-absent case without adding data fields that don't exist in the model.

- [x] **Step 2: Add `matchScore` prop to `ExerciseCard.tsx`**

  In `src/components/ExerciseCard.tsx`, update the `ExerciseCardProps` interface (currently at line 22–25) and function signature:

  ```tsx
  interface ExerciseCardProps {
    exercise: ExerciseData
    onSelect: (exercise: ExerciseData) => void
    matchScore?: number
  }

  export default function ExerciseCard({ exercise, onSelect, matchScore }: ExerciseCardProps) {
  ```

  Inside the name/tier row (wherever the tier badge `<span>` is rendered), add immediately after it:

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

- [x] **Step 3: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/ExerciseCard.tsx
  git commit -m "feat(search): optional matchScore confidence badge on ExerciseCard"
  ```

**Acceptance:** `matchScore` undefined → no badge (no regression to existing callers). `matchScore=0.92` → green "92% Match" pill. `matchScore=0.65` → amber. `matchScore=0.40` → red. **STATUS: DONE**

---

### Phase 5.1: Prestige wiring + 2s particle flash [STITCH UI]

**Depends on:** Nothing (independent — unblocked now).
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

  `onPrestige?: () => void` prop already exists at line 6. The current `handlePrestige` (line 18–21) only calls `onPrestige?.()` + `setDismissed(true)` and does NOT call `forgeMasterwork()`. Fix:

  Add import at top of `src/components/hero/MasterworkModal.tsx`:
  ```tsx
  import { forgeMasterwork } from '../../services/heroMathService'
  ```

  Replace `handlePrestige`:
  ```tsx
  function handlePrestige() {
    void forgeMasterwork()
    onPrestige?.()
    setDismissed(true)
  }
  ```

- [ ] **Step 4: Add `onAscend` prop to `SummitModal.tsx`**

  `SummitModal` currently calls `ascend()` in `handleAscend` but has no external callback. Add:

  Update `src/components/hero/SummitModal.tsx` — add props interface before `export function SummitModal`:

  ```tsx
  interface SummitModalProps {
    onAscend?: () => void
  }

  export function SummitModal({ onAscend }: SummitModalProps) {
  ```

  Update `handleAscend` (currently lines 15–18):
  ```tsx
  function handleAscend() {
    setDismissed(true)
    ascend()
    onAscend?.()
  }
  ```

- [ ] **Step 5: Wire flash + updated modals into `HeroOverlay.tsx`**

  Add to the import block in `src/components/hero/HeroOverlay.tsx`:
  ```tsx
  import { PrestigeFlash } from './PrestigeFlash'
  ```

  Add state inside `HeroOverlay()` (after existing state declarations):
  ```tsx
  const [prestigeFlashActive, setPrestigeFlashActive] = useState(false)
  ```

  Update modal renders at lines 66–67 (currently `<SummitModal />` and `<MasterworkModal />` with no props):
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

**Depends on:** Nothing (independent — unblocked now).
**Files:**
- Modify: `src/components/hero/HeroOverlay.tsx`

#### Stitch Selection — Phase 5.2

- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Full-screen dark RPG background cross-fade transition: left state is dark obsidian dungeon stairs, right state is orange forge fire embers. 500ms opacity cross-fade between the two backgrounds."
  - **Prompt B:** "Smooth 500ms background transition in a dark fitness RPG app, fading between a cool slate/indigo staircase scene and a warm amber/orange forge fire scene, full-screen fixed overlay"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Add `TheForge` + `motion` imports and AnimatePresence cross-fade to `HeroOverlay.tsx`**

  Add to the framer-motion import (currently `import { AnimatePresence } from 'framer-motion'`):
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  ```

  Add TheForge import:
  ```tsx
  import { TheForge } from './TheForge'
  ```

  Find line 59: `{track.active === 'power' && <ObsidianStairs progress={track.power} />}`

  Replace it with:
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

**Acceptance:** TheForge renders when `track.active !== 'power'` (was missing entirely); ObsidianStairs renders when `track.active === 'power'`; switching Primary Goal in settings cross-fades over 500ms; both backgrounds never visible simultaneously.

---

### Phase 8.1: `HeroErrorBoundary.tsx`

**Depends on:** Nothing (independent — unblocked now).
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

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm run test -- HeroErrorBoundary
  ```

  Expected: FAIL with `Cannot find module '../components/UI/HeroErrorBoundary'`

- [ ] **Step 3: Implement `HeroErrorBoundary.tsx`**

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

- [ ] **Step 4: Run test to verify it passes + commit**

  ```bash
  npm run test -- HeroErrorBoundary
  git add src/components/UI/HeroErrorBoundary.tsx src/test/HeroErrorBoundary.test.tsx
  git commit -m "feat(ui): HeroErrorBoundary class component calls onFallback on canvas crash"
  ```

**Acceptance:** Child throw → renders null + calls `onFallback` once; healthy children render normally.

---

### Phase 8.2: Wrap `HeroOverlay` in boundary + RAF try/catch + toast

**Depends on:** 8.1 committed.
**Note:** No toast system exists in the codebase — zero matches for sonner/useToast. Install `sonner` first.
**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/main.tsx` (add `<Toaster />`)
- Modify: `src/App.tsx`
- Modify: `src/components/hero/TheForge.tsx`
- Modify: `src/components/hero/CombatCanvas.tsx`

- [ ] **Step 1: Install `sonner`**

  ```bash
  npm install sonner
  ```

  Expected output: `added 1 package` (sonner has no peer deps). Confirm: `npm run build` should succeed with no new TS errors.

- [ ] **Step 2: Add `<Toaster />` to `src/main.tsx`**

  Read `src/main.tsx`. Add to imports:
  ```tsx
  import { Toaster } from 'sonner'
  ```

  Add `<Toaster position="bottom-center" richColors />` inside the `<React.StrictMode>` block alongside the existing root:
  ```tsx
  <React.StrictMode>
    <App />
    <Toaster position="bottom-center" richColors />
  </React.StrictMode>
  ```

- [ ] **Step 3: Read `src/App.tsx` to confirm `<HeroOverlay />` location**

  Confirm `<HeroOverlay />` is inside `UIModeProvider` (so `useUIMode()` can be called inside the provider).

- [ ] **Step 4: Add `HeroOverlayWithBoundary` wrapper to `App.tsx`**

  Add imports to `src/App.tsx`:
  ```tsx
  import { toast } from 'sonner'
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Add before the default export (not as a named export):
  ```tsx
  function HeroOverlayWithBoundary() {
    const { setUIMode } = useUIMode()
    return (
      <HeroErrorBoundary onFallback={() => {
        setUIMode('focus')
        toast.error('Hero overlay crashed — switched to Focus Mode', { duration: 4000 })
      }}>
        <HeroOverlay />
      </HeroErrorBoundary>
    )
  }
  ```

  Replace `<HeroOverlay />` with `<HeroOverlayWithBoundary />`.

- [ ] **Step 5: Add RAF try/catch in `TheForge.tsx`**

  Read `src/components/hero/TheForge.tsx`. Find the `tick()` function inside the animation useEffect. Wrap the draw body so RAF errors propagate to the error boundary:

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

- [ ] **Step 6: Add RAF try/catch in `CombatCanvas.tsx`**

  Read `src/components/hero/CombatCanvas.tsx`. Find the `step()` function. Apply the same pattern:

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

- [ ] **Step 7: Run full tests + commit**

  ```bash
  npm run test
  git add src/main.tsx src/App.tsx src/components/hero/TheForge.tsx src/components/hero/CombatCanvas.tsx
  git commit -m "feat(ui): wrap HeroOverlay in HeroErrorBoundary with sonner toast, add RAF error rethrow for canvas fallback"
  ```

**Acceptance:** Forced throw in RAF → overlay collapses → `uiMode` snaps to `'focus'` → sonner toast "Hero overlay crashed — switched to Focus Mode" appears at bottom-center; Blueprint/Logger remain interactive; `'professional'` mode never used.

---

### Phase 7.1: Verify `completedAscensions` Roman numeral badge updates in real-time

**Depends on:** 5.1 committed (prestige wiring live).
**Files:**
- Read: `src/pages/HomePage.tsx` (or wherever PrestigeBadge is rendered)
- Possibly modify: same file

- [ ] **Step 1: Confirm wiring**

  ```bash
  grep -n "PrestigeBadge\|completedAscensions" src/components/SessionBlueprint.tsx src/pages/HomePage.tsx 2>/dev/null
  ```

  Expected: `PrestigeBadge` rendered with `completedAscensions` from a `useLiveQuery` hook. If present — no code change needed, jump to Step 4.

- [ ] **Step 2: If `PrestigeBadge` is missing or lacks live data, add it**

  Add to imports in the relevant file:
  ```tsx
  import { PrestigeBadge } from '../components/PrestigeBadge'
  ```

  Ensure `completedAscensions` comes from `useLiveQuery`:
  ```tsx
  const settings = useLiveQuery(() => db.settings.get(APP_SETTINGS_ID))
  const completedAscensions = settings?.completedAscensions ?? 0
  ```

  Add in header JSX:
  ```tsx
  <PrestigeBadge ascensions={completedAscensions} />
  ```

- [ ] **Step 3: Confirm reactivity**

  `useLiveQuery` re-runs whenever `db.settings.update(APP_SETTINGS_ID, { completedAscensions: n+1 })` fires (called by `ascend()` and `forgeMasterwork()`). No additional code needed if already wired.

- [ ] **Step 4: Write or update `PrestigeBadge` test**

  Create/update `src/test/PrestigeBadge.test.tsx`:

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

- [ ] **Step 5: Run tests + commit if any files changed**

  ```bash
  npm run test -- PrestigeBadge
  # Only commit if Step 2 made changes:
  git add src/pages/HomePage.tsx src/test/PrestigeBadge.test.tsx
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
- [ ] TheForge renders when `track.active !== 'power'` (was previously missing entirely).
- [ ] Hero overlay survives forced canvas error → snaps to `uiMode = 'focus'` + sonner toast.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| No toast system in codebase | Phase 8.2 Step 1 installs `sonner` before touching App.tsx |
| `UIMode` has no `'professional'` | Use `setUIMode('focus')` — confirmed `'focus' \| 'hero'` |
| `MasterworkModal.handlePrestige` never called `forgeMasterwork()` | Phase 5.1 Step 3 adds the import + call — confirmed missing |
| `TheForge` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds import — confirmed missing from imports |
| `motion` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds `motion` to framer-motion import — currently only `AnimatePresence` |
| `SummitModal`/`MasterworkModal` rendered with no props | Phase 5.1 Step 5 adds `onAscend` and `onPrestige` — confirmed zero props at lines 66–67 |
| `@xenova/transformers` progress_callback API may vary | Worker sends no progress if it throws — graceful degradation |
| RAF errors don't reach React error boundary natively | `try/catch` + rethrow pattern in Phase 8.2 resolves this |
| Both prestige modals active simultaneously | Each is independently dismissed; flash fires for whichever button is pressed first |
| `ExerciseCard` used in `ActiveLogger` without `matchScore` | `matchScore` is optional — no prop → no badge rendered (no regression) |
| Stitch MCP unavailable | Stop and fix connectivity; never skip Stitch for [STITCH UI] tasks |
| Phase 5.3 (Brain Initializing) appears separately in TODO | Integrated into Phase 3.3; closing 3.3 closes 5.3 |

---

## 5. Execution order

| Step | Task | State |
|---|---|---|
| 1–21 | All combat, data prep, merge, seed, embeddingWorker, useDebouncedValue | ~~DONE~~ |
| 22 | 3.1 — NLPSearchBar scaffold | ~~DONE~~ `c19352a` |
| 23 | 3.3 — exerciseSearchService + full NLPSearchBar [STITCH UI] | ~~DONE~~ `174f504` |
| 24 | 3.5 — ExerciseCard confidence badge [STITCH UI] | ~~DONE~~ (this session) |
| **24‖** | **5.1 — Prestige wiring + PrestigeFlash [STITCH UI]** | **← NEXT (parallel, unblocked)** |
| **24‖** | **5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI]** | **← NEXT (parallel, unblocked)** |
| **24‖** | **8.1 — HeroErrorBoundary** | **← NEXT (parallel, unblocked)** |
| 25 | 8.2 — Wrap overlay + RAF safety + toast (needs 8.1) | — |
| 26 | 7.1 — Verify completedAscensions badge (needs 5.1) | — |

Check the corresponding `TODO.md` checkbox in the same commit as each implementation.

---

## 6. Exact next task

> **STATUS:** 3.3 (`174f504`) committed — Phase 5.3 closed with it. **Four tasks are now unblocked and fully independent — run in parallel:**
>
> **3.5 [STITCH UI]** — Generate 2 Stitch variants for the ExerciseCard confidence badge. Pick one. Add optional `matchScore?: number` prop to `ExerciseCardProps` in `src/components/ExerciseCard.tsx`. Render green/amber/red pill after the tier badge when `matchScore !== undefined`. Run tests. Commit `feat(search): optional matchScore confidence badge on ExerciseCard`. **Check the Phase 1 TODO checkbox in the same commit.**
>
> **5.1 [STITCH UI]** — Generate 2 Stitch variants for PrestigeFlash. Pick one. Create `src/components/hero/PrestigeFlash.tsx`. Add `forgeMasterwork()` import+call to `MasterworkModal.handlePrestige` (currently missing). Add `onAscend` prop to `SummitModal` (currently no props). Wire both modals + flash in `HeroOverlay`. Commit `feat(hero): wire forgeMasterwork to MasterworkModal + 2s PrestigeFlash on ascend/forge`. **Check the Phase 5 TODO checkbox.**
>
> **5.2 [STITCH UI]** — Generate 2 Stitch variants for cross-fade. Pick one. Add `TheForge` + `motion` imports to `HeroOverlay` (both currently missing). Replace line 59 single-branch with `AnimatePresence mode="wait"` wrapping both `ObsidianStairs` and `TheForge` (500ms opacity). Commit `feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch`. **Check the Phase 5 TODO checkbox.**
>
> **8.1** — Create `src/components/UI/HeroErrorBoundary.tsx` + `src/test/HeroErrorBoundary.test.tsx`. Class component catches, renders null, calls `onFallback`. TDD: write test first, verify fail, implement, verify pass. Commit `feat(ui): HeroErrorBoundary class component calls onFallback on canvas crash`. **Check Phase 4 first TODO checkbox.**
>
> **After all four committed:**
> - Run **8.2** (install `sonner` → add `<Toaster />` to `main.tsx` → wrap `HeroOverlay` in `App.tsx` → RAF try/catch in `TheForge` + `CombatCanvas`). **Check Phase 4 second TODO checkbox.**
> - Run **7.1** (verify `completedAscensions` in `SessionBlueprint.tsx` line 758 uses `useLiveQuery`; add if missing). **Check Phase 5 last TODO checkbox.**
> - Mark the Brain Initializing TODO checkbox (Phase 5 item 3) as done — it shipped in `174f504`.
