import type { Exercise, ExerciseTier, IronProtocolDB, Workout, WorkoutSet } from '../db/schema'
import { ensureIronExerciseLibrary } from '../db/seedExercises'

export interface PlannedExercise {
  readonly exerciseId: string
  readonly exerciseName: string
  readonly weight: number
  readonly reps: number
  readonly sets: number
  readonly tier: ExerciseTier
  readonly progressionGoal: string
}

export interface PlannedWorkout {
  readonly exercises: readonly PlannedExercise[]
  readonly estimatedMinutes: number
  readonly routineType: string
  readonly sessionIndex: number
}

export interface GenerateWorkoutParams {
  db: IronProtocolDB
  trainingGoal: 'Hypertrophy' | 'Power'
  timeAvailable: number // minutes
  routineType: string   // e.g. 'PPL' | 'UpperLower' | 'FullBody' | 'GZCL' | ...
  sessionIndex?: number // optional override used for deterministic previews
}

export interface PreflightAuditReport {
  passed: boolean
  danglingWorkoutRefs: number
  danglingExerciseRefs: number
  nonUuidPrimaryKeys: number
  nonUuidForeignKeys: number
  compoundTierViolations: string[]
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const BASELINE_WEIGHT = { upper: 20, lower: 40 } as const
const REST_MINUTES_BY_GOAL = {
  Hypertrophy: 90 / 60,
  Power: 180 / 60,
} as const

export const TIER_REP_RANGES: Record<ExerciseTier, { min: number; max: number }> = {
  1: { min: 3, max: 5 },
  2: { min: 8, max: 10 },
  3: { min: 12, max: 15 },
}

export const TIER_DEFAULT_SETS: Record<ExerciseTier, number> = {
  1: 5,
  2: 3,
  3: 3,
}

export function baselineRepGoal(tier: ExerciseTier): string {
  return `Goal: ${TIER_REP_RANGES[tier].min} Reps (Baseline)`
}

export const SMALLEST_INCREMENT_KG = 2.5

// Muscle groups classified as lower body; everything else is upper.
const LOWER_BODY_GROUPS = new Set(['Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves'])
const LOWER_TAGS = new Set(['legs', 'lower'])

const PRIMARY_COMPOUND_PATTERNS = [
  /\bsquat\b/i,
  /\bbench(\s+press)?\b/i,
  /\bdeadlift\b/i,
  /\boverhead\s+press\b/i,
  /\bohp\b/i,
]

interface RoutineSessionRule {
  label: string
  tags: string[]
  allowedTiers?: ExerciseTier[]
}

interface RoutineTemplate {
  cycleLength: number
  sessions: RoutineSessionRule[]
}

type RoutineBlueprint = {
  routineType: CanonicalRoutineType
  sessionIndex: number
  rule: RoutineSessionRule
}

const ROUTINE_TEMPLATES = {
  PPL: {
    cycleLength: 3,
    sessions: [
      { label: 'Push A', tags: ['push'] },
      { label: 'Pull A', tags: ['pull'] },
      { label: 'Legs A', tags: ['legs'] },
    ],
  },
  UpperLower: {
    cycleLength: 2,
    sessions: [
      { label: 'Upper', tags: ['upper'] },
      { label: 'Lower', tags: ['lower'] },
    ],
  },
  FullBody: {
    cycleLength: 1,
    sessions: [{ label: 'Full Body', tags: ['push', 'pull', 'legs'] }],
  },
  GZCL: {
    cycleLength: 4,
    sessions: [
      { label: 'Squat Focus', tags: ['legs'] },
      { label: 'Bench Focus', tags: ['push'] },
      { label: 'Deadlift Focus', tags: ['legs'] },
      { label: 'OHP Focus', tags: ['push'] },
    ],
  },
  ArnoldSplit: {
    cycleLength: 3,
    sessions: [
      { label: 'Chest and Back', tags: ['push', 'pull'] },
      { label: 'Shoulders and Arms', tags: ['push', 'isolation'] },
      { label: 'Legs', tags: ['legs'] },
    ],
  },
  PushPull: {
    cycleLength: 2,
    sessions: [
      { label: 'Push', tags: ['push'] },
      { label: 'Pull', tags: ['pull'] },
    ],
  },
  '531': {
    cycleLength: 4,
    sessions: [
      { label: 'Squat Day', tags: ['legs'] },
      { label: 'Bench Day', tags: ['push'] },
      { label: 'Deadlift Day', tags: ['legs'] },
      { label: 'OHP Day', tags: ['push'] },
    ],
  },
  PHUL: {
    cycleLength: 4,
    sessions: [
      { label: 'Upper Power', tags: ['upper'], allowedTiers: [1, 2] },
      { label: 'Lower Power', tags: ['lower'], allowedTiers: [1, 2] },
      { label: 'Upper Hypertrophy', tags: ['upper'], allowedTiers: [2, 3] },
      { label: 'Lower Hypertrophy', tags: ['lower'], allowedTiers: [2, 3] },
    ],
  },
  BroSplit: {
    cycleLength: 5,
    sessions: [
      { label: 'Chest', tags: ['push'] },
      { label: 'Back', tags: ['pull'] },
      { label: 'Shoulders', tags: ['push'] },
      { label: 'Arms', tags: ['isolation'] },
      { label: 'Legs', tags: ['legs'] },
    ],
  },
  TimeCrunch: {
    cycleLength: 1,
    sessions: [{ label: 'Time Crunch', tags: ['push', 'pull', 'legs'], allowedTiers: [1] }],
  },
} as const satisfies Record<string, RoutineTemplate>

export type CanonicalRoutineType = keyof typeof ROUTINE_TEMPLATES

export const ROUTINE_OPTIONS: Array<{
  type: CanonicalRoutineType
  label: string
  cycleLength: number
}> = [
  { type: 'PPL', label: 'PPL (Push Pull Legs)', cycleLength: ROUTINE_TEMPLATES.PPL.cycleLength },
  { type: 'UpperLower', label: 'Upper / Lower', cycleLength: ROUTINE_TEMPLATES.UpperLower.cycleLength },
  { type: 'FullBody', label: 'Full Body', cycleLength: ROUTINE_TEMPLATES.FullBody.cycleLength },
  { type: 'GZCL', label: 'GZCL', cycleLength: ROUTINE_TEMPLATES.GZCL.cycleLength },
  { type: 'ArnoldSplit', label: 'Arnold Split', cycleLength: ROUTINE_TEMPLATES.ArnoldSplit.cycleLength },
  { type: 'PushPull', label: 'Push / Pull (2 Day)', cycleLength: ROUTINE_TEMPLATES.PushPull.cycleLength },
  { type: '531', label: '5/3/1', cycleLength: ROUTINE_TEMPLATES['531'].cycleLength },
  { type: 'PHUL', label: 'PHUL', cycleLength: ROUTINE_TEMPLATES.PHUL.cycleLength },
  { type: 'BroSplit', label: 'Bro Split', cycleLength: ROUTINE_TEMPLATES.BroSplit.cycleLength },
  { type: 'TimeCrunch', label: 'Time Crunch', cycleLength: ROUTINE_TEMPLATES.TimeCrunch.cycleLength },
]

export function getRoutineSessionLabel(routineType: string, sessionIndex: number): string {
  const canonical = normalizeRoutineType(routineType)
  const session = ROUTINE_TEMPLATES[canonical].sessions[sessionIndex]
  if (!session) {
    return `Workout Day ${sessionIndex + 1}`
  }
  return session.label
}

// ── Frequency recommendations ──────────────────────────────────────────────────

// Maps training days per week to the best-fit routines for that frequency.
export const ROUTINE_RECOMMENDATIONS_BY_DAYS: Record<number, CanonicalRoutineType[]> = {
  3: ['PPL', 'FullBody'],
  4: ['GZCL', 'UpperLower'],
  5: ['ArnoldSplit', 'BroSplit'],
}

export function getRecommendedRoutinesForDays(daysPerWeek: number): CanonicalRoutineType[] {
  return ROUTINE_RECOMMENDATIONS_BY_DAYS[daysPerWeek] ?? ['PPL']
}

// ── GZCL helpers ───────────────────────────────────────────────────────────────

// Per-session anchor matcher — index mirrors GZCL sessions: 0=Squat, 1=Bench, 2=Deadlift, 3=OHP.
const GZCL_SESSION_FOCUS_MATCHERS = [
  /\bsquat\b/i,
  /\bbench(\s+press)?\b/i,
  /\bdeadlift\b/i,
  /\boverhead\s+press\b|\bohp\b/i,
] as const

const GZCL_STRICT_ANCHOR_MATCHER = /\bsquat\b|\bbench(\s+press)?\b/i

// Demotes any T1 exercise that is NOT the session's Big-4 anchor to T2.
// This enforces GZCL method: only one T1 lift per session (the anchor compound).
function remapGzclTiers(exercises: Exercise[], sessionIndex: number): Exercise[] {
  const anchorMatcher: RegExp = GZCL_SESSION_FOCUS_MATCHERS[sessionIndex] ?? GZCL_STRICT_ANCHOR_MATCHER
  return exercises.map((exercise) => {
    if (exercise.tier === 1 && !anchorMatcher.test(exercise.name)) {
      return { ...exercise, tier: 2 as ExerciseTier }
    }
    return exercise
  })
}

interface RoutineInputSnapshot {
  routineType: string
  sessionIndex?: number
  trainingGoal: 'Hypertrophy' | 'Power'
  timeAvailable: number
  exercises: Exercise[]
  workoutsForRoutine: Workout[]
  sets: WorkoutSet[]
  // Optional: user-calibrated starting weights keyed by exerciseName.toLowerCase().
  // Takes effect only when the exercise has zero history (cold start).
  baselines?: Map<string, number>
  // Optional: inject 1-2 T3 exercises for the listed muscle groups into the blueprint,
  // regardless of the session's base tags. Ignored if the exercises are already present.
  additionalFocusParts?: string[]
}

// ── Empty Pool Defense ─────────────────────────────────────────────────────────
// Returned when the DB contains no exercises for the requested routine slot.
// All GPP movements are bodyweight so weight is 0.
const GPP_EXERCISES: PlannedExercise[] = [
  {
    exerciseId: 'gpp-burpees',
    exerciseName: 'Burpees',
    weight: 0,
    reps: TIER_REP_RANGES[3].min,
    sets: 3,
    tier: 3,
    progressionGoal: baselineRepGoal(3),
  },
  {
    exerciseId: 'gpp-jumping-jacks',
    exerciseName: 'Jumping Jacks',
    weight: 0,
    reps: TIER_REP_RANGES[3].min,
    sets: 3,
    tier: 3,
    progressionGoal: baselineRepGoal(3),
  },
  {
    exerciseId: 'gpp-air-squat',
    exerciseName: 'Air Squat',
    weight: 0,
    reps: TIER_REP_RANGES[3].min,
    sets: 3,
    tier: 3,
    progressionGoal: baselineRepGoal(3),
  },
]

// ── Pure helpers ───────────────────────────────────────────────────────────────

function bodyRegion(muscleGroup: string): 'upper' | 'lower' {
  return LOWER_BODY_GROUPS.has(muscleGroup) ? 'lower' : 'upper'
}

function calcEstimatedMinutes(exercises: PlannedExercise[], restMinutes: number): number {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0)
  return totalSets * restMinutes
}

function isUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value)
}

function isLikelyPrimaryCompound(name: string): boolean {
  // Romanian Deadlift is a T2 secondary compound — exclude it from the Big-4 check.
  if (/\bromanian\b/i.test(name)) return false
  return PRIMARY_COMPOUND_PATTERNS.some((pattern) => pattern.test(name))
}

function normalizeRoutineType(routineType: string): CanonicalRoutineType {
  const normalized = routineType.toLowerCase().replace(/[^a-z0-9]/g, '')
  switch (normalized) {
    case 'ppl':
      return 'PPL'
    case 'upperlower':
      return 'UpperLower'
    case 'fullbody':
      return 'FullBody'
    case 'gzcl':
      return 'GZCL'
    case 'arnoldsplit':
      return 'ArnoldSplit'
    case 'pushpull':
      return 'PushPull'
    case '531':
      return '531'
    case 'phul':
      return 'PHUL'
    case 'brosplit':
      return 'BroSplit'
    case 'timecrunch':
      return 'TimeCrunch'
    default:
      throw new Error(`Unsupported routine type: ${routineType}`)
  }
}

function normalizeStoredRoutineType(routineType: string): CanonicalRoutineType | null {
  try {
    return normalizeRoutineType(routineType)
  } catch {
    return null
  }
}

export function inferAxis(exercise: Exercise): 'upper' | 'lower' {
  const normalizedTags = exercise.tags.map((tag) => tag.toLowerCase())
  if (normalizedTags.some((tag) => LOWER_TAGS.has(tag))) {
    return 'lower'
  }
  return bodyRegion(exercise.muscleGroup)
}

function hasSessionTag(exercise: Exercise, tag: string): boolean {
  const normalizedTag = tag.toLowerCase()
  const exerciseTags = exercise.tags.map((item) => item.toLowerCase())
  if (exerciseTags.includes(normalizedTag)) {
    return true
  }
  if (normalizedTag === 'upper') {
    return inferAxis(exercise) === 'upper'
  }
  if (normalizedTag === 'lower') {
    return inferAxis(exercise) === 'lower'
  }
  return false
}

function filterBySessionRule(exercises: Exercise[], rule: RoutineSessionRule): Exercise[] {
  return exercises.filter((exercise) => {
    const tagMatch = rule.tags.some((tag) => hasSessionTag(exercise, tag))
    if (!tagMatch) {
      return false
    }
    if (!rule.allowedTiers) {
      return true
    }
    return rule.allowedTiers.includes(exercise.tier)
  })
}

function dedupeExercisesById(exercises: Exercise[]): Exercise[] {
  const seen = new Set<string>()
  const deduped: Exercise[] = []

  for (const exercise of exercises) {
    if (seen.has(exercise.id)) {
      continue
    }
    seen.add(exercise.id)
    deduped.push(exercise)
  }

  return deduped
}

// Deduplicates the final PlannedExercise list by both exerciseId AND exerciseName
// (first occurrence wins, preserving the tier-priority sort order applied upstream).
// This is the last-resort guard against DB-level duplicates (same exercise seeded
// with two different UUIDs) reaching the session blueprint as "two Bench Presses".
function dedupePlannedById(exercises: PlannedExercise[]): PlannedExercise[] {
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  return exercises.filter((exercise) => {
    const nameKey = exercise.exerciseName.toLowerCase()
    if (seenIds.has(exercise.exerciseId) || seenNames.has(nameKey)) {
      return false
    }
    seenIds.add(exercise.exerciseId)
    seenNames.add(nameKey)
    return true
  })
}

function getBlueprint(routineType: CanonicalRoutineType, sessionIndex: number): RoutineBlueprint {
  const template = ROUTINE_TEMPLATES[routineType]
  const safeSessionIndex = template.cycleLength > 0 ? sessionIndex % template.cycleLength : 0
  return {
    routineType,
    sessionIndex: safeSessionIndex,
    rule: template.sessions[safeSessionIndex] ?? template.sessions[0],
  }
}

function getBlueprintExercises(
  blueprint: RoutineBlueprint,
  exercises: Exercise[],
): Exercise[] {
  const routed = filterBySessionRule(exercises, blueprint.rule)

  if (blueprint.routineType !== 'GZCL') {
    return dedupeExercisesById(routed)
  }

  // GZCL: prioritise the session's specific Big-4 anchor, then fill from the tag pool.
  const sessionFocusMatcher: RegExp = GZCL_SESSION_FOCUS_MATCHERS[blueprint.sessionIndex] ?? GZCL_STRICT_ANCHOR_MATCHER
  const strictFocusFromPool = exercises.filter((exercise) => GZCL_STRICT_ANCHOR_MATCHER.test(exercise.name))
  const sessionFocusFromPool = exercises.filter((exercise) => sessionFocusMatcher.test(exercise.name))

  let merged = dedupeExercisesById([
    ...sessionFocusFromPool,
    ...routed,
  ])

  const hasStrictAnchor = merged.some((exercise) => GZCL_STRICT_ANCHOR_MATCHER.test(exercise.name))
  if (!hasStrictAnchor) {
    merged = dedupeExercisesById([
      ...merged,
      ...strictFocusFromPool,
    ])
  }

  // Enforce GZCL method: only the session anchor counts as T1; all other T1 DB entries → T2.
  return remapGzclTiers(merged, blueprint.sessionIndex)
}

function detectSessionIndex(totalWorkoutsForRoutine: number, cycleLength: number): number {
  return cycleLength > 0 ? (totalWorkoutsForRoutine % cycleLength) : 0
}

function tierCapForTime(timeAvailable: number): ExerciseTier {
  if (timeAvailable < 30) {
    return 1
  }
  if (timeAvailable < 40) {
    return 2
  }
  return 3
}

function mapRecentSetsByExercise(recentSessionSets: WorkoutSet[]): Map<string, WorkoutSet[]> {
  const byExercise = new Map<string, WorkoutSet[]>()
  for (const set of recentSessionSets) {
    const existing = byExercise.get(set.exerciseId)
    if (existing) {
      existing.push(set)
    } else {
      byExercise.set(set.exerciseId, [set])
    }
  }

  for (const grouped of byExercise.values()) {
    grouped.sort((a, b) => a.orderIndex - b.orderIndex)
  }
  return byExercise
}

export function planExerciseFromHistory(
  exercise: Exercise,
  previousSets: WorkoutSet[],
  userBaselineKg?: number,
): PlannedExercise {
  const axis = inferAxis(exercise)
  // User-calibrated weight takes precedence over the static default on cold start.
  const baselineWeight = (previousSets.length === 0 && userBaselineKg !== undefined)
    ? userBaselineKg
    : BASELINE_WEIGHT[axis]
  const tierRange = TIER_REP_RANGES[exercise.tier]
  const baselineGoal = baselineRepGoal(exercise.tier)
  const latestWeight = previousSets.length > 0
    ? previousSets[previousSets.length - 1].weight
    : baselineWeight

  const linearGoal = `Linear Progression: Add ${axis === 'lower' ? '5.0kg' : '2.5kg'} next session`
  const doubleGoal = `Double Progression: Hit ${tierRange.max} reps to increase weight`

  if (exercise.tier === 1) {
    if (previousSets.length === 0) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        weight: baselineWeight,
        reps: tierRange.min,
        sets: TIER_DEFAULT_SETS[1],
        tier: 1,
        progressionGoal: baselineGoal,
      }
    }

    const nextWeight = latestWeight + (axis === 'lower' ? 5 : 2.5)

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: nextWeight,
      reps: tierRange.max,
      sets: TIER_DEFAULT_SETS[1],
      tier: 1,
      progressionGoal: linearGoal,
    }
  }

  if (previousSets.length === 0) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: baselineWeight,
      reps: tierRange.min,
      sets: TIER_DEFAULT_SETS[exercise.tier],
      tier: exercise.tier,
      progressionGoal: baselineGoal,
    }
  }

  const allSetsHitMax = previousSets.every((set) => set.reps >= tierRange.max)
  if (allSetsHitMax) {
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: latestWeight + SMALLEST_INCREMENT_KG,
      reps: tierRange.min,
      sets: TIER_DEFAULT_SETS[exercise.tier],
      tier: exercise.tier,
      progressionGoal: doubleGoal,
    }
  }

  const previousReps = Math.min(...previousSets.map((set) => set.reps))
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    weight: latestWeight,
    reps: Math.min(tierRange.max, previousReps + 1),
    sets: TIER_DEFAULT_SETS[exercise.tier],
    tier: exercise.tier,
    progressionGoal: doubleGoal,
  }
}

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
  const canonicalRoutineType = normalizeRoutineType(routineType)
  const template = ROUTINE_TEMPLATES[canonicalRoutineType]
  const detectedSessionIndex = detectSessionIndex(workoutsForRoutine.length, template.cycleLength)
  const sessionIndex = Number.isInteger(requestedSessionIndex) && (requestedSessionIndex ?? 0) >= 0
    ? (template.cycleLength > 0 ? (requestedSessionIndex as number) % template.cycleLength : 0)
    : detectedSessionIndex
  const blueprint = getBlueprint(canonicalRoutineType, sessionIndex)

  const sessionExercises = getBlueprintExercises(blueprint, exercises)
  if (sessionExercises.length === 0) {
    const restMinutes = REST_MINUTES_BY_GOAL[trainingGoal]
    return {
      exercises: GPP_EXERCISES,
      estimatedMinutes: calcEstimatedMinutes(GPP_EXERCISES, restMinutes),
      routineType: canonicalRoutineType,
      sessionIndex,
    }
  }

  const recentSpecificSession = [...workoutsForRoutine]
    .filter((workout) => workout.sessionIndex === sessionIndex)
    .sort((a, b) => b.date - a.date)[0]

  const recentSessionSets = recentSpecificSession
    ? sets.filter((set) => set.workoutId === recentSpecificSession.id)
    : []
  const setsByExercise = mapRecentSetsByExercise(recentSessionSets)

  const progressed = dedupePlannedById(
    sessionExercises
      .map((exercise) => {
        const userBaseline = resolvedBaselines.get(exercise.name.toLowerCase())
        return planExerciseFromHistory(exercise, setsByExercise.get(exercise.id) ?? [], userBaseline)
      })
      .sort((a, b) => (a.tier - b.tier) || a.exerciseName.localeCompare(b.exerciseName)),
  )

  const tierCap = tierCapForTime(effectiveTime)
  let qosFiltered = progressed.filter((exercise) => exercise.tier <= tierCap)

  const restMinutes = REST_MINUTES_BY_GOAL[trainingGoal]
  if (
    qosFiltered.length > 0
    && qosFiltered.every((exercise) => exercise.tier === 1)
    && calcEstimatedMinutes(qosFiltered, restMinutes) > effectiveTime
  ) {
    qosFiltered = qosFiltered.map((exercise) => ({
      ...exercise,
      sets: Math.min(exercise.sets, 3),
    }))
  }

  // ── Hybrid Focus Injection ────────────────────────────────────────────────────
  // Inject up to 2 T3 exercises for user-selected focus muscle groups that are
  // not already present in the session blueprint.
  let finalExercises: PlannedExercise[] = qosFiltered

  if (additionalFocusParts && additionalFocusParts.length > 0) {
    const includedIds = new Set(finalExercises.map((ex) => ex.exerciseId))
    const injections: PlannedExercise[] = []

    for (const focusPart of additionalFocusParts) {
      if (injections.length >= 2) break
      const focusNorm = focusPart.toLowerCase()
      const candidate = exercises.find(
        (ex) =>
          ex.muscleGroup.toLowerCase() === focusNorm
          && ex.tier === 3
          && !includedIds.has(ex.id),
      )
      if (candidate) {
        const userBaseline = resolvedBaselines.get(candidate.name.toLowerCase())
        // Always treat injected focus exercises as cold-start for clean baseline reps.
        injections.push(planExerciseFromHistory(candidate, [], userBaseline))
        includedIds.add(candidate.id)
      }
    }

    finalExercises = [...finalExercises, ...injections]
  }

  return {
    exercises: finalExercises,
    estimatedMinutes: calcEstimatedMinutes(finalExercises, restMinutes),
    routineType: canonicalRoutineType,
    sessionIndex,
  }
}

export async function runPlannerPreflightAudit(db: IronProtocolDB): Promise<PreflightAuditReport> {
  const [exercises, workouts, sets] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
  ])

  let nonUuidPrimaryKeys = 0
  let nonUuidForeignKeys = 0

  for (const exercise of exercises) {
    if (!isUuidV4(exercise.id)) {
      nonUuidPrimaryKeys += 1
    }
  }

  for (const workout of workouts) {
    if (!isUuidV4(workout.id)) {
      nonUuidPrimaryKeys += 1
    }
  }

  for (const set of sets) {
    if (!isUuidV4(set.id)) {
      nonUuidPrimaryKeys += 1
    }
    if (!isUuidV4(set.workoutId) || !isUuidV4(set.exerciseId)) {
      nonUuidForeignKeys += 1
    }
  }

  const workoutIds = new Set(workouts.map((workout) => workout.id))
  const exerciseIds = new Set(exercises.map((exercise) => exercise.id))

  let danglingWorkoutRefs = 0
  let danglingExerciseRefs = 0

  for (const set of sets) {
    if (!workoutIds.has(set.workoutId)) {
      danglingWorkoutRefs += 1
    }
    if (!exerciseIds.has(set.exerciseId)) {
      danglingExerciseRefs += 1
    }
  }

  const compoundTierViolations = exercises
    .filter((exercise) => isLikelyPrimaryCompound(exercise.name) && exercise.tier !== 1)
    .map((exercise) => exercise.name)

  const passed =
    danglingWorkoutRefs === 0
    && danglingExerciseRefs === 0
    && nonUuidPrimaryKeys === 0
    && nonUuidForeignKeys === 0
    && compoundTierViolations.length === 0

  return {
    passed,
    danglingWorkoutRefs,
    danglingExerciseRefs,
    nonUuidPrimaryKeys,
    nonUuidForeignKeys,
    compoundTierViolations,
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function generateWorkout({
  db,
  routineType,
  sessionIndex,
  trainingGoal,
  timeAvailable,
}: GenerateWorkoutParams): Promise<PlannedWorkout> {
  const canonicalRoutineType = normalizeRoutineType(routineType)
  const existingExercises = await db.exercises.toArray()
  const hasGzclAnchor = existingExercises.some((exercise) => /\bsquat\b|\bbench(\s+press)?\b/i.test(exercise.name))

  if (existingExercises.length === 0 || (canonicalRoutineType === 'GZCL' && !hasGzclAnchor)) {
    await ensureIronExerciseLibrary(db)
  }

  const audit = await runPlannerPreflightAudit(db)
  if (!audit.passed) {
    throw new Error(
      `Pre-flight audit failed: danglingWorkoutRefs=${audit.danglingWorkoutRefs}, danglingExerciseRefs=${audit.danglingExerciseRefs}, nonUuidPrimaryKeys=${audit.nonUuidPrimaryKeys}, nonUuidForeignKeys=${audit.nonUuidForeignKeys}, compoundTierViolations=${audit.compoundTierViolations.length}`,
    )
  }

  const [exercises, workouts, sets, baselinesArray] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.baselines.toArray(),
  ])

  const baselinesMap = new Map<string, number>(
    baselinesArray.map((b) => [b.exerciseName.toLowerCase(), b.weight]),
  )

  const workoutsForRoutine = workouts.filter((workout) => {
    const normalized = normalizeStoredRoutineType(workout.routineType)
    return normalized === canonicalRoutineType
  })

  return planRoutineWorkoutPure({
    routineType: canonicalRoutineType,
    sessionIndex,
    trainingGoal,
    timeAvailable,
    exercises,
    workoutsForRoutine,
    sets,
    baselines: baselinesMap,
  })
}
