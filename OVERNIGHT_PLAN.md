# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 3 remaining unchecked TODO.md items — graceful canvas fallback (Phase 8.2), ObsidianStairs→TheForge cross-fade (Phase 5.2), and badge reactivity verification (Phase 7.1).

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. Error boundary in `src/components/UI/`. `App.tsx` renders `<HeroOverlay />` inside `<UIModeProvider>`. Hooks in `src/hooks/`. Tests in `src/test/`.

**Tech Stack:** React 18, Framer Motion, Dexie v15, Vitest, TypeScript strict, sonner (to install for 8.2). Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #24 — full disk-verify pass)

---

## 0. Live-state snapshot (pass #24, 2026-04-18 — disk-verified)

| Item | State | Evidence |
|---|---|---|
| Phase 5.1 — Prestige wiring + PrestigeFlash | **DONE** | `HeroOverlay.tsx` line 14 imports `PrestigeFlash`; line 33 has `prestigeFlashActive`; lines 68-70 pass `onAscend`/`onPrestige` to modals |
| Phase 8.2 — Wrap overlay + RAF safety + toast | **MISSING** | `App.tsx` line 97 is bare `<HeroOverlay />`; `sonner` absent from `package.json`; no `Toaster` in `main.tsx`; no try/catch in `TheForge.tick()` or `CombatCanvas.step()` |
| Phase 5.2 — ObsidianStairs→TheForge cross-fade | **MISSING** | `HeroOverlay.tsx` line 61 is single-branch `{track.active === 'power' && <ObsidianStairs />}`; `TheForge` not imported; `motion` not imported |
| Phase 7.1 — Verify completedAscensions badge | **VERIFY-ONLY** | `HomePage.tsx` line 603: `completedAscensions={onboardingRecord?.completedAscensions ?? 0}` — `onboardingRecord` comes from `useLiveQuery` at line 224; chain is already reactive; no code change expected |

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
| 5.2 | ObsidianStairs → TheForge cross-fade | 2 × background cross-fade variant |

---

## 1. Dependency graph

```
8.2  (unblocked — install sonner, then touch main.tsx / App.tsx / TheForge.tsx / CombatCanvas.tsx)
5.2  (unblocked — touches HeroOverlay.tsx only; 5.1 already committed)
7.1  (unblocked — verify-only; 5.1 already committed so ascend() fires correctly)

8.2 ‖ 5.2  → no shared files, parallelisable
7.1         → independent, run after or alongside 8.2+5.2
```

**Parallelisable now:** 8.2, 5.2, and 7.1 are all unblocked. 8.2 and 5.2 touch different files — run in parallel.

---

## 2. File structure

| File | Action | Phase |
|---|---|---|
| `src/main.tsx` | **Modify** — add `<Toaster />` from sonner | 8.2 |
| `src/App.tsx` | **Modify** — add `HeroOverlayWithBoundary` wrapper; replace `<HeroOverlay />` at line 97 | 8.2 |
| `src/components/hero/TheForge.tsx` | **Modify** — wrap `tick()` draw body in try/catch at line 51 | 8.2 |
| `src/components/hero/CombatCanvas.tsx` | **Modify** — wrap `step()` draw body in try/catch at line 118 | 8.2 |
| `src/components/hero/HeroOverlay.tsx` | **Modify** — add `motion`+`TheForge` imports; replace line 61 with AnimatePresence cross-fade | 5.2 |
| `src/pages/HomePage.tsx` | **Read-only** — verify `completedAscensions` reactive chain; no change expected | 7.1 |
| `src/test/PrestigeBadge.test.tsx` | **Run only** — already exists; confirm all 3 tests pass | 7.1 |

---

## 3. Per-item execution plan

---

### Phase 8.2: Wrap HeroOverlay in boundary + RAF try/catch + toast

**Depends on:** 8.1 DONE (committed `ad8a9c3`). **Unblocked — run in parallel with 5.2.**

**TODO.md item:** Phase 4, item 2 — "If the Canvas fails to initialize or the WebGL context is lost, catch the error and auto-toggle the app back to 'Professional Focus Mode' with a subtle toast notification." (Note: UIMode is `'focus' | 'hero'` — use `'focus'`, never `'professional'`.)

**Files:**
- `package.json` (via npm install)
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/hero/TheForge.tsx`
- Modify: `src/components/hero/CombatCanvas.tsx`

- [x] **Step 1: Install `sonner`**

  ```bash
  npm install sonner
  ```

  Expected: `added 1 package`. Confirm no peer-dep errors. Then:

  ```bash
  npm run build
  ```

  Expected: zero TS errors.

- [x] **Step 2: Add `<Toaster />` to `src/main.tsx`**

  Current `src/main.tsx` (5 lines, verified):
  ```tsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import './index.css'
  import App from './App.tsx'
  import { registerSW } from 'virtual:pwa-register'
  ```

  Add import after line 4:
  ```tsx
  import { Toaster } from 'sonner'
  ```

  Replace the `createRoot(...).render(...)` block:
  ```tsx
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <Toaster position="bottom-center" richColors />
    </StrictMode>,
  )
  ```

- [x] **Step 3: Add `HeroOverlayWithBoundary` wrapper to `App.tsx`**

  Current `src/App.tsx` imports (lines 1-11, verified):
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  import { useEffect, useMemo, useState } from 'react'
  import BottomNav from './components/BottomNav'
  // ... (other imports)
  import { HeroOverlay } from './components/hero/HeroOverlay'
  import { ModeToggleButton } from './components/hero/ModeToggleButton'
  import { UIModeProvider } from './context/UIModeContext'
  ```

  Add three named imports after the existing import block:
  ```tsx
  import { toast } from 'sonner'
  import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
  import { useUIMode } from './context/UIModeContext'
  ```

  Add this function immediately before `export default function App()`:
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

  Replace `<HeroOverlay />` at line 97 (inside `<UIModeProvider>`) with:
  ```tsx
  <HeroOverlayWithBoundary />
  ```

- [x] **Step 4: Add RAF try/catch in `src/components/hero/TheForge.tsx`**

  Current `tick()` at lines 50-87 (disk-verified). The entire draw body is between `function tick() {` and the final `rafRef.current = requestAnimationFrame(tick)`. Wrap all draw code in try/catch and move the RAF call after the try/catch:

  Replace the `tick` function body (lines 51-87) with:
  ```ts
  function tick() {
    try {
      const p = progressRef.current
      frameRef.current++

      const spawnInterval = Math.max(1, Math.round(12 / (1 + p * 9)))
      if (frameRef.current % spawnInterval === 0) {
        embersRef.current.push(spawnEmber(p))
      }

      if (embersRef.current.length > 150) {
        embersRef.current.splice(0, embersRef.current.length - 150)
      }

      ctx!.clearRect(0, 0, W, H)

      const glowAlpha = 0.08 + p * 0.52
      const grad = ctx!.createRadialGradient(W / 2, H, 5, W / 2, H, H * 0.85)
      grad.addColorStop(0, `rgba(255, 90, 10, ${glowAlpha})`)
      grad.addColorStop(0.45, `rgba(200, 35, 5, ${glowAlpha * 0.55})`)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, W, H)

      embersRef.current = embersRef.current.filter(e => e.alpha > 0)
      for (const e of embersRef.current) {
        e.x += e.vx
        e.y += e.vy
        e.alpha -= e.decay
        e.vx += (Math.random() - 0.5) * 0.12

        ctx!.beginPath()
        ctx!.arc(e.x, e.y, Math.max(0.4, e.radius), 0, Math.PI * 2)
        ctx!.fillStyle = `hsla(${e.hue}, 100%, 62%, ${Math.max(0, e.alpha)})`
        ctx!.fill()
      }
    } catch (e) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      throw e
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  ```

- [x] **Step 5: Add RAF try/catch in `src/components/hero/CombatCanvas.tsx`**

  Current `step()` at lines 117-132 (disk-verified). Wrap the draw body in try/catch; keep the post-try RAF scheduling and clear logic unchanged:

  Replace the `step` function body (lines 118-132):
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

- [x] **Step 6: Run full tests + commit**

  ```bash
  npm run test
  ```

  Expected: all tests pass, zero regressions.

  ```bash
  git add src/main.tsx src/App.tsx src/components/hero/TheForge.tsx src/components/hero/CombatCanvas.tsx
  git commit -m "feat(ui): wrap HeroOverlay in HeroErrorBoundary with sonner toast, add RAF error rethrow for canvas fallback"
  ```

  Then mark Phase 4 item 2 checked in `TODO.md`:
  ```bash
  git add TODO.md
  git commit -m "chore: mark Phase 4 graceful fallback done"
  ```

**Acceptance:** Forced throw inside `tick()` or `step()` → RAF cancels → error propagates to React boundary → `HeroErrorBoundary.componentDidCatch` fires `onFallback` → `setUIMode('focus')` + sonner toast bottom-center "Hero overlay crashed — switched to Focus Mode" for 4s; Blueprint/Logger remain interactive; `'professional'` string never appears in any file.

---

### Phase 5.2: ObsidianStairs → TheForge 500ms cross-fade [STITCH UI]

**Depends on:** 5.1 committed (done — commit `8eb2ab5`). **Unblocked — run in parallel with 8.2.**

**TODO.md item:** Phase 5, item 2 — "Ensure the transition between the 'Obsidian Stairs' and 'The Forge' is smooth. Add a 500ms CSS cross-fade when the user switches their Primary Goal in settings."

**Files:**
- Modify: `src/components/hero/HeroOverlay.tsx`

**Stitch Selection — Phase 5.2**

- [ ] **Step 1: Generate Stitch variants for cross-fade**

  Call `mcp__stitch__generate_screen_from_text` twice:

  - **Prompt A:** "Full-screen dark RPG background cross-fade transition: left state is dark obsidian dungeon stairs (deep slate/navy palette), right state is orange forge fire embers (amber/orange palette). 500ms opacity cross-fade between the two backgrounds. Fixed position full-screen overlay, pointer-events none."
  - **Prompt B:** "Smooth 500ms background transition in a dark fitness RPG app, fading between a cool slate/indigo staircase scene and a warm amber/orange forge fire scene, full-screen fixed overlay, no UI chrome shown."

  _Selected variant ID:_ **[fill in during execution]**
  _Reasoning:_ **[fill in during execution — pick whichever variant better matches the existing ObsidianStairs/TheForge color palettes already in code]**

- [ ] **Step 2: Add `motion` + `TheForge` imports and AnimatePresence cross-fade to `HeroOverlay.tsx`**

  Current `HeroOverlay.tsx` line 2 (disk-verified):
  ```tsx
  import { AnimatePresence } from 'framer-motion'
  ```

  Replace with:
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  ```

  Current `HeroOverlay.tsx` line 13 (disk-verified):
  ```tsx
  import { ObsidianStairs } from './ObsidianStairs'
  ```

  Add `TheForge` import immediately after (line 14 becomes):
  ```tsx
  import { TheForge } from './TheForge'
  ```

  Current `HeroOverlay.tsx` line 61 (disk-verified):
  ```tsx
  {track.active === 'power' && <ObsidianStairs progress={track.power} />}
  ```

  Replace with:
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
  ```

  Expected: all tests pass, zero regressions.

  ```bash
  git add src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch"
  ```

  Then mark Phase 5 item 2 checked in `TODO.md`:
  ```bash
  git add TODO.md
  git commit -m "chore: mark Phase 5 cross-fade done"
  ```

**Acceptance:** `TheForge` renders when `track.active !== 'power'` (was missing entirely — no import, no branch); `ObsidianStairs` renders when `track.active === 'power'`; switching Primary Goal cross-fades over 500ms via `AnimatePresence mode="wait"`; both backgrounds never visible simultaneously; `motion` only added, no other framer-motion imports changed.

---

### Phase 7.1: Verify `completedAscensions` Roman numeral badge updates in real-time

**Depends on:** 5.1 committed (done — `ascend()` / `forgeMasterwork()` now fire correctly via wired modals).

**TODO.md item:** Phase 5, item 5 — "Verify that `completedAscensions` correctly updates the Roman Numeral badge in the `HomePage` header in real-time without a page refresh."

**Disk-verified facts:**
- `HomePage.tsx` line 1: `useLiveQuery` imported
- `HomePage.tsx` line 224: `onboardingRecord` from `useLiveQuery(() => db.settings.get(APP_SETTINGS_ID))`
- `HomePage.tsx` line 603: `completedAscensions={onboardingRecord?.completedAscensions ?? 0}` passed to `SessionBlueprint`
- **Reactivity chain is already correct** — no code change expected.

**Files:**
- Read: `src/pages/HomePage.tsx` — confirm chain still intact
- Run: `src/test/PrestigeBadge.test.tsx` — file exists, do not recreate

- [ ] **Step 1: Confirm reactivity chain in `HomePage.tsx`**

  ```bash
  grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx
  ```

  Expected output includes:
  - Line 1: `useLiveQuery` import
  - Line 224 (±5): `useLiveQuery` call assigning `onboardingRecord`
  - Line 603 (±5): `completedAscensions={onboardingRecord?.completedAscensions ?? 0}`

  If this is confirmed — no code change needed. Proceed to Step 2.

  **Only if `completedAscensions` is NOT from `useLiveQuery`** — fix it:
  ```tsx
  const onboardingRecord = useLiveQuery<AppSettings | null>(
    async () => (await db.settings.get(APP_SETTINGS_ID)) ?? null,
    [db],
  )
  const completedAscensions = onboardingRecord?.completedAscensions ?? 0
  ```

- [ ] **Step 2: Run existing `PrestigeBadge.test.tsx`**

  ```bash
  npm run test -- PrestigeBadge
  ```

  Expected: all 3 tests pass (0 ascensions → null, 1 → "I", 4 → "IV"). If any fail, read `src/components/PrestigeBadge.tsx` and fix the rendering logic only.

- [ ] **Step 3: Mark TODO done (no commit if no files changed)**

  If Step 1 confirmed reactivity and Step 2 passed — no commit needed. Mark Phase 5 item 5 checked in `TODO.md`:
  ```bash
  git add TODO.md
  git commit -m "chore: mark Phase 5 completedAscensions badge verification done"
  ```

  If code changed in Step 1:
  ```bash
  git add src/pages/HomePage.tsx TODO.md
  git commit -m "feat(hero): ensure completedAscensions Roman numeral badge reactive via useLiveQuery"
  ```

**Acceptance:** `grep` confirms `completedAscensions` flows from `useLiveQuery`; all 3 `PrestigeBadge` tests pass; badge updates without page refresh after prestige fires.

---

## 4. Global acceptance criteria

- [ ] `npm run test` green — zero regressions across all phases.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] `TheForge` renders when `track.active !== 'power'` (was missing entirely — no import, no branch).
- [ ] Switching Primary Goal cross-fades ObsidianStairs ↔ TheForge over 500ms.
- [ ] Forced throw in RAF (`tick` or `step`) → overlay collapses → `uiMode` snaps to `'focus'` → sonner toast bottom-center 4s.
- [ ] Blueprint/Logger remain interactive after canvas crash.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.
- [ ] `'professional'` mode string never appears — only `'focus'` and `'hero'`.

---

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `sonner` not in codebase | Phase 8.2 Step 1 installs before touching any files |
| `UIMode` has no `'professional'` value | Use `setUIMode('focus')` — confirmed `'focus' \| 'hero'` |
| RAF errors don't reach React error boundary natively | try/catch + rethrow in Phase 8.2 Steps 4-5 propagates error to boundary |
| 8.2 and 5.2 conflict | They touch **different files** (App.tsx/main.tsx/TheForge/CombatCanvas vs HeroOverlay) — safe to parallel |
| `motion` import addition breaks other framer-motion usage | Only adding `motion` to existing named import — no removals |
| `TheForge` import shadows something | No naming conflict — `TheForge` not currently imported anywhere in HeroOverlay |
| Stitch MCP unavailable | Stop and fix connectivity; never skip Stitch for Phase 5.2 |
| `completedAscensions` already reactive | Disk-verified reactive; Step 1 is a quick grep confirm, not a code change |
| `HeroOverlayWithBoundary` uses `useUIMode` outside provider | Rendered at line 97 inside `<UIModeProvider>` in App.tsx — hook is valid |

---

## 6. Execution order

| Step | Task | State |
|---|---|---|
| 1–24 | All combat, data, NLP, search, badge, HeroErrorBoundary | ~~DONE~~ |
| 25 | Phase 5.1 — Prestige wiring + PrestigeFlash | ~~DONE~~ |
| ~~26‖~~ | ~~Phase 8.2 — Wrap overlay + RAF safety + toast~~ | ~~DONE (commit a114297)~~ |
| **27‖** | **Phase 5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI]** | **← NEXT** |
| **28** | **Phase 7.1 — Verify completedAscensions badge** | **← NEXT (verify-only, anytime)** |

---

## 7. Exact next task

> **Three tasks are all unblocked. Two can run in parallel:**
>
> **8.2 ← START NOW (parallel with 5.2)**
> 1. `npm install sonner` → `npm run build` (verify zero TS errors).
> 2. Read `src/main.tsx`. Add `import { Toaster } from 'sonner'`. Add `<Toaster position="bottom-center" richColors />` inside StrictMode block alongside `<App />`.
> 3. Read `src/App.tsx`. Add `toast`/`HeroErrorBoundary`/`useUIMode` imports. Add `HeroOverlayWithBoundary` function before `export default function App()`. Replace `<HeroOverlay />` at line 97 with `<HeroOverlayWithBoundary />`.
> 4. Read `src/components/hero/TheForge.tsx`. Wrap `tick()` draw body (lines 51-86) in try/catch that cancels RAF and rethrows; move `rafRef.current = requestAnimationFrame(tick)` after the try/catch.
> 5. Read `src/components/hero/CombatCanvas.tsx`. Wrap `step()` draw body (lines 118-125) in try/catch that cancels RAF and rethrows; keep post-try RAF scheduling and clearRect unchanged.
> 6. `npm run test` → PASS. Commit `feat(ui): wrap HeroOverlay in HeroErrorBoundary with sonner toast, add RAF error rethrow for canvas fallback`. Check Phase 4 TODO item 2.
>
> **5.2 [STITCH UI] ← START NOW (parallel with 8.2)**
> 1. Generate 2 Stitch variants (Prompts A/B in Phase 5.2 Step 1). Pick one and record variant ID + reasoning.
> 2. Read `src/components/hero/HeroOverlay.tsx`. Add `motion` to framer-motion import (line 2). Add `import { TheForge } from './TheForge'` below ObsidianStairs import (line 14). Replace line 61 single-branch `{track.active === 'power' && <ObsidianStairs />}` with `AnimatePresence mode="wait"` wrapping both `ObsidianStairs` (key="stairs") and `TheForge` (key="forge"), each in `motion.div` with 500ms opacity.
> 3. `npm run test` → PASS. Commit `feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch`. Check Phase 5 TODO item 2.
>
> **7.1 ← RUN ANYTIME**
> 1. `grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx` — confirm reactive chain.
> 2. `npm run test -- PrestigeBadge` — confirm all 3 tests pass.
> 3. Commit only if code changed. Check Phase 5 TODO item 5.
