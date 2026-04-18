# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all remaining unchecked TODO.md items (Phases 4 & 5) with TDD, one commit per task, zero inline comments.

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. Error boundary in `src/components/UI/`. Tests in `src/test/`. Hooks in `src/hooks/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict, sonner (to install). Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #23 — file-verified from disk)

---

## 0. Live-state snapshot (pass #23, 2026-04-18 — disk-verified)

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
| **Phase 8.1 — HeroErrorBoundary class component** | **DONE** | `ad8a9c3` |
| **Phase 5.1 — Prestige wiring + PrestigeFlash** | **DONE** | TBD |
| **Phase 5.2 — ObsidianStairs→TheForge cross-fade** | **MISSING** | — |
| **Phase 8.2 — Wrap overlay + RAF safety + toast** | **MISSING** | — |
| **Phase 7.1 — Verify completedAscensions badge** | **MISSING** | — |

### Critical verified facts (pass #23 — disk-verified, 2026-04-18)

| Assumption | Reality |
|---|---|
| `HeroOverlay.tsx` imports `motion` from framer-motion | **No** — only `AnimatePresence`; Phase 5.2 adds `motion` |
| `HeroOverlay.tsx` imports `TheForge` | **No** — Phase 5.2 adds the import |
| `HeroOverlay.tsx` line ~59 has single-branch ObsidianStairs | **Yes** — `{track.active === 'power' && <ObsidianStairs progress={track.power} />}` — Phase 5.2 replaces it |
| `HeroOverlay.tsx` lines 66-67 render modals with zero props | **Yes** — `<SummitModal />` and `<MasterworkModal />` with zero props; Phase 5.1 wires them |
| `HeroOverlay.tsx` has `prestigeFlashActive` state | **No** — Phase 5.1 adds it |
| `HeroOverlay.tsx` imports `PrestigeFlash` | **No** — Phase 5.1 adds it |
| `MasterworkModal.tsx` has `onPrestige?: () => void` prop | **Yes** — prop exists; `handlePrestige` calls `onPrestige?.()` + `setDismissed(true)` |
| `MasterworkModal.tsx` calls `forgeMasterwork()` | **No** — `forgeMasterwork` is NOT imported; Phase 5.1 adds import + call |
| `SummitModal.tsx` accepts `onAscend` prop | **No** — zero props; `handleAscend` calls `ascend()` internally only; Phase 5.1 adds `onAscend` |
| `HeroErrorBoundary.tsx` exists in `src/components/UI/` | **Yes** — DONE (commit `ad8a9c3`): class component, `onFallback` called in `componentDidCatch`, renders null when caught |
| `App.tsx` has `HeroOverlay` at line 97 inside `<UIModeProvider>` | **Yes** — line 97 renders `<HeroOverlay />`; `useUIMode()` callable inside provider |
| `App.tsx` imports HeroErrorBoundary or sonner | **No** — Phase 8.2 adds both |
| `sonner` in package.json | **No** — Phase 8.2 Step 1 installs it |
| `PrestigeFlash.tsx` exists | **No** — Phase 5.1 creates it |
| `UIMode` is `'focus' \| 'hero'` | **Confirmed** — use `setUIMode('focus')` not `'professional'` |
| `forgeMasterwork` and `ascend` exported from `heroMathService` | **Confirmed** |
| `AnimatePresence` already imported in `HeroOverlay` | **Confirmed** |
| `PrestigeBadge.test.tsx` exists at `src/test/PrestigeBadge.test.tsx` | **Yes** — file exists with tests for 0, 1, and 4 ascensions |
| `completedAscensions` flows from `useLiveQuery` in `HomePage.tsx` → prop to `SessionBlueprint` → prop to `PrestigeBadge` at line 758 | **Confirmed** — `HomePage.tsx` calls `useLiveQuery` at lines 224/229/246 and passes `completedAscensions` as prop at line 603 |

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
8.2 (unblocked — 8.1 is DONE)

5.1 → 5.2  (both touch HeroOverlay.tsx; commit 5.1 before starting 5.2)
5.1 → 7.1  (prestige wiring must be live before verifying badge reactivity)
```

**Parallelisable now:** 5.1 and 8.2 are both unblocked — run in parallel.
**Sequential after:** 5.2 and 7.1 both wait for 5.1 commit.

---

## 2. File structure

| File | Action | Phase |
|---|---|---|
| `src/components/hero/PrestigeFlash.tsx` | **Create** | 5.1 |
| `src/components/hero/MasterworkModal.tsx` | **Modify** — add `forgeMasterwork()` import + call | 5.1 |
| `src/components/hero/SummitModal.tsx` | **Modify** — add `onAscend` prop | 5.1 |
| `src/components/hero/HeroOverlay.tsx` | **Modify** — wire flash (5.1), then cross-fade (5.2); commit between | 5.1, 5.2 |
| `src/main.tsx` | **Modify** — add `<Toaster />` | 8.2 |
| `src/App.tsx` | **Modify** — wrap `HeroOverlay` in `HeroOverlayWithBoundary` | 8.2 |
| `src/components/hero/TheForge.tsx` | **Modify** — RAF try/catch | 8.2 |
| `src/components/hero/CombatCanvas.tsx` | **Modify** — RAF try/catch | 8.2 |
| `src/pages/HomePage.tsx` | **Possibly modify** — ensure `completedAscensions` sourced from `useLiveQuery` | 7.1 |
| `src/test/PrestigeBadge.test.tsx` | **Already exists** — run; update if coverage is insufficient | 7.1 |

---

## 3. Per-item execution plan

---

### Phase 5.1: Prestige wiring + 2s particle flash [STITCH UI]

**Depends on:** Nothing — unblocked. **Run in parallel with 8.2.**

**TODO.md item:** Phase 5, item 1 — "Redo the connection between `MasterworkModal` and `SummitModal` to the `heroMathService.prestige()` call. Ensure the 'Prestige' effect triggers a 2-second full-screen particle 'Flash' to celebrate the reset."

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

  _Selected variant ID:_ **1a7ae2d04b664202bcaa12a1d9e9d065** (Prompt A — "Prestige Celebration Overlay")
  _Reasoning:_ Variant A is a pure pointer-events-none radial flash without RPG text overlays; better for a 2s auto-dismiss non-blocking flash. Variant B added "ASCENDED" typography that would feel intrusive.

- [x] **Step 2: Implement `PrestigeFlash.tsx`** (match selected variant's colors/timing)

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

- [x] **Step 3: Wire `forgeMasterwork()` into `MasterworkModal.tsx`**

  Read `src/components/hero/MasterworkModal.tsx` first.

  Add to the import block at the top:
  ```tsx
  import { forgeMasterwork } from '../../services/heroMathService'
  ```

  Replace `handlePrestige` (currently calls `onPrestige?.()` + `setDismissed(true)` only):
  ```tsx
  function handlePrestige() {
    void forgeMasterwork()
    onPrestige?.()
    setDismissed(true)
  }
  ```

- [x] **Step 4: Add `onAscend` prop to `SummitModal.tsx`**

  Read `src/components/hero/SummitModal.tsx` first.

  Add before `export function SummitModal`:
  ```tsx
  interface SummitModalProps {
    onAscend?: () => void
  }
  ```

  Change the function signature from `export function SummitModal()` to:
  ```tsx
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

- [x] **Step 5: Wire flash + updated modals into `HeroOverlay.tsx`**

  Read `src/components/hero/HeroOverlay.tsx` first.

  Add import below the other hero component imports:
  ```tsx
  import { PrestigeFlash } from './PrestigeFlash'
  ```

  Add state inside `HeroOverlay()` after the existing state declarations:
  ```tsx
  const [prestigeFlashActive, setPrestigeFlashActive] = useState(false)
  ```

  Ensure `useState` is in the React import (it should already be). If `useState` is not currently imported, add it:
  ```tsx
  import { useState } from 'react'
  ```

  Replace lines rendering `<SummitModal />` and `<MasterworkModal />` with zero props:
  ```tsx
  <SummitModal onAscend={() => setPrestigeFlashActive(true)} />
  <MasterworkModal onPrestige={() => setPrestigeFlashActive(true)} />
  <PrestigeFlash active={prestigeFlashActive} onDone={() => setPrestigeFlashActive(false)} />
  ```

- [x] **Step 6: Run full tests + commit**

  ```bash
  npm run test
  git add src/components/hero/PrestigeFlash.tsx src/components/hero/MasterworkModal.tsx src/components/hero/SummitModal.tsx src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): wire forgeMasterwork to MasterworkModal + 2s PrestigeFlash on ascend/forge"
  ```

**Acceptance:** Clicking "Forge Masterwork" now calls `forgeMasterwork()` (was broken — no import); clicking ascend in `SummitModal` fires `onAscend`; 2s radial golden flash covers full screen on both paths; flash auto-dismisses after 2s; `PrestigeFlash` uses `pointer-events: none`; `'professional'` mode never referenced.

---

### Phase 5.2: ObsidianStairs → TheForge 500ms cross-fade [STITCH UI]

**Depends on:** 5.1 committed. **Both touch `HeroOverlay.tsx` — never start before 5.1 commits.**

**TODO.md item:** Phase 5, item 2 — "Ensure the transition between the 'Obsidian Stairs' and 'The Forge' is smooth. Add a 500ms CSS cross-fade when the user switches their Primary Goal in settings."

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

  Read `src/components/hero/HeroOverlay.tsx` first (it now includes the 5.1 changes).

  Update the framer-motion import to add `motion` (currently only `AnimatePresence`):
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  ```

  Add TheForge import below the ObsidianStairs import:
  ```tsx
  import { TheForge } from './TheForge'
  ```

  Find the line: `{track.active === 'power' && <ObsidianStairs progress={track.power} />}`

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

**Acceptance:** `TheForge` renders when `track.active !== 'power'` (was missing entirely — no import, no branch); `ObsidianStairs` renders when `track.active === 'power'`; switching Primary Goal cross-fades over 500ms; both backgrounds never visible simultaneously.

---

### Phase 8.2: Wrap `HeroOverlay` in boundary + RAF try/catch + toast

**Depends on:** 8.1 DONE (committed `ad8a9c3`). **Unblocked — run in parallel with 5.1.**

**TODO.md item:** Phase 4, item 2 — "If the Canvas fails to initialize or the WebGL context is lost, catch the error and auto-toggle the app back to 'Professional Focus Mode' with a subtle toast notification." (Note: UIMode has no 'professional' — use `'focus'`.)

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

  Read `src/main.tsx` first. Add import:
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

  Read `src/App.tsx` first. Add imports:
  ```tsx
  import { toast } from 'sonner'
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Add this function before the default export (not a named export):
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

  Replace `<HeroOverlay />` (line 97) with `<HeroOverlayWithBoundary />`.

- [ ] **Step 4: Add RAF try/catch in `TheForge.tsx`**

  Read `src/components/hero/TheForge.tsx`. Find the `tick()` function inside the animation `useEffect`. Wrap the draw body (keep all existing draw code unchanged inside the try block):

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

  Read `src/components/hero/CombatCanvas.tsx`. Find the `step(ts: number)` function. Wrap the draw body (keep all existing logic unchanged inside the try block):

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

**Depends on:** 5.1 committed (prestige wiring live so `ascend()` / `forgeMasterwork()` actually fire).

**TODO.md item:** Phase 5, item 5 — "Verify that `completedAscensions` correctly updates the Roman Numeral badge in the `HomePage` header in real-time without a page refresh."

**Files:**
- Read: `src/pages/HomePage.tsx` — verify `completedAscensions` comes from `useLiveQuery`
- Read: `src/components/SessionBlueprint.tsx` — confirm PrestigeBadge at line 758 receives live value
- Possibly modify: `src/pages/HomePage.tsx` — fix if not reactive
- Test: `src/test/PrestigeBadge.test.tsx` (already exists — run, do not recreate)

- [ ] **Step 1: Confirm reactivity chain in `HomePage.tsx`**

  ```bash
  grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx
  ```

  Expected: `completedAscensions` destructured from a `useLiveQuery` result. If it is — no code change needed.

- [ ] **Step 2: If `completedAscensions` is NOT from `useLiveQuery`, fix it**

  Only apply if Step 1 shows `completedAscensions` is static or from a non-reactive source.

  Read `src/pages/HomePage.tsx`. Find the settings query. Ensure it uses:
  ```tsx
  const settings = useLiveQuery(() => db.settings.get(APP_SETTINGS_ID))
  const completedAscensions = settings?.completedAscensions ?? 0
  ```

  Then confirm the prop is passed down to `SessionBlueprint` or wherever `PrestigeBadge` is used:
  ```tsx
  <SessionBlueprint completedAscensions={completedAscensions} ... />
  ```

- [ ] **Step 3: Run existing `PrestigeBadge.test.tsx`**

  ```bash
  npm run test -- PrestigeBadge
  ```

  Expected: all 3 tests pass (0 ascensions → null, 1 → "I", 4 → "IV"). If any fail, fix `PrestigeBadge.tsx` logic.

- [ ] **Step 4: Commit (only if Step 2 made file changes)**

  If no files were changed (Step 1 confirmed reactivity already), skip commit — just mark TODO done.

  If files changed:
  ```bash
  git add src/pages/HomePage.tsx
  git commit -m "feat(hero): ensure completedAscensions Roman numeral badge reactive via useLiveQuery"
  ```

**Acceptance:** After prestige fires, `PrestigeBadge` increments without page refresh; 0 ascensions → badge hidden; `useLiveQuery` drives the value through the prop chain.

---

## 4. Global acceptance criteria

- [ ] `npm run test` green — zero regressions.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] Clicking "Forge Masterwork" calls `forgeMasterwork()` (was previously broken — no import existed).
- [ ] 2s golden radial flash covers full screen on both prestige paths (`SummitModal` ascend and `MasterworkModal` forge).
- [ ] `TheForge` renders when `track.active !== 'power'` (was previously missing entirely — no import, no branch).
- [ ] Switching Primary Goal cross-fades ObsidianStairs ↔ TheForge over 500ms.
- [ ] Hero overlay survives forced canvas error → snaps to `uiMode = 'focus'` + sonner toast bottom-center 4s.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| sonner not in codebase | Phase 8.2 Step 1 installs before touching App.tsx |
| `UIMode` has no `'professional'` value | Use `setUIMode('focus')` — confirmed `'focus' \| 'hero'` |
| `MasterworkModal.handlePrestige` never called `forgeMasterwork()` | Phase 5.1 Step 3 adds import + call — disk-confirmed missing |
| `TheForge` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds import — disk-confirmed missing |
| `motion` not imported in `HeroOverlay` | Phase 5.2 Step 2 adds `motion` to framer-motion import — currently only `AnimatePresence` |
| `SummitModal` / `MasterworkModal` rendered with no props | Phase 5.1 Step 5 adds `onAscend` and `onPrestige` — disk-confirmed zero props |
| RAF errors don't reach React error boundary natively | `try/catch` + rethrow pattern in Phase 8.2 Steps 4-5 resolves this |
| 5.1 and 5.2 both touch `HeroOverlay.tsx` | Enforced sequential: commit 5.1 first, then apply 5.2 on top |
| Stitch MCP unavailable | Stop and fix connectivity; never skip Stitch for [STITCH UI] tasks |
| `completedAscensions` in `HomePage.tsx` may not be from `useLiveQuery` | Phase 7.1 Step 1 greps actual file before any code change |
| `useState` may not be imported in `HeroOverlay.tsx` after 5.1 | Phase 5.1 Step 5 checks and adds if missing |

---

## 6. Execution order

| Step | Task | State |
|---|---|---|
| 1–24 | All combat, data, NLP, search, badge, HeroErrorBoundary | ~~DONE~~ |
| ~~25‖~~ | ~~5.1 — Prestige wiring + PrestigeFlash [STITCH UI]~~ | ~~DONE~~ |
| **25‖** | **8.2 — Wrap overlay + RAF safety + toast** | **← NEXT (unblocked)** |
| **26** | **5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI]** | **← NEXT (5.1 committed)** |
| 27 | 7.1 — Verify completedAscensions badge (after 5.1 commits) | — |

Check the corresponding `TODO.md` checkbox in the same commit as each implementation.

---

## 7. Exact next task

> **Two tasks are unblocked and ready to run in parallel now:**
>
> **5.1 [STITCH UI] ← START NOW**
> 1. Generate 2 Stitch variants for PrestigeFlash (Prompts A/B in Phase 5.1 Step 1). Pick one and record variant ID + reasoning.
> 2. Create `src/components/hero/PrestigeFlash.tsx` (2s radial golden flash, pointer-events none, auto-dismisses via setTimeout).
> 3. Read `src/components/hero/MasterworkModal.tsx`. Add `import { forgeMasterwork } from '../../services/heroMathService'` and call `void forgeMasterwork()` inside `handlePrestige` before `onPrestige?.()`.
> 4. Read `src/components/hero/SummitModal.tsx`. Add `SummitModalProps` interface with `onAscend?: () => void`. Wire into `handleAscend` after `ascend()`.
> 5. Read `src/components/hero/HeroOverlay.tsx`. Add `PrestigeFlash` import, `prestigeFlashActive` state, and pass `onAscend`/`onPrestige` callbacks to modals on lines 66-67. Add `<PrestigeFlash>` after modals.
> 6. `npm run test` → PASS. Commit `feat(hero): wire forgeMasterwork to MasterworkModal + 2s PrestigeFlash on ascend/forge`. Check Phase 5 TODO item 1.
>
> **8.2 ← START NOW (parallel with 5.1)**
> 1. `npm install sonner` → `npm run build` (verify zero TS errors).
> 2. Read `src/main.tsx`. Add `import { Toaster } from 'sonner'`. Add `<Toaster position="bottom-center" richColors />` inside StrictMode block.
> 3. Read `src/App.tsx`. Add `toast`/`HeroErrorBoundary`/`useUIMode` imports. Add `HeroOverlayWithBoundary` function before default export. Replace `<HeroOverlay />` at line 97 with `<HeroOverlayWithBoundary />`.
> 4. Read `src/components/hero/TheForge.tsx`. Wrap `tick()` draw body in try/catch that cancels RAF and rethrows.
> 5. Read `src/components/hero/CombatCanvas.tsx`. Wrap `step()` draw body in try/catch that cancels RAF and rethrows.
> 6. `npm run test` → PASS. Commit `feat(ui): wrap HeroOverlay in HeroErrorBoundary with sonner toast, add RAF error rethrow for canvas fallback`. Check Phase 4 TODO item 2.
>
> **After 5.1 commits:**
> - **5.2 [STITCH UI]** — Generate 2 Stitch variants. Read `HeroOverlay.tsx`. Add `motion` to framer-motion import. Add `TheForge` import. Replace single-branch ObsidianStairs with `AnimatePresence mode="wait"` wrapping both `ObsidianStairs` (key="stairs") and `TheForge` (key="forge"), each in `motion.div` with 500ms opacity. `npm run test` → PASS. Commit. Check Phase 5 TODO item 2.
> - **7.1** — `grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx`. If reactive — run `npm run test -- PrestigeBadge` (file already exists), confirm pass, check TODO. If not reactive — fix HomePage then run tests. Commit only if code changed. Check Phase 5 TODO item 5.
