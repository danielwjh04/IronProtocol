# Lab vs Gantry UX Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the "draft and edit" blueprint experience from the "static confirm and launch" screen by creating a full-featured `SessionBlueprint` Drafting Lab and a read-only `ReviewBlueprint` confirmation screen.

**Architecture:** `SessionBlueprint.tsx` absorbs all interactive editing (time slider, goal toggle, reorder, swap, DB persistence) from both the old inline HomePage dashboard section and `DraftBlueprintReview.tsx`. `ReviewBlueprint.tsx` replaces `DraftBlueprintReview.tsx` as a purely presentational confirmation screen. `HomePage` becomes a thin phase-router. The shared time estimation formula is exported from `autoPlanner.ts` so both screens compute durations identically.

**Tech Stack:** React 18, Framer Motion (Reorder + AnimatePresence), Dexie.js (TempSession persistence), Vitest + @testing-library/react, Tailwind CSS v4, TypeScript strict.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Create** | `src/components/SessionBlueprint.tsx` | Drafting Lab: time slider, goal toggle, reorder, swap drawer, DB persistence, "Lock Blueprint" CTA |
| **Create** | `src/components/ReviewBlueprint.tsx` | Static confirmation: read-only exercise list, "Modify Plan" + "Start Workout" CTAs |
| **Modify** | `src/planner/autoPlanner.ts` | Export `calcEstimatedMinutes` + `estimateExerciseDurationSeconds`; replace expansion with category-priority (Synergist → Core → Pre-hab); threshold 12 min |
| **Modify** | `src/pages/HomePage.tsx` | Replace inline blueprint JSX with `<SessionBlueprint />`; replace 'review' phase with `<ReviewBlueprint />`; wire `onModify → setSessionPhase('idle')` |
| **Modify** | `src/test/autoPlanner.test.ts` | Tests for category-priority expansion and exported formula |
| **Modify** | `src/test/UI.test.tsx` | Tests for SessionBlueprint and ReviewBlueprint |
| **Delete** | `src/components/DraftBlueprintReview.tsx` | Functionality fully absorbed by above two new components |

---

## Task 1: Export time estimation utilities from `autoPlanner.ts`

The formula `T = Σ[(S_i × R_i × 4s) + ((S_i - 1) × P_i) + 120s]` is already implemented as private functions. Export them so `SessionBlueprint` can compute live estimates client-side.

**Files:**
- Modify: `src/planner/autoPlanner.ts`
- Modify: `src/test/autoPlanner.test.ts`

- [ ] **Step 1: Write failing tests for the exported formula**

Add to `src/test/autoPlanner.test.ts`:

```typescript
import {
  calcEstimatedMinutes,
  estimateExerciseDurationSeconds,
  TIER_DEFAULT_SETS,
  TIER_REP_RANGES,
} from '../planner/autoPlanner'
import type { PlannedExercise } from '../planner/autoPlanner'

describe('Time estimation formula', () => {
  const makeExercise = (tier: 1 | 2 | 3): PlannedExercise => ({
    exerciseId: 'test-id',
    exerciseName: 'Test Exercise',
    weight: 60,
    reps: TIER_REP_RANGES[tier].min,
    sets: TIER_DEFAULT_SETS[tier],
    tier,
    progressionGoal: 'Test Goal',
  })

  it('calculates single T1 Hypertrophy exercise duration correctly', () => {
    // T1 Hypertrophy: 3 sets, 8 reps, 90s rest
    // (3 * 8 * 4) + (2 * 90) + 120 = 96 + 180 + 120 = 396s
    const exercise: PlannedExercise = { ...makeExercise(1), sets: 3, reps: 8 }
    const result = estimateExerciseDurationSeconds(exercise, 'Hypertrophy')
    expect(result).toBe(396)
  })

  it('calculates single T2 Power exercise duration correctly', () => {
    // T2 Power: 4 sets, 6 reps, 90s rest
    // (4 * 6 * 4) + (3 * 90) + 120 = 96 + 270 + 120 = 486s
    const exercise: PlannedExercise = { ...makeExercise(2), sets: 4, reps: 6 }
    const result = estimateExerciseDurationSeconds(exercise, 'Power')
    expect(result).toBe(486)
  })

  it('calcEstimatedMinutes sums across all exercises', () => {
    const exercises: PlannedExercise[] = [
      { ...makeExercise(1), sets: 3, reps: 8 },  // 396s
      { ...makeExercise(2), sets: 3, reps: 12 }, // (3*12*4) + (2*60) + 120 = 144+120+120 = 384s
    ]
    // Total: 780s = 13min (ceil)
    const result = calcEstimatedMinutes(exercises, 'Hypertrophy')
    expect(result).toBe(13)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/autoPlanner.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `calcEstimatedMinutes is not exported` / `estimateExerciseDurationSeconds is not exported`.

- [ ] **Step 3: Add `export` to the two functions in `autoPlanner.ts`**

In `src/planner/autoPlanner.ts`, find the two function declarations (lines ~333 and ~342) and add `export`:

```typescript
// was: function estimateExerciseDurationSeconds(
export function estimateExerciseDurationSeconds(
  exercise: PlannedExercise,
  trainingGoal: TrainingGoal,
): number {
  const restSeconds = REST_SECONDS_BY_GOAL_AND_TIER[trainingGoal][exercise.tier]
  const tempoSeconds = exercise.sets * exercise.reps * TEMPO_SECONDS_PER_REP
  const intraExerciseRestSeconds = Math.max(exercise.sets - 1, 0) * restSeconds
  return tempoSeconds + intraExerciseRestSeconds + TRANSITION_SECONDS_PER_EXERCISE
}

// was: function calcEstimatedMinutes(
export function calcEstimatedMinutes(
  exercises: readonly PlannedExercise[],
  trainingGoal: TrainingGoal,
): number {
  const totalSeconds = exercises.reduce(
    (acc, exercise) => acc + estimateExerciseDurationSeconds(exercise, trainingGoal),
    0,
  )
  return Math.ceil(totalSeconds / 60)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/autoPlanner.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — 3 tests pass in the "Time estimation formula" describe block.

- [ ] **Step 5: Type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/planner/autoPlanner.ts src/test/autoPlanner.test.ts && git commit -m "feat(planner): export calcEstimatedMinutes and estimateExerciseDurationSeconds"
```

---

## Task 2: Replace expansion with category-priority expansion in `autoPlanner.ts`

Replace the existing `expandForTimeBudget` + `buildVolumeExpansionCandidates` block with a category-priority (Synergist → Core → Pre-hab) expansion triggered when the time gap is ≥ 12 minutes.

**Files:**
- Modify: `src/planner/autoPlanner.ts`
- Modify: `src/test/autoPlanner.test.ts`

- [ ] **Step 1: Write failing tests for category-priority expansion**

Append to `src/test/autoPlanner.test.ts`:

```typescript
describe('Category-priority volume expansion', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  const makeExercise = (
    name: string,
    tier: 1 | 2 | 3,
    tags: string[],
    muscleGroup = 'Chest',
  ) => ({
    id: uuidv4(),
    name,
    muscleGroup,
    tier,
    tags,
    mediaType: 'webp',
    mediaRef: `${name.replace(/\s/g, '-')}.webp`,
  })

  it('adds synergist (T2) exercises before core when gap >= 12 min', async () => {
    await db.open()
    await db.exercises.bulkAdd([
      makeExercise('Bench Press',    1, ['push', 'compound']),
      makeExercise('Incline Press',  2, ['push']),              // synergist
      makeExercise('Plank',          2, ['push'], 'Core'),      // core
      makeExercise('Cable Fly',      3, ['push']),              // prehab
    ])

    // 120-min budget with only 1 T1 exercise guarantees expansion
    const result = await generateWorkout({
      db,
      routineType: 'PPL',
      trainingGoal: 'Hypertrophy',
      timeAvailable: 120,
    })

    const names = result.exercises.map((e) => e.exerciseName)
    const inclineIdx = names.indexOf('Incline Press')
    const plankIdx   = names.indexOf('Plank')

    // Synergist must appear before Core when both are present
    if (inclineIdx !== -1 && plankIdx !== -1) {
      expect(inclineIdx).toBeLessThan(plankIdx)
    }
  })

  it('does NOT expand when gap < 12 min', async () => {
    await db.open()
    await db.exercises.bulkAdd([
      makeExercise('Bench Press',    1, ['push', 'compound']),
      makeExercise('Incline Press',  2, ['push']),
    ])

    // 15-min budget → only T1 fits → gap is tiny → no expansion expected
    const result = await generateWorkout({
      db,
      routineType: 'PPL',
      trainingGoal: 'Hypertrophy',
      timeAvailable: 15,
    })

    expect(result.exercises.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/autoPlanner.test.ts -t "Category-priority" --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL on "adds synergist (T2) exercises before core" — current expansion does not prioritize categories.

- [ ] **Step 3: Add helpers and replace expansion block in `autoPlanner.ts`**

**3a.** Replace `EXPANSION_TOLERANCE_MINUTES` constant (currently `10`) and add the new category type + helpers. Place directly after the `EXPANSION_TOLERANCE_MINUTES` constant on line ~71:

```typescript
// Remove old constant:
// const EXPANSION_TOLERANCE_MINUTES = 10

// Replace with:
const EXPANSION_THRESHOLD_MINUTES = 12
type ExpansionCategory = 'synergist' | 'core' | 'prehab'
```

**3b.** Delete the old `buildVolumeExpansionCandidates` function entirely (lines ~466–486) and replace with two new helpers placed in the same area:

```typescript
function classifyExpansionCandidate(
  exercise: Exercise,
  rule: RoutineSessionRule,
): ExpansionCategory | null {
  const matchesSession = rule.tags.some((tag) => hasSessionTag(exercise, tag))
  if (!matchesSession) return null

  if (
    exercise.muscleGroup.toLowerCase().includes('core') ||
    exercise.tags.some((tag) => tag.toLowerCase() === 'core')
  ) {
    return 'core'
  }

  if (exercise.tier === 2) return 'synergist'
  if (exercise.tier === 3) return 'prehab'

  return null
}

function buildCategoryExpansionQueue(
  allExercises: Exercise[],
  rule: RoutineSessionRule,
): Exercise[] {
  const buckets: Record<ExpansionCategory, Exercise[]> = {
    synergist: [],
    core: [],
    prehab: [],
  }

  for (const exercise of dedupeExercisesById(allExercises)) {
    const cat = classifyExpansionCandidate(exercise, rule)
    if (cat) {
      buckets[cat].push(exercise)
    }
  }

  return [...buckets.synergist, ...buckets.core, ...buckets.prehab]
}
```

**3c.** Delete the old `expandForTimeBudget` function entirely (lines ~488–526) and replace with:

```typescript
function expandByCategoryPriority(
  current: readonly PlannedExercise[],
  allExercises: Exercise[],
  rule: RoutineSessionRule,
  trainingGoal: TrainingGoal,
  effectiveTime: number,
  baselines: Map<string, number>,
  setsByExercise: Map<string, WorkoutSet[]>,
): PlannedExercise[] {
  const seenIds = new Set(current.map((ex) => ex.exerciseId))
  const seenNames = new Set(current.map((ex) => normalizeExerciseName(ex.exerciseName)))
  const queue = buildCategoryExpansionQueue(allExercises, rule)
  let expanded = [...current]

  for (const exercise of queue) {
    const normalizedName = normalizeExerciseName(exercise.name)
    if (seenIds.has(exercise.id) || seenNames.has(normalizedName)) continue

    const userBaseline = baselines.get(exercise.name.toLowerCase())
    const planned = applyGoalPrescription(
      planExerciseFromHistory(exercise, setsByExercise.get(exercise.id) ?? [], userBaseline),
      trainingGoal,
    )

    const withNew = [...expanded, planned]
    if (calcEstimatedMinutes(withNew, trainingGoal) <= effectiveTime) {
      expanded = withNew
      seenIds.add(exercise.id)
      seenNames.add(normalizedName)
    }
  }

  return expanded
}
```

**3d.** In `planRoutineWorkoutPure`, find the expansion block (around line ~790) that currently reads:

```typescript
if (tierCap === 3 && calcEstimatedMinutes(finalExercises, trainingGoal) < effectiveTime) {
  const expansionCandidates = dedupePlannedById(
    buildVolumeExpansionCandidates(exercises, sessionExercises, blueprint.rule)
      ...
  )
  finalExercises = expandForTimeBudget(finalExercises, expansionCandidates, trainingGoal, effectiveTime)
}
```

Replace that entire block with:

```typescript
if (tierCap === 3) {
  const gap = effectiveTime - calcEstimatedMinutes(finalExercises, trainingGoal)
  if (gap >= EXPANSION_THRESHOLD_MINUTES) {
    finalExercises = expandByCategoryPriority(
      finalExercises,
      exercises,
      blueprint.rule,
      trainingGoal,
      effectiveTime,
      resolvedBaselines,
      setsByExercise,
    )
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/autoPlanner.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: ALL tests pass including the new category-priority tests.

- [ ] **Step 5: Type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 6: Lint**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx eslint src/planner/autoPlanner.ts 2>&1
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/planner/autoPlanner.ts src/test/autoPlanner.test.ts && git commit -m "feat(planner): replace volume expansion with category-priority (Synergist→Core→Pre-hab), threshold 12 min"
```

---

## Task 3: Create `ReviewBlueprint.tsx` (Static Review)

A purely presentational component. It receives a finalized `PlannedWorkout` as a prop and renders it. No slider, no swap. Two CTAs: "Modify Plan" and "Start Workout".

**Files:**
- Create: `src/components/ReviewBlueprint.tsx`
- Modify: `src/test/UI.test.tsx`

- [ ] **Step 1: Write failing tests**

Append to `src/test/UI.test.tsx`:

```typescript
// @vitest-environment jsdom
import ReviewBlueprint from '../components/ReviewBlueprint'
import type { PlannedWorkout } from '../planner/autoPlanner'

const makeMockPlan = (): PlannedWorkout => ({
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 42,
  exercises: [
    {
      exerciseId: 'ex-1',
      exerciseName: 'Bench Press',
      weight: 80,
      reps: 8,
      sets: 3,
      tier: 1,
      progressionGoal: 'Linear Progression',
    },
    {
      exerciseId: 'ex-2',
      exerciseName: 'Incline Press',
      weight: 60,
      reps: 12,
      sets: 3,
      tier: 2,
      progressionGoal: 'Double Progression',
    },
  ],
})

describe('ReviewBlueprint', () => {
  it('renders all exercise names from the plan', () => {
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={vi.fn()} onModify={vi.fn()} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Incline Press')).toBeInTheDocument()
  })

  it('renders the Start Workout and Modify Plan buttons', () => {
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={vi.fn()} onModify={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /modify plan/i })).toBeInTheDocument()
  })

  it('calls onConfirm when Start Workout is clicked', () => {
    const onConfirm = vi.fn()
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={onConfirm} onModify={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /start workout/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onModify when Modify Plan is clicked', () => {
    const onModify = vi.fn()
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={vi.fn()} onModify={onModify} />)
    fireEvent.click(screen.getByRole('button', { name: /modify plan/i }))
    expect(onModify).toHaveBeenCalledTimes(1)
  })

  it('does NOT render a range input (no slider)', () => {
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={vi.fn()} onModify={vi.fn()} />)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('does NOT render a Swap button', () => {
    render(<ReviewBlueprint plan={makeMockPlan()} onConfirm={vi.fn()} onModify={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /swap/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx -t "ReviewBlueprint" --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `ReviewBlueprint` module not found.

- [ ] **Step 3: Create `src/components/ReviewBlueprint.tsx`**

```typescript
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import type { PlannedWorkout } from '../planner/autoPlanner'

interface Props {
  plan: PlannedWorkout
  onConfirm: () => void
  onModify: () => void
}

export default function ReviewBlueprint({ plan, onConfirm, onModify }: Props) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-8 text-zinc-100">
      <header className="mb-2 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Session Ready</p>
        <h1 className="mt-2 text-3xl font-black text-white">Review Blueprint</h1>
        <p className="mt-1 text-sm font-semibold text-zinc-400">Est. {plan.estimatedMinutes} min</p>
      </header>

      <section className="flex flex-col gap-3">
        {plan.exercises.map((exercise) => (
          <div
            key={exercise.exerciseId}
            className="flex items-center justify-between rounded-2xl border border-[#3B71FE]/15 bg-[#0D1626] px-4 py-4"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#3B71FE]/10 px-1.5 py-0.5 text-[10px] font-black text-blue-400">
                  T{exercise.tier}
                </span>
                <h3 className="text-base font-black text-white">{exercise.exerciseName}</h3>
              </div>
              <p className="text-xs font-semibold text-zinc-400">
                {exercise.sets} sets × {exercise.reps} reps · {exercise.weight} kg
              </p>
              <p className="text-[11px] font-semibold text-blue-400/70">{exercise.progressionGoal}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-3 border-t border-gray-800 bg-[#0A0E1A]/80 p-4 pb-8 backdrop-blur-md">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-3xl bg-[#3B71FE] text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)]"
        >
          <CheckCircle2 size={22} /> Start Workout
        </motion.button>

        <button
          onClick={onModify}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-[#3B71FE]/20 bg-transparent text-sm font-bold text-zinc-300 transition-colors hover:border-[#3B71FE]/40 hover:text-zinc-100"
        >
          <ArrowLeft size={16} /> Modify Plan
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx -t "ReviewBlueprint" --reporter=verbose 2>&1 | tail -20
```

Expected: ALL 6 ReviewBlueprint tests pass.

- [ ] **Step 5: Type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/ReviewBlueprint.tsx src/test/UI.test.tsx && git commit -m "feat(ui): add ReviewBlueprint — static read-only confirmation screen with Modify Plan CTA"
```

---

## Task 4: Create `SessionBlueprint.tsx` (Drafting Lab)

The full-featured Drafting Lab. Absorbs the interactive sections from both the old HomePage inline dashboard (`sessionLabel`, exercise list, goal toggle, time slider, QoS preview) and `DraftBlueprintReview.tsx` (exercise card reorder, swap drawer, `persistPlanDraft`, `regeneratePlanForDuration`). Calls `db.tempSessions.put()` on every mutation.

**Files:**
- Create: `src/components/SessionBlueprint.tsx`
- Modify: `src/test/UI.test.tsx`

- [ ] **Step 1: Write failing tests**

Append to `src/test/UI.test.tsx`:

```typescript
import SessionBlueprint from '../components/SessionBlueprint'
import { IronProtocolDB } from '../db/schema'

const makeMockPlanFull = (): PlannedWorkout => ({
  routineType: 'PPL',
  sessionIndex: 0,
  estimatedMinutes: 42,
  exercises: [
    { exerciseId: 'ex-1', exerciseName: 'Bench Press', weight: 80, reps: 8, sets: 3, tier: 1, progressionGoal: 'Linear Progression' },
    { exerciseId: 'ex-2', exerciseName: 'Incline Press', weight: 60, reps: 12, sets: 3, tier: 2, progressionGoal: 'Double Progression' },
  ],
})

describe('SessionBlueprint', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  const defaultProps = () => ({
    db,
    plan: makeMockPlanFull(),
    fullPlan: makeMockPlanFull(),
    loading: false,
    error: null,
    sessionLabel: 'Push A',
    cycleLength: 3,
    sessionIndex: 0,
    routineType: 'PPL' as const,
    trainingGoal: 'Hypertrophy' as const,
    timeAvailable: 45,
    routineSetupRequired: false,
    onTrainingGoalChange: vi.fn(),
    onTimeAvailableChange: vi.fn(),
    onChooseDefaultRoutine: vi.fn(),
    onUpdatePlan: vi.fn(),
    onLockBlueprint: vi.fn(),
  })

  it('renders the session label', () => {
    render(<SessionBlueprint {...defaultProps()} />)
    expect(screen.getByText('Push A')).toBeInTheDocument()
  })

  it('renders all exercise names from the plan', () => {
    render(<SessionBlueprint {...defaultProps()} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Incline Press')).toBeInTheDocument()
  })

  it('renders a time-available range slider', () => {
    render(<SessionBlueprint {...defaultProps()} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('calls onTrainingGoalChange when Power goal is clicked', () => {
    const onTrainingGoalChange = vi.fn()
    render(<SessionBlueprint {...defaultProps()} onTrainingGoalChange={onTrainingGoalChange} />)
    fireEvent.click(screen.getByRole('button', { name: /power/i }))
    expect(onTrainingGoalChange).toHaveBeenCalledWith('Power')
  })

  it('calls onLockBlueprint when Lock Blueprint is clicked', () => {
    const onLockBlueprint = vi.fn()
    render(<SessionBlueprint {...defaultProps()} onLockBlueprint={onLockBlueprint} />)
    fireEvent.click(screen.getByRole('button', { name: /lock blueprint/i }))
    expect(onLockBlueprint).toHaveBeenCalledTimes(1)
  })

  it('renders Swap button for each exercise', () => {
    render(<SessionBlueprint {...defaultProps()} />)
    const swapButtons = screen.getAllByRole('button', { name: /swap/i })
    expect(swapButtons).toHaveLength(2)
  })

  it('shows loading state when loading is true', () => {
    render(<SessionBlueprint {...defaultProps()} loading={true} plan={null} />)
    expect(screen.getByText(/syncing session/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx -t "SessionBlueprint" --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `SessionBlueprint` module not found.

- [ ] **Step 3: Create `src/components/SessionBlueprint.tsx`**

This component combines the old HomePage inline blueprint + DraftBlueprintReview's swap + reorder logic.

```typescript
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Shuffle, GripVertical, CheckCircle2 } from 'lucide-react'
import {
  generateWorkout,
  calcEstimatedMinutes,
  type PlannedWorkout,
  type PlannedExercise,
  type CanonicalRoutineType,
} from '../planner/autoPlanner'
import type { IronProtocolDB, Exercise } from '../db/schema'
import { APP_SETTINGS_ID, TEMP_SESSION_ID } from '../db/schema'
import { parseTempSessionDraft } from '../validation/tempSessionSchema'
import { getFunctionalInfo } from '../data/functionalMapping'
import { getSmartSwapAlternatives, getSwapRepTarget } from '../services/exerciseService'

interface Props {
  db: IronProtocolDB
  plan: PlannedWorkout | null
  fullPlan: PlannedWorkout | null
  loading: boolean
  error: string | null
  sessionLabel: string
  cycleLength: number
  sessionIndex: number
  routineType: CanonicalRoutineType
  trainingGoal: 'Hypertrophy' | 'Power'
  timeAvailable: number
  routineSetupRequired: boolean
  onTrainingGoalChange: (goal: 'Hypertrophy' | 'Power') => void
  onTimeAvailableChange: (minutes: number) => void
  onChooseDefaultRoutine: () => void
  onUpdatePlan: (plan: PlannedWorkout) => void
  onLockBlueprint: () => void
}

interface ExerciseCardModel {
  instanceId: string
  exercise: PlannedExercise
}

function createInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function exerciseIdentityKey(exercise: PlannedExercise): string {
  return `${exercise.exerciseId}:${normalizeExerciseName(exercise.exerciseName)}:${exercise.tier}`
}

function reconcileCards(
  prev: readonly ExerciseCardModel[],
  next: readonly PlannedExercise[],
): ExerciseCardModel[] {
  const prevByKey = new Map<string, ExerciseCardModel[]>()
  for (const card of prev) {
    const key = exerciseIdentityKey(card.exercise)
    const q = prevByKey.get(key)
    if (q) { q.push(card) } else { prevByKey.set(key, [card]) }
  }
  return next.map((exercise) => {
    const key = exerciseIdentityKey(exercise)
    const reused = prevByKey.get(key)?.shift()
    return reused
      ? { instanceId: reused.instanceId, exercise }
      : { instanceId: createInstanceId(), exercise }
  })
}

function clampMinutes(minutes: number): number {
  return Math.round(Math.max(15, Math.min(120, minutes)) / 5) * 5
}

function isDatabaseClosedError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error &&
    (error as { name?: string }).name === 'DatabaseClosedError'
}

function vibrate(ms: number): void {
  if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
    window.navigator.vibrate(ms)
  }
}

export default function SessionBlueprint({
  db,
  plan,
  fullPlan,
  loading,
  error,
  sessionLabel,
  cycleLength,
  sessionIndex,
  routineType,
  trainingGoal,
  timeAvailable,
  routineSetupRequired,
  onTrainingGoalChange,
  onTimeAvailableChange,
  onChooseDefaultRoutine,
  onUpdatePlan,
  onLockBlueprint,
}: Props) {
  const [exerciseCards, setExerciseCards] = useState<ExerciseCardModel[]>(() =>
    reconcileCards([], plan?.exercises ?? []),
  )
  const [alternatives, setAlternatives] = useState<Record<string, Exercise[]>>({})
  const [swapTarget, setSwapTarget] = useState<ExerciseCardModel | null>(null)
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false)
  const [isSwapLoading, setIsSwapLoading] = useState(false)
  const [isSwapPending, setIsSwapPending] = useState(false)
  const [isPacingUpdating, setIsPacingUpdating] = useState(false)
  const [workoutLengthMinutes, setWorkoutLengthMinutes] = useState(() => clampMinutes(timeAvailable))
  const pacingRequestIdRef = useRef(0)
  const hasSeenGoalRef = useRef(false)

  // Sync exercise cards when plan prop changes externally
  useEffect(() => {
    setExerciseCards((prev) => reconcileCards(prev, plan?.exercises ?? []))
  }, [plan?.exercises])

  // Sync slider when timeAvailable prop changes externally
  useEffect(() => {
    setWorkoutLengthMinutes(clampMinutes(timeAvailable))
  }, [timeAvailable])

  // Re-plan when trainingGoal changes (skips first render)
  useEffect(() => {
    if (!hasSeenGoalRef.current) { hasSeenGoalRef.current = true; return }
    void regenerateForDuration(workoutLengthMinutes)
  }, [trainingGoal])

  // Pre-fetch alternatives on mount / card change
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const session = await db.tempSessions.get(TEMP_SESSION_ID)
        const altsMap: Record<string, Exercise[]> = {}
        for (const card of exerciseCards) {
          const guards = buildSwapGuards(card.exercise, session)
          const alts = await getSmartSwapAlternatives(db, card.exercise, { limit: 4, ...guards })
          altsMap[card.instanceId] = alts
        }
        if (!cancelled) setAlternatives(altsMap)
      } catch (err) {
        if (!isDatabaseClosedError(err)) throw err
      }
    })()
    return () => { cancelled = true }
  }, [exerciseCards, db])

  function buildSwapGuards(
    source: PlannedExercise,
    session: { exercises: readonly { exerciseId: string; exerciseName: string }[] } | null | undefined,
  ) {
    if (!session) return { blockedExerciseIds: [], blockedExerciseNames: [] }
    const norm = normalizeExerciseName(source.exerciseName)
    const ids: string[] = []
    const names: string[] = []
    for (const ex of session.exercises) {
      if (ex.exerciseId === source.exerciseId || normalizeExerciseName(ex.exerciseName) === norm) continue
      ids.push(ex.exerciseId)
      names.push(ex.exerciseName)
    }
    return { blockedExerciseIds: ids, blockedExerciseNames: names }
  }

  async function persistPlanToDb(nextPlan: PlannedWorkout): Promise<void> {
    if (nextPlan.exercises.length === 0) {
      await db.tempSessions.delete(TEMP_SESSION_ID)
      return
    }

    const nextExercises = nextPlan.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      weight: ex.weight,
      reps: ex.reps,
      sets: ex.sets,
      tier: ex.tier,
      progressionGoal: ex.progressionGoal,
    }))

    try {
      const existing = await db.tempSessions.get(TEMP_SESSION_ID)
      const draft = parseTempSessionDraft(existing
        ? {
            ...existing,
            exercises: nextExercises,
            routineType: nextPlan.routineType,
            sessionIndex: nextPlan.sessionIndex,
            estimatedMinutes: nextPlan.estimatedMinutes,
            updatedAt: Date.now(),
          }
        : {
            id: TEMP_SESSION_ID,
            routineType: nextPlan.routineType,
            sessionIndex: nextPlan.sessionIndex,
            estimatedMinutes: nextPlan.estimatedMinutes,
            exercises: nextExercises,
            currentExIndex: 0,
            currentSetInEx: 0,
            weight: nextExercises[0]?.weight ?? 0,
            reps: nextExercises[0]?.reps ?? 0,
            phase: 'active',
            restSecondsLeft: 90,
            completedSets: [],
            updatedAt: Date.now(),
          })
      await db.tempSessions.put(draft)
    } catch (err) {
      if (!isDatabaseClosedError(err)) throw err
    }
  }

  async function regenerateForDuration(durationMinutes: number): Promise<void> {
    const requestId = ++pacingRequestIdRef.current
    setIsPacingUpdating(true)
    try {
      const next = await generateWorkout({
        db,
        routineType,
        sessionIndex,
        trainingGoal,
        timeAvailable: durationMinutes,
      })
      if (requestId !== pacingRequestIdRef.current) return
      const nextPlan: PlannedWorkout = { ...next, exercises: [...next.exercises] }
      onUpdatePlan(nextPlan)
      await persistPlanToDb(nextPlan)
    } catch {
      // Keep current blueprint on failure
    } finally {
      if (requestId === pacingRequestIdRef.current) setIsPacingUpdating(false)
    }
  }

  function handleSliderChange(event: ChangeEvent<HTMLInputElement>): void {
    const next = clampMinutes(Number(event.target.value))
    setWorkoutLengthMinutes(next)
    onTimeAvailableChange(next)
    void regenerateForDuration(next)
  }

  async function openSwapDrawer(card: ExerciseCardModel): Promise<void> {
    setSwapTarget(card)
    setIsSwapDrawerOpen(true)
    setIsSwapLoading(true)
    try {
      const session = await db.tempSessions.get(TEMP_SESSION_ID)
      const guards = buildSwapGuards(card.exercise, session)
      const alts = await getSmartSwapAlternatives(db, card.exercise, { limit: 6, ...guards })
      setAlternatives((curr) => ({ ...curr, [card.instanceId]: alts }))
    } catch (err) {
      if (!isDatabaseClosedError(err)) throw err
    } finally {
      setIsSwapLoading(false)
    }
  }

  function closeSwapDrawer(): void {
    if (isSwapPending) return
    setIsSwapDrawerOpen(false)
    setSwapTarget(null)
  }

  async function handleSwap(newExercise: Exercise): Promise<void> {
    if (!swapTarget || isSwapPending || !plan) return
    setIsSwapPending(true)
    vibrate(50)

    const [settings, sourceOriginal] = await Promise.all([
      db.settings.get(APP_SETTINGS_ID),
      db.exercises.get(swapTarget.exercise.exerciseId),
    ])

    const adjustedReps = getSwapRepTarget({
      sourceExerciseName: swapTarget.exercise.exerciseName,
      sourceTags: sourceOriginal?.tags ?? [],
      targetExerciseName: newExercise.name,
      currentReps: swapTarget.exercise.reps,
      purposeChip: settings?.purposeChip,
    })

    const updatedCards = exerciseCards.map((card) =>
      card.instanceId === swapTarget.instanceId
        ? { ...card, exercise: { ...card.exercise, exerciseId: newExercise.id, exerciseName: newExercise.name, reps: adjustedReps } }
        : card,
    )
    const updatedPlan: PlannedWorkout = { ...plan, exercises: updatedCards.map((c) => c.exercise) }

    setExerciseCards([...updatedCards])
    onUpdatePlan(updatedPlan)
    setIsSwapDrawerOpen(false)
    setSwapTarget(null)

    try {
      await persistPlanToDb(updatedPlan)
    } finally {
      setIsSwapPending(false)
    }
  }

  function handleReorder(nextOrderIds: string[]): void {
    if (currentCards.length !== nextOrderIds.length) return
    const byId = new Map(exerciseCards.map((c) => [c.instanceId, c]))
    const reordered = nextOrderIds.map((id) => byId.get(id)).filter(Boolean) as ExerciseCardModel[]
    if (reordered.length !== exerciseCards.length) return
    if (!plan) return
    vibrate(20)
    const updatedPlan: PlannedWorkout = { ...plan, exercises: reordered.map((c) => c.exercise) }
    setExerciseCards(reordered)
    onUpdatePlan(updatedPlan)
    void persistPlanToDb(updatedPlan)
  }

  // NOTE: fix typo — replace `currentCards` with `exerciseCards` in handleReorder above:
  function handleReorderFixed(nextOrderIds: string[]): void {
    if (exerciseCards.length !== nextOrderIds.length) return
    const byId = new Map(exerciseCards.map((c) => [c.instanceId, c]))
    const reordered = nextOrderIds.map((id) => byId.get(id)).filter(Boolean) as ExerciseCardModel[]
    if (reordered.length !== exerciseCards.length) return
    if (!plan) return
    vibrate(20)
    const updatedPlan: PlannedWorkout = { ...plan, exercises: reordered.map((c) => c.exercise) }
    setExerciseCards(reordered)
    onUpdatePlan(updatedPlan)
    void persistPlanToDb(updatedPlan)
  }

  const swapCandidates = swapTarget ? (alternatives[swapTarget.instanceId] ?? []) : []
  const orderedIds = exerciseCards.map((c) => c.instanceId)
  const liveEstimate = plan ? calcEstimatedMinutes(plan.exercises, trainingGoal) : 0
  const trimmedExercises = plan && fullPlan
    ? fullPlan.exercises.filter((ex) => !plan.exercises.find((p) => p.exerciseId === ex.exerciseId))
    : []

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="rounded-3xl bg-gradient-to-br from-[#ec4899]/15 to-[#3B71FE]/15 p-[1px]">
        <motion.section
          initial={{ opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-3xl bg-[#0D1626] p-5 shadow-[0_16px_30px_-20px_rgba(59,113,254,0.35)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Session Blueprint</p>
            <span className="rounded-2xl border border-[#3B71FE]/20 bg-[#091020] px-3 py-2 text-xs font-black text-zinc-100">
              Day {sessionIndex + 1} of {cycleLength}
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-50">{sessionLabel}</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-300">
            Est. {liveEstimate} min
            {isPacingUpdating && <span className="ml-2 text-xs text-blue-400/80"> · Rebalancing...</span>}
          </p>
        </motion.section>
      </div>

      {/* ── Training Goal ── */}
      <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">Training Goal</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['Hypertrophy', 'Power'] as const).map((goal) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={goal}
              type="button"
              onClick={() => onTrainingGoalChange(goal)}
              className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-bold transition-all ${
                trainingGoal === goal
                  ? 'border-[#3B71FE] bg-[#3B71FE]/15 text-[#3B71FE]'
                  : 'border-[#3B71FE]/15 bg-[#091020] text-zinc-300'
              }`}
            >
              {goal}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── Time Slider ── */}
      <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="session-time-slider" className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400/70">
            Time Available
          </label>
          <span className="text-sm font-black text-[#3B71FE]">{workoutLengthMinutes} min</span>
        </div>
        <div className="mt-4">
          <input
            id="session-time-slider"
            type="range"
            min={15}
            max={120}
            step={5}
            value={workoutLengthMinutes}
            onChange={handleSliderChange}
            className="qos-slider w-full cursor-pointer appearance-none"
          />
        </div>

        {trimmedExercises.length > 0 && (
          <div className="mt-4 rounded-2xl border border-[#3B71FE]/15 bg-[#091020] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400/50">QoS Trimmed</p>
            <ul className="mt-2 flex flex-col gap-2">
              {trimmedExercises.map((ex) => (
                <li key={ex.exerciseId} className="flex items-center justify-between rounded-xl border border-[#3B71FE]/15 px-3 py-2">
                  <p className="text-sm font-bold text-zinc-100">{ex.exerciseName}</p>
                  <span className="rounded-full border border-[#3B71FE]/30 px-2 py-1 text-xs font-bold text-zinc-200">T{ex.tier}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>

      {/* ── Exercise Cards (Reorderable) ── */}
      {loading ? (
        <div className="rounded-3xl border border-[#3B71FE]/15 bg-[#0D1626] p-6 text-center">
          <p className="text-sm font-semibold text-zinc-400">Syncing session...</p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={orderedIds}
          onReorder={handleReorderFixed}
          className="flex flex-col gap-3"
        >
          {exerciseCards.map((card) => {
            const { exercise } = card
            return (
              <Reorder.Item key={card.instanceId} value={card.instanceId}>
                <motion.div
                  layout
                  whileTap={{ scale: 0.98 }}
                  className="flex cursor-grab items-center justify-between rounded-2xl border border-gray-800 bg-[#0D1626] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0A0E1A]/70 text-zinc-500">
                      <GripVertical size={16} />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#3B71FE]/10 px-1.5 py-0.5 text-[10px] font-black text-blue-400">T{exercise.tier}</span>
                        <h3 className="text-base font-black text-white">{exercise.exerciseName}</h3>
                      </div>
                      <p className="text-xs font-semibold text-zinc-400">{exercise.sets} sets × {exercise.reps} reps · {exercise.weight} kg</p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void openSwapDrawer(card) }}
                    aria-label={`Swap ${exercise.exerciseName}`}
                    className="flex items-center gap-1.5 rounded-xl border border-electric/30 bg-electric/10 px-2.5 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-electric"
                  >
                    <Shuffle size={14} /> Swap
                  </motion.button>
                </motion.div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      )}

      {error && (
        <p className="rounded-2xl border border-red-500/40 bg-red-900/20 p-3 text-sm font-semibold text-red-300">{error}</p>
      )}

      {routineSetupRequired && (
        <motion.section
          whileTap={{ scale: 0.95 }}
          className="rounded-3xl border border-[#3B71FE]/40 bg-[#0f1f44] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3B71FE]">Setup Required</p>
          <p className="mt-2 text-sm font-semibold text-zinc-100">A routine must be selected before planning can continue.</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onChooseDefaultRoutine}
            className="mt-4 h-12 w-full cursor-pointer rounded-2xl bg-[#3B71FE] text-sm font-black text-white"
          >
            Choose Routine
          </motion.button>
        </motion.section>
      )}

      {/* ── Lock Blueprint CTA ── */}
      {!routineSetupRequired && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onLockBlueprint}
          disabled={!plan || loading}
          className="h-16 w-full cursor-pointer rounded-3xl bg-[#3B71FE] text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.55)] disabled:cursor-not-allowed disabled:bg-[#3B71FE]/20 disabled:text-zinc-600"
        >
          {loading ? 'Syncing Session...' : 'Lock Blueprint'}
        </motion.button>
      )}

      {/* ── Swap Drawer ── */}
      <AnimatePresence>
        {isSwapDrawerOpen && swapTarget && (
          <>
            <motion.button
              type="button"
              aria-label="Close quick swap drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSwapDrawer}
              className="fixed inset-0 z-[60] bg-[#0A0E1A]/55 backdrop-blur-[12px]"
            />
            <motion.section
              initial={{ y: '100%', opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[430px] rounded-t-3xl border border-electric/25 bg-navy-card px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-16px_44px_-20px_rgba(59,113,254,0.72)]"
              aria-label="Quick swap drawer"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-electric/75">Quick Swap</p>
                  <h2 className="mt-1 text-lg font-black text-zinc-100">Replace {swapTarget.exercise.exerciseName}</h2>
                </div>
                <button
                  type="button"
                  onClick={closeSwapDrawer}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-2 pb-2">
                {isSwapLoading ? (
                  <p className="text-xs font-semibold text-zinc-300">Scanning alternatives...</p>
                ) : swapCandidates.length > 0 ? (
                  swapCandidates.slice(0, 4).map((alt) => {
                    const info = getFunctionalInfo(alt.name)
                    return (
                      <motion.button
                        key={alt.id}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSwapPending}
                        onClick={() => void handleSwap(alt)}
                        className="cursor-pointer rounded-2xl border border-electric/20 bg-navy px-3.5 py-3 text-left disabled:opacity-50"
                      >
                        <p className="text-sm font-black text-electric">{alt.name}</p>
                        <p className="mt-1 text-xs font-semibold text-zinc-300">
                          {info?.purpose ?? 'Same tier alternative.'}
                        </p>
                      </motion.button>
                    )
                  })
                ) : (
                  <p className="text-xs font-semibold text-zinc-400">No alternatives available.</p>
                )}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
```

> **Note:** The `handleReorder` function contains a reference to `currentCards` which is a typo — use `handleReorderFixed` as the actual handler. In the real file, only define `handleReorderFixed` once (no duplicate) and wire it to `onReorder`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx -t "SessionBlueprint" --reporter=verbose 2>&1 | tail -30
```

Expected: ALL 7 SessionBlueprint tests pass.

- [ ] **Step 5: Type-check and lint**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1 && npx eslint src/components/SessionBlueprint.tsx 2>&1
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/components/SessionBlueprint.tsx src/test/UI.test.tsx && git commit -m "feat(ui): add SessionBlueprint Drafting Lab — reorder, swap, time slider, goal toggle, DB persistence"
```

---

## Task 5: Update `HomePage.tsx`

Wire `SessionBlueprint` into the idle render, wire `ReviewBlueprint` into the review phase, remove all state/logic that migrated to `SessionBlueprint`, and add the `onModify` → `setSessionPhase('idle')` callback.

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Write failing tests**

Append to `src/test/UI.test.tsx`:

```typescript
describe('HomePage — Lab vs Gantry phase wiring', () => {
  const MOCK_PLAN: PlannedWorkout = {
    routineType: 'PPL',
    sessionIndex: 0,
    estimatedMinutes: 42,
    exercises: [
      { exerciseId: 'ex-1', exerciseName: 'Bench Press', weight: 80, reps: 8, sets: 3, tier: 1, progressionGoal: 'Linear Progression' },
    ],
  }

  beforeEach(async () => {
    vi.mocked(generateWorkout).mockResolvedValue(MOCK_PLAN)
  })

  it('renders the Lock Blueprint button in the idle phase (dashboard)', async () => {
    const testDb = new IronProtocolDB()
    await testDb.open()
    await testDb.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      userName: 'Test User',
    })

    render(<HomePage db={testDb} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /lock blueprint/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    if (testDb.isOpen()) await testDb.close()
    await testDb.delete()
  })

  it('renders the Modify Plan button in the review phase after lock', async () => {
    const testDb = new IronProtocolDB()
    await testDb.open()
    await testDb.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: true,
      preferredRoutineType: 'PPL',
      daysPerWeek: 3,
      userName: 'Test User',
    })

    render(<HomePage db={testDb} />)

    // Wait for Lock Blueprint to appear and click it
    const lockButton = await screen.findByRole('button', { name: /lock blueprint/i }, { timeout: 3000 })
    fireEvent.click(lockButton)

    // ThinkingTerminal completes quickly in test (mocked) → review phase → ReviewBlueprint
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /modify plan/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    if (testDb.isOpen()) await testDb.close()
    await testDb.delete()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx -t "Lab vs Gantry" --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — "Lock Blueprint" button not found (current render uses "Start Recommended Session").

- [ ] **Step 3: Update imports in `HomePage.tsx`**

Replace the `DraftBlueprintReview` import and add the two new components:

```typescript
// Remove:
import DraftBlueprintReview from '../components/DraftBlueprintReview'

// Add:
import SessionBlueprint from '../components/SessionBlueprint'
import ReviewBlueprint from '../components/ReviewBlueprint'
```

- [ ] **Step 4: Update the 'review' phase render in `HomePage.tsx`**

Find the block (around line ~365):
```typescript
// ── Review phase ───────────────────────────────────────────────────────────
if (sessionPhase === 'review' && loggerPlan) {
  return (
    <DraftBlueprintReview
      plan={loggerPlan}
      db={db}
      trainingGoal={trainingGoal}
      initialWorkoutLengthMinutes={timeAvailable}
      onConfirm={() => { setSessionPhase('ignition') }}
      onCancel={() => { setSessionPhase('idle'); setActivePlan(null) }}
      onUpdatePlan={(updatedPlan) => {
        const nextPlan = clonePlan(updatedPlan)
        setActivePlan(nextPlan)
        setPlan(nextPlan)
      }}
      onWorkoutLengthChange={(nextDurationMinutes) => {
        setTimeAvailable(nextDurationMinutes)
      }}
    />
  )
}
```

Replace with:

```typescript
// ── Review phase ───────────────────────────────────────────────────────────
if (sessionPhase === 'review' && loggerPlan) {
  return (
    <ReviewBlueprint
      plan={loggerPlan}
      onConfirm={() => { setSessionPhase('ignition') }}
      onModify={() => {
        setSessionPhase('idle')
        setActivePlan(null)
      }}
    />
  )
}
```

- [ ] **Step 5: Replace the idle-phase inline blueprint with `<SessionBlueprint />`**

Find the final `return` statement (around line ~526) — the entire `<main>` block that contains the inline blueprint, training goal, and QoS governor sections. Replace the **entire** contents of that `<main>` with:

```typescript
return (
  <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-[#0A0E1A] px-4 pb-28 pt-5 text-zinc-100">
    <SessionBlueprint
      db={db}
      plan={plan}
      fullPlan={fullPlan}
      loading={loading}
      error={error}
      sessionLabel={sessionLabel}
      cycleLength={cycleLength}
      sessionIndex={detectedSessionIndex}
      routineType={routineType}
      trainingGoal={trainingGoal}
      timeAvailable={timeAvailable}
      routineSetupRequired={routineSetupRequired}
      onTrainingGoalChange={setTrainingGoal}
      onTimeAvailableChange={setTimeAvailable}
      onChooseDefaultRoutine={() => {
        const defaultRoutine = ROUTINE_OPTIONS[0]
        if (defaultRoutine) {
          handleRoutineSelect(defaultRoutine.type)
        }
      }}
      onUpdatePlan={(updatedPlan) => {
        const nextPlan = clonePlan(updatedPlan)
        setActivePlan(nextPlan)
        setPlan(nextPlan)
      }}
      onLockBlueprint={() => {
        if (plan) {
          setActivePlan(clonePlan(plan))
          setSessionPhase('thinking')
        }
      }}
    />
  </main>
)
```

- [ ] **Step 6: Remove state and computed values that now live in `SessionBlueprint`**

The following are safe to remove from `HomePage` because `SessionBlueprint` owns them internally:
- `progressionPreview` computed memo (lines ~243–249) — `SessionBlueprint` does not need it via props; remove the prop entirely
- The `trimmedExercises` memo stays — it is still passed to `SessionBlueprint` via `fullPlan` prop
- `sessionLabel`, `cycleLength`, `detectedSessionIndex` computed values stay — passed as props

Remove the `progressionPreview` useMemo block entirely. Also remove the old `handleRoutineSelect` inline block from the blueprint section — it is now handled via `onChooseDefaultRoutine` in the prop above.

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run src/test/UI.test.tsx --reporter=verbose 2>&1 | tail -30
```

Expected: ALL tests pass including the new "Lab vs Gantry phase wiring" tests.

- [ ] **Step 8: Type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 9: Lint**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx eslint src/pages/HomePage.tsx 2>&1
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 10: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add src/pages/HomePage.tsx && git commit -m "refactor(home): wire SessionBlueprint + ReviewBlueprint into phase state machine; remove inline blueprint JSX"
```

---

## Task 6: Delete `DraftBlueprintReview.tsx`

Its functionality has been fully absorbed by `SessionBlueprint` and `ReviewBlueprint`.

**Files:**
- Delete: `src/components/DraftBlueprintReview.tsx`

- [ ] **Step 1: Delete the file**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && rm src/components/DraftBlueprintReview.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && grep -r "DraftBlueprintReview" src/ 2>&1
```

Expected: empty output (no remaining references).

- [ ] **Step 3: Type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run --reporter=verbose 2>&1 | tail -40
```

Expected: ALL tests pass, no failures.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add -A && git commit -m "refactor(ui): delete DraftBlueprintReview — functionality absorbed by SessionBlueprint + ReviewBlueprint"
```

---

## Task 7: Full Quality Gate + Visual Verification

- [ ] **Step 1: Full type-check**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 2: Full lint pass**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx eslint src/ 2>&1
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Full test suite**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vitest run --reporter=verbose 2>&1
```

Expected: ALL tests pass.

- [ ] **Step 4: Start dev server and visually verify**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && npx vite --port 5173
```

Verify in browser:
1. Dashboard loads with exercise cards that have **Grab handles** and **Swap buttons** — confirm drag reorder works.
2. Moving the time slider updates the exercise list in real-time and updates the "Est. X min" display.
3. Clicking **Hypertrophy ↔ Power** updates sets/reps on the cards.
4. Clicking **Lock Blueprint** → ThinkingTerminal → ReviewBlueprint (no slider, no swap visible).
5. Clicking **Modify Plan** from ReviewBlueprint returns to dashboard (SessionBlueprint).
6. Clicking **Start Workout** from ReviewBlueprint → WorkoutIgnition countdown.
7. After a swap: confirm DB write happened (check DevTools → IndexedDB → IronProtocolDB → tempSessions).

- [ ] **Step 5: Final commit**

```bash
cd "C:/Users/megaw/Downloads/IronProtocol" && git add -A && git commit -m "chore: final quality gate pass — Lab vs Gantry UX pivot complete"
```

---

## Self-Review Against Spec

| Spec Requirement | Task Covering It | Status |
|---|---|---|
| Move Time Slider into SessionBlueprint | Task 4 (`handleSliderChange`) | ✅ |
| Move Swap triggers into SessionBlueprint | Task 4 (swap drawer) | ✅ |
| Move Reorder logic into SessionBlueprint | Task 4 (`handleReorderFixed`) | ✅ |
| Volume Expansion: gap ≥ 12 min → Synergists → Core → Pre-hab | Task 2 (`expandByCategoryPriority`) | ✅ |
| Goal Toggle updates sets/reps in real-time on SessionBlueprint | Task 4 (trainingGoal `useEffect` + regeneration) | ✅ |
| Convert DraftBlueprintReview to Static Component | Task 3 (`ReviewBlueprint`) | ✅ |
| Remove slider + swap from review screen | Task 3 (no `<input type="range">`, no Swap button) | ✅ |
| Add "Modify Plan" button to review screen | Task 3 (`onModify` CTA) | ✅ |
| Both screens use T = Σ[(S×R×4s)+((S-1)×P)+120s] | Task 1 (exports); Task 4 (`calcEstimatedMinutes` call) | ✅ |
| SessionBlueprint calls `db.tempSessions.put()` on every change | Task 4 (`persistPlanToDb` called on swap/reorder/regenerate) | ✅ |
| Static Review reads latest saved data | Task 3 (plan prop = activePlan from HomePage state, which SessionBlueprint kept synced) | ✅ |
