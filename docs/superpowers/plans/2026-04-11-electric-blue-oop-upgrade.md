# Electric Blue OOP Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden IronProtocol's core logic layer with strict OOP patterns (interfaces, encapsulation, generics, immutability), extend the schema to v10 with DailyTargets + PersonalBests, enforce the 120m QoS ceiling, and wire instant per-keystroke draft persistence.

**Architecture:** New `src/services/` layer owns all daily-metrics and achievement logic — components never compute progress directly. `ProgressIndicator<T>` provides a reusable, generic percentage engine consumed by `ActivityManager`. Schema v10 adds two tables (`dailyTargets`, `personalBests`) with proper Dexie migration. Superset support is modelled at the type level via `IWorkoutAction` without changing the active logger's UI flow.

**Tech Stack:** Vite + React 19 (TS), Dexie 4, Zod 4, Vitest 4, framer-motion 12, Tailwind CSS 4.

---

## Audit Findings

| File | Gap Identified |
|---|---|
| `src/db/schema.ts` (v9) | No `DailyTargets` or `PersonalBests` tables. No `IWorkoutAction` / superset typing. No `readonly` on blueprint interfaces. |
| `src/planner/autoPlanner.ts` | 120m QoS ceiling NOT enforced — `timeAvailable` passes raw into tier logic. `PlannedExercise` / `PlannedWorkout` fields are mutable. |
| `src/components/ActiveLogger.tsx` | `persistDraft` only called after full set completion — rep/weight keystrokes are NOT persisted. |
| `src/validation/tempSessionSchema.ts` | No `supersetGroupId` field. Schema will reject any future superset drafts. |

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/db/schema.ts` | v10 migration (DailyTargets, PersonalBests tables); `IWorkoutAction` + `supersetGroupId`; `ReadonlyExercise` type alias |
| Modify | `src/planner/autoPlanner.ts` | 120m ceiling clamp; `readonly` on `PlannedExercise` + `PlannedWorkout` fields |
| Modify | `src/validation/tempSessionSchema.ts` | Add optional `supersetGroupId` to exercise sub-schema |
| Modify | `src/components/ActiveLogger.tsx` | Instant draft persistence on weight/reps `onChange` |
| Create | `src/services/activityManager.ts` | `IDashboardMetrics` interface + `ActivityManager` class |
| Create | `src/services/progressIndicator.ts` | `ProgressIndicator<T>` generic logic class |
| Create | `src/services/personalBests.ts` | `PersonalBestsService` — achievement flag logic |
| Create | `src/test/activityManager.test.ts` | Tests for ActivityManager + ProgressIndicator |
| Create | `src/test/personalBests.test.ts` | Tests for PersonalBestsService |

---

## Task 1: Enforce 120m QoS Ceiling in autoPlanner.ts

**Files:**
- Modify: `src/planner/autoPlanner.ts:566-665` (function `planRoutineWorkoutPure`)
- Modify: `src/test/autoPlanner.test.ts` (add ceiling test)

- [ ] **Step 1: Write the failing test**

Add this test to `src/test/autoPlanner.test.ts` in the existing `planRoutineWorkoutPure` describe block:

```ts
it('clamps timeAvailable to 120m — passing 180m behaves identically to 120m', () => {
  const exercises: Exercise[] = [
    { id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', tier: 1, tags: ['push', 'compound'], mediaType: 'webp', mediaRef: 'bench.webp' },
    { id: 'e2', name: 'Overhead Press', muscleGroup: 'Shoulders', tier: 2, tags: ['push'], mediaType: 'webp', mediaRef: 'ohp.webp' },
    { id: 'e3', name: 'Cable Fly', muscleGroup: 'Chest', tier: 3, tags: ['push', 'isolation'], mediaType: 'webp', mediaRef: 'fly.webp' },
  ]
  const base = {
    routineType: 'PPL',
    trainingGoal: 'Hypertrophy' as const,
    exercises,
    workoutsForRoutine: [],
    sets: [],
  }
  const at120 = planRoutineWorkoutPure({ ...base, timeAvailable: 120 })
  const at180 = planRoutineWorkoutPure({ ...base, timeAvailable: 180 })

  expect(at180.exercises.map(e => e.exerciseId)).toEqual(at120.exercises.map(e => e.exerciseId))
  expect(at180.estimatedMinutes).toBe(at120.estimatedMinutes)
})
```

- [ ] **Step 2: Run the test to confirm it FAILS**

```bash
npx vitest run src/test/autoPlanner.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — the two results differ because 180m is currently treated the same as "any time >= 40m" tier-wise but `estimatedMinutes` may diverge if the internal time is used directly.

- [ ] **Step 3: Add the 120m ceiling clamp to `planRoutineWorkoutPure`**

In `src/planner/autoPlanner.ts`, locate the first line of `planRoutineWorkoutPure` (line ~577). Add the clamp immediately after the destructured parameters:

```ts
export function planRoutineWorkoutPure({
  routineType,
  sessionIndex: requestedSessionIndex,
  trainingGoal,
  timeAvailable,
  exercises,
  workoutsForRoutine,
  sets,
  baselines,
  additionalFocusParts,
}: RoutineInputSnapshot): PlannedWorkout {
  // 120m is the QoS ceiling — inputs above this produce identical output to 120m.
  const effectiveTime = Math.min(timeAvailable, 120)
  const resolvedBaselines = baselines ?? new Map<string, number>()
```

Then replace every subsequent reference to `timeAvailable` inside this function with `effectiveTime`. There are exactly two occurrences to update:

1. `const tierCap = tierCapForTime(timeAvailable)` → `const tierCap = tierCapForTime(effectiveTime)`
2. `&& calcEstimatedMinutes(qosFiltered, restMinutes) > timeAvailable` → `&& calcEstimatedMinutes(qosFiltered, restMinutes) > effectiveTime`

- [ ] **Step 4: Run the test to confirm it PASSES**

```bash
npx vitest run src/test/autoPlanner.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: PASS — `at120` and `at180` produce identical results.

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -40
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/megaw/Downloads/IronProtocol" && git add src/planner/autoPlanner.ts src/test/autoPlanner.test.ts && git commit -m "feat(planner): enforce 120m QoS ceiling in planRoutineWorkoutPure"
```

---

## Task 2: Readonly Types on PlannedExercise, PlannedWorkout, and ReadonlyExercise Alias

**Files:**
- Modify: `src/planner/autoPlanner.ts:4-18` (PlannedExercise + PlannedWorkout interfaces)
- Modify: `src/db/schema.ts` (add ReadonlyExercise alias)

- [ ] **Step 1: Add `readonly` to all `PlannedExercise` fields**

In `src/planner/autoPlanner.ts`, replace the `PlannedExercise` interface (lines 4–12):

```ts
export interface PlannedExercise {
  readonly exerciseId: string
  readonly exerciseName: string
  readonly weight: number
  readonly reps: number
  readonly sets: number
  readonly tier: ExerciseTier
  readonly progressionGoal: string
}
```

- [ ] **Step 2: Add `readonly` to all `PlannedWorkout` fields**

Replace the `PlannedWorkout` interface (lines 14–19):

```ts
export interface PlannedWorkout {
  readonly exercises: readonly PlannedExercise[]
  readonly estimatedMinutes: number
  readonly routineType: string
  readonly sessionIndex: number
}
```

- [ ] **Step 3: Export `ReadonlyExercise` type alias from schema.ts**

In `src/db/schema.ts`, after the `Exercise` interface definition (after line 13), add:

```ts
// ReadonlyExercise is used at consumption boundaries (planner, services) where
// exercise data must not be mutated. The mutable Exercise type is preserved for
// Dexie upgrade callbacks which use .modify() with partial mutation.
export type ReadonlyExercise = Readonly<Exercise>
```

- [ ] **Step 4: Typecheck to verify no regressions**

```bash
cd "c:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -40
```

Expected: Zero errors. The `readonly` modifier on `PlannedExercise` fields is compatible with all spread operations used in the planner (e.g., `{ ...exercise, sets: 3 }` creates a new object, not a mutation).

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/planner/autoPlanner.ts src/db/schema.ts && git commit -m "feat(types): enforce readonly on PlannedExercise, PlannedWorkout; add ReadonlyExercise alias"
```

---

## Task 3: IWorkoutAction Interface + Superset Support in TempSession Schema

**Files:**
- Modify: `src/db/schema.ts` (add `IWorkoutAction`, add `supersetGroupId` to `TempSessionExercise`)
- Modify: `src/validation/tempSessionSchema.ts` (extend exercise sub-schema with optional field)

- [ ] **Step 1: Add `supersetGroupId` to `TempSessionExercise` in schema.ts**

In `src/db/schema.ts`, replace the `TempSessionExercise` interface (lines 51–59):

```ts
export interface TempSessionExercise {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  sets: number
  tier: ExerciseTier
  progressionGoal: string
  // Defined when this exercise is part of a superset group.
  // Exercises sharing the same supersetGroupId are performed back-to-back
  // with no rest between them.
  supersetGroupId?: string
}
```

- [ ] **Step 2: Add the `IWorkoutAction` interface to schema.ts**

In `src/db/schema.ts`, after the `TempSessionExercise` interface, add:

```ts
// IWorkoutAction is the unit of work for the active logger.
// A 'single' action contains one exercise; a 'superset' contains 2+ exercises
// sharing a supersetGroupId and executed back-to-back.
export interface IWorkoutAction {
  readonly type: 'single' | 'superset'
  readonly exercises: TempSessionExercise[]
  readonly supersetGroupId?: string  // defined when type === 'superset'
}
```

- [ ] **Step 3: Extend the Zod schema to accept `supersetGroupId`**

In `src/validation/tempSessionSchema.ts`, update `tempSessionExerciseSchema` to add the optional field before `.strict()`:

```ts
const tempSessionExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  exerciseName: z.string().min(1),
  weight: z.number(),
  reps: z.number().int().nonnegative(),
  sets: z.number().int().positive(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  progressionGoal: z.string().min(1),
  supersetGroupId: z.string().min(1).optional(),
}).strict()
```

- [ ] **Step 4: Write a test covering round-trip validation of superset drafts**

In `src/test/tempSessionSchema.test.ts`, add a new `describe` block at the end of the file:

```ts
describe('supersetGroupId — optional field round-trip', () => {
  it('accepts a TempSessionExercise with supersetGroupId defined', () => {
    const baseExercise = {
      exerciseId: 'abc',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      sets: 3,
      tier: 1 as const,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
    }
    const withSuperset = { ...baseExercise, supersetGroupId: 'grp-1' }
    expect(() => parseTempSessionDraft({
      id: 'temp_session',
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 60,
      exercises: [withSuperset],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 80,
      reps: 8,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })).not.toThrow()
  })

  it('accepts a TempSessionExercise without supersetGroupId (standard single)', () => {
    const exercise = {
      exerciseId: 'abc',
      exerciseName: 'Squat',
      weight: 100,
      reps: 5,
      sets: 5,
      tier: 1 as const,
      progressionGoal: 'Goal: 3 Reps (Baseline)',
    }
    expect(() => parseTempSessionDraft({
      id: 'temp_session',
      routineType: 'PPL',
      sessionIndex: 0,
      estimatedMinutes: 60,
      exercises: [exercise],
      currentExIndex: 0,
      currentSetInEx: 0,
      weight: 100,
      reps: 5,
      phase: 'active',
      restSecondsLeft: 90,
      completedSets: [],
      updatedAt: Date.now(),
    })).not.toThrow()
  })
})
```

- [ ] **Step 5: Run the schema tests**

```bash
npx vitest run src/test/tempSessionSchema.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/validation/tempSessionSchema.ts src/test/tempSessionSchema.test.ts && git commit -m "feat(schema): add IWorkoutAction interface and optional supersetGroupId to TempSessionExercise"
```

---

## Task 4: Schema v10 — DailyTargets + PersonalBests Tables

**Files:**
- Modify: `src/db/schema.ts` (add interfaces + v10 Dexie migration)

- [ ] **Step 1: Add `DailyTarget` and `PersonalBest` interfaces to schema.ts**

In `src/db/schema.ts`, after the `ExerciseBaseline` interface (after line 41), add:

```ts
// DailyTarget stores the user's activity goals for a calendar day.
// date is the PK formatted as "YYYY-MM-DD" (ISO local date, no timezone).
export interface DailyTarget {
  date: string         // PK — e.g. "2026-04-11"
  targetKcal: number   // user's daily calorie target
  targetSteps: number  // user's daily step target
  actualKcal: number   // updated in real-time throughout the day
  actualSteps: number  // updated in real-time throughout the day
}

// PersonalBest tracks the all-time best weight×reps for each exercise.
// exerciseId is the PK — one record per exercise.
// flagged = true triggers an achievement badge in the UI until cleared.
export interface PersonalBest {
  exerciseId: string   // PK — FK → Exercise.id
  bestWeight: number
  bestReps: number
  achievedAt: number   // Unix timestamp (ms)
  flagged: boolean     // true = newly achieved, unread by the user
}
```

- [ ] **Step 2: Add the table declarations to `IronProtocolDB`**

In the class body of `IronProtocolDB` (around line 84), add two new table declarations after the existing ones:

```ts
export class IronProtocolDB extends Dexie {
  exercises!: Dexie.Table<Exercise, string>
  workouts!: Dexie.Table<Workout, string>
  sets!: Dexie.Table<WorkoutSet, string>
  settings!: Dexie.Table<AppSettings, string>
  tempSessions!: Dexie.Table<TempSession, string>
  baselines!: Dexie.Table<ExerciseBaseline, string>
  dailyTargets!: Dexie.Table<DailyTarget, string>
  personalBests!: Dexie.Table<PersonalBest, string>
```

- [ ] **Step 3: Add the v10 migration block**

In `src/db/schema.ts`, after the closing brace of the v9 block (after line 287), add:

```ts
    // Version 10 — adds DailyTargets for real-time Kcal/Steps tracking and
    // PersonalBests for immediate achievement flags upon set completion.
    // No data upgrade needed — both tables start empty and are populated at runtime.
    this.version(10).stores({
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

- [ ] **Step 4: Write a database test for v10 tables**

In `src/test/db.test.ts`, add a new describe block:

```ts
describe('v10 schema — DailyTargets and PersonalBests', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  it('can write and read a DailyTarget record', async () => {
    await db.open()
    const target: DailyTarget = {
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 10000,
      actualKcal: 850,
      actualSteps: 4200,
    }
    await db.dailyTargets.put(target)
    const retrieved = await db.dailyTargets.get('2026-04-11')
    expect(retrieved).toEqual(target)
  })

  it('can write and read a PersonalBest record', async () => {
    await db.open()
    const pb: PersonalBest = {
      exerciseId: 'ex-bench-001',
      bestWeight: 102.5,
      bestReps: 5,
      achievedAt: Date.now(),
      flagged: true,
    }
    await db.personalBests.put(pb)
    const retrieved = await db.personalBests.get('ex-bench-001')
    expect(retrieved?.bestWeight).toBe(102.5)
    expect(retrieved?.flagged).toBe(true)
  })
})
```

Make sure to import `DailyTarget` and `PersonalBest` at the top of `src/test/db.test.ts`:

```ts
import { IronProtocolDB, type DailyTarget, type PersonalBest } from '../db/schema'
```

- [ ] **Step 5: Run database tests**

```bash
npx vitest run src/test/db.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass including the new v10 tests.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/test/db.test.ts && git commit -m "feat(schema): v10 — add DailyTargets and PersonalBests tables"
```

---

## Task 5: ProgressIndicator\<T\> Generic Logic Class

**Files:**
- Create: `src/services/progressIndicator.ts`
- Create: `src/test/activityManager.test.ts` (partial — ProgressIndicator tests first)

- [ ] **Step 1: Write the failing tests for ProgressIndicator**

Create `src/test/activityManager.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ProgressIndicator } from '../services/progressIndicator'

describe('ProgressIndicator<T>', () => {
  it('returns 0% when current is 0', () => {
    const pi = new ProgressIndicator(10000, 0)
    expect(pi.percent).toBe(0)
  })

  it('returns 50% when current is half of target', () => {
    const pi = new ProgressIndicator(10000, 5000)
    expect(pi.percent).toBe(50)
  })

  it('returns 100% when current meets target', () => {
    const pi = new ProgressIndicator(10000, 10000)
    expect(pi.percent).toBe(100)
  })

  it('clamps to 100% when current exceeds target', () => {
    const pi = new ProgressIndicator(10000, 12000)
    expect(pi.percent).toBe(100)
  })

  it('calculates remaining correctly', () => {
    const pi = new ProgressIndicator(2000, 850)
    expect(pi.remaining).toBe(1150)
  })

  it('clamps remaining to 0 when target is exceeded', () => {
    const pi = new ProgressIndicator(2000, 2500)
    expect(pi.remaining).toBe(0)
  })

  it('isComplete returns false when below target', () => {
    const pi = new ProgressIndicator(100, 99)
    expect(pi.isComplete).toBe(false)
  })

  it('isComplete returns true when at target', () => {
    const pi = new ProgressIndicator(100, 100)
    expect(pi.isComplete).toBe(true)
  })

  it('returns 0% when target is zero (guard against division by zero)', () => {
    const pi = new ProgressIndicator(0, 0)
    expect(pi.percent).toBe(0)
  })

  it('works with fractional numbers (Kcal use case)', () => {
    const pi = new ProgressIndicator(2000.5, 1000.25)
    expect(pi.percent).toBe(50)
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/test/activityManager.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/services/progressIndicator.ts`**

```ts
// ProgressIndicator<T> provides a reusable percentage-based completion engine
// for any numeric target (Kcal, Steps, Sets, etc.).
// T is constrained to number so arithmetic operations are always valid.
export class ProgressIndicator<T extends number> {
  private readonly target: T
  private readonly current: T

  constructor(target: T, current: T) {
    this.target = target
    this.current = current
  }

  // Percentage of target completed, clamped to [0, 100].
  get percent(): number {
    if (this.target <= 0) return 0
    return Math.min(100, Math.round((this.current / this.target) * 100))
  }

  // Units still needed to hit the target, floored at 0.
  get remaining(): number {
    return Math.max(0, this.target - this.current)
  }

  // True when current has reached or surpassed the target.
  get isComplete(): boolean {
    return this.current >= this.target
  }
}
```

- [ ] **Step 4: Run ProgressIndicator tests to confirm PASS**

```bash
npx vitest run src/test/activityManager.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: All 10 ProgressIndicator tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/progressIndicator.ts src/test/activityManager.test.ts && git commit -m "feat(services): add generic ProgressIndicator<T> logic class"
```

---

## Task 6: IDashboardMetrics Interface + ActivityManager Service

**Files:**
- Create: `src/services/activityManager.ts`
- Modify: `src/test/activityManager.test.ts` (add ActivityManager tests)

- [ ] **Step 1: Write the failing ActivityManager tests**

Append to `src/test/activityManager.test.ts` (after the ProgressIndicator describe block):

```ts
import { IronProtocolDB } from '../db/schema'
import { ActivityManager } from '../services/activityManager'

describe('ActivityManager', () => {
  let db: IronProtocolDB
  let manager: ActivityManager

  beforeEach(async () => {
    const { IronProtocolDB } = await import('../db/schema')
    db = new IronProtocolDB()
    await db.open()
    manager = new ActivityManager(db)
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('returns zero metrics when no DailyTarget exists for the date', async () => {
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.targetKcal).toBe(0)
    expect(metrics.actualKcal).toBe(0)
    expect(metrics.remainingKcal).toBe(0)
    expect(metrics.targetSteps).toBe(0)
    expect(metrics.remainingSteps).toBe(0)
    expect(metrics.kcalProgress.percent).toBe(0)
  })

  it('calculates remaining Kcal correctly from stored targets', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 10000,
      actualKcal: 1200,
      actualSteps: 6000,
    })
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.remainingKcal).toBe(800)
    expect(metrics.remainingSteps).toBe(4000)
    expect(metrics.kcalProgress.percent).toBe(60)
    expect(metrics.stepsProgress.percent).toBe(60)
  })

  it('updateKcal persists new actualKcal value', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 0,
      actualSteps: 0,
    })
    await manager.updateKcal('2026-04-11', 750)
    const row = await db.dailyTargets.get('2026-04-11')
    expect(row?.actualKcal).toBe(750)
  })

  it('updateSteps persists new actualSteps value', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 0,
      actualSteps: 0,
    })
    await manager.updateSteps('2026-04-11', 3500)
    const row = await db.dailyTargets.get('2026-04-11')
    expect(row?.actualSteps).toBe(3500)
  })

  it('clamps kcalProgress to 100% when actualKcal exceeds target', async () => {
    await db.dailyTargets.put({
      date: '2026-04-11',
      targetKcal: 2000,
      targetSteps: 8000,
      actualKcal: 2500,
      actualSteps: 0,
    })
    const metrics = await manager.getMetricsForDate('2026-04-11')
    expect(metrics.kcalProgress.percent).toBe(100)
    expect(metrics.remainingKcal).toBe(0)
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/test/activityManager.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ActivityManager` not found.

- [ ] **Step 3: Create `src/services/activityManager.ts`**

```ts
import type { IronProtocolDB } from '../db/schema'
import { ProgressIndicator } from './progressIndicator'

// IDashboardMetrics is the central contract for all daily progress data.
// Components consume this interface only — they never compute progress directly.
export interface IDashboardMetrics {
  readonly date: string
  readonly targetKcal: number
  readonly actualKcal: number
  readonly remainingKcal: number
  readonly kcalProgress: ProgressIndicator<number>
  readonly targetSteps: number
  readonly actualSteps: number
  readonly remainingSteps: number
  readonly stepsProgress: ProgressIndicator<number>
}

// ActivityManager encapsulates all daily progress calculations.
// Instantiate once per session (e.g. in a React context or hook) and call
// its methods instead of reading dailyTargets directly from components.
export class ActivityManager {
  private readonly db: IronProtocolDB

  constructor(db: IronProtocolDB) {
    this.db = db
  }

  // Returns a fully computed IDashboardMetrics snapshot for the given date.
  // If no DailyTarget row exists, all values are zero.
  async getMetricsForDate(date: string): Promise<IDashboardMetrics> {
    const row = await this.db.dailyTargets.get(date)

    const targetKcal  = row?.targetKcal  ?? 0
    const actualKcal  = row?.actualKcal  ?? 0
    const targetSteps = row?.targetSteps ?? 0
    const actualSteps = row?.actualSteps ?? 0

    const kcalProgress  = new ProgressIndicator(targetKcal,  actualKcal)
    const stepsProgress = new ProgressIndicator(targetSteps, actualSteps)

    return {
      date,
      targetKcal,
      actualKcal,
      remainingKcal:  kcalProgress.remaining,
      kcalProgress,
      targetSteps,
      actualSteps,
      remainingSteps: stepsProgress.remaining,
      stepsProgress,
    }
  }

  // Updates only the actualKcal field for the given date.
  // Throws if no DailyTarget row exists for that date.
  async updateKcal(date: string, kcal: number): Promise<void> {
    await this.db.dailyTargets
      .where('date')
      .equals(date)
      .modify({ actualKcal: kcal })
  }

  // Updates only the actualSteps field for the given date.
  // Throws if no DailyTarget row exists for that date.
  async updateSteps(date: string, steps: number): Promise<void> {
    await this.db.dailyTargets
      .where('date')
      .equals(date)
      .modify({ actualSteps: steps })
  }
}
```

- [ ] **Step 4: Run ActivityManager tests to confirm PASS**

```bash
npx vitest run src/test/activityManager.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass (10 ProgressIndicator + 5 ActivityManager = 15 total).

- [ ] **Step 5: Commit**

```bash
git add src/services/activityManager.ts src/test/activityManager.test.ts && git commit -m "feat(services): add IDashboardMetrics interface and ActivityManager service"
```

---

## Task 7: PersonalBestsService — Achievement Flags on Set Completion

**Files:**
- Create: `src/services/personalBests.ts`
- Create: `src/test/personalBests.test.ts`

- [ ] **Step 1: Write the failing PersonalBests tests**

Create `src/test/personalBests.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IronProtocolDB } from '../db/schema'
import { PersonalBestsService } from '../services/personalBests'

describe('PersonalBestsService', () => {
  let db: IronProtocolDB
  let service: PersonalBestsService

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
    service = new PersonalBestsService(db)
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('creates a new PersonalBest record on first set for an exercise', async () => {
    const isNew = await service.checkAndFlag('ex-bench', 80, 8)
    expect(isNew).toBe(true)
    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(80)
    expect(pb?.bestReps).toBe(8)
    expect(pb?.flagged).toBe(true)
  })

  it('flags a new PB when weight increases beyond previous best', async () => {
    await service.checkAndFlag('ex-bench', 80, 8)
    await service.clearFlag('ex-bench')
    const isNew = await service.checkAndFlag('ex-bench', 82.5, 6)
    expect(isNew).toBe(true)
    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(82.5)
    expect(pb?.flagged).toBe(true)
  })

  it('flags a new PB when reps increase at the same weight', async () => {
    await service.checkAndFlag('ex-bench', 80, 8)
    await service.clearFlag('ex-bench')
    const isNew = await service.checkAndFlag('ex-bench', 80, 10)
    expect(isNew).toBe(true)
    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestReps).toBe(10)
    expect(pb?.flagged).toBe(true)
  })

  it('does NOT flag when weight and reps are both below previous best', async () => {
    await service.checkAndFlag('ex-bench', 80, 8)
    await service.clearFlag('ex-bench')
    const isNew = await service.checkAndFlag('ex-bench', 75, 6)
    expect(isNew).toBe(false)
    const pb = await db.personalBests.get('ex-bench')
    expect(pb?.bestWeight).toBe(80) // unchanged
    expect(pb?.flagged).toBe(false)  // still cleared
  })

  it('clearFlag sets flagged to false without altering bestWeight/bestReps', async () => {
    await service.checkAndFlag('ex-squat', 120, 5)
    await service.clearFlag('ex-squat')
    const pb = await db.personalBests.get('ex-squat')
    expect(pb?.flagged).toBe(false)
    expect(pb?.bestWeight).toBe(120)
    expect(pb?.bestReps).toBe(5)
  })

  it('clearFlag is a no-op when no record exists', async () => {
    await expect(service.clearFlag('non-existent')).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Run to confirm FAIL**

```bash
npx vitest run src/test/personalBests.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/services/personalBests.ts`**

```ts
import type { IronProtocolDB } from '../db/schema'

// PersonalBestsService checks each logged set against the stored all-time best
// and immediately sets flagged=true when a new PB is detected.
// Call checkAndFlag() inside handleCompleteSet() in ActiveLogger.
// Call clearFlag() when the badge has been seen by the user.
export class PersonalBestsService {
  private readonly db: IronProtocolDB

  constructor(db: IronProtocolDB) {
    this.db = db
  }

  // Compares weight+reps against the stored PB for this exercise.
  // If the set beats the existing record (or no record exists), writes the new PB
  // with flagged=true and returns true. Returns false if no PB was set.
  async checkAndFlag(exerciseId: string, weight: number, reps: number): Promise<boolean> {
    const existing = await this.db.personalBests.get(exerciseId)

    const isNewBest = !existing
      || weight > existing.bestWeight
      || (weight === existing.bestWeight && reps > existing.bestReps)

    if (!isNewBest) {
      return false
    }

    await this.db.personalBests.put({
      exerciseId,
      bestWeight: weight,
      bestReps: reps,
      achievedAt: Date.now(),
      flagged: true,
    })

    return true
  }

  // Marks the achievement as seen. Does nothing if no record exists.
  async clearFlag(exerciseId: string): Promise<void> {
    const existing = await this.db.personalBests.get(exerciseId)
    if (!existing) return
    await this.db.personalBests.put({ ...existing, flagged: false })
  }
}
```

- [ ] **Step 4: Run to confirm PASS**

```bash
npx vitest run src/test/personalBests.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/personalBests.ts src/test/personalBests.test.ts && git commit -m "feat(services): add PersonalBestsService with immediate set-completion flags"
```

---

## Task 8: Wire PersonalBestsService into ActiveLogger on Set Completion

**Files:**
- Modify: `src/components/ActiveLogger.tsx`

- [ ] **Step 1: Import PersonalBestsService and instantiate in ActiveLogger**

In `src/components/ActiveLogger.tsx`, add the import at the top (after the existing imports):

```ts
import { PersonalBestsService } from '../services/personalBests'
```

Inside the `ActiveLogger` component function body (before `handleCompleteSet`), add:

```ts
// Instantiate once per render lifecycle — db reference is stable.
const personalBests = new PersonalBestsService(db)
```

- [ ] **Step 2: Call `checkAndFlag` inside `handleCompleteSet` before the `isFinalSet` branch**

In `src/components/ActiveLogger.tsx`, locate `handleCompleteSet` (around line 171). After `const newSet: CompletedSet = ...` and `const newCompleted = [...completedSets, newSet]`, add the checkAndFlag call:

```ts
async function handleCompleteSet() {
  const newSet: CompletedSet = {
    exerciseId: currentEx.exerciseId,
    weight,
    reps,
    orderIndex: completedSets.length,
  }
  const newCompleted = [...completedSets, newSet]

  // Check for a new personal best immediately on every set completion.
  await personalBests.checkAndFlag(currentEx.exerciseId, weight, reps)

  const isLastSetInEx = currentSetInEx === currentEx.sets - 1
  // ... rest unchanged
```

- [ ] **Step 3: Typecheck**

```bash
cd "c:/Users/megaw/Downloads/IronProtocol" && npx tsc -b --noEmit 2>&1 | head -20
```

Expected: Zero errors.

- [ ] **Step 4: Run the ActiveLogger tests**

```bash
npx vitest run src/test/ActiveLogger.test.tsx --reporter=verbose 2>&1 | tail -30
```

Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ActiveLogger.tsx && git commit -m "feat(logger): wire PersonalBestsService — flag PBs immediately on set completion"
```

---

## Task 9: Harden Instant temp_session Persistence (Per-Keystroke)

**Files:**
- Modify: `src/components/ActiveLogger.tsx`

Currently `persistDraft` is only called after a full set completes. If the user changes weight or reps and the app crashes before they tap "Complete Set", those adjustments are lost.

- [ ] **Step 1: Replace the weight input's onChange with an instant-persist version**

In `src/components/ActiveLogger.tsx`, find the weight `<input>` (around line 383):

```tsx
onChange={e => setWeight(Number(e.target.value))}
```

Replace with:

```tsx
onChange={e => {
  const newWeight = Number(e.target.value)
  setWeight(newWeight)
  void persistDraft({
    currentExIndex,
    currentSetInEx,
    weight: newWeight,
    reps,
    phase,
    restSecondsLeft,
    completedSets,
  })
}}
```

- [ ] **Step 2: Replace the reps input's onChange with an instant-persist version**

Find the reps `<input>` (around line 394):

```tsx
onChange={e => setReps(Number(e.target.value))}
```

Replace with:

```tsx
onChange={e => {
  const newReps = Number(e.target.value)
  setReps(newReps)
  void persistDraft({
    currentExIndex,
    currentSetInEx,
    weight,
    reps: newReps,
    phase,
    restSecondsLeft,
    completedSets,
  })
}}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc -b --noEmit 2>&1 | head -20
```

Expected: Zero errors. `persistDraft` already accepts these exact fields.

- [ ] **Step 4: Run ActiveLogger + Integration tests**

```bash
npx vitest run src/test/ActiveLogger.test.tsx src/test/Integration.test.tsx --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ActiveLogger.tsx && git commit -m "feat(logger): persist draft on every weight/reps keystroke for set-by-set resilience"
```

---

## Task 10: Full Test Suite Verification + Git Push to GitHub

**Files:** None modified — verification and push only.

- [ ] **Step 1: Run the full test suite**

```bash
cd "c:/Users/megaw/Downloads/IronProtocol" && npx vitest run --reporter=verbose 2>&1 | tail -50
```

Expected: All tests pass with zero failures.

- [ ] **Step 2: Typecheck the full project**

```bash
npx tsc -b --noEmit 2>&1
```

Expected: Zero errors.

- [ ] **Step 3: Lint the full project**

```bash
npx eslint . --max-warnings 0 2>&1 | tail -20
```

Expected: Zero warnings or errors.

- [ ] **Step 4: Initialize git (this repo has no git history yet)**

```bash
cd "c:/Users/megaw/Downloads/IronProtocol" && git init && git add -A && git status
```

> **Note:** Before running `git add -A`, confirm `.gitignore` excludes `node_modules/`. If it doesn't exist, create it first with `node_modules/` and `dist/` on separate lines.

- [ ] **Step 5: Create the initial commit**

```bash
git commit -m "$(cat <<'EOF'
feat: Electric Blue OOP upgrade — v10 schema, services layer, 120m QoS ceiling

- Schema v10: DailyTargets + PersonalBests tables
- ActivityManager + IDashboardMetrics encapsulate daily progress logic
- ProgressIndicator<T> generic completion engine
- PersonalBestsService fires achievement flags immediately on set completion
- IWorkoutAction + supersetGroupId enable superset structuring
- Readonly PlannedExercise / PlannedWorkout enforce blueprint immutability
- 120m QoS ceiling enforced via effectiveTime clamp in planRoutineWorkoutPure
- Instant per-keystroke temp_session persistence in ActiveLogger
EOF
)"
```

- [ ] **Step 6: Create the GitHub repository and push**

```bash
gh repo create IronProtocol --private --source=. --remote=origin --push
```

> If the repo already exists: `git remote add origin https://github.com/<your-username>/IronProtocol.git && git push -u origin main`

---

## Self-Review Checklist

| Requirement | Task |
|---|---|
| `IDashboardMetrics` interface | Task 6 — `src/services/activityManager.ts` |
| `ActivityManager` private service | Task 6 — `src/services/activityManager.ts` |
| `ProgressIndicator<T>` generic class | Task 5 — `src/services/progressIndicator.ts` |
| `Readonly` on exercise + blueprint data | Task 2 — `PlannedExercise`, `PlannedWorkout`, `ReadonlyExercise` |
| `DailyTargets` Dexie fields (Kcal, Steps) | Task 4 — schema v10 |
| Real-time "Remaining" calculation | Task 6 — `ActivityManager.getMetricsForDate()` |
| `IWorkoutAction` superset interface | Task 3 — schema.ts |
| `PersonalBests` service (immediate flags) | Task 7 — `src/services/personalBests.ts`, Task 8 — wired to ActiveLogger |
| Set-by-Set instant persistence | Task 9 — weight/reps onChange handlers |
| 120m QoS ceiling verified | Task 1 — `effectiveTime = Math.min(timeAvailable, 120)` |
| Commit via GitHub | Task 10 |
