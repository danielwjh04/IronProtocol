# Iron Protocol Endgame — Overnight Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 2 remaining unchecked TODO.md items — ObsidianStairs→TheForge 500ms cross-fade (Phase 5.2) and `completedAscensions` badge reactivity verification (Phase 7.1).

**Architecture:** React 18 + Vite + Tailwind + Dexie v15. Hero overlay in `src/components/hero/`. `HeroOverlay.tsx` is the single file that needs changing for 5.2. `HomePage.tsx` uses `useLiveQuery` and is already reactive — verify only, no code change expected for 7.1.

**Tech Stack:** React 18, Framer Motion (`AnimatePresence` + `motion`), Dexie v15, Vitest, TypeScript strict. Named imports only. Spring physics for UI. No wildcards. No inline comments.

**Generated:** 2026-04-18 (replan pass #25 — full disk-verify pass)

---

## 0. Automation Contract (ENFORCED)

> **From TODO.md — this is a hard rule, not a suggestion.**
>
> For every task marked **[STITCH UI]**:
> 1. Call `mcp__stitch__generate_screen_from_text` **twice** (exact prompts listed per task).
> 2. Inspect both variants.
> 3. Record the chosen variant ID and one sentence of reasoning in the **Stitch Selection** block before writing any code.
> 4. All code must match the chosen variant's layout and color decisions.
> 5. **If Stitch MCP is unavailable, stop and fix connectivity. Do not skip Stitch.**

| Phase | Task | Stitch required |
|---|---|---|
| 5.2 | ObsidianStairs → TheForge cross-fade | 2 variants |
| 7.1 | Badge verification | None (not a UI task) |

---

## 1. Live-state snapshot (pass #25, 2026-04-18 — disk-verified)

| Item | State | Evidence |
|---|---|---|
| Phase 8.2 — Wrap overlay + RAF safety + toast | **DONE** | commits `a114297` + `41d4d04`; `HeroErrorBoundary` wired in `App.tsx`; sonner `<Toaster>` in `main.tsx`; try/catch in `TheForge.tick()` and `CombatCanvas.step()` |
| Phase 5.2 — ObsidianStairs→TheForge cross-fade | **MISSING** | `HeroOverlay.tsx` line 61 is single-branch `{track.active === 'power' && <ObsidianStairs progress={track.power} />}`; `TheForge` not imported; `motion` not in framer-motion import |
| Phase 7.1 — Verify completedAscensions badge | **VERIFY-ONLY** | `HomePage.tsx` line 1: `useLiveQuery` imported; line 224: `onboardingRecord` from `useLiveQuery`; line 603: `completedAscensions={onboardingRecord?.completedAscensions ?? 0}` — reactive chain already correct |

---

## 2. Dependency graph

```
5.2  [STITCH UI] — unblocked (touches HeroOverlay.tsx only)
7.1              — unblocked (verify-only, any time)

5.2 ‖ 7.1 → no shared files, parallelisable
```

**Execution order:** Run 5.2 first (has Stitch overhead + code change). Run 7.1 any time in parallel or after.

---

## 3. File structure

| File | Action | Phase |
|---|---|---|
| `src/components/hero/HeroOverlay.tsx` | **Modify** — add `motion` to framer-motion import; add `TheForge` import; replace line 61 with `AnimatePresence mode="wait"` dual-branch | 5.2 |
| `src/pages/HomePage.tsx` | **Read-only** — grep confirms reactive chain; no code change | 7.1 |
| `src/test/PrestigeBadge.test.tsx` | **Run-only** — file exists; confirm all 3 tests pass | 7.1 |
| `TODO.md` | **Modify** — check off Phase 5 items 2 and 5 after each task | both |

---

## 4. Per-item execution plan

---

### Task 1: Phase 5.2 — ObsidianStairs → TheForge 500ms cross-fade [STITCH UI]

**TODO.md item:** Phase 5, item 2 — "Ensure the transition between the 'Obsidian Stairs' and 'The Forge' is smooth. Add a 500ms CSS cross-fade when the user switches their Primary Goal in settings."

**Files:**
- Modify: `src/components/hero/HeroOverlay.tsx`

**Stitch Selection — Phase 5.2**

- [ ] **Step 1: Generate Stitch variants**

  Call `mcp__stitch__generate_screen_from_text` twice:

  **Prompt A:**
  ```
  Full-screen dark RPG background cross-fade transition: left state is dark obsidian dungeon stairs (deep slate/navy palette), right state is orange forge fire embers (amber/orange palette). 500ms opacity cross-fade between the two backgrounds. Fixed position full-screen overlay, pointer-events none.
  ```

  **Prompt B:**
  ```
  Smooth 500ms background transition in a dark fitness RPG app, fading between a cool slate/indigo staircase scene and a warm amber/orange forge fire scene, full-screen fixed overlay, no UI chrome shown.
  ```

  _Selected variant ID:_ **f6491a45729c450c9de0f9e1e42158da**
  _Reasoning:_ Variant A ("RPG Background Transition") is a pure full-screen opacity fade with no UI chrome and pointer-events-none — exactly matching HeroOverlay's background role; Variant B added an unwanted "Thermal Shift" status card overlay.

- [ ] **Step 2: Verify Stitch selection recorded above, then open `HeroOverlay.tsx`**

  Confirm the Stitch Selection block above has a variant ID and reasoning sentence filled in. Only then proceed.

  Current `src/components/hero/HeroOverlay.tsx` line 2 (disk-verified):
  ```tsx
  import { AnimatePresence } from 'framer-motion'
  ```

  Replace with:
  ```tsx
  import { AnimatePresence, motion } from 'framer-motion'
  ```

- [ ] **Step 3: Add `TheForge` import**

  Current line 13 (disk-verified):
  ```tsx
  import { ObsidianStairs } from './ObsidianStairs'
  ```

  Insert immediately after (new line 14):
  ```tsx
  import { TheForge } from './TheForge'
  ```

- [ ] **Step 4: Replace line 61 with AnimatePresence cross-fade**

  Current line 61 (disk-verified):
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

- [ ] **Step 5: Run full test suite**

  ```bash
  npm run test
  ```

  Expected: all tests pass, zero regressions.

- [ ] **Step 6: Run build to verify zero TS errors**

  ```bash
  npm run build
  ```

  Expected: build succeeds, no TypeScript errors, no unused-import warnings.

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/hero/HeroOverlay.tsx
  git commit -m "feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch"
  ```

- [ ] **Step 8: Check off in TODO.md**

  In `TODO.md`, change Phase 5 item 2 from `- [ ]` to `- [x]`:
  ```
  - [x] [STITCH UI] Ensure the transition between the "Obsidian Stairs" and "The Forge" is smooth. Add a 500ms CSS cross-fade when the user switches their Primary Goal in settings.
  ```

  ```bash
  git add TODO.md
  git commit -m "chore: mark Phase 5 cross-fade done"
  ```

**Acceptance:**
- `TheForge` renders when `track.active !== 'power'` (was missing entirely — no import, no branch).
- `ObsidianStairs` renders when `track.active === 'power'`.
- Switching Primary Goal cross-fades ObsidianStairs ↔ TheForge over 500ms via `AnimatePresence mode="wait"`.
- Both backgrounds are never visible simultaneously.
- `motion` added to existing framer-motion import line — no other framer-motion imports changed.
- Stitch Selection block contains a variant ID and one sentence of reasoning.

---

### Task 2: Phase 7.1 — Verify `completedAscensions` Roman numeral badge updates in real-time

**TODO.md item:** Phase 5, item 5 — "Verify that `completedAscensions` correctly updates the Roman Numeral badge in the `HomePage` header in real-time without a page refresh."

**Disk-verified facts (no code change expected):**
- `HomePage.tsx` line 1: `useLiveQuery` imported from `dexie-react-hooks` ✓
- `HomePage.tsx` line 224: `onboardingRecord` assigned from `useLiveQuery` ✓
- `HomePage.tsx` line 603: `completedAscensions={onboardingRecord?.completedAscensions ?? 0}` ✓
- `src/test/PrestigeBadge.test.tsx` exists ✓

**Files:**
- Read: `src/pages/HomePage.tsx` (grep only — confirm chain)
- Run: `src/test/PrestigeBadge.test.tsx`

- [ ] **Step 1: Confirm reactive chain in `HomePage.tsx`**

  ```bash
  grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx
  ```

  Expected output must include ALL THREE of:
  - A line ~1: `useLiveQuery` import
  - A line ~224: `useLiveQuery` call assigning `onboardingRecord`
  - A line ~603: `completedAscensions={onboardingRecord?.completedAscensions ?? 0}`

  If all three are present → no code change needed. Proceed to Step 2.

  **Only if `completedAscensions` is NOT derived from a `useLiveQuery` result** — fix it:
  ```tsx
  const onboardingRecord = useLiveQuery<AppSettings | null>(
    async () => (await db.settings.get(APP_SETTINGS_ID)) ?? null,
    [db],
  )
  const completedAscensions = onboardingRecord?.completedAscensions ?? 0
  ```

- [ ] **Step 2: Run `PrestigeBadge.test.tsx`**

  ```bash
  npm run test -- PrestigeBadge
  ```

  Expected: all 3 tests pass (0 ascensions → no badge, 1 → "I", 4 → "IV"). If any fail, read `src/components/PrestigeBadge.tsx` and fix only the rendering logic (not the test).

- [ ] **Step 3: Check off in TODO.md (commit only if code changed)**

  If Steps 1–2 passed with no code changes:
  ```bash
  git add TODO.md
  git commit -m "chore: mark Phase 5 completedAscensions badge verification done"
  ```

  If code changed in Step 1:
  ```bash
  git add src/pages/HomePage.tsx TODO.md
  git commit -m "feat(hero): ensure completedAscensions Roman numeral badge reactive via useLiveQuery"
  ```

**Acceptance:**
- `grep` confirms all three lines present in `HomePage.tsx`.
- All 3 `PrestigeBadge` tests pass.
- Badge updates without page refresh after prestige fires.

---

## 5. Global acceptance criteria

- [ ] `npm run test` green — zero regressions.
- [ ] `npm run build` succeeds — zero TS errors, zero unused imports.
- [ ] `TheForge` renders when `track.active !== 'power'` (was missing entirely before this plan).
- [ ] Switching Primary Goal cross-fades ObsidianStairs ↔ TheForge over 500ms.
- [ ] `completedAscensions` badge updates without page refresh via `useLiveQuery`.
- [ ] Both TODO.md items checked off.
- [ ] No `Co-authored-by: Claude` trailer in any commit.
- [ ] Zero inline comments added to any file.
- [ ] Stitch Selection block filled in (variant ID + reasoning) before any 5.2 code was written.

---

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Stitch MCP unavailable | Stop and fix connectivity before writing any 5.2 code — never skip |
| `TheForge` export name mismatch | Import added in Step 3; TS build in Step 6 catches any name error |
| `motion` import addition breaks other framer-motion usage | Only adding `motion` to existing named import line — no removals |
| `AnimatePresence mode="wait"` nests inside existing `AnimatePresence` at line 72 | Outer `AnimatePresence` at line 72 handles damage numbers/burst — different subtree, no conflict |
| `completedAscensions` already reactive | Disk-verified reactive; Step 1 is a 2-second grep confirm, not a code change |
| `PrestigeBadge` tests fail due to unrelated regression | Fix only `PrestigeBadge.tsx` rendering logic; do not modify the test |

---

## 7. Execution order

| Step | Task | State |
|---|---|---|
| 1–24 | All combat, data, NLP, search, badge, HeroErrorBoundary | ~~DONE~~ |
| 25 | Phase 5.1 — Prestige wiring + PrestigeFlash | ~~DONE~~ (commit `8eb2ab5`) |
| 26 | Phase 8.2 — Wrap overlay + RAF safety + toast | ~~DONE~~ (commits `a114297` + `41d4d04`) |
| 27 | Phase 5.2 — ObsidianStairs→TheForge cross-fade [STITCH UI] | ~~DONE~~ |
| **28** | **Phase 7.1 — Verify completedAscensions badge** | **← NEXT (run in parallel with 27 or after)** |

---

## 8. Exact next task

> **Two tasks remain. Both are unblocked. Run in parallel if possible.**
>
> **Task 1 — Phase 5.2 [STITCH UI] ← START NOW**
> 1. Call `mcp__stitch__generate_screen_from_text` with Prompt A (dark obsidian dungeon stairs → forge fire embers, 500ms opacity cross-fade).
> 2. Call `mcp__stitch__generate_screen_from_text` with Prompt B (slate/indigo → amber/orange fitness RPG fade).
> 3. Pick the variant that better matches ObsidianStairs slate/navy + TheForge amber/orange. Record variant ID + reasoning in Stitch Selection block.
> 4. In `src/components/hero/HeroOverlay.tsx` line 2: add `motion` to the framer-motion import.
> 5. After line 13 (ObsidianStairs import): add `import { TheForge } from './TheForge'`.
> 6. Replace line 61 single-branch `{track.active === 'power' && <ObsidianStairs ...>}` with `AnimatePresence mode="wait"` wrapping both `ObsidianStairs` (key="stairs") and `TheForge` (key="forge"), each in a `motion.div` with 500ms opacity.
> 7. `npm run test` → PASS. `npm run build` → zero TS errors.
> 8. Commit `feat(hero): 500ms cross-fade between ObsidianStairs and TheForge on track switch`.
> 9. Check Phase 5 item 2 in TODO.md. Commit `chore: mark Phase 5 cross-fade done`.
>
> **Task 2 — Phase 7.1 ← RUN ANY TIME (parallel with Task 1)**
> 1. `grep -n "completedAscensions\|useLiveQuery" src/pages/HomePage.tsx` — confirm all 3 lines present.
> 2. `npm run test -- PrestigeBadge` — confirm all 3 tests pass.
> 3. Check Phase 5 item 5 in TODO.md. Commit only if code changed.
