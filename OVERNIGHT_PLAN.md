# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining unchecked TODO.md items (Phases 2.3, 3, 4, 6, 8) with TDD, one commit per task, zero inline comments.

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay lives in `src/components/hero/`. Search lives in `src/components/Search/`. Error boundary in `src/components/UI/`. Tests in `src/test/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict. Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-17 (replan pass #9)

---

## 0. Live-state snapshot (pass #9, 2026-04-17)

| Item | State | Commit |
|---|---|---|
| P0 schema + Forge + track progress | **DONE** | `69473be` |
| 7.4 PrestigeBadge in HomePage | **DONE** | `c7d3eb1` |
| 5.1 useSensoryFeedback scaffold | **DONE** | `da34b7c` |
| 5.2 heavyDouble/lightTap tests | **DONE** | `898111c` |
| 2.1 ObsidianStairs 3-layer parallax | **DONE** | `49365f8` |
| 2.2 Lightning Strike (useLightningOnPR) | **DONE** | `60a3dc4` |
| 2.3 SummitModal | **DONE** | `ba67a46` |
| Phase 3 all (NLPSearchBar, debounce, search service, dropdown, badge) | **MISSING** | — |
| Phase 4 all (raw JSONs, merge, execute, chunked embed) | **MISSING** | — |
| Phase 6 all (tonnage field, HitCombo, DamageNumber) | **MISSING** | — |
| Phase 8 all (HeroErrorBoundary, wrap overlay) | **MISSING** | — |

### Critical corrections verified from live files (pass #9 — file reads confirmed)

| Assumption | Reality (verified pass #9, 2026-04-17) |
|---|---|
| SummitModal mounts in `HomePage.tsx` | **`HeroOverlay.tsx` lines 48–49** — `<SummitModal />` and `<MasterworkModal />` already mounted |
| Phase 8.2 wraps `HeroOverlay` in `HomePage.tsx` | **`App.tsx` line 97** — `<HeroOverlay />` is inside `App.tsx`, not `HomePage` |
| `exercises.json` is empty / doesn't exist | **Exists with 53 old entries**; Phase 4.7 overwrites it with 300-entry seeded library |
| `src/data/raw/` exists | **Does NOT exist** — must be created by Phase 4.1–4.5 |
| `src/components/Search/` exists | **Does NOT exist** — created by Phase 3.1 |
| `src/components/UI/` exists | **Does NOT exist** — created by Phase 8.1 |
| `MasterworkModal` accepts `hypertrophyProgress` prop | **Self-contained** — uses `useHeroProgress()` internally, optional `onPrestige?` prop |
| `SummitModal` accepts `powerProgress` prop | **Self-contained** — uses `useTrackProgress()` internally (confirmed `ba67a46`) |
| `ascend()` takes no args | **`ascend(dbInstance?: IronProtocolDB)`** — call as `ascend()`, default arg handles DB |
| `PersonalBest.flagged` stored as `1` | **`boolean`** → use `.equals(true)` / `.filter(pb => pb.flagged === true)` |
| `UIMode` includes `'professional'` | **`'focus' \| 'hero'` only** (UIModeContext.tsx line 4) → use `setUIMode('focus')` in Phase 8.2 |
| `db.embeddings` table exists | **No embeddings table** — embeddings stored as `exercise.embedding: number[]` |
| `getEmbedding` is `localAIService.getEmbedding()` method | **Named export** `import { getEmbedding } from './localAIService'` |
| `dispatchCombat(intensity, tonnage?)` | **`dispatchCombat(intensity: number)` only** (UIModeContext.tsx line 14) — Phase 6.1 extends it |
| `PendingBash` has `tonnage` field | **`{ intensity: number; id: string }` only** (UIModeContext.tsx lines 6–9) — Phase 6.1 adds `tonnage?` |
| `HeroOverlay` monitors `pendingBash` | **Confirmed**: useEffect at lines 26–36 watches `pendingBash.id` — Phase 6.3 wires `DamageNumber` here |
| `cosineSimilarity` needs to be created | **Already exists** in `src/utils/vectorMath.ts` |

---

## 1. Dependency graph

```
2.3 (SummitModal) ─► mounts in HeroOverlay
6.1 → 6.2 → 6.3  (combat V2, independent of 2.3)
4.1–4.5 (parallel) → 4.6 → 4.7 → 4.8 → 3.1 → 3.2 → 3.3 → 3.4
8.1 → 8.2  (last — wraps everything above)
```

**Critical path:** 2.3 → 6.1 → 6.2 → 6.3 → [4.x chain] → 3.x chain → 8.1 → 8.2

---

## 2. Per-item execution plan

---

### Phase 2.3: `SummitModal.tsx`

- **Depends on:** P0 committed (`ascend()` in `heroMathService`); `useTrackProgress` available.
- **Files:**
  - Create `src/components/hero/SummitModal.tsx`
  - Create `src/test/SummitModal.test.tsx`
  - Modify `src/components/hero/HeroOverlay.tsx`

**Steps:**

- [ ] **Step 1: Read `MasterworkModal.tsx` and `HeroOverlay.tsx`**

  Confirm `MasterworkModal` is self-contained (uses `useHeroProgress()` internally). Confirm HeroOverlay has `track = useTrackProgress()` and renders `ObsidianStairs` + `CombatCanvas`.

- [ ] **Step 2: Write failing test**

  Create `src/test/SummitModal.test.tsx`:

  ```tsx
  // @vitest-environment jsdom
  import { render, screen, fireEvent } from '@testing-library/react'
  import { describe, it, expect, vi } from 'vitest'

  vi.mock('../hooks/useTrackProgress', () => ({
    useTrackProgress: vi.fn(() => ({ power: 0.5, hypertrophy: 0.5, active: 'power' })),
  }))
  vi.mock('../services/heroMathService', () => ({ ascend: vi.fn().mockResolvedValue(undefined) }))
  vi.mock('framer-motion', () => ({
    motion: { div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
               button: ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...p}>{children}</button> },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }))

  import { SummitModal } from '../components/hero/SummitModal'
  import { useTrackProgress } from '../hooks/useTrackProgress'

  const mockTrack = useTrackProgress as ReturnType<typeof vi.fn>

  describe('SummitModal', () => {
    it('renders nothing when power < 1.0', () => {
      mockTrack.mockReturnValue({ power: 0.9, hypertrophy: 0, active: 'power' })
      const { container } = render(<SummitModal />)
      expect(container.firstChild).toBeNull()
    })

    it('renders when power >= 1.0', () => {
      mockTrack.mockReturnValue({ power: 1.0, hypertrophy: 0, active: 'power' })
      render(<SummitModal />)
      expect(screen.getByText(/The Summit is Attained/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Ascend/i })).toBeTruthy()
    })

    it('hides after Ascend is clicked', async () => {
      mockTrack.mockReturnValue({ power: 1.0, hypertrophy: 0, active: 'power' })
      render(<SummitModal />)
      fireEvent.click(screen.getByRole('button', { name: /Ascend/i }))
      expect(screen.queryByText(/The Summit is Attained/i)).toBeNull()
    })
  })
  ```

- [ ] **Step 3: Run test to verify it fails**

  ```bash
  npm run test -- SummitModal
  ```

- [ ] **Step 4: Implement `SummitModal.tsx`**

  Create `src/components/hero/SummitModal.tsx`:

  ```tsx
  import { useState } from 'react'
  import { AnimatePresence, motion } from 'framer-motion'
  import { useTrackProgress } from '../../hooks/useTrackProgress'
  import { ascend } from '../../services/heroMathService'

  const springIn  = { type: 'spring', stiffness: 300, damping: 24 } as const
  const springOut = { duration: 0.18 } as const

  export function SummitModal() {
    const track = useTrackProgress()
    const [dismissed, setDismissed] = useState(false)

    const visible = track.power >= 1.0 && !dismissed

    async function handleAscend() {
      await ascend()
      setDismissed(true)
    }

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="summit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: springOut }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => setDismissed(true)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: springIn }}
              exit={{ opacity: 0, scale: 0.9, y: 12, transition: springOut }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'linear-gradient(160deg, #00101c 0%, #001e2e 55%, #000d1a 100%)',
                border: '1px solid rgba(20, 180, 255, 0.45)',
                borderRadius: 18,
                padding: '2.5rem 2rem 2rem',
                maxWidth: 360,
                width: '90vw',
                textAlign: 'center',
                boxShadow:
                  '0 0 0 1px rgba(20,180,255,0.12), 0 8px 40px rgba(20,180,255,0.25), 0 0 80px rgba(0,120,220,0.15)',
              }}
            >
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #40c8ff 0%, #0088cc 60%, #003050 100%)',
                  boxShadow: '0 0 28px rgba(20, 180, 255, 0.7)',
                }}
              />
              <h2 style={{ color: '#60d0ff', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '0.02em' }}>
                The Summit is Attained
              </h2>
              <p style={{ color: 'rgba(150, 220, 255, 0.78)', fontSize: '0.88rem', lineHeight: 1.65, margin: '0 0 28px' }}>
                You have conquered the Power track. Ascend and carry your strength into eternity.
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={springIn}
                onClick={handleAscend}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'linear-gradient(135deg, #0096d6 0%, #005899 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '0.8rem 0',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 22px rgba(20, 180, 255, 0.35)',
                }}
              >
                Ascend
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  ```

- [ ] **Step 5: Run test to verify it passes**

  ```bash
  npm run test -- SummitModal
  ```

- [ ] **Step 6: Mount in `HeroOverlay.tsx`**

  Add to `src/components/hero/HeroOverlay.tsx`:

  ```tsx
  import { SummitModal } from './SummitModal'
  import { MasterworkModal } from './MasterworkModal'
  ```

  Inside the return fragment (after `<CombatCanvas />`):

  ```tsx
  <SummitModal />
  <MasterworkModal />
  ```

  Both are self-contained — they gate on their own track progress via hooks.

- [ ] **Step 7: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/hero/SummitModal.tsx src/test/SummitModal.test.tsx src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): SummitModal at power track 1.0 with Ascend prestige trigger"
  ```

  Also update the TODO.md checkbox for Phase 2.3 in the same commit:
  ```bash
  # In the commit, also stage TODO.md after checking the box for SummitModal
  ```

- **Acceptance:** Cold-blue modal appears at exactly `track.power >= 1.0`; clicking Ascend calls `ascend()` and dismisses; distinct from orange MasterworkModal; clicking backdrop dismisses without ascending.
- **Risk:** `useTrackProgress` returns `{ power, hypertrophy, active }` — verify field names match `TrackProgress` type in test mock.

---

### Phase 6.1: Add optional `tonnage` to bash burst type

- **Depends on:** P0 committed.
- **Files:**
  - Modify `src/context/UIModeContext.tsx`

**Steps:**

- [ ] **Step 1: Read `UIModeContext.tsx`**

  Confirm current `PendingBash = { intensity: number; id: string }` and `dispatchCombat(intensity: number)`.

- [ ] **Step 2: Extend `PendingBash` and `dispatchCombat`**

  In `src/context/UIModeContext.tsx`, change:

  ```tsx
  interface PendingBash {
    intensity: number
    id: string
    tonnage?: number
  }

  interface UIModeContextValue {
    uiMode: UIMode
    setUIMode: (mode: UIMode) => void
    dispatchCombat: (intensity: number, tonnage?: number) => void
    pendingBash: PendingBash | null
  }
  ```

  Change the `dispatchCombat` callback:

  ```tsx
  const dispatchCombat = useCallback((intensity: number, tonnage?: number) => {
    setPendingBash({ intensity, id: crypto.randomUUID(), ...(tonnage !== undefined ? { tonnage } : {}) })
  }, [])
  ```

- [ ] **Step 3: Run full tests**

  ```bash
  npm run test
  ```

  Expected: all pass — optional field addition is backward-compatible.

- [ ] **Step 4: Commit**

  ```bash
  git add src/context/UIModeContext.tsx
  git commit -m "feat(combat): add optional tonnage field to bash burst type"
  ```

- **Acceptance:** Existing tests unbroken; callers that don't pass `tonnage` are unaffected.

---

### Phase 6.2: `HitCombo` multiplier counter

- **Depends on:** 6.1 committed.
- **Files:**
  - Create `src/hooks/useHitCombo.ts`
  - Create `src/test/useHitCombo.test.ts`
  - Create `src/components/hero/ComboCounter.tsx`
  - Modify `src/components/hero/HeroOverlay.tsx`

**Steps:**

- [ ] **Step 1: Write failing hook test**

  Create `src/test/useHitCombo.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { renderHook } from '@testing-library/react'
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

  vi.mock('../context/UIModeContext', () => ({
    useUIMode: () => ({ pendingBash: null }),
  }))

  import { useHitCombo } from '../hooks/useHitCombo'

  describe('useHitCombo', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('starts at 0 combo', () => {
      const { result } = renderHook(() => useHitCombo())
      expect(result.current.comboCount).toBe(0)
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npm run test -- useHitCombo
  ```

- [ ] **Step 3: Implement `useHitCombo.ts`**

  Create `src/hooks/useHitCombo.ts`:

  ```ts
  import { useEffect, useRef, useState } from 'react'
  import { useUIMode } from '../context/UIModeContext'

  const COMBO_WINDOW_MS = 120_000

  export function useHitCombo() {
    const { pendingBash } = useUIMode()
    const [comboCount, setComboCount] = useState(0)
    const lastId      = useRef<string | null>(null)
    const expiresAt   = useRef<number>(0)
    const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      if (!pendingBash || pendingBash.id === lastId.current) return
      lastId.current = pendingBash.id
      const now = Date.now()
      if (now > expiresAt.current) {
        setComboCount(1)
      } else {
        setComboCount(prev => prev + 1)
      }
      expiresAt.current = now + COMBO_WINDOW_MS
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setComboCount(0), COMBO_WINDOW_MS)
    }, [pendingBash])

    return { comboCount }
  }
  ```

- [ ] **Step 4: Implement `ComboCounter.tsx`**

  Create `src/components/hero/ComboCounter.tsx`:

  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'

  interface ComboCounterProps {
    count: number
  }

  export function ComboCounter({ count }: ComboCounterProps) {
    return (
      <AnimatePresence>
        {count >= 2 && (
          <motion.div
            key={count}
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2 text-center"
          >
            <span className="text-4xl font-black tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
              {count}x COMBO
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
  ```

- [ ] **Step 5: Mount in `HeroOverlay.tsx`**

  Read `src/components/hero/HeroOverlay.tsx`. Add:

  ```tsx
  import { useHitCombo } from '../../hooks/useHitCombo'
  import { ComboCounter } from './ComboCounter'

  // inside HeroOverlay():
  const { comboCount } = useHitCombo()

  // in JSX fragment:
  <ComboCounter count={comboCount} />
  ```

- [ ] **Step 6: Run full tests**

  ```bash
  npm run test
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/hooks/useHitCombo.ts src/test/useHitCombo.test.ts src/components/hero/ComboCounter.tsx src/components/hero/HeroOverlay.tsx
  git commit -m "feat(combat): HitCombo multiplier counter with 2-minute window"
  ```

- **Acceptance:** 3 sets within 2 min shows "3x COMBO"; waiting past window resets to 0; displayed only when count ≥ 2.

---

### Phase 6.3: Floating damage numbers

- **Depends on:** 6.1 (burst has `tonnage`).
- **Files:**
  - Create `src/components/hero/DamageNumber.tsx`
  - Modify `src/components/hero/HeroOverlay.tsx`

**Steps:**

- [ ] **Step 1: Implement `DamageNumber.tsx`**

  Create `src/components/hero/DamageNumber.tsx`:

  ```tsx
  import { motion } from 'framer-motion'

  interface DamageNumberProps {
    value: number
    id: string
    intensity: number
  }

  export function DamageNumber({ value, id, intensity }: DamageNumberProps) {
    const isHeavy = intensity > 0.6
    return (
      <motion.span
        key={id}
        initial={{ y: 0, opacity: 0, x: (Math.random() - 0.5) * 60 }}
        animate={{ y: -80, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`pointer-events-none absolute select-none font-black tabular-nums ${
          isHeavy ? 'text-3xl text-red-400' : 'text-xl text-white/70'
        }`}
        style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }}
        aria-hidden
      >
        {value}
      </motion.span>
    )
  }
  ```

- [ ] **Step 2: Wire into `HeroOverlay.tsx`**

  Read `src/components/hero/HeroOverlay.tsx`. Add a `damageNumbers` state array (max 6, FIFO). In the `useEffect` that watches `pendingBash`, after the existing `setBurst()` call:

  ```tsx
  import { DamageNumber } from './DamageNumber'

  // state:
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; value: number; intensity: number }>>([])

  // inside the pendingBash useEffect, after setBurst():
  const raw = pendingBash.tonnage ?? pendingBash.intensity ?? 0.5
  const value = Math.round(raw * 100)
  setDamageNumbers(prev => [...prev, { id: pendingBash.id, value, intensity: pendingBash.intensity }].slice(-6))

  // in JSX fragment:
  <AnimatePresence>
    {damageNumbers.map(d => <DamageNumber key={d.id} {...d} />)}
  </AnimatePresence>
  ```

- [ ] **Step 3: Run full tests**

  ```bash
  npm run test
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/hero/DamageNumber.tsx src/components/hero/HeroOverlay.tsx
  git commit -m "feat(combat): floating damage numbers mapped to set tonnage/intensity"
  ```

- **Acceptance:** Heavy set (intensity > 0.6) → large red number; light set → small white/gray number; max 6 concurrent; keyed by burst id.

---

### Phase 4.1–4.5: Generate five raw exercise JSON files

> **These five can run as parallel subagents.** Each writes one file. Each subagent validates uniqueness within its file. Phase 4.6 checks cross-file uniqueness.

**Schema (all five files, strict):**

```ts
{
  id: string            // kebab-case, prefixed per file (see below)
  name: string
  technical_cues: string[]   // 3–6 imperative-voice strings
  biomechanical_why: string  // ≥ 3 sentences: primary movers, origins/insertions, leverage, failure mode
}
```

**ID prefix per file:**

| File | Prefix | Muscle focus |
|---|---|---|
| `src/data/raw/chest_back.json` | `cb-` | Chest + Back |
| `src/data/raw/legs_core.json` | `lc-` | Quads, Hamstrings, Glutes, Calves, Core |
| `src/data/raw/shoulders_arms.json` | `sa-` | Deltoids, Biceps, Triceps, Forearms |
| `src/data/raw/functional_cables.json` | `fc-` | Unilateral, Cables, Functional mobility |
| `src/data/raw/power_strongman.json` | `ps-` | Olympic lifts, Strongman, Heavy compound variations |

**Acceptance per file:** Exactly 60 distinct entries. No duplicate `id`. No duplicate lowercased `name`. `biomechanical_why` ≥ 3 sentences. `technical_cues` has 3–6 entries. Valid JSON (`JSON.parse` succeeds). Array is the top-level structure (not wrapped in an object).

**Commit per file:**

```bash
git add src/data/raw/<filename>.json
git commit -m "feat(data): seed 60 <category> exercises"
```

---

### Phase 4.6: `mergeExercises.ts` utility

- **Depends on:** 4.1–4.5 all committed.
- **Files:**
  - Create `src/utils/mergeExercises.ts`
  - Create `src/test/mergeExercises.test.ts`

**Important:** The `Exercise` type in `src/db/schema.ts` does NOT have `technical_cues` or `biomechanical_why`. These fields exist only in the raw JSON. The merge utility **drops** them to produce DB-compatible `Exercise` objects. `tier` is `1 | 2 | 3` (numeric), not `'T1' | 'T2' | 'T3'`.

**Steps:**

- [ ] **Step 1: Read `src/db/schema.ts` lines 1–20**

  Confirm `Exercise` interface fields: `id, name, muscleGroup, mediaType, mediaRef, tags, tier (1|2|3), embedding?`.

- [ ] **Step 2: Write failing test**

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
      const ids = result.map(e => e.id)
      expect(new Set(ids).size).toBe(300)
    })

    it('has no duplicate lowercased names', async () => {
      const result = await mergeRawExercises()
      const names = result.map(e => e.name.toLowerCase())
      expect(new Set(names).size).toBe(300)
    })

    it('all entries have required Exercise fields with numeric tier', async () => {
      const result = await mergeRawExercises()
      for (const e of result) {
        expect(typeof e.id).toBe('string')
        expect(typeof e.name).toBe('string')
        expect(typeof e.muscleGroup).toBe('string')
        expect([1, 2, 3]).toContain(e.tier)
        expect('technical_cues' in e).toBe(false)
        expect('biomechanical_why' in e).toBe(false)
      }
    })
  })
  ```

- [ ] **Step 3: Run test to verify it fails**

  ```bash
  npm run test -- mergeExercises
  ```

- [ ] **Step 4: Implement `mergeExercises.ts`**

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
      return /curl|tricep|hammer|press.?down/.test(lc) ? 'arms' : 'shoulders'
    }
    return FILE_META[filename]?.baseMuscleGroup ?? 'other'
  }

  function inferTier(name: string, tags: string[]): 1 | 2 | 3 {
    const lc = name.toLowerCase()
    const isT1 = ['bench press', 'squat', 'deadlift', 'overhead press', 'barbell row', 'clean', 'snatch', 'jerk'].some(k => lc.includes(k))
    if (isT1 || tags.includes('power')) return 1
    if (tags.includes('compound') || tags.includes('cable')) return 2
    return 3
  }

  export async function mergeRawExercises(): Promise<Exercise[]> {
    const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json')).sort()
    const allRaw: Array<RawEntry & { _file: string }> = []

    for (const file of files) {
      const raw: unknown = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'))
      const entries: RawEntry[] = Array.isArray(raw) ? raw : (raw as { exercises: RawEntry[] }).exercises
      entries.forEach(e => allRaw.push({ ...e, _file: file }))
    }

    const seenIds   = new Set<string>()
    const seenNames = new Set<string>()

    return allRaw.map(raw => {
      if (seenIds.has(raw.id))                   throw new Error(`Duplicate id: ${raw.id}`)
      if (seenNames.has(raw.name.toLowerCase()))  throw new Error(`Duplicate name: ${raw.name}`)
      seenIds.add(raw.id)
      seenNames.add(raw.name.toLowerCase())
      const tags        = [...(FILE_META[raw._file]?.tags ?? [])]
      const muscleGroup = inferMuscleGroup(raw._file, raw.name)
      const tier        = inferTier(raw.name, tags)
      return {
        id: raw.id, name: raw.name,
        muscleGroup, mediaType: 'none' as const, mediaRef: '',
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

  > **Note:** Output is a plain array (not wrapped in `{ exercises: [...] }`). `seedEmbeddings.ts` reads via `db.exercises.toArray()`, so exercises.json is only used as the seeding source — not read at runtime after DB is populated.

- [ ] **Step 5: Run test to verify it passes**

  ```bash
  npm run test -- mergeExercises
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/utils/mergeExercises.ts src/test/mergeExercises.test.ts
  git commit -m "feat(data): mergeExercises utility with cross-file dedup and tier inference"
  ```

- **Acceptance:** 300 entries, no dup ids/names, `tier` numeric (1/2/3), no `technical_cues`/`biomechanical_why` in output.

---

### Phase 4.7: Execute merge + overwrite `exercises.json`

- **Depends on:** 4.6 committed; all 5 raw files exist.
- **Note:** `src/data/exercises.json` currently has 53 old entries. This step replaces it.

**Steps:**

- [ ] **Step 1: Execute the merge script**

  ```bash
  npx tsx src/utils/mergeExercises.ts
  ```

  Expected: `Written 300 exercises to src/data/exercises.json`

- [ ] **Step 2: Verify output count**

  ```bash
  node -e "const d=require('./src/data/exercises.json'); const arr=Array.isArray(d)?d:(d.exercises||[]); console.log('count:', arr.length)"
  ```

  Expected: `count: 300`

- [ ] **Step 3: Delete raw dir**

  ```bash
  rm -rf src/data/raw
  ```

- [ ] **Step 4: Run full tests**

  ```bash
  npm run test
  ```

  Expected: all pass.

- [ ] **Step 5: Commit**

  ```bash
  git add src/data/exercises.json
  git rm -r src/data/raw
  git commit -m "chore(data): seed 300 exercises from raw partitions, delete raw dir"
  ```

- **Acceptance:** `exercises.json` has exactly 300 plain-array entries. `src/data/raw/` gone. Tests green.

---

### Phase 4.8: Refactor `seedEmbeddings.ts` to chunked batches

- **Depends on:** 4.7 committed.
- **Files:**
  - Modify `src/utils/seedEmbeddings.ts`
  - Create `src/test/seedEmbeddings.test.ts`

**Important live-state corrections:**
- `getEmbedding` is a named export: `import { getEmbedding } from '../services/localAIService'`
- Embeddings are stored on `db.exercises` as `exercise.embedding: number[]`, NOT in a separate `db.embeddings` table.
- Keep no-args signature `seedEmbeddings(): Promise<void>`.

**Steps:**

- [ ] **Step 1: Read `src/utils/seedEmbeddings.ts`**

  Understand current `buildExerciseText` and the per-item loop.

- [ ] **Step 2: Write failing test**

  Create `src/test/seedEmbeddings.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  const mockGetEmbedding = vi.fn().mockResolvedValue(new Array(384).fill(0))
  vi.mock('../services/localAIService', () => ({ getEmbedding: mockGetEmbedding }))

  const mockUpdate = vi.fn().mockResolvedValue(1)
  const fakeExercises = Array.from({ length: 10 }, (_, i) => ({
    id: `e${i}`, name: `Ex ${i}`, muscleGroup: 'chest', tags: [], tier: 3 as const,
    mediaType: 'none' as const, mediaRef: '', embedding: undefined,
  }))
  vi.mock('../db/db', () => ({
    db: {
      exercises: {
        toArray: vi.fn().mockResolvedValue(fakeExercises),
        update: mockUpdate,
      },
    },
  }))

  import { seedEmbeddings } from '../utils/seedEmbeddings'

  describe('seedEmbeddings chunked', () => {
    beforeEach(() => mockGetEmbedding.mockClear())

    it('calls getEmbedding once per exercise', async () => {
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

- [ ] **Step 3: Run test to verify it fails**

  ```bash
  npm run test -- seedEmbeddings
  ```

- [ ] **Step 4: Refactor `seedEmbeddings.ts`**

  Replace the file contents with:

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

- [ ] **Step 5: Run test to verify it passes**

  ```bash
  npm run test -- seedEmbeddings
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/utils/seedEmbeddings.ts src/test/seedEmbeddings.test.ts
  git commit -m "feat(data): seed embeddings in chunks of 5 with batch progress logging"
  ```

- **Acceptance:** 300 exercises process in 60 batches; console shows "Processed batch X of 60"; no OOM.

---

### Phase 3.1: `NLPSearchBar.tsx` scaffold

- **Depends on:** 4.8 committed (embeddings rich with 300 entries).
- **Files:**
  - Create `src/components/Search/NLPSearchBar.tsx`
  - Create `src/test/NLPSearchBar.test.tsx`

> **Create the `src/components/Search/` directory** by creating the first file inside it.

**Steps:**

- [ ] **Step 1: Write failing test**

  Create `src/test/NLPSearchBar.test.tsx`:

  ```tsx
  // @vitest-environment jsdom
  import { render, screen, fireEvent } from '@testing-library/react'
  import { describe, it, expect, vi } from 'vitest'
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

- [ ] **Step 2: Implement scaffold `NLPSearchBar.tsx`**

  Create `src/components/Search/NLPSearchBar.tsx`:

  ```tsx
  import { useState } from 'react'

  interface NLPSearchBarProps {
    onSelect: (exerciseId: string) => void
    placeholder?: string
  }

  export function NLPSearchBar({ onSelect: _onSelect, placeholder = 'Search exercises...' }: NLPSearchBarProps) {
    const [query, setQuery] = useState('')

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          aria-label={placeholder}
        />
      </div>
    )
  }
  ```

- [ ] **Step 3: Run test + commit**

  ```bash
  npm run test -- NLPSearchBar
  git add src/components/Search/NLPSearchBar.tsx src/test/NLPSearchBar.test.tsx
  git commit -m "feat(search): NLPSearchBar scaffold with controlled input"
  ```

---

### Phase 3.2: `useDebouncedValue` hook

- **Files:**
  - Create `src/hooks/useDebouncedValue.ts`
  - Create `src/test/useDebouncedValue.test.ts`

**Steps:**

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
  git commit -m "feat(search): add generic useDebouncedValue hook (300ms)"
  ```

---

### Phase 3.3: `exerciseSearchService.ts` + full NLPSearchBar wiring

- **Depends on:** 3.1, 3.2, 4.8 committed.
- **Files:**
  - Create `src/services/exerciseSearchService.ts`
  - Create `src/test/exerciseSearchService.test.ts`
  - Modify `src/components/Search/NLPSearchBar.tsx`

**Important:** No `db.embeddings` table — embeddings are on `exercise.embedding: number[]` in `db.exercises`. `cosineSimilarity` exists in `src/utils/vectorMath.ts`. `getEmbedding` is a named export from `localAIService`. Do NOT reuse `ExerciseCard` — it expects a full `ExerciseData` (session shape); the dropdown uses its own inline list item.

**Steps:**

- [ ] **Step 1: Confirm `cosineSimilarity` signature**

  ```bash
  head -3 src/utils/vectorMath.ts
  ```

  Expected: `export function cosineSimilarity(vecA: number[], vecB: number[]): number`

- [ ] **Step 2: Write failing service test**

  Create `src/test/exerciseSearchService.test.ts`:

  ```ts
  // @vitest-environment jsdom
  import { describe, it, expect, vi } from 'vitest'

  const mockGetEmbedding = vi.fn().mockResolvedValue([1, 0, 0])
  vi.mock('../services/localAIService', () => ({ getEmbedding: mockGetEmbedding }))
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
    it('returns exercises sorted by cosine similarity', async () => {
      const results = await searchExercises('bench press')
      expect(results[0].exerciseId).toBe('e1')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })

    it('result has exerciseId, name, score fields', async () => {
      const results = await searchExercises('bench press')
      expect(typeof results[0].exerciseId).toBe('string')
      expect(typeof results[0].name).toBe('string')
      expect(typeof results[0].score).toBe('number')
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

  export function invalidateSearchCache() {
    cache = null
  }

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

- [ ] **Step 6: Replace `NLPSearchBar.tsx` with full wired version**

  Replace `src/components/Search/NLPSearchBar.tsx`:

  ```tsx
  import { useEffect, useRef, useState } from 'react'
  import { useDebouncedValue } from '../../hooks/useDebouncedValue'
  import { searchExercises } from '../../services/exerciseSearchService'

  type SearchResult = Awaited<ReturnType<typeof searchExercises>>[number]

  interface NLPSearchBarProps {
    onSelect: (exerciseId: string) => void
    placeholder?: string
  }

  export function NLPSearchBar({ onSelect, placeholder = 'Search exercises...' }: NLPSearchBarProps) {
    const [query, setQuery]     = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const activeQuery           = useRef('')
    const debouncedQuery        = useDebouncedValue(query, 300)

    useEffect(() => {
      if (!debouncedQuery.trim()) { setResults([]); return }
      activeQuery.current = debouncedQuery
      searchExercises(debouncedQuery).then(res => {
        if (activeQuery.current === debouncedQuery) setResults(res)
      })
    }, [debouncedQuery])

    function handleSelect(id: string) {
      onSelect(id)
      setQuery('')
      setResults([])
    }

    return (
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setResults([]) } }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          aria-label={placeholder}
        />
        {results.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
            style={{ maxHeight: '60vh' }}
          >
            {results.map(r => {
              const pct    = Math.round(((r.score + 1) / 2) * 100)
              const colour = pct >= 85 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
              return (
                <li
                  key={r.exerciseId}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-slate-800 focus:bg-slate-800 outline-none"
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
  git commit -m "feat(search): exerciseSearchService with cosine ranking + inline dropdown with Match Score"
  ```

- **Acceptance:** Typing debounces 300ms; dropdown shows ranked results; Match Score badge green/amber/red; Esc closes; reads from `db.exercises.embedding`.

---

### Phase 3.4: Dropdown keyboard navigation (arrow keys)

- **Depends on:** 3.3 committed.
- **Files:** Modify `src/components/Search/NLPSearchBar.tsx` only.

**Steps:**

- [ ] **Step 1: Add `activeIndex` state and keyboard handlers**

  In `NLPSearchBar.tsx`, add after the `results` state:

  ```tsx
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => setActiveIndex(-1), [results])
  ```

  Replace the `onKeyDown` handler on `<input>`:

  ```tsx
  onKeyDown={e => {
    if (e.key === 'Escape') { setQuery(''); setResults([]) }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter' && activeIndex >= 0) { handleSelect(results[activeIndex].exerciseId) }
  }}
  ```

  On each `<li>`, add `aria-selected={idx === activeIndex}` and conditionally add `bg-slate-700`:

  ```tsx
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
  ```

- [ ] **Step 2: Run tests + commit**

  ```bash
  npm run test
  git add src/components/Search/NLPSearchBar.tsx
  git commit -m "feat(search): arrow-key navigation for NLPSearchBar dropdown"
  ```

- **Acceptance:** ↓ moves selection; ↑ moves up; Enter selects highlighted item; Esc closes; selected row highlighted.

---

### Phase 8.1: `HeroErrorBoundary.tsx`

- **Depends on:** All hero components built; run before 8.2.
- **Files:**
  - Create `src/components/UI/HeroErrorBoundary.tsx`
  - Create `src/test/HeroErrorBoundary.test.tsx`

> **Create the `src/components/UI/` directory** by creating the first file inside it.

**Steps:**

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
        <HeroErrorBoundary onFallback={onFallback}>
          <Boom />
        </HeroErrorBoundary>
      )
      expect(container.firstChild).toBeNull()
      expect(onFallback).toHaveBeenCalledOnce()
      spy.mockRestore()
    })

    it('renders children when no error', () => {
      render(
        <HeroErrorBoundary onFallback={vi.fn()}>
          <span>ok</span>
        </HeroErrorBoundary>
      )
      expect(screen.getByText('ok')).toBeTruthy()
    })
  })
  ```

- [ ] **Step 2: Implement `HeroErrorBoundary.tsx`**

  Create `src/components/UI/HeroErrorBoundary.tsx`:

  ```tsx
  import { Component, ErrorInfo, ReactNode } from 'react'

  interface Props {
    children: ReactNode
    onFallback: () => void
  }

  interface State {
    caught: boolean
  }

  export class HeroErrorBoundary extends Component<Props, State> {
    state: State = { caught: false }

    static getDerivedStateFromError(): State {
      return { caught: true }
    }

    componentDidCatch(_error: Error, _info: ErrorInfo) {
      this.props.onFallback()
    }

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
  git commit -m "feat(ui): HeroErrorBoundary class component with onFallback prop"
  ```

---

### Phase 8.2: Wrap Hero overlay in error boundary + RAF safety

- **Depends on:** 8.1 committed.
- **Target file:** `src/App.tsx` (line 97 — `<HeroOverlay />` is here, NOT in `HomePage.tsx`)
- **Files:**
  - Modify `src/App.tsx`
  - Modify `src/components/hero/TheForge.tsx`
  - Modify `src/components/hero/CombatCanvas.tsx`

**Important:** `UIMode` is `'focus' | 'hero'`. The fallback MUST call `setUIMode('focus')`, NOT `setUIMode('professional')`.

**Steps:**

- [ ] **Step 1: Read `App.tsx` lines 85–101**

  Confirm `<HeroOverlay />` is at line 97 inside the `UIModeProvider`. `useUIMode()` can be called in the same component since `UIModeProvider` wraps it.

- [ ] **Step 2: Wrap `HeroOverlay` in `HeroErrorBoundary` in `App.tsx`**

  ```tsx
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Extract a small inner component so `useUIMode()` can be called inside `UIModeProvider`:

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

  Read `src/components/hero/TheForge.tsx`. Find the `requestAnimationFrame` tick callback. Wrap the draw body:

  ```ts
  const tick = (ts: number) => {
    try {
      // ... existing draw code ...
    } catch (e) {
      cancelAnimationFrame(rafRef.current)
      throw e
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  ```

  > Re-throwing inside a RAF causes React's error boundary to catch on next render cycle.

- [ ] **Step 4: Add RAF try/catch in `CombatCanvas.tsx`**

  Read `src/components/hero/CombatCanvas.tsx`. Apply the identical `try/catch/rethrow` pattern to its RAF tick callback.

- [ ] **Step 5: Run full tests**

  ```bash
  npm run test
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/App.tsx src/components/hero/TheForge.tsx src/components/hero/CombatCanvas.tsx
  git commit -m "feat(ui): wrap HeroOverlay in HeroErrorBoundary, add RAF try/catch fallback"
  ```

- **Acceptance:** A forced throw inside a RAF tick collapses the overlay and restores `uiMode = 'focus'`; Blueprint/Review/Ignition/ActiveLogger remain interactive.

---

## 3. Global acceptance criteria

- [ ] `npm run test` green — no regressions.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] `src/data/exercises.json` is a plain array with exactly 300 entries.
- [ ] Embeddings process in batches of 5; console shows "Processed batch X of 60".
- [ ] Hero overlay survives a forced canvas error and falls back to `uiMode = 'focus'`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.

---

## 4. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `PersonalBest.flagged` is boolean | Use `.filter(pb => pb.flagged === true)` — NOT `.where('flagged').equals(1)` |
| `UIMode` has no `'professional'` value | Use `setUIMode('focus')` in Phase 8.2 |
| No `db.embeddings` table | Use `db.exercises` with `exercise.embedding: number[]` in Phases 4.8 and 3.3 |
| `ExerciseCard` needs full `ExerciseData` | Phase 3.3 uses inline list item — no reuse of ExerciseCard |
| `getEmbedding` is a named export | `import { getEmbedding } from './localAIService'` |
| `git add -A` stages graphify cache | Always add specific files by name |
| Framer Motion breaks in jsdom tests | Mock `framer-motion` in tests that render Framer components (see SummitModal test) |
| `flagged` not a Dexie index | Use `.filter()` not `.where()` |
| Both modals at 1.0 simultaneously | Each is self-contained and dismissed independently |
| RAF async throws not caught by Error Boundary | `try/catch` in tick body, re-throw — wired in Phase 8.2 |
| `HeroErrorBoundary` must be inside `UIModeProvider` | `HeroOverlayWithBoundary` inner component in App.tsx ensures this |
| `exercises.json` has 53 old entries | Phase 4.7 overwrites it; no backup needed |
| `src/data/raw/` doesn't exist yet | Must create it via Phases 4.1–4.5 before running 4.6 |
| `mergeExercises` test needs real raw files | Test imports `mergeRawExercises` which reads from disk; run test after Phases 4.1–4.5 are done |

---

## 5. Execution order (handoff sequence)

| Step | Task | State |
|---|---|---|
| 1 | P0 schema + Forge + track progress | ~~DONE~~ `69473be` |
| 2 | 7.4 PrestigeBadge in HomePage | ~~DONE~~ `c7d3eb1` |
| 3 | 5.1 useSensoryFeedback scaffold | ~~DONE~~ `da34b7c` |
| 4 | 5.2 heavyDouble/lightTap tests | ~~DONE~~ `898111c` |
| 5 | 2.1 ObsidianStairs 3-layer parallax | ~~DONE~~ `49365f8` |
| 6 | 2.2 Lightning Strike | ~~DONE~~ `60a3dc4` |
| 7 | 2.3 SummitModal | ~~DONE~~ `ba67a46` |
| 8 | 6.1 — Add `tonnage?` to `PendingBash`, extend `dispatchCombat` | ~~DONE~~ |
| **9** | **6.2 — `useHitCombo` hook + `ComboCounter` component** | **← NEXT** |
| 10 | 6.3 — `DamageNumber` component + wire into `HeroOverlay` | pending |
| 11 | 4.1–4.5 — Generate 5 raw exercise JSON files (parallel) | pending |
| 12 | 4.6 — `mergeExercises.ts` utility | pending (needs 4.1–4.5) |
| 13 | 4.7 — Execute merge, overwrite `exercises.json`, delete raw dir | pending (needs 4.6) |
| 14 | 4.8 — Refactor `seedEmbeddings.ts` to chunked batches of 5 | pending (needs 4.7) |
| 15 | 3.1 — `NLPSearchBar.tsx` scaffold | pending (needs 4.8) |
| 16 | 3.2 — `useDebouncedValue` hook | pending |
| 17 | 3.3 — `exerciseSearchService.ts` + full wired `NLPSearchBar` | pending (needs 3.1, 3.2, 4.8) |
| 18 | 3.4 — Arrow-key keyboard navigation in dropdown | pending (needs 3.3) |
| 19 | 8.1 — `HeroErrorBoundary.tsx` class component | pending |
| 20 | 8.2 — Wrap `HeroOverlay` in boundary in `App.tsx`; RAF try/catch | pending (needs 8.1, all hero) |

Check the corresponding TODO.md checkbox in the same commit as each implementation.

---

## 6. Exact next task

> **NEXT: Phase 6.2 — Create `src/hooks/useHitCombo.ts`, `src/test/useHitCombo.test.ts`, and `src/components/hero/ComboCounter.tsx`. Wire into `HeroOverlay.tsx`. The hook reads `pendingBash` from `useUIMode()` and tracks combo count within a 2-minute window.**
