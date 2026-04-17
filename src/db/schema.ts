import Dexie from 'dexie'

export type ExerciseTier = 1 | 2 | 3

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  mediaType: string
  mediaRef: string
  tags: string[]
  tier: ExerciseTier // 1=T1, 2=T2, 3=T3
  embedding?: number[]
}

export interface Plan {
  id: string
  name: string
  description: string
  embedding?: number[]
}

// ReadonlyExercise is used at consumption boundaries (planner, services) where
// exercise data must not be mutated. The mutable Exercise type is preserved for
// Dexie upgrade callbacks which use .modify() with partial mutation.
export type ReadonlyExercise = Readonly<Exercise>

export interface Workout {
  id: string
  date: number // Unix timestamp (integer)
  routineType: string
  sessionIndex: number
  notes: string
}

export interface WorkoutSet {
  id: string
  workoutId: string  // FK → Workout.id
  exerciseId: string // FK → Exercise.id
  weight: number
  reps: number
  orderIndex: number
  requiresCalibration?: boolean
}

export const APP_SETTINGS_ID = 'app'
export const TEMP_SESSION_ID = 'temp_session'

// Stores user-set starting weights for T1 compound lifts.
// exerciseName is the PK (lowercased) — e.g. 'bench press', 'back squat'.
export interface ExerciseBaseline {
  exerciseName: string // PK — lowercased canonical compound name
  weight: number       // kg — user's starting working weight
}

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

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'

export interface RecoveryLog {
  id: string
  workoutId: string
  loggedAt: number
  sleepHours: number
  sleepQuality: 1 | 2 | 3 | 4 | 5
  stressLevel: 1 | 2 | 3 | 4 | 5
  overallFatigue: 1 | 2 | 3 | 4 | 5
  soreness: Partial<Record<MuscleGroup, 1 | 2 | 3 | 4 | 5>>
}

export type PurposeChip = 'strength' | 'hypertrophy' | 'fat-loss' | 'endurance' | 'health'

export type V11Gender = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say'

export interface V11PhysiologicalBaselines {
  ageYears: number | null
  bodyWeightKg: number | null
  gender: V11Gender | null
}

export type V11TrainingExperienceLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced'

export interface V11LogisticalConstraints {
  targetDaysPerWeek: 3 | 4 | 5 | null
  hardSessionLimitMinutes: number | null // expected range: 15-120
}

export type V11EquipmentAvailability =
  | 'commercial-gym'
  | 'home-gym'
  | 'dumbbells-only'
  | 'bodyweight-only'

export type V11PrimaryGoalFocus =
  | 'hypertrophy'
  | 'strength'
  | 'endurance'
  | 'specific-lift-target'

export interface V11SpecificLiftTarget {
  liftName: 'back-squat' | 'bench-press' | 'deadlift' | 'overhead-press' | 'custom'
  targetWeightKg?: number
  targetReps?: number
  notes?: string
}

export interface V11PrimaryGoals {
  primaryFocus: V11PrimaryGoalFocus | null
  specificLiftTargets: V11SpecificLiftTarget[]
}

export interface V11InjuryConstraint {
  structuralAversion: string // e.g. "No spinal loading"
}

export interface V11InjuryConstraints {
  hasActiveConstraints: boolean
  constraints: V11InjuryConstraint[]
}

export interface V11AppSettingsSchema {
  physiologicalBaselines: V11PhysiologicalBaselines
  trainingExperienceLevel: V11TrainingExperienceLevel | null
  logisticalConstraints: V11LogisticalConstraints
  equipmentAvailability: V11EquipmentAvailability | null
  primaryGoals: V11PrimaryGoals
  injuryConstraints: V11InjuryConstraints
}

export interface ActiveFallbackExercise {
  exerciseName: string
  reason: string
}

export type ActiveFallbackPool = Record<string, ActiveFallbackExercise[]>

export interface AppSettings {
  id: string
  hasCompletedOnboarding: boolean
  preferredRoutineType: string
  daysPerWeek: number // 3, 4, or 5 — drives routine recommendations in onboarding
  userName?: string   // set during IdentitySplash; gates first-run flow
  northStar?: string       // free-text goal from onboarding
  purposeChip?: PurposeChip // training intent from onboarding
  qosMinutes?: number      // session time budget from onboarding (15–120)
  v11PromptContract?: V11AppSettingsSchema
  activeFallbackPool?: ActiveFallbackPool
}

export type TempSessionPhase = 'active' | 'resting'

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

// IWorkoutAction is the unit of work for the active logger.
// A 'single' action contains one exercise; a 'superset' contains 2+ exercises
// sharing a supersetGroupId and executed back-to-back.
export interface IWorkoutAction {
  readonly type: 'single' | 'superset'
  readonly exercises: readonly TempSessionExercise[]
  readonly supersetGroupId?: string  // defined when type === 'superset'
}

export interface TempSessionCompletedSet {
  exerciseId: string
  weight: number
  reps: number
  orderIndex: number
}

export interface TempSession {
  id: string
  routineType: string
  sessionIndex: number
  estimatedMinutes: number
  exercises: readonly TempSessionExercise[]
  currentExIndex: number
  currentSetInEx: number
  weight: number
  reps: number
  phase: TempSessionPhase
  restSecondsLeft: number
  completedSets: TempSessionCompletedSet[]
  updatedAt: number
}

function isSupportedTrainingDays(value: unknown): value is 3 | 4 | 5 {
  return value === 3 || value === 4 || value === 5
}

function mapPurposeChipToPrimaryFocus(chip: PurposeChip | undefined): V11PrimaryGoalFocus | null {
  if (chip === 'strength' || chip === 'hypertrophy' || chip === 'endurance') {
    return chip
  }
  return null
}

export function createDefaultV11PromptContract(): V11AppSettingsSchema {
  return {
    physiologicalBaselines: {
      ageYears: null,
      bodyWeightKg: null,
      gender: null,
    },
    trainingExperienceLevel: null,
    logisticalConstraints: {
      targetDaysPerWeek: null,
      hardSessionLimitMinutes: null,
    },
    equipmentAvailability: null,
    primaryGoals: {
      primaryFocus: null,
      specificLiftTargets: [],
    },
    injuryConstraints: {
      hasActiveConstraints: false,
      constraints: [],
    },
  }
}

function normalizeV11PromptContract(contract: Partial<V11AppSettingsSchema> | undefined): V11AppSettingsSchema {
  const defaultContract = createDefaultV11PromptContract()
  return {
    physiologicalBaselines: {
      ageYears: contract?.physiologicalBaselines?.ageYears ?? defaultContract.physiologicalBaselines.ageYears,
      bodyWeightKg: contract?.physiologicalBaselines?.bodyWeightKg ?? defaultContract.physiologicalBaselines.bodyWeightKg,
      gender: contract?.physiologicalBaselines?.gender ?? defaultContract.physiologicalBaselines.gender,
    },
    trainingExperienceLevel: contract?.trainingExperienceLevel ?? defaultContract.trainingExperienceLevel,
    logisticalConstraints: {
      targetDaysPerWeek:
        contract?.logisticalConstraints?.targetDaysPerWeek ?? defaultContract.logisticalConstraints.targetDaysPerWeek,
      hardSessionLimitMinutes:
        contract?.logisticalConstraints?.hardSessionLimitMinutes
        ?? defaultContract.logisticalConstraints.hardSessionLimitMinutes,
    },
    equipmentAvailability: contract?.equipmentAvailability ?? defaultContract.equipmentAvailability,
    primaryGoals: {
      primaryFocus: contract?.primaryGoals?.primaryFocus ?? defaultContract.primaryGoals.primaryFocus,
      specificLiftTargets: Array.isArray(contract?.primaryGoals?.specificLiftTargets)
        ? contract.primaryGoals.specificLiftTargets
        : defaultContract.primaryGoals.specificLiftTargets,
    },
    injuryConstraints: {
      hasActiveConstraints:
        contract?.injuryConstraints?.hasActiveConstraints
        ?? defaultContract.injuryConstraints.hasActiveConstraints,
      constraints: Array.isArray(contract?.injuryConstraints?.constraints)
        ? contract.injuryConstraints.constraints
        : defaultContract.injuryConstraints.constraints,
    },
  }
}

export class IronProtocolDB extends Dexie {
  exercises!: Dexie.Table<Exercise, string>
  workouts!: Dexie.Table<Workout, string>
  sets!: Dexie.Table<WorkoutSet, string>
  settings!: Dexie.Table<AppSettings, string>
  tempSessions!: Dexie.Table<TempSession, string>
  baselines!: Dexie.Table<ExerciseBaseline, string>
  dailyTargets!: Dexie.Table<DailyTarget, string>
  personalBests!: Dexie.Table<PersonalBest, string>
  recoveryLogs!: Dexie.Table<RecoveryLog, string>

  constructor() {
    super('IronProtocolDB')

    // Version 1 — initial schema.
    // Rules (dexie_schema_rules.md):
    //   • Primary keys are UUID strings — never auto-incremented integers.
    //   • To migrate, add a NEW version(x) block. Never edit old blocks.
    this.version(1).stores({
      exercises: 'id, name, muscleGroup',
      workouts:  'id, date',
      sets:      'id, workoutId, exerciseId, orderIndex',
    })

    // Version 2 — adds tier (scalar index) and tags (multi-value index) to
    // exercises to support routine-aware tiered planning (docs/routine_config.md).
    // workouts and sets are listed unchanged — Dexie requires all tables.
    this.version(2).stores({
      exercises: 'id, name, muscleGroup, tier, *tags',
      workouts:  'id, date',
      sets:      'id, workoutId, exerciseId, orderIndex',
    })

    // Version 3 — workouts are now routine-aware and exercises require
    // explicit tier/tags metadata for routing and QoS trimming.
    this.version(3)
      .stores({
        exercises: 'id, name, muscleGroup, tier, *tags',
        workouts:  'id, date, routineType, sessionIndex',
        sets:      'id, workoutId, exerciseId, orderIndex',
      })
      .upgrade(async (tx) => {
        await tx
          .table('exercises')
          .toCollection()
          .modify((exercise: Partial<Exercise>) => {
            if (!Array.isArray(exercise.tags)) {
              exercise.tags = []
            }
            if (exercise.tier !== 1 && exercise.tier !== 2 && exercise.tier !== 3) {
              exercise.tier = 3
            }
          })

        await tx
          .table('workouts')
          .toCollection()
          .modify((workout: Partial<Workout>) => {
            if (typeof workout.routineType !== 'string' || workout.routineType.length === 0) {
              workout.routineType = 'Unknown'
            }
            if (!Number.isInteger(workout.sessionIndex) || (workout.sessionIndex ?? 0) < 0) {
              workout.sessionIndex = 0
            }
          })
      })

    // Version 4 — audit hardening pass to ensure compound lifts are never
    // misclassified as Tier 3 after backfill.
    this.version(4)
      .stores({
        exercises: 'id, name, muscleGroup, tier, *tags',
        workouts:  'id, date, routineType, sessionIndex',
        sets:      'id, workoutId, exerciseId, orderIndex',
      })
      .upgrade(async (tx) => {
        await tx
          .table('exercises')
          .toCollection()
          .modify((exercise: Partial<Exercise>) => {
            const name = exercise.name?.toLowerCase() ?? ''
            const likelyPrimaryCompound =
              /\bsquat\b/.test(name)
              || /\bbench(\s+press)?\b/.test(name)
              || /\bdeadlift\b/.test(name)
              || /\boverhead\s+press\b/.test(name)
              || /\bohp\b/.test(name)

            if (likelyPrimaryCompound && exercise.tier === 3) {
              exercise.tier = 1
            }

            if (!Array.isArray(exercise.tags)) {
              exercise.tags = []
            }
            if (likelyPrimaryCompound && !exercise.tags.includes('compound')) {
              exercise.tags.push('compound')
            }
          })

        await tx
          .table('workouts')
          .toCollection()
          .modify((workout: Partial<Workout>) => {
            if (typeof workout.routineType !== 'string' || workout.routineType.length === 0) {
              workout.routineType = 'Unknown'
            }
            if (!Number.isInteger(workout.sessionIndex) || (workout.sessionIndex ?? 0) < 0) {
              workout.sessionIndex = 0
            }
          })
      })

    // Version 5 — adds app-level settings with onboarding completion state.
    this.version(5)
      .stores({
        exercises: 'id, name, muscleGroup, tier, *tags',
        workouts:  'id, date, routineType, sessionIndex',
        sets:      'id, workoutId, exerciseId, orderIndex',
        settings:  'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .put({
            id: APP_SETTINGS_ID,
            hasCompletedOnboarding: false,
            preferredRoutineType: 'PPL',
            daysPerWeek: 3,
          } satisfies AppSettings)
      })

    // Version 6 — adds temp session draft storage for crash-safe workout
    // recovery when users background/refresh mid-session.
    this.version(6)
      .stores({
        exercises: 'id, name, muscleGroup, tier, *tags',
        workouts:  'id, date, routineType, sessionIndex',
        sets:      'id, workoutId, exerciseId, orderIndex',
        settings:  'id, preferredRoutineType',
        tempSessions: 'id, updatedAt',
      })

    // Version 7 — persists onboarding-selected routine in settings so
    // initialize flow and planner refresh use the chosen routine deterministically.
    this.version(7)
      .stores({
        exercises: 'id, name, muscleGroup, tier, *tags',
        workouts:  'id, date, routineType, sessionIndex',
        sets:      'id, workoutId, exerciseId, orderIndex',
        settings:  'id, preferredRoutineType',
        tempSessions: 'id, updatedAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            if (typeof settings.preferredRoutineType !== 'string' || settings.preferredRoutineType.length === 0) {
              settings.preferredRoutineType = 'PPL'
            }
          })
      })

    // Version 8 — adds baselines table for user-calibrated T1 compound starting weights.
    // No upgrade needed — table starts empty and is populated via CalibrateBaselinesCard.
    this.version(8).stores({
      exercises:    'id, name, muscleGroup, tier, *tags',
      workouts:     'id, date, routineType, sessionIndex',
      sets:         'id, workoutId, exerciseId, orderIndex',
      settings:     'id, preferredRoutineType',
      tempSessions: 'id, updatedAt',
      baselines:    'exerciseName',
    })

    // Version 9 — adds daysPerWeek to settings to drive routine frequency recommendations.
    // Also corrects Romanian Deadlift tier from T1 to T2 in the exercise library.
    this.version(9)
      .stores({
        exercises:    'id, name, muscleGroup, tier, *tags',
        workouts:     'id, date, routineType, sessionIndex',
        sets:         'id, workoutId, exerciseId, orderIndex',
        settings:     'id, preferredRoutineType',
        tempSessions: 'id, updatedAt',
        baselines:    'exerciseName',
      })
      .upgrade(async (tx) => {
        // Backfill daysPerWeek = 3 for all existing settings rows.
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            if (typeof settings.daysPerWeek !== 'number') {
              settings.daysPerWeek = 3
            }
          })

        // Correct Romanian Deadlift — it is a secondary compound (T2), not T1.
        await tx
          .table('exercises')
          .toCollection()
          .modify((exercise: Partial<{ name: string; tier: number }>) => {
            if (exercise.name?.toLowerCase() === 'romanian deadlift' && exercise.tier === 1) {
              exercise.tier = 2
            }
          })
      })

    // Version 10 — adds DailyTargets for real-time Kcal/Steps tracking and
    // PersonalBests for immediate achievement flags upon set completion.
    // No data upgrade needed — both tables start empty and are populated at runtime.
    // personalBests indexes exerciseId only; flagged is not indexed because the
    // expected table size (≤ one row per exercise) makes a full scan negligible.
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

    // Version 11 — adds onboarding identity fields to settings:
    // northStar (free-text goal), purposeChip (training intent),
    // qosMinutes (session time budget). All optional; no data migration
    // needed because absent rows get undefined for new fields.
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

    // Version 12 — introduces strict V11 planner prompt contract structure
    // inside settings while preserving legacy onboarding fields for compatibility.
    this.version(12)
      .stores({
        exercises:     'id, name, muscleGroup, tier, *tags',
        workouts:      'id, date, routineType, sessionIndex',
        sets:          'id, workoutId, exerciseId, orderIndex',
        settings:      'id, preferredRoutineType',
        tempSessions:  'id, updatedAt',
        baselines:     'exerciseName',
        dailyTargets:  'date',
        personalBests: 'exerciseId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            const normalizedDaysPerWeek = isSupportedTrainingDays(settings.daysPerWeek)
              ? settings.daysPerWeek
              : 3

            if (typeof settings.hasCompletedOnboarding !== 'boolean') {
              settings.hasCompletedOnboarding = false
            }
            if (typeof settings.preferredRoutineType !== 'string' || settings.preferredRoutineType.length === 0) {
              settings.preferredRoutineType = 'PPL'
            }
            settings.daysPerWeek = normalizedDaysPerWeek

            const v11PromptContract = normalizeV11PromptContract(settings.v11PromptContract)

            if (v11PromptContract.logisticalConstraints.targetDaysPerWeek === null) {
              v11PromptContract.logisticalConstraints.targetDaysPerWeek = normalizedDaysPerWeek
            }

            const qos = settings.qosMinutes
            if (
              typeof qos === 'number'
              && Number.isFinite(qos)
              && qos >= 15
              && qos <= 120
              && v11PromptContract.logisticalConstraints.hardSessionLimitMinutes === null
            ) {
              v11PromptContract.logisticalConstraints.hardSessionLimitMinutes = qos
            }

            if (v11PromptContract.primaryGoals.primaryFocus === null) {
              v11PromptContract.primaryGoals.primaryFocus = mapPurposeChipToPrimaryFocus(settings.purposeChip)
            }

            settings.v11PromptContract = v11PromptContract
          })
      })

    // Version 13 — stores active fallback alternatives for offline Gantry swaps.
    this.version(13)
      .stores({
        exercises:     'id, name, muscleGroup, tier, *tags',
        workouts:      'id, date, routineType, sessionIndex',
        sets:          'id, workoutId, exerciseId, orderIndex',
        settings:      'id, preferredRoutineType',
        tempSessions:  'id, updatedAt',
        baselines:     'exerciseName',
        dailyTargets:  'date',
        personalBests: 'exerciseId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            if (!settings.activeFallbackPool) {
              settings.activeFallbackPool = {}
            }
          })
      })

    // Version 14 — adds recoveryLogs for post-session telemetry feeding the
    // Recovery Auditor (Lab feature). Table starts empty; no data upgrade needed.
    this.version(14).stores({
      exercises:     'id, name, muscleGroup, tier, *tags',
      workouts:      'id, date, routineType, sessionIndex',
      sets:          'id, workoutId, exerciseId, orderIndex',
      settings:      'id, preferredRoutineType',
      tempSessions:  'id, updatedAt',
      baselines:     'exerciseName',
      dailyTargets:  'date',
      personalBests: 'exerciseId',
      recoveryLogs:  'id, workoutId, loggedAt',
    })

    // New databases (created directly at latest version) skip migration
    // upgrade callbacks, so populate seeds the onboarding settings row.
    this.on('populate', (tx) => {
      void tx.table('settings').add({
        id: APP_SETTINGS_ID,
        hasCompletedOnboarding: false,
        preferredRoutineType: 'PPL',
        daysPerWeek: 3,
        v11PromptContract: createDefaultV11PromptContract(),
        activeFallbackPool: {},
      } satisfies AppSettings)
    })
  }
}
