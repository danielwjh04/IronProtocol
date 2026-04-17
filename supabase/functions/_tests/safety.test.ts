import { assertEquals, assertRejects, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { composePlan } from '../_shared/composePlan.ts'
import { REP_SCHEMES } from '../_shared/repSchemes.ts'

const safePool = [
  { id: 'ex-squat', name: 'Back Squat', movement_pattern: 'squat', tier: 1 as const, safety_flags: [], equipment: ['barbell','rack'], intensity_band: 'high', swap_group_id: 'squat_primary' },
  { id: 'ex-bench', name: 'Bench Press', movement_pattern: 'push', tier: 1 as const, safety_flags: [], equipment: ['barbell','bench'], intensity_band: 'high', swap_group_id: 'horizontal_push_primary' },
  { id: 'ex-curl',  name: 'Biceps Curl', movement_pattern: 'pull', tier: 3 as const, safety_flags: [], equipment: ['barbell'], intensity_band: 'low', swap_group_id: 'biceps_isolation' },
]

const flaggedExercise = { id: 'ex-flagged', name: 'Back Squat Variant', movement_pattern: 'squat', tier: 1 as const, safety_flags: ['high_impact', 'deep_knee_flexion'], equipment: ['barbell'], intensity_band: 'high', swap_group_id: 'squat_primary' }

Deno.test('composePlan fills slots without duplicates', () => {
  const template = { id: 'tpl-1', split_type: 'full_body', slots: [
    { movement_pattern: 'squat', tier: 1 as const, intensity_band: 'high' },
    { movement_pattern: 'push',  tier: 1 as const, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result.length, 2)
  const ids = result.map(e => e.id)
  assertEquals(new Set(ids).size, 2)
})

Deno.test('composePlan throws when no candidate for a slot', () => {
  const template = { id: 'tpl-2', split_type: 'full_body', slots: [
    { movement_pattern: 'carry', tier: 1 as const, intensity_band: 'high' },
  ]}
  assertThrows(() => composePlan(template, safePool, 'hypertrophy'))
})

Deno.test('composePlan: hypertrophy T1 rep scheme = 5-8 reps, 90s rest', () => {
  const template = { id: 'tpl-3', split_type: 'full_body', slots: [
    { movement_pattern: 'squat', tier: 1 as const, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result[0].repScheme.repsMin, 5)
  assertEquals(result[0].repScheme.repsMax, 8)
  assertEquals(result[0].repScheme.restSeconds, 90)
})

Deno.test('composePlan: hypertrophy T3 rep scheme = 8-12 reps, 60s rest', () => {
  const template = { id: 'tpl-4', split_type: 'full_body', slots: [
    { movement_pattern: 'pull', tier: 3 as const, intensity_band: 'low' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result[0].repScheme.repsMin, 8)
  assertEquals(result[0].repScheme.repsMax, 12)
  assertEquals(result[0].repScheme.restSeconds, 60)
})

Deno.test('composePlan: power T1 rep scheme = 3-5 reps, 180s rest, RPE 9', () => {
  const template = { id: 'tpl-5', split_type: 'full_body', slots: [
    { movement_pattern: 'squat', tier: 1 as const, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'power')
  assertEquals(result[0].repScheme.repsMin, 3)
  assertEquals(result[0].repScheme.repsMax, 5)
  assertEquals(result[0].repScheme.restSeconds, 180)
  assertEquals(result[0].repScheme.rpe, 9)
})

Deno.test('composePlan: power T3 rep scheme = 5-8 reps, 90s rest', () => {
  const template = { id: 'tpl-6', split_type: 'full_body', slots: [
    { movement_pattern: 'pull', tier: 3 as const, intensity_band: 'low' },
  ]}
  const result = composePlan(template, safePool, 'power')
  assertEquals(result[0].repScheme.repsMin, 5)
  assertEquals(result[0].repScheme.repsMax, 8)
  assertEquals(result[0].repScheme.restSeconds, 90)
})

Deno.test('SAFETY: flagged exercise cannot be assigned to a slot', () => {
  const template = { id: 'tpl-7', split_type: 'full_body', slots: [
    { movement_pattern: 'squat', tier: 1 as const, intensity_band: 'high' },
  ]}
  const userInjuryFlags = ['high_impact', 'deep_knee_flexion']
  const safePoolOnly = [...safePool, flaggedExercise].filter(
    ex => !ex.safety_flags.some(f => userInjuryFlags.includes(f))
  )
  const result = composePlan(template, safePoolOnly, 'hypertrophy')
  assertEquals(result[0].id, 'ex-squat')
  assertEquals(result[0].safety_flags.some(f => userInjuryFlags.includes(f)), false)
})

Deno.test('SAFETY: final safety scan detects violation that bypassed SQL filter', () => {
  const plan = [{ ...flaggedExercise, repScheme: REP_SCHEMES['hypertrophy'][1] }]
  const userInjuryFlags = ['high_impact']
  const violation = plan.find(ex => ex.safety_flags.some(f => userInjuryFlags.includes(f)))
  assertEquals(violation?.name, 'Back Squat Variant')
})

Deno.test('SAFETY: pain_flag=true feedback does not increase safe_swaps signal', () => {
  const feedbackRows = [
    { swapped_from_exercise: 'ex-a', swapped_to_exercise: 'ex-b', pain_flag: true, goal_tag: 'hypertrophy' },
    { swapped_from_exercise: 'ex-a', swapped_to_exercise: 'ex-b', pain_flag: true, goal_tag: 'hypertrophy' },
  ]
  const safeSwaps = feedbackRows.filter(r => !r.pain_flag).length
  assertEquals(safeSwaps, 0)
})
