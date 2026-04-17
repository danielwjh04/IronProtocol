# Hero Mode Design Spec
**Date:** 2026-04-17  
**Status:** Approved  
**Scope:** UIModeController (global toggle) + CombatTrigger / HeavyBash system

---

## Overview

Add a "Hero Mode" gamification layer on top of the existing Focus Mode gym tracker. The layer is ambient — it never blocks the UI thread or delays DB writes. `ActiveLogger` and `CoreIgnition` stay mounted; only their visual skin and additional Hero overlays change.

---

## 1. State Management — `UIModeContext`

**File:** `src/context/UIModeContext.tsx`

### Interface

```ts
type UIMode = 'focus' | 'hero'

interface UIModeContextValue {
  uiMode: UIMode
  setUIMode: (mode: UIMode) => void
  dispatchCombat: (intensity: number) => void   // normalised 0–1
  pendingBash: { intensity: number; id: string } | null
}
```

### Persistence

- Storage: `localStorage` key `ip_ui_mode`
- Read once on provider mount; written on every `setUIMode` call
- No Dexie involvement — pure UI preference

### Mounting

- `UIModeProvider` wraps the app root in `main.tsx`, outside `HomePage`
- `CombatCanvas` renders as a portal child inside the provider — sibling to `HomePage`, not inside `ActiveLogger`
- A persistent floating toggle button (bottom-left, `z-index: 55`) is also rendered inside the provider, always visible regardless of session phase

### Pixel-Fade Transition

- Provider toggles a `data-ui-mode` attribute on `<html>`
- CSS class `.pixel-fade` applies a stepped `filter: blur()` + `opacity` keyframe at `steps(6)` — chunky pixel-dissolve without JS animation overhead
- `ActiveLogger` and `CoreIgnition` remain mounted throughout; no remount on mode switch

---

## 2. `useCombatTrigger` Hook

**File:** `src/hooks/useCombatTrigger.ts`

### Interface

```ts
function useCombatTrigger(): {
  triggerBash: (weight: number, reps: number) => void
}
```

### Integration

Called inside `handleCompleteSet` in `ActiveLogger`, after each successful DB write (both mid-session `persistDraft` path and final `db.sets.add` path):

```ts
triggerBash(weight, reps)
```

The `uiMode === 'hero'` guard lives **inside the hook** — `ActiveLogger` calls `triggerBash` unconditionally and remains ignorant of mode logic. The hook reads `uiMode` from context and no-ops when in Focus Mode.

### Intensity Calculation

```ts
const rawVolume = weight * reps
const intensity = Math.min(rawVolume / 2000, 1)  // normalised, ceiling at 2000 vol
```

- Bodyweight sets (0kg × n) produce `intensity: 0` — canvas fires with minimal effect
- Ceiling at 2000 volume units (e.g. 100kg × 20 reps)

### Dispatch

```ts
dispatchCombat(intensity)
// injects { intensity, id: crypto.randomUUID() } into context
```

The `id` ensures `CombatCanvas` re-triggers on consecutive identical intensities.

### Haptics

Called synchronously before dispatch (mirrors existing `CoreIgnition` vibration pattern):

```ts
navigator.vibrate?.([intensity > 0.7 ? 120 : 60, 30, 40])
```

Heavy triple-pattern for high intensity; light double-tap for low.

### Performance Guarantee

The hook never awaits. DB write completes first; `dispatchCombat` is called synchronously after — no blocking, no race condition.

---

## 3. `CombatCanvas` & `HeroOverlay`

### `CombatCanvas`

**File:** `src/components/hero/CombatCanvas.tsx`

- Fixed full-screen portal, `z-index: 60`, `pointer-events: none`
- Subscribes to `pendingBash` from `UIModeContext`
- Renders on every new `pendingBash.id`

**Placeholder sprite (slot-ready):**

Two geometric SVGs — Fighter and Mob. Fighter "lunges" via CSS `keyframes` translate on bash trigger. The SVG child is the swap slot: replace with a real 16-bit sprite sheet import without touching component logic.

### `ImpactStars`

**File:** `src/components/hero/ImpactStars.tsx`

- Generates `Math.ceil(intensity * 12)` star `<div>` elements on mount
- Each star has randomised `rotate`, `translate`, `scale` via inline CSS custom properties
- Framer Motion `AnimatePresence` handles mount/unmount
- No Canvas API — pure DOM particles sufficient at this scale

### `HeroOverlay`

**File:** `src/components/hero/HeroOverlay.tsx`

- Reads `uiMode` from context; only renders when `uiMode === 'hero'`
- Contains `CombatCanvas` + a `HERO MODE` pill badge (top-right corner)
- The badge includes the toggle button to switch back to Focus Mode

---

## 4. File Map

```
src/
  context/
    UIModeContext.tsx          # Provider, Context, useUIMode hook
  hooks/
    useCombatTrigger.ts        # triggerBash, intensity calc, haptics, dispatch
  components/
    hero/
      HeroOverlay.tsx          # Mounts when uiMode === 'hero'
      CombatCanvas.tsx         # Fixed portal, sprite placeholder, ImpactStars
      ImpactStars.tsx          # DOM particle burst
  index.css                    # .pixel-fade keyframe + steps(6) transition
main.tsx                       # UIModeProvider wraps app root
```

### Modified files

| File | Change |
|---|---|
| `main.tsx` | Wrap with `UIModeProvider`; render floating mode toggle |
| `src/components/ActiveLogger.tsx` | Call `triggerBash` after each set commit |
| `src/index.css` | Add `.pixel-fade` CSS keyframe |

---

## 5. Out of Scope (Separate Tickets)

- **T1 rep range by training goal:** `autoPlanner.ts` should return 3–5 reps for T1 exercises when `trainingGoal === 'Power'` and 8–12 when `trainingGoal === 'Hypertrophy'`. Captured here for tracking; not part of this implementation plan.
- Real 16-bit sprite sheet asset — placeholder slot is reserved in `CombatCanvas`

---

## 6. Constraints

- Gamification must not delay DB writes or block the UI thread
- `ActiveLogger` and `CoreIgnition` must stay mounted on mode switch
- Hero Mode is a bonus overlay; Focus Mode professional utility is unaffected
- No new npm dependencies beyond what is already installed
