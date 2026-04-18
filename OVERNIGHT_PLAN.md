# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining unchecked TODO.md items (Phases 4 & 5) with TDD, one commit per task, zero inline comments.

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. Error boundary in `src/components/UI/`. Tests in `src/test/`. Hooks in `src/hooks/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict, sonner (to install). Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #22 — file-verified from disk)

---

## 0. Live-state snapshot (pass #22, 2026-04-18 — file-verified)

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
| HitCombo counter | **DONE** | `a5df8aa` |
| DamageNumber floating | **DONE** | `f45a94c` |
| HeavyBash sensory sync at strike frame | **DONE** | `64bd56c` |
| Raw exercise JSONs (5 files) | **DONE** | `59ee7c1` |
| mergeExercises utility | **DONE** | `e12a22c` |
| Execute merge + delete raw dir | **DONE** | `0e22469` |
| Chunked seedEmbeddings | **DONE** | `f485528` |
| embeddingWorker progress callback | **DONE** | `403ecb8` |
| useDebouncedValue | **DONE** | `ac42ee0` |
| NLPSearchBar scaffold | **DONE** | `c19352a` |
| exerciseSearchService + full NLPSearchBar (incl. Brain Initializing) | **DONE** | `174f504` |
| ExerciseCard confidence badge | **DONE** | `0192b6c` |
| **Phase 5.1 — Prestige wiring + PrestigeFlash** | **MISSING** | — |
| **Phase 5.2 — ObsidianStairs→TheForge cross-fade** | **MISSING** | — |
| **Phase 8.1 — HeroErrorBoundary** | **DONE** | `(next commit)` |
| **Phase 8.2 — Wrap overlay + RAF safety + toast** | **MISSING** | — |
| **Phase 7.1 — Verify completedAscensions badge** | **MISSING** | — |

### Critical verified facts (pass #22 — file-verified from disk, 2026-04-18)

| Assumption | Reality |
|---|---|
| `HeroOverlay.tsx` imports `motion` from framer-motion | **No** — only `AnimatePresence`; Phase 5.2 adds `motion` |
| `HeroOverlay.tsx` imports `TheForge` | **No** — Phase 5.2 adds the import |
| `HeroOverlay.tsx` line 59 has ObsidianStairs single-branch | **Yes** — `{track.active === 'power' && <ObsidianStairs progress={track.power} />}` — no else; Phase 5.2 replaces it |
| `HeroOverlay.tsx` lines 66-67 render modals with props | **No** — `<SummitModal />` and `<MasterworkModal />` with zero props; Phase 5.1 wires them |
| `HeroOverlay.tsx` has `prestigeFlashActive` state | **No** — Phase 5.1 adds it |
| `HeroOverlay.tsx` imports `PrestigeFlash` | **No** — Phase 5.1 adds it |
| `MasterworkModal.tsx` has `onPrestige?: () => void` prop | **Yes** — prop exists; `handlePrestige` calls `onPrestige?.()` + `setDismissed(true)` |
| `MasterworkModal.tsx` calls `forgeMasterwork()` | **No** — `forgeMasterwork` is NOT imported; Phase 5.1 adds import + call |
| `SummitModal.tsx` accepts `onAscend` prop | **No** — zero props; `handleAscend` calls `ascend()` internally only; Phase 5.1 adds `onAscend` |
| `App.tsx` has `HeroOverlay` inside `<UIModeProvider>` | **Yes** — line 79 wraps; `useUIMode()` callable inside the wrapper; Phase 8.2 wraps `HeroOverlay` in boundary inside provider |
| `App.tsx` imports sonner | **No** — zero toast imports; Phase 8.2 installs + adds `<Toaster />` |
| `src/components/UI/` directory exists | **No** — Phase 8.1 creates it |
| `PrestigeFlash.tsx` exists | **No** — Phase 5.1 creates it |
| `UIMode` is `'focus' \| 'hero'` | **Confirmed** — use `setUIMode('focus')` not `'professional'` |
| `forgeMasterwork` and `ascend` exported from `heroMathService` | **Confirmed** |
| `AnimatePresence` already imported in `HeroOverlay` | **Confirmed** — line 2 |
| `PrestigeBadge` rendered in `SessionBlueprint.tsx` line 758 with `completedAscensions` | **Confirmed** — Phase 7.1 verifies `useLiveQuery` reactivity |

---

## 0.1 Automation Contract (ENFORCED — Stitch required for [STITCH UI] tasks)

For every task marked **[STITCH UI]**:

1. Call `mcp__stitch__generate_screen_from_text` **twice** (Prompt A and Prompt B listed per task).
2. Inspect both variants.
3. Before writing any code, record the chosen variant ID and one sentence of reasoning in the **Stitch Selection** block.
4. Code must match the chosen variant's layout and color decisions.
5. If Stitch MCP is unavailable, stop and fix connectivity. **Do not skip Stitch.**

| Phase | [STITCH UI] task | Stitch calls required |
|---|---|---|
| 5.1 | Prestige wiring + PrestigeFlash | 2 × flash overlay variant |
| 5.2 | ObsidianStairs → TheForge cross-fade | 2 × background cross-fade variant |

---

## 1. Dependency graph

```
5.1 (unblocked — independent)
5.2 (unblocked — independent)
8.1 (unblocked — independent)

5.1 → 7.1
8.1 → 8.2
```

**Parallelisable now:** 5.1, 5.2, 8.1 are all unblocked.
**Critical path:** 8.1 → 8.2 (sonner install must precede wrap)

---

## 2. File structure

| File | Action | Responsible phase |
|---|---|---|
| `src/components/hero/PrestigeFlash.tsx` | **Create** | 5.1 |
| `src/components/hero/MasterworkModal.tsx` | **Modify** — add `forgeMasterwork()` call | 5.1 |
| `src/components/hero/SummitModal.tsx` | **Modify** — add `onAscend` prop | 5.1 |
| `src/components/hero/HeroOverlay.tsx` | **Modify** — wire flash + cross-fade (phases 5.1 and 5.2 each touch it; do 5.1 first, commit, then 5.2) | 5.1, 5.2 |
| `src/components/UI/HeroErrorBoundary.tsx` | **Create** | 8.1 |
| `src/test/HeroErrorBoundary.test.tsx` | **Create** | 8.1 |
| `src/main.tsx` | **Modify** — add `<Toaster />` | 8.2 |
| `src/App.tsx` | **Modify** — wrap `HeroOverlay` in boundary | 8.2 |
| `src/components/hero/TheForge.tsx` | **Modify** — RAF try/catch | 8.2 |
| `src/components/hero/CombatCanvas.tsx` | **Modify** — RAF try/catch | 8.2 |
| `src/test/PrestigeBadge.test.tsx` | **Create/update** | 7.1 |
| `src/pages/HomePage.tsx` | **Possibly modify** — wire `useLiveQuery` if missing | 7.1 |

---

## 3. Per-item execution plan

---

### Phase 5.1: Prestige wiring + 2s particle flash [STITCH UI]

**Depends on:** Nothing — unblocked.

**Files:**
- Create: `src/components/hero/PrestigeFlash.tsx`
- Modify: `src/components/hero/MasterworkModal.tsx`
- Modify: `src/components/hero/SummitModal.tsx`
- Modify: `src/components/hero/HeroOverlay.tsx`

**Stitch Selection — Phase 5.1**

- [ ] **Step 1: Generate Stitch variants for prestige flash**

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

  `forgeMasterwork` is NOT currently imported. `handlePrestige` only calls `onPrestige?.()` + `setDismissed(true)`.

  Add to imports at top of `src/components/hero/MasterworkModal.tsx`:
  ```tsx
  import { forgeMasterwork } from '../../services/heroMathService'
  ```

  Replace `handlePrestige` function:
  ```tsx
  function handlePrestige() {
    void forgeMasterwork()
    onPrestige?.()
    setDismissed(true)
  }
  ```

- [ ] **Step 4: Add `onAscend` prop to `SummitModal.tsx`**

  `SummitModal` currently has zero props. Add before `export function SummitModal`:

  ```tsx
  interface SummitModalProps {
    onAscend?: () => void
  }

  export function SummitModal({ onAscend }: SummitModalProps) {
  ```

  Replace `handleAscend` (currently calls `ascend()` only):
  ```tsx
  function handleAscend() {
    setDismissed(true)
    ascend()
    onAscend?.()
  }
  ```

- [ ] **Step 5: Wire flash + updated modals into `HeroOverlay.tsx`**

  Add to the framer-motion import line (currently `import { AnimatePresence } from 'framer-motion'`):
  ```tsx
  import { AnimatePresence } from 'framer-motion'
  ```
  *(no change needed — `PrestigeFlash` handles its own `motion` import)*

  Add import below other hero imports:
  ```tsx
  import { PrestigeFlash } from './PrestigeFlash'
  ```

  Add state inside `HeroOverlay()` after the existing state declarations:
  ```tsx
  const [prestigeFlashActive, setPrestigeFlashActive] = useState(false)
  ```

  Replace lines 66-67 (currently `<SummitModal />` and `<MasterworkModal />` with zero props):
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

**Acceptance:** Clicking "Forge Masterwork" now calls `forgeMasterwork()` (was broken); clicking ascend in `SummitModal` now fires `onAscend`; 2s radial golden flash covers full screen on both paths; flash auto-dismisses after 2s; `PrestigeFlash` uses `pointer-events: none`; `'professional'` mode never referenced.

---

### Phase 5.2: ObsidianStairs → TheForge 500ms cross-fade [STITCH UI]

**Depends on:** Nothing — unblocked. **Execute after 5.1 commit** (both touch `HeroOverlay.tsx`).

**Files:**
- Modify: `src/components/hero/HeroOverlay.tsx`

**Stitch Selection — Phase 5.2**

- [ ] **Step 1: Generate Stitch variants for cross-fade**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Full-screen dark RPG background cross-fade transition: left state is dark obsidian dungeon stairs, right state is orange forge fire embers. 500ms opacity cross-fade between the two backgrounds."
  - **Prompt B:** "Smooth 500ms background transition in a dark fitness RPG app, fading between a cool slate/indigo staircase scene and a warm amber/orange forge fire scene, full-screen fixed overlay"

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution]**

- [ ] **Step 2: Add `motion` + `TheForge` imports and AnimatePresence cross-fade to `HeroOverlay.tsx`**

  Update the framer-motion import (add `motion`):
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  ```

  Add TheForge import below the ObsidianStairs import:
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

**Acceptance:** `TheForge` renders when `track.active !== 'power'` (was missing entirely); `ObsidianStairs` renders when `track.active === 'power'`; switching Primary Goal cross-fades over 500ms; both backgrounds never visible simultaneously.

---

### Phase 8.1: `HeroErrorBoundary.tsx`

**Depends on:** Nothing — unblocked (can run in parallel with 5.1 and 5.2).

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

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/hero/TheForge.tsx`
- Modify: `src/components/hero/CombatCanvas.tsx`

- [ ] **Step 1: Install `sonner`**

  ```bash
  npm install sonner
  ```

  Expected: `added 1 package`. Confirm no peer-dep errors. Then:

  ```bash
  npm run build
  ```

  Expected: zero TS errors.

- [ ] **Step 2: Add `<Toaster />` to `src/main.tsx`**

  Read `src/main.tsx` first. Add to imports:
  ```tsx
  import { Toaster } from 'sonner'
  ```

  Add `<Toaster />` inside the `<React.StrictMode>` block alongside `<App />`:
  ```tsx
  <React.StrictMode>
    <App />
    <Toaster position="bottom-center" richColors />
  </React.StrictMode>
  ```

- [ ] **Step 3: Add `HeroOverlayWithBoundary` wrapper to `App.tsx`**

  Add imports to `src/App.tsx`:
  ```tsx
  import { toast } from 'sonner'
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Add this function before the default export (not as a named export):
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

  Replace `<HeroOverlay />` (currently at line 97) with `<HeroOverlayWithBoundary />`.

- [ ] **Step 4: Add RAF try/catch in `TheForge.tsx`**

  Read `src/components/hero/TheForge.tsx`. Find the `tick()` function inside the animation `useEffect`. Wrap the draw body:

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

- [ ] **Step 5: Add RAF try/catch in `CombatCanvas.tsx`**

  Read `src/components/hero/CombatCanvas.tsx`. Find the `step(ts: number)` function. Wrap the draw body:

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

- [ ] **Step 6: Run full tests + commit**

  ```bash
  npm run test
  git add src/main.tsx src/App.tsx src/components/hero/TheForge.tsx src/components/hero/CombatCanvas.tsx
  git commit -m "feat(ui): wrap HeroOverlay in HeroErrorBoundary with sonner toast, add RAF error rethrow for canvas fallback"
  ```

**Acceptance:** Forced throw in RAF → overlay collapses → `uiMode` snaps to `'focus'` → sonner toast "Hero overlay crashed — switched to Focus Mode" appears bottom-center for 4s; Blueprint/Logger remain interactive; `'professional'` mode never used.

---

### Phase 7.1: Verify `completedAscensions` Roman numeral badge updates in real-time

**Depends on:** 5.1 committed (prestige wiring live so `ascend()` / `forgeMasterwork()` actually fire now).

**Files:**
- Read: `src/components/SessionBlueprint.tsx` (confirmed line 758 has `PrestigeBadge`)
- Possibly modify: `src/pages/HomePage.tsx`
- Create/update: `src/test/PrestigeBadge.test.tsx`

- [ ] **Step 1: Confirm wiring in SessionBlueprint**

  ```bash
  grep -n "PrestigeBadge\|completedAscensions\|useLiveQuery" src/components/SessionBlueprint.tsx
  ```

  Expected: `PrestigeBadge` at line 758, `completedAscensions` sourced from a `useLiveQuery` hook. If `useLiveQuery` is present — no code change needed in `SessionBlueprint.tsx`.

- [ ] **Step 2: If `completedAscensions` is NOT from `useLiveQuery`, fix it**

  If `completedAscensions` is a static value rather than from `useLiveQuery`, update the relevant query in `SessionBlueprint.tsx`:

  ```tsx
  const settings = useLiveQuery(() => db.settings.get(APP_SETTINGS_ID))
  const completedAscensions = settings?.completedAscensions ?? 0
  ```

  And ensure `PrestigeBadge` receives it:
  ```tsx
  <PrestigeBadge ascensions={completedAscensions} />
  ```

- [ ] **Step 3: Write or update `PrestigeBadge` test**

  Create `src/test/PrestigeBadge.test.tsx`:

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

- [ ] **Step 4: Run tests + commit (only if files changed)**

  ```bash
  npm run test -- PrestigeBadge
  # Commit only if Step 2 made changes:
  git add src/components/SessionBlueprint.tsx src/test/PrestigeBadge.test.tsx
  git commit -m "feat(hero): verify completedAscensions Roman numeral badge via useLiveQuery"
  ```

**Acceptance:** `PrestigeBadge` renders with value from `useLiveQuery`; after prestige fires, badge increments without page refresh; 0 ascensions → no badge rendered.

---

## 4. Global acceptance criteria

- [ ] `npm run test` green — zero regressions.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] Clicking "Forge Masterwork" calls `forgeMasterwork()` (was previously broken — no import existed).
- [ ] 2s golden radial flash covers full screen on both prestige paths (`SummitModal` ascend and `MasterworkModal` forge).
- [ ] `TheForge` renders when `track.active !== 'power'` (was previously missing entirely — no import, no branch).
- [ ] Switching Primary Goal cross-fades ObsidianStairs ↔ TheForge over 500ms.
- [ ] Hero overlay survives forced canvas error → snaps to `uiMode = 'focus'` + sonner toast.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| No toast system in codebase | Phase 8.2 Step 1 installs `sonner` before touching App.tsx |
| `UIMode` has no `'professional'` value | Use `setUIMode('focus')` — confirmed `'focus' \| 'hero'` |
| `MasterworkModal.handlePrestige` never called `forgeMasterwork()` | Phase 5.1 Step 3 adds import + call — confirmed missing |
| `TheForge` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds import — confirmed missing |
| `motion` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds `motion` to framer-motion import — currently only `AnimatePresence` |
| `SummitModal` / `MasterworkModal` rendered with no props | Phase 5.1 Step 5 adds `onAscend` and `onPrestige` — confirmed zero props |
| RAF errors don't reach React error boundary natively | `try/catch` + rethrow pattern in Phase 8.2 Steps 4-5 resolves this |
| 5.1 and 5.2 both touch `HeroOverlay.tsx` | Execute sequentially: commit 5.1 first, then apply 5.2 on top |
| Stitch MCP unavailable | Stop and fix connectivity; never skip Stitch for [STITCH UI] tasks |
| `db.settings` key for APP_SETTINGS_ID may differ | Phase 7.1 Step 1 reads actual grep output before any code change |

---

## 6. Execution order

| Step | Task | State |
|---|---|---|
| 1–24 | All combat, data, NLP, search, badge | ~~DONE~~ |
| **25‖** | **5.1 — Prestige wiring + PrestigeFlash [STITCH UI]** | **← NEXT (unblocked)** |
| **25‖** | **8.1 — HeroErrorBoundary (TDD)** | **DONE** |
| 26 | 5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI] (after 5.1 commits to avoid merge on HeroOverlay.tsx) | — |
| 27 | 8.2 — Wrap overlay + RAF safety + toast (needs 8.1) | — |
| 28 | 7.1 — Verify completedAscensions badge (needs 5.1) | — |

Check the corresponding `TODO.md` checkbox in the same commit as each implementation.

---

## 7. Exact next task

> **Three tasks are unblocked and ready to execute — 5.1 and 8.1 run in parallel first, then 5.2:**
>
> **5.1 [STITCH UI] ← START NOW**
> Generate 2 Stitch variants for PrestigeFlash (Prompts A/B above). Pick one. Create `src/components/hero/PrestigeFlash.tsx`. Add `forgeMasterwork()` import + call to `MasterworkModal.handlePrestige` (currently NOT imported). Add `onAscend` prop to `SummitModal` (currently zero props). Wire both modals + flash in `HeroOverlay`: add `PrestigeFlash` import + `prestigeFlashActive` state + prop callbacks on lines 66-67. Run `npm run test`. Commit `feat(hero): wire forgeMasterwork to MasterworkModal + 2s PrestigeFlash on ascend/forge`. Check Phase 5 TODO item 1.
>
> **8.1 ← START NOW (parallel)**
> Write test in `src/test/HeroErrorBoundary.test.tsx` first. Run it, confirm FAIL. Create `src/components/UI/HeroErrorBoundary.tsx` (class component, renders null on catch, calls `onFallback`). Run test, confirm PASS. Commit `feat(ui): HeroErrorBoundary class component calls onFallback on canvas crash`. Check Phase 4 TODO item 1.
>
> **After 5.1 and 8.1 commit:**
> - **5.2 [STITCH UI]** — Generate 2 Stitch variants. Add `motion` to framer-motion import in `HeroOverlay.tsx`. Add `TheForge` import. Replace line 59 single-branch with `AnimatePresence mode="wait"` wrapping both `ObsidianStairs` (key="stairs") and `TheForge` (key="forge"), each in a `motion.div` with 500ms opacity. Commit `feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch`. Check Phase 5 TODO item 2.
> - **8.2** — Install `sonner`. Add `<Toaster />` to `main.tsx`. Add `HeroOverlayWithBoundary` wrapper in `App.tsx`. Add RAF try/catch to `TheForge.tsx` and `CombatCanvas.tsx`. Commit. Check Phase 4 TODO item 2.
> - **7.1** — Grep `SessionBlueprint.tsx` for `useLiveQuery` + `completedAscensions`. Fix if not reactive. Write/update `PrestigeBadge.test.tsx`. Commit if changes made. Check Phase 5 TODO item 5.
