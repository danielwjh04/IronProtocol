# Gemini Semantic Layer — Design Spec

**Date:** 2026-04-16
**Sub-project:** A of 3 (Gemini Semantic Layer → UI Mode Toggle → Monolith Arc)
**Status:** Approved, ready for implementation planning

---

## Overview

Extends IronProtocol's existing Gemini integration (`aiPlannerService.ts`) with two new AI capabilities:

1. **Semantic Swap** — natural language exercise substitution, available in both `SessionBlueprint` (pre-session) and `ActiveLogger` (mid-session)
2. **Recovery Auditor** — Gemini-powered recovery telemetry analysis that routes to session-level adjustments or arc-level macrocycle recalibration based on severity

Both features are Lab-only (require `VITE_GEMINI_API_KEY` + online). When unavailable, explicit locked states are shown — no silent degradation.

---

## Architecture

### Approach: Shared Gemini Client + Feature Modules

Extract shared HTTP primitives from `aiPlannerService.ts` into `geminiClient.ts`. Each feature gets its own service file and a custom React hook. Components stay thin.

### New Files

| File | Responsibility |
|------|----------------|
| `src/services/geminiClient.ts` | Shared `fetchGemini()`, timeout, Zod parse, `isLabAvailable()` |
| `src/services/semanticSwapService.ts` | Swap prompt builder, `SwapResult` Zod schema, `generateSemanticSwap()` |
| `src/services/recoveryAuditorService.ts` | Audit prompt builder, severity scoring, `generateRecoveryAudit()` |
| `src/hooks/useSemanticSwap.ts` | Async state (idle/loading/result/error), Lab gate, `submit(query, exercise)` |
| `src/hooks/useRecoveryAudit.ts` | Async state, Lab gate, reads Dexie `recoveryLogs` |
| `src/components/SemanticSwapDrawer.tsx` | Shared slide-up drawer UI, used in Blueprint + ActiveLogger |
| `src/components/RecoveryAuditorCard.tsx` | Pre-ignition recovery brief, mounted in `CoreIgnition` |

### Modified Files

| File | Change |
|------|--------|
| `src/services/aiPlannerService.ts` | Internal refactor to use `geminiClient`; all public exports unchanged |
| `src/db/schema.ts` | V14: adds `RecoveryLog` interface, `MuscleGroup` type, `recoveryLogs` table |
| `src/components/SessionBlueprint.tsx` | Mounts `SemanticSwapDrawer` on exercise tap |
| `src/components/ActiveLogger.tsx` | Mounts `SemanticSwapDrawer` + post-session `RecoveryLog` form |
| `src/components/CoreIgnition.tsx` | Mounts `RecoveryAuditorCard` when ≥1 recovery log exists |

---

## Schema V14

### New Type: `MuscleGroup`

```typescript
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
```

Aligned with existing `Exercise.muscleGroup` values in the exercise library.

### New Interface: `RecoveryLog`

```typescript
export interface RecoveryLog {
  id: string                    // UUID PK
  workoutId: string             // FK → Workout.id
  loggedAt: number              // Unix ms
  sleepHours: number            // 0–12 (capped at 12)
  sleepQuality: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
  overallFatigue: 1 | 2 | 3 | 4 | 5
  soreness: Partial<Record<MuscleGroup, 1 | 2 | 3 | 4 | 5>>
}
```

`soreness` is `Partial` — user taps only affected muscle groups, not a mandatory grid.

### Dexie V14 Migration

```typescript
this.version(14).stores({
  // all existing tables unchanged...
  recoveryLogs: 'id, workoutId, loggedAt',
})
// No upgrade callback needed — table starts empty.
```

---

## Service Contracts

### `geminiClient.ts`

```typescript
export function isLabAvailable(): boolean
// Checks VITE_GEMINI_API_KEY presence + navigator.onLine

export async function fetchGemini<T>(
  prompt: string,
  schema: ZodType<T>,
  config?: { temperatureOverride?: number }
): Promise<T>
// Shared: fetch + AbortController timeout (90s) + Zod validation + logPlannerFailure
```

`aiPlannerService.ts` refactors its internal fetch/parse to call `fetchGemini`. Public API (`generateWorkoutBlueprint`, `buildSystemPrompt`, `generateLocalMacrocycle`, `canonicalizeExerciseName`) stays identical.

### `semanticSwapService.ts`

```typescript
export interface SwapResult {
  exerciseName: string          // canonicalized via existing alias map
  muscleGroup: string
  tier: 'T1' | 'T2' | 'T3'
  reason: string                // 1-sentence biomechanical justification
  confidence: 'high' | 'medium' | 'low'
}

export function buildSwapPrompt(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema
): string

export async function generateSemanticSwap(
  query: string,
  currentExercise: { name: string; tier: ExerciseTier; muscleGroup: string },
  exerciseDB: ReadonlyExercise[],
  v11Contract: V11AppSettingsSchema
): Promise<SwapResult>
```

Prompt passes: V11 contract (equipment, injuries, goals) + current exercise metadata + local exercise DB filtered by muscle group and tier + user's natural language query. Output canonicalized via existing `canonicalizeExerciseName`.

### `recoveryAuditorService.ts`

```typescript
export interface SessionAdjustment {
  type: 'reduce-volume' | 'swap-exercise' | 'extend-rest' | 'rest-day'
  target?: string               // exercise name when type === 'swap-exercise'
  detail: string                // e.g. "Drop T3 volume by 1 set"
}

export interface ArcRecommendation {
  action: 'insert-deload' | 'reduce-overload-delta' | 'shift-goal-weighting'
  rationale: string
}

export interface AuditResult {
  severity: 'low' | 'medium' | 'high'
  missionBrief: string          // 1–2 sentence Gemini narrative shown in card header
  sessionAdjustments: SessionAdjustment[]
  arcRecommendation?: ArcRecommendation  // only present when severity === 'high'
}

export function buildAuditPrompt(
  logs: RecoveryLog[],          // last 4, ordered by loggedAt desc
  recentWorkouts: Workout[],    // last 4 workouts for volume context
  v11Contract: V11AppSettingsSchema
): string

export async function generateRecoveryAudit(
  logs: RecoveryLog[],
  recentWorkouts: Workout[],
  v11Contract: V11AppSettingsSchema
): Promise<AuditResult>
```

---

## Data Flows

### Semantic Swap

1. User taps exercise in `SessionBlueprint` or `ActiveLogger`
2. `SemanticSwapDrawer` mounts via `AnimatePresence` (slide-up)
3. User types natural language query
4. `useSemanticSwap.submit(query, exercise)` called
5. `semanticSwapService.generateSemanticSwap()` → `geminiClient.fetchGemini()`
6. `SwapResult` returned, confidence chip rendered (high=electric, medium=amber, low=muted)
7. User confirms → `onSwapConfirmed(exerciseName)` fires → parent updates plan or active exercise

### Recovery Auditor

1. Session completes in `ActiveLogger` → `RecoveryLog` form appears
2. User fills sleep hours (number input), sleep quality, stress, fatigue (1–5 tile selectors), soreness (tap-to-toggle muscle group chips)
3. On confirm: `RecoveryLog` written to Dexie V14 with `workoutId` FK
4. On skip: form dismissed, no write (non-blocking)
5. Next visit to `CoreIgnition`: `useRecoveryAudit` reads last 4 logs from Dexie (ordered by `loggedAt` desc)
6. If 0 logs: `RecoveryAuditorCard` not rendered
7. If ≥1 log: `generateRecoveryAudit()` called
8. `AuditResult.severity` routes display:
   - `low` → green card, no adjustments shown
   - `medium` → amber card, `sessionAdjustments` listed
   - `high` → red card, `sessionAdjustments` + arc recommendation prompt; user confirms before any arc write

---

## UI Specifications

### SemanticSwapDrawer

- **Trigger:** Exercise tap in `SessionBlueprint` or `ActiveLogger`
- **Mount:** `AnimatePresence` slide-up sheet from bottom
- **Handle:** 36px drag indicator bar, centered
- **Header:** Electric blue dot + "Lab · Biomechanical Search" label + exercise name + tier badge
- **Input:** Full-width text field, border glows electric blue on focus; send arrow button
- **Result state:** Card with exercise name, tier badge, muscle group chip, reason text, confidence chip, "Confirm Swap" CTA
- **Confidence colours:** high=`#22c55e`, medium=`#f59e0b`, low=muted with warning note
- **Lab-only locked state:** Grey dot + "Lab · Offline" label, disabled input, centred lock card with 🔬 icon and explanation text
- **Error state:** Inline error text below input, retry does not close drawer

### RecoveryAuditorCard

- **Location:** `src/components/CoreIgnition.tsx`, rendered above the launch CTA when ≥1 recovery log exists
- **Not rendered:** When 0 logs exist or Lab unavailable and no cached result
- **Lab-only locked state:** Grey badge, greyed card body, explanation text — does not block session launch
- **Severity border colours:** low=`#22c55e44`, medium=`#f59e0b44`, high=`#ef444444`
- **`missionBrief`:** Rendered as italic quote in card header
- **Arc adjustment:** Shown only for `severity === 'high'`; "Review Arc Adjustment →" CTA opens confirmation modal before any write

### Post-Session RecoveryLog Form

- **Location:** Appears in `ActiveLogger` after workout commit, before the session-complete screen
- **Sleep hours:** Number input (0–12)
- **Sleep quality / stress / fatigue:** 1–5 tile selectors (filled electric blue = selected, `#1e2a45` = unselected)
- **Soreness:** Tap-to-toggle muscle group chips (6 groups); tapped = electric border + blue text
- **CTA:** "Log Recovery Data" (primary, electric blue); "Skip — I'll log next time" (muted text link below)
- **Skip behaviour:** Dismisses form without writing to Dexie; workout data is unaffected

---

## Error Handling

### Semantic Swap

| Condition | Behaviour |
|-----------|-----------|
| `isLabAvailable()` false | Locked drawer state shown; no service call |
| Gemini timeout (>90s) | Inline: "Search timed out. Try a shorter query." Drawer stays open. |
| Zod parse failure | Inline: "Unexpected response. Try again." Raw payload logged to console. |
| Low confidence result | Result shown with amber chip + advisory note |
| Network error | Inline error with retry button; parent component unaffected |

### Recovery Auditor

| Condition | Behaviour |
|-----------|-----------|
| `isLabAvailable()` false | Card shows locked state; form still usable; log saved to Dexie |
| 0 recovery logs | `RecoveryAuditorCard` not rendered in `CoreIgnition` |
| Gemini failure | Card shows "Audit unavailable — retry"; session launch not blocked |
| User skips log form | No Dexie write; non-blocking |
| Dexie write failure | Recovery log silently skipped; workout data never at risk |
| Arc recommendation | Always user-confirmed; never auto-applied to macrocycle |

---

## Test Coverage

### Unit — Service Layer (`src/test/semanticSwapService.test.ts`, `recoveryAuditorService.test.ts`)

- `buildSwapPrompt` includes all V11 contract fields
- `buildSwapPrompt` includes exercise DB context (filtered by muscle group)
- `buildAuditPrompt` formats rolling window of 4 logs correctly
- Zod schemas reject malformed Gemini responses (missing fields, wrong types)
- `canonicalizeExerciseName` applied to swap results

### Unit — Hooks (`src/test/useSemanticSwap.test.ts`, `useRecoveryAudit.test.ts`)

- `useSemanticSwap` returns Lab-only state when `isLabAvailable()` returns false
- `useSemanticSwap` transitions idle → loading → result on submit
- `useSemanticSwap` transitions to error state on service throw
- `useRecoveryAudit` returns Lab-only state when offline
- `useRecoveryAudit` does not call service when 0 logs in Dexie

### Component — SemanticSwapDrawer (`src/test/UI.test.tsx`)

- Renders locked state when `isLabAvailable=false`
- Submit button disabled while loading
- Confidence chip colour matches result severity
- `onSwapConfirmed` fires with correct canonicalized exercise name
- Renders cleanly in initial (no result) state

### Component — RecoveryAuditorCard (`src/test/UI.test.tsx`)

- Renders correct border/badge colour per severity
- Arc adjustment section hidden when `severity !== 'high'`
- Renders locked state when `isLabAvailable=false`
- "Review Arc Adjustment" CTA fires callback
- Not rendered when passed `null` audit result

---

## Out of Scope (Sub-projects B and C)

- UI Mode Toggle (Focus Mode vs Hero Mode) — Sub-project B
- Monolith Progression Visualization (Obsidian Stairs) — Sub-project C
- "Mission Briefs" as rendered narrative in Hero Mode — Sub-project C
- Legendary Achievement Card — Sub-project C
