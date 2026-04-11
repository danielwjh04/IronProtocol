# IronProtocol — Foundation & Phase 1 Onboarding Design
**Date:** 2026-04-11
**Scope:** Database schema extension (v11), Electric Navy theme tokens, IdentitySplash full onboarding form

---

## 1. Context

The project already has a mature Dexie.js schema at version 10 (`src/db/schema.ts`) and a partial `IdentitySplash.tsx` that captures Name and Days/Week only. This spec extends both to match Phase 1 of `raw/vision.md`.

**Files touched:**
- `src/index.css` — Tailwind v4 `@theme` palette injection
- `src/db/schema.ts` — `AppSettings` extension + version 11
- `src/components/IdentitySplash.tsx` — full 4-field onboarding form

**File NOT created:** `tailwind.config.js` — this project uses Tailwind CSS v4 (`@tailwindcss/vite: ^4.2.2`), which uses CSS-based configuration. A `tailwind.config.js` is not read and must not be created.

---

## 2. `src/index.css` — Electric Navy `@theme` Tokens

Add a `@theme` block immediately after `@import "tailwindcss"` to expose the Electric Navy palette as first-class Tailwind utility classes.

**Tokens to register:**

| Token name | Value | Generated utilities |
|---|---|---|
| `--color-navy` | `#0A0E1A` | `bg-navy`, `text-navy`, `border-navy` |
| `--color-navy-card` | `#0D1626` | `bg-navy-card` |
| `--color-navy-border` | `#1a2a5e` | `border-navy-border` |
| `--color-electric` | `#3B71FE` | `bg-electric`, `text-electric`, `border-electric` |
| `--color-pink` | `#FF89D6` | `bg-pink`, `text-pink`, `border-pink` |
| `--color-vivid-red` | `#FF3B3B` | `bg-vivid-red`, `text-vivid-red` |
| `--font-display` | `'Barlow', sans-serif` | `font-display` |
| `--font-ui` | `'Inter', 'Segoe UI', sans-serif` | `font-ui` |

Existing raw CSS variables (`--electric-blue`, `--surface-bg`, etc.) are kept for backward compatibility with existing inline usages.

---

## 3. `src/db/schema.ts` — Version 11

### 3a. `AppSettings` interface extension

Three new optional fields added:

```ts
northStar?: string    // Free-text goal: "I want to..."
purposeChip?: string  // One of: 'strength' | 'hypertrophy' | 'fat-loss' | 'endurance' | 'health'
qosMinutes?: number   // Session time budget: 15–120, default 45
```

Existing fields (`id`, `hasCompletedOnboarding`, `preferredRoutineType`, `daysPerWeek`, `userName`) are unchanged.

### 3b. Version 11 migration block

Store schema is unchanged from v10. No data migration needed — new fields are optional and absent rows receive `undefined`. The version block is added to satisfy Dexie's strict versioning rule (never modify existing version blocks).

```ts
this.version(11).stores({
  exercises:     'id, name, muscleGroup, tier, *tags',
  workouts:      'id, date, routineType, sessionIndex',
  sets:          'id, workoutId, exerciseId, orderIndex',
  settings:      'id, preferredRoutineType',
  tempSessions:  'id, updatedAt',
  baselines:     'exerciseName',
  dailyTargets:  'date',
  personalBests: 'exerciseId',
})
```

---

## 4. `src/components/IdentitySplash.tsx` — Full Onboarding Form

### 4a. Form fields

| Field | UI | State type | Saves to |
|---|---|---|---|
| Call Sign | `<input type="text">` | `string` | `userName` |
| North Star | `<textarea>` (2 rows) | `string` | `northStar` |
| Purpose | 5 tap chips | `PurposeChip \| null` | `purposeChip` |
| QoS | `<input type="range">` 15–120 | `number` | `qosMinutes` |
| Days/Week | 3-button toggle (3×/4×/5×) | `3 \| 4 \| 5` | `daysPerWeek` |

**Purpose chip values:** `'strength' | 'hypertrophy' | 'fat-loss' | 'endurance' | 'health'`
**Purpose chip labels:** Strength · Hypertrophy · Fat Loss · Endurance · Health

**QoS default:** 45 minutes. Live label updates as slider moves (e.g. "45 min").

**Submit gate:** Requires `name.trim().length > 0` AND `purposeChip !== null`. North Star is optional (can be empty string).

### 4b. Submit behavior

Single `db.settings.put()` call:

```ts
await db.settings.put({
  id: APP_SETTINGS_ID,
  hasCompletedOnboarding: existing?.hasCompletedOnboarding ?? false,
  preferredRoutineType: existing?.preferredRoutineType ?? 'PPL',
  daysPerWeek,
  userName: name.trim(),
  northStar: northStar.trim(),
  purposeChip,
  qosMinutes,
})
```

`hasCompletedOnboarding` remains `false` at this stage — it is set to `true` only after the baseline calibration step later in the flow.

### 4c. Motion choreography

- Title character stagger: existing behavior preserved
- Subtitle fade: existing behavior preserved
- Form card: `initial={{ opacity: 0, y: 16 }}` → animate in after subtitle
- Purpose chips: `whileTap={{ scale: 0.95 }}` per spec
- Submit button: `whileTap={{ scale: 0.95 }}` per spec, glow shadow while enabled
- Spring config: stiffness 300, damping 30 per vision.md §I

---

## 5. What is NOT in scope

- `src/db/db.ts`: Already correct — singleton re-export of `IronProtocolDB`. No changes.
- ThinkingTerminal / Vercel Edge Function handshake: Phase 2.
- Blueprint Audit Screen, Active Logger, Victory Lap: Later phases.
- `hasCompletedOnboarding` being set to `true`: Happens at baseline calibration step, not here.

---

## 6. Testing

Existing test suite (`src/test/db.test.ts`, `src/test/UI.test.tsx`) should pass without modification. No new tests are added in this phase — the onboarding form is covered by the upcoming integration test pass.
