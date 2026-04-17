import { describe, expect, it } from 'vitest'
import type { V11AppSettingsSchema } from '../db/schema'
import {
  buildSystemPrompt,
  generateLocalMacrocycle,
  type AIExerciseSelection,
} from '../services/aiPlannerService'

function buildSettings(
  daysPerWeek: 3 | 4 | 5,
  primaryFocus: V11AppSettingsSchema['primaryGoals']['primaryFocus'] = 'strength',
): V11AppSettingsSchema {
  return {
    physiologicalBaselines: {
      ageYears: 30,
      bodyWeightKg: 82,
      gender: 'male',
    },
    trainingExperienceLevel: 'intermediate',
    logisticalConstraints: {
      targetDaysPerWeek: daysPerWeek,
      hardSessionLimitMinutes: 120,
    },
    equipmentAvailability: 'commercial-gym',
    primaryGoals: {
      primaryFocus,
      specificLiftTargets: [],
    },
    injuryConstraints: {
      hasActiveConstraints: false,
      constraints: [],
    },
  }
}

function makeSelection(index: number): AIExerciseSelection {
  const dayBlock = Math.floor(index / 5)
  const workoutTitle = dayBlock === 0
    ? 'Explosive Push Power'
    : dayBlock === 1
      ? 'Posterior Chain Strength'
      : 'Upper Back Hypertrophy'

  return {
    workoutTitle,
    primaryExercise: `Exercise ${index + 1}`,
    muscleGroup: index % 2 === 0 ? 'Chest' : 'Back',
    tier: index % 3 === 0 ? 'T1' : index % 3 === 1 ? 'T2' : 'T3',
    fallbacks: [
      `Fallback ${index + 1}`,
      'Shared Fallback',
      `Reserve ${index + 1}`,
    ],
  }
}

describe('aiPlannerService local builder refinement', () => {
  it('buildSystemPrompt requests dynamic primary count from daysPerWeek', () => {
    const promptForThreeDaySplit = buildSystemPrompt(buildSettings(3))
    const promptForFourDaySplit = buildSystemPrompt(buildSettings(4))

    expect(promptForThreeDaySplit).toContain('MUST return exactly 15 objects (3 days x 5 primary exercises per day).')
    expect(promptForFourDaySplit).toContain('MUST return exactly 20 objects (4 days x 5 primary exercises per day).')
    expect(promptForThreeDaySplit).toContain('primaryGoals.primaryFocus is the highest-priority optimization signal for biomechanical relevance.')
  })

  it('generateLocalMacrocycle expands baseline to 8 exercises/day, carries workout titles, and deduplicates global fallback pool', () => {
    const sparseSelections = Array.from({ length: 8 }, (_, index) => makeSelection(index))
    const macrocycle = generateLocalMacrocycle(sparseSelections, buildSettings(3))

    expect(macrocycle.blueprint.durationWeeks).toBe(12)
    expect(macrocycle.blueprint.weeks).toHaveLength(12)

    for (const week of macrocycle.blueprint.weeks) {
      expect(week.days).toHaveLength(3)
      for (const day of week.days) {
        expect(day.plannedExercises.length).toBeGreaterThanOrEqual(8)
      }
    }

    expect(macrocycle.blueprint.weeks[0]?.days[0]?.dayLabel).toBe('Explosive Push Power')

    const globalFallbacks = macrocycle.fallbackPool.global
    expect(globalFallbacks).toBeDefined()

    const normalizedNames = (globalFallbacks ?? []).map((entry) => entry.exerciseName.trim().toLowerCase())
    expect(new Set(normalizedNames).size).toBe(normalizedNames.length)
    expect(normalizedNames.filter((name) => name === 'shared fallback')).toHaveLength(1)
  })

  it('generateLocalMacrocycle applies goal-specific tier prescriptions from settings.primaryGoals.primaryFocus', () => {
    const selections = Array.from({ length: 15 }, (_, index) => makeSelection(index))
    const strengthMacrocycle = generateLocalMacrocycle(selections, buildSettings(3, 'strength'))
    const hypertrophyMacrocycle = generateLocalMacrocycle(selections, buildSettings(3, 'hypertrophy'))

    const strengthDay = strengthMacrocycle.blueprint.weeks[0]?.days[0]
    const hypertrophyDay = hypertrophyMacrocycle.blueprint.weeks[0]?.days[0]

    const strengthT1 = strengthDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 1')
    const strengthT2 = strengthDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 2')
    const strengthT3 = strengthDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 3')

    const hypertrophyT1 = hypertrophyDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 1')
    const hypertrophyT2 = hypertrophyDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 2')
    const hypertrophyT3 = hypertrophyDay?.plannedExercises.find((exercise) => exercise.exerciseName === 'Exercise 3')

    expect([strengthT1?.targetSets, strengthT1?.targetReps]).toEqual([5, 5])
    expect([strengthT2?.targetSets, strengthT2?.targetReps]).toEqual([4, 8])
    expect([strengthT3?.targetSets, strengthT3?.targetReps]).toEqual([3, 12])

    expect([hypertrophyT1?.targetSets, hypertrophyT1?.targetReps]).toEqual([4, 8])
    expect([hypertrophyT2?.targetSets, hypertrophyT2?.targetReps]).toEqual([4, 12])
    expect([hypertrophyT3?.targetSets, hypertrophyT3?.targetReps]).toEqual([3, 15])
  })
})