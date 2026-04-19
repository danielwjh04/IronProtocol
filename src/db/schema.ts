import Dexie from 'dexie'

export type ExerciseTier = 1 | 2 | 3

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  mediaType: string
  mediaRef: string
  tags: string[]
  tier: ExerciseTier
  embedding?: number[]
}

export interface Plan {
  id: string
  name: string
  description: string
  embedding?: number[]
}

export type ReadonlyExercise = Readonly<Exercise>

export interface Workout {
  id: string
  date: number
  routineType: string
  sessionIndex: number
  notes: string
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseId: string
  weight: number
  reps: number
  orderIndex: number
  requiresCalibration?: boolean
}

export const APP_SETTINGS_ID = 'app'
export const TEMP_SESSION_ID = 'temp_session'

export interface ExerciseBaseline {
  exerciseName: string
  weight: number
}

export interface DailyTarget {
  date: string
  targetKcal: number
  targetSteps: number
  actualKcal: number
  actualSteps: number
}

export interface PersonalBest {
  exerciseId: string
  bestWeight: number
  bestReps: number
  achievedAt: number
  flagged: boolean
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

export type RoutineGoal = 'Hypertrophy' | 'Power'
export type RoutineDaysPerWeek = 3 | 4 | 5

export interface Routine {
  id: string
  name: string
  goal: RoutineGoal
  daysPerWeek: RoutineDaysPerWeek
  cycleLengthWeeks: number
  createdAt: number
  isActive: 0 | 1
}

export type PurposeChip = 'strength' | 'hypertrophy' | 'fat-loss' | 'endurance' | 'health'

export type HeroTrack = 'power' | 'hypertrophy'

export type V11Gender = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say'

export interface V11PhysiologicalBaselines {
  ageYears: number | null
  bodyWeightKg: number | null
  gender: V11Gender | null
}

export type V11TrainingExperienceLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced'

export interface V11LogisticalConstraints {
  targetDaysPerWeek: 3 | 4 | 5 | null
  hardSessionLimitMinutes: number | null
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
  structuralAversion: string
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
  daysPerWeek: number
  userName?: string
  northStar?: string
  purposeChip?: PurposeChip
  qosMinutes?: number
  v11PromptContract?: V11AppSettingsSchema
  activeFallbackPool?: ActiveFallbackPool
  lifetimeHeroLevel?: number
  completedAscensions?: number
  activeTrack?: HeroTrack
  macrocycleClosedAt?: number
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
  supersetGroupId?: string
}

export interface IWorkoutAction {
  readonly type: 'single' | 'superset'
  readonly exercises: readonly TempSessionExercise[]
  readonly supersetGroupId?: string
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
  routines!: Dexie.Table<Routine, string>

  constructor() {
    super('IronProtocolDB')

    this.version(1).stores({
      exercises: 'id, name, muscleGroup',
      workouts:  'id, date',
      sets:      'id, workoutId, exerciseId, orderIndex',
    })

    this.version(2).stores({
      exercises: 'id, name, muscleGroup, tier, *tags',
      workouts:  'id, date',
      sets:      'id, workoutId, exerciseId, orderIndex',
    })

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

    this.version(6).stores({
      exercises: 'id, name, muscleGroup, tier, *tags',
      workouts:  'id, date, routineType, sessionIndex',
      sets:      'id, workoutId, exerciseId, orderIndex',
      settings:  'id, preferredRoutineType',
      tempSessions: 'id, updatedAt',
    })

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

    this.version(8).stores({
      exercises:    'id, name, muscleGroup, tier, *tags',
      workouts:     'id, date, routineType, sessionIndex',
      sets:         'id, workoutId, exerciseId, orderIndex',
      settings:     'id, preferredRoutineType',
      tempSessions: 'id, updatedAt',
      baselines:    'exerciseName',
    })

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
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            if (typeof settings.daysPerWeek !== 'number') {
              settings.daysPerWeek = 3
            }
          })

        await tx
          .table('exercises')
          .toCollection()
          .modify((exercise: Partial<{ name: string; tier: number }>) => {
            if (exercise.name?.toLowerCase() === 'romanian deadlift' && exercise.tier === 1) {
              exercise.tier = 2
            }
          })
      })

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

    this.version(15)
      .stores({
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
      .upgrade(async (tx) => {
        await tx
          .table('settings')
          .toCollection()
          .modify((settings: Partial<AppSettings>) => {
            if (typeof settings.lifetimeHeroLevel !== 'number') {
              settings.lifetimeHeroLevel = 0
            }
            if (typeof settings.completedAscensions !== 'number') {
              settings.completedAscensions = 0
            }
            if (settings.activeTrack !== 'power' && settings.activeTrack !== 'hypertrophy') {
              settings.activeTrack = 'power'
            }
          })
      })

    this.version(16).stores({
      exercises:     'id, name, muscleGroup, tier, *tags',
      workouts:      'id, date, routineType, sessionIndex',
      sets:          'id, workoutId, exerciseId, orderIndex',
      settings:      'id, preferredRoutineType',
      tempSessions:  'id, updatedAt',
      baselines:     'exerciseName',
      dailyTargets:  'date',
      personalBests: 'exerciseId',
      recoveryLogs:  'id, workoutId, loggedAt',
      routines:      'id, name, goal, isActive, createdAt',
    })

    this.on('populate', (tx) => {
      void tx.table('settings').add({
        id: APP_SETTINGS_ID,
        hasCompletedOnboarding: false,
        preferredRoutineType: 'PPL',
        daysPerWeek: 3,
        v11PromptContract: createDefaultV11PromptContract(),
        activeFallbackPool: {},
        lifetimeHeroLevel: 0,
        completedAscensions: 0,
        activeTrack: 'power',
      } satisfies AppSettings)
    })
  }
}
