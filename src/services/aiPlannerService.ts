import type {
  V11AppSettingsSchema,
  V11SpecificLiftTarget,
} from '../db/schema'
import { z } from 'zod'

export interface AIPlannedExercise {
  plannedExerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
}

export interface AIPlannedDay {
  dayNumber: number
  dayLabel: string
  plannedExercises: AIPlannedExercise[]
}

export interface AIPlannedWeek {
  weekNumber: number
  days: AIPlannedDay[]
}

export interface AIMacrocycleBlueprint {
  durationWeeks: 12
  weeks: AIPlannedWeek[]
}

export interface AIFallbackExercise {
  exerciseName: string
  reason: string
}

export type AIFallbackPool = Record<string, AIFallbackExercise[]>

export interface AIGeneratedMacrocycle {
  blueprint: AIMacrocycleBlueprint
  fallbackPool: AIFallbackPool
}

export type AIExerciseTier = 'T1' | 'T2' | 'T3'

export interface AIExerciseSelection {
  workoutTitle: string
  primaryExercise: string
  muscleGroup: string
  tier: AIExerciseTier
  fallbacks: string[]
}

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_TIMEOUT_MS = 90000
const GEMINI_MAX_OUTPUT_TOKENS = 8192
const MACROCYCLE_WEEKS = 12
const DEFAULT_DAYS_PER_WEEK = 3
const AI_PRIMARY_EXERCISES_PER_DAY = 5
const MIN_EXERCISES_PER_DAY = 8
const EXACT_FALLBACKS_PER_PRIMARY = 3

const AI_EXERCISE_SELECTION_INTERFACE = [
  'interface AIExerciseSelection {',
  '  workoutTitle: string',
  '  primaryExercise: string',
  '  muscleGroup: string',
  "  tier: 'T1' | 'T2' | 'T3'",
  '  fallbacks: string[]',
  '}',
  '',
  'type AIExerciseSelectionResponse = AIExerciseSelection[]',
].join('\n')

const aiExerciseSelectionSchema = z.object({
  workoutTitle: z.string().min(1),
  primaryExercise: z.string().min(1),
  muscleGroup: z.string().min(1),
  tier: z.enum(['T1', 'T2', 'T3']),
  fallbacks: z.array(z.string().min(1)).length(EXACT_FALLBACKS_PER_PRIMARY),
})

function createExerciseSelectionResponseSchema(expectedPrimaryCount: number) {
  return z.array(aiExerciseSelectionSchema).length(expectedPrimaryCount)
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
  }>
  error?: {
    message?: string
  }
}

interface PlannerFailureContext {
  stage: string
  model?: string
  endpoint?: string
  status?: number
  providerError?: string
  finishReason?: string
  details?: unknown
  payload?: unknown
  error?: unknown
}

function logPlannerFailure(context: PlannerFailureContext): void {
  console.error('[aiPlannerService] generateWorkoutBlueprint failure', context)
}

function messageFromUnknownError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }

  return fallback
}

const EXERCISE_NAME_ALIASES: Record<string, string> = {
  'close-grip bench press': 'Close Grip Bench Press',
  'close-grip dumbbell press': 'Dumbbell Bench Press',
  'pull-up': 'Pull Up',
  'chin-up': 'Chin Up',
  'one-arm dumbbell row': 'Dumbbell Row',
  'one-arm row': 'Dumbbell Row',
  'chest supported row': 'Seated Cable Row',
  'seated row': 'Seated Cable Row',
  'cable lateral raise': 'Lateral Raise',
  'dumbbell lateral raise': 'Lateral Raise',
  'triceps pressdown': 'Triceps Pushdown',
  'leg curl': 'Seated Leg Curl',
  'hamstring curl': 'Seated Leg Curl',
  'incline dumbbell press': 'Dumbbell Incline Press',
  'machine shoulder press': 'Dumbbell Shoulder Press',
  'barbell lunge': 'Walking Lunges',
  'walking lunge': 'Walking Lunges',
  'dumbbell lunge': 'Walking Lunges',
  'split squat': 'Bulgarian Split Squat',
  'dumbbell split squat': 'Bulgarian Split Squat',
  'dumbbell step-up': 'Walking Lunges',
  'rear delt raise': 'Rear Delt Fly',
  'reverse fly': 'Rear Delt Fly',
  'dumbbell curl': 'Biceps Curl',
  'cable curl': 'Biceps Curl',
  'floor press': 'Dumbbell Bench Press',
  skullcrusher: 'Skullcrushers',
  'dumbbell front squat': 'Front Squat',
  'goblet squat': 'Front Squat',
}

const TIER_DEFAULT_TARGETS: Record<AIExerciseTier, { targetSets: number; targetReps: number }> = {
  T1: { targetSets: 5, targetReps: 5 },
  T2: { targetSets: 4, targetReps: 8 },
  T3: { targetSets: 3, targetReps: 12 },
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function canonicalizeExerciseName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, ' ')
  return EXERCISE_NAME_ALIASES[normalizeExerciseName(collapsed)] ?? collapsed
}

function formatValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value)
}

function formatSpecificLiftTarget(target: V11SpecificLiftTarget): string {
  const parts: string[] = [`lift=${target.liftName}`]

  if (typeof target.targetWeightKg === 'number') {
    parts.push(`targetWeightKg=${target.targetWeightKg}`)
  }

  if (typeof target.targetReps === 'number') {
    parts.push(`targetReps=${target.targetReps}`)
  }

  if (target.notes && target.notes.trim().length > 0) {
    parts.push(`notes=${target.notes.trim()}`)
  }

  return parts.join(', ')
}

function extractJsonBlock(content: string): string {
  const trimmed = content.trim()

  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }

  return trimmed
}

function parseExerciseSelections(content: string, expectedPrimaryCount: number): AIExerciseSelection[] {
  const jsonBlock = extractJsonBlock(content)

  let decoded: unknown
  try {
    decoded = JSON.parse(jsonBlock)
  } catch (error) {
    logPlannerFailure({
      stage: 'parse-selection-json-block',
      error,
      details: { jsonSnippet: jsonBlock.slice(0, 300) },
    })
    throw new Error('Gemini returned invalid JSON for AIExerciseSelection response.')
  }

  const parsed = createExerciseSelectionResponseSchema(expectedPrimaryCount).safeParse(decoded)
  if (!parsed.success) {
    logPlannerFailure({
      stage: 'validate-selection-schema',
      details: parsed.error.flatten(),
    })
    throw new Error('Gemini returned JSON that does not match AIExerciseSelection response schema.')
  }

  return parsed.data.map((selection) => {
    const primaryExercise = canonicalizeExerciseName(selection.primaryExercise)
    const fallbacks = selection.fallbacks.map((fallback) => canonicalizeExerciseName(fallback.trim()))

    return {
      workoutTitle: selection.workoutTitle.trim(),
      primaryExercise,
      muscleGroup: selection.muscleGroup.trim(),
      tier: selection.tier,
      fallbacks,
    }
  })
}

function resolveTargetDaysPerWeek(settings: V11AppSettingsSchema): number {
  const configuredDays = settings.logisticalConstraints.targetDaysPerWeek
  if (configuredDays === 3 || configuredDays === 4 || configuredDays === 5) {
    return configuredDays
  }

  return DEFAULT_DAYS_PER_WEEK
}

function buildDayBuckets(selections: AIExerciseSelection[], daysPerWeek: number): AIExerciseSelection[][] {
  const buckets: AIExerciseSelection[][] = []

  for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex += 1) {
    const startIndex = dayIndex * AI_PRIMARY_EXERCISES_PER_DAY
    const endIndex = startIndex + AI_PRIMARY_EXERCISES_PER_DAY
    buckets.push(selections.slice(startIndex, endIndex))
  }

  return buckets
}

interface DayExerciseSeed {
  exerciseName: string
  tier: AIExerciseTier
  muscleGroup: string
}

function addUniqueSeed(
  seeds: DayExerciseSeed[],
  seen: Set<string>,
  candidate: DayExerciseSeed,
): void {
  const normalizedName = normalizeExerciseName(candidate.exerciseName)
  if (normalizedName.length === 0 || seen.has(normalizedName)) {
    return
  }

  seen.add(normalizedName)
  seeds.push(candidate)
}

function buildExpandedDaySeeds(
  daySelections: AIExerciseSelection[],
  allSelections: AIExerciseSelection[],
  minimumExercises: number,
): DayExerciseSeed[] {
  const seeds: DayExerciseSeed[] = []
  const seenNames = new Set<string>()

  for (const selection of daySelections) {
    addUniqueSeed(seeds, seenNames, {
      exerciseName: canonicalizeExerciseName(selection.primaryExercise),
      tier: selection.tier,
      muscleGroup: selection.muscleGroup,
    })
  }

  for (const selection of daySelections) {
    for (const fallback of selection.fallbacks) {
      addUniqueSeed(seeds, seenNames, {
        exerciseName: canonicalizeExerciseName(fallback),
        tier: selection.tier,
        muscleGroup: selection.muscleGroup,
      })

      if (seeds.length >= minimumExercises) {
        return seeds
      }
    }
  }

  for (const selection of allSelections) {
    addUniqueSeed(seeds, seenNames, {
      exerciseName: canonicalizeExerciseName(selection.primaryExercise),
      tier: selection.tier,
      muscleGroup: selection.muscleGroup,
    })

    if (seeds.length >= minimumExercises) {
      return seeds
    }
  }

  for (const selection of allSelections) {
    for (const fallback of selection.fallbacks) {
      addUniqueSeed(seeds, seenNames, {
        exerciseName: canonicalizeExerciseName(fallback),
        tier: selection.tier,
        muscleGroup: selection.muscleGroup,
      })

      if (seeds.length >= minimumExercises) {
        return seeds
      }
    }
  }

  return seeds
}

function normalizeSelectionCount(
  selections: AIExerciseSelection[],
  requiredCount: number,
): AIExerciseSelection[] {
  if (selections.length === requiredCount) {
    return selections
  }

  if (selections.length > requiredCount) {
    return selections.slice(0, requiredCount)
  }

  const expanded = [...selections]
  let cursor = 0

  while (expanded.length < requiredCount) {
    expanded.push(selections[cursor % selections.length])
    cursor += 1
  }

  return expanded
}

function buildGlobalFallbackPool(selections: AIExerciseSelection[]): AIFallbackExercise[] {
  const seenNames = new Set<string>()
  const pooledFallbacks: AIFallbackExercise[] = []

  for (const selection of selections) {
    const primaryExercise = canonicalizeExerciseName(selection.primaryExercise)

    for (const fallback of selection.fallbacks) {
      const canonicalFallback = canonicalizeExerciseName(fallback)
      const normalizedFallback = normalizeExerciseName(canonicalFallback)

      if (normalizedFallback.length === 0 || seenNames.has(normalizedFallback)) {
        continue
      }

      seenNames.add(normalizedFallback)
      pooledFallbacks.push({
        exerciseName: canonicalFallback,
        reason: `Fallback for ${primaryExercise}`,
      })
    }
  }

  return pooledFallbacks
}

export function generateLocalMacrocycle(
  selections: AIExerciseSelection[],
  settings: V11AppSettingsSchema,
): AIGeneratedMacrocycle {
  if (selections.length === 0) {
    throw new Error('AIExerciseSelection list is empty. Cannot build local macrocycle.')
  }

  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const requiredSelectionCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const normalizedSelections = normalizeSelectionCount(selections, requiredSelectionCount)
  const globalFallbackPool = buildGlobalFallbackPool(normalizedSelections)
  const dayBuckets = buildDayBuckets(normalizedSelections, daysPerWeek)
  const weeks: AIPlannedWeek[] = []

  for (let weekNumber = 1; weekNumber <= MACROCYCLE_WEEKS; weekNumber += 1) {
    const days: AIPlannedDay[] = []

    for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex += 1) {
      const dayNumber = dayIndex + 1
      const daySelections = dayBuckets[dayIndex]
      const dayExerciseSeeds = buildExpandedDaySeeds(daySelections, normalizedSelections, MIN_EXERCISES_PER_DAY)

      const workoutTitle = daySelections
        .map((selection) => selection.workoutTitle.trim())
        .find((title) => title.length > 0)

      const focusLabel = daySelections
        .map((selection) => selection.muscleGroup.trim())
        .filter((label) => label.length > 0)
        .slice(0, 2)
        .join('/')

      const dayLabel = workoutTitle || (focusLabel.length > 0 ? `Day ${dayNumber} (${focusLabel})` : `Day ${dayNumber}`)

      const plannedExercises = dayExerciseSeeds.map((seed, exerciseIndex) => {
        const targetPrescription = TIER_DEFAULT_TARGETS[seed.tier]
        const plannedExerciseId = `w${weekNumber}d${dayNumber}e${exerciseIndex + 1}`

        return {
          plannedExerciseId,
          exerciseName: seed.exerciseName,
          targetSets: targetPrescription.targetSets,
          targetReps: targetPrescription.targetReps,
        }
      })

      days.push({
        dayNumber,
        dayLabel,
        plannedExercises,
      })
    }

    weeks.push({
      weekNumber,
      days,
    })
  }

  return {
    blueprint: {
      durationWeeks: 12,
      weeks,
    },
    fallbackPool: {
      global: globalFallbackPool,
    },
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutHandle)
  }
}

function extractCandidateText(payload: GeminiGenerateContentResponse): string {
  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text?.trim() ?? '')
    .find((value) => value.length > 0)

  if (!text) {
    const finishReason = payload.candidates?.[0]?.finishReason
    logPlannerFailure({
      stage: 'extract-candidate-text',
      finishReason,
      payload,
    })
    if (finishReason) {
      throw new Error(`Gemini returned no text content (finishReason: ${finishReason}).`)
    }
    throw new Error('Gemini returned no text content in candidates.')
  }

  return text
}

export function buildSystemPrompt(settings: V11AppSettingsSchema): string {
  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const expectedPrimaryCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const specificTargets = settings.primaryGoals.specificLiftTargets.length > 0
    ? settings.primaryGoals.specificLiftTargets.map((target) => `- ${formatSpecificLiftTarget(target)}`).join('\n')
    : '- none'

  const injuryConstraints = settings.injuryConstraints.hasActiveConstraints
    ? settings.injuryConstraints.constraints
      .map((constraint) => constraint.structuralAversion.trim())
      .filter((constraint) => constraint.length > 0)
      .map((constraint) => `- ${constraint}`)
      .join('\n')
    : '- none'

  const settingsJson = JSON.stringify(settings, null, 2)

  return [
    '[ROLE]',
    'You are the IronProtocol Lab AI selector.',
    'Select only the best core exercise list for the user profile; do not create a macrocycle.',
    '',
    '[OUTPUT CONTRACT]',
    'Return strict JSON only as a top-level array. No markdown fences and no extra prose.',
    'The JSON must match this TypeScript contract exactly:',
    AI_EXERCISE_SELECTION_INTERFACE,
    `MUST return exactly ${expectedPrimaryCount} objects (${daysPerWeek} days x ${AI_PRIMARY_EXERCISES_PER_DAY} primary exercises per day).`,
    "Use tier exactly as 'T1', 'T2', or 'T3'.",
    `Each object MUST include exactly ${EXACT_FALLBACKS_PER_PRIMARY} fallback exercise names in fallbacks.`,
    'Each object MUST include workoutTitle.',
    `Order the array in day blocks: first ${AI_PRIMARY_EXERCISES_PER_DAY} objects are Day 1, next ${AI_PRIMARY_EXERCISES_PER_DAY} are Day 2, etc.`,
    `Within each day block, use the same workoutTitle for all ${AI_PRIMARY_EXERCISES_PER_DAY} entries.`,
    'Workout titles must be goal-specific and biomechanically relevant (example patterns: "Explosive Vertical Power", "Hypertrophy Push").',
    'The object count and fallback count are mandatory; do not return more or less.',
    'The local app will expand this baseline for QoS scaling; preserve meaningful movement diversity and focus alignment.',
    '',
    '[SELECTION RULES]',
    'primaryGoals.primaryFocus is the highest-priority optimization signal for biomechanical relevance.',
    'Every primaryExercise must clearly serve primaryGoals.primaryFocus first.',
    'Respect equipment availability and injury constraints strictly.',
    'Prioritize compounds for T1, key accessory patterns for T2, and lower-load/isolations for T3.',
    'Use concise muscleGroup labels like Chest, Back, Legs, Shoulders, Arms, Core, Full Body.',
    '',
    '[ARCHITECTURE CONSTRAINTS]',
    'The app is Hybrid Offline-First.',
    'The local app will build the 12-week schedule from your selected exercises.',
    '',
    '[V11 USER CONSTRAINTS]',
    `physiologicalBaselines.ageYears: ${formatValue(settings.physiologicalBaselines.ageYears)}`,
    `physiologicalBaselines.bodyWeightKg: ${formatValue(settings.physiologicalBaselines.bodyWeightKg)}`,
    `physiologicalBaselines.gender: ${formatValue(settings.physiologicalBaselines.gender)}`,
    `trainingExperienceLevel: ${formatValue(settings.trainingExperienceLevel)}`,
    `logisticalConstraints.targetDaysPerWeek: ${formatValue(settings.logisticalConstraints.targetDaysPerWeek)}`,
    `logisticalConstraints.hardSessionLimitMinutes: ${formatValue(settings.logisticalConstraints.hardSessionLimitMinutes)}`,
    `equipmentAvailability: ${formatValue(settings.equipmentAvailability)}`,
    `primaryGoals.primaryFocus: ${formatValue(settings.primaryGoals.primaryFocus)}`,
    'primaryGoals.specificLiftTargets:',
    specificTargets,
    `injuryConstraints.hasActiveConstraints: ${formatValue(settings.injuryConstraints.hasActiveConstraints)}`,
    'injuryConstraints.constraints:',
    injuryConstraints,
    '',
    '[RAW V11 SETTINGS JSON]',
    settingsJson,
  ].join('\n')
}

export async function generateWorkoutBlueprint(settings: V11AppSettingsSchema): Promise<AIGeneratedMacrocycle> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) {
    logPlannerFailure({
      stage: 'read-api-key',
      details: 'VITE_GEMINI_API_KEY missing or empty',
    })
    throw new Error('Gemini API key missing. Define VITE_GEMINI_API_KEY in .env.local.')
  }

  const model = import.meta.env.VITE_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  const daysPerWeek = resolveTargetDaysPerWeek(settings)
  const expectedPrimaryCount = daysPerWeek * AI_PRIMARY_EXERCISES_PER_DAY
  const systemPrompt = buildSystemPrompt(settings)
  const endpoint = `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  let response: Response
  try {
    response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: systemPrompt }],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    }, GEMINI_TIMEOUT_MS)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logPlannerFailure({
        stage: 'fetch-gemini-selection',
        model,
        endpoint,
        details: { timeoutMs: GEMINI_TIMEOUT_MS },
        error,
      })
      throw new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS}ms.`)
    }

    logPlannerFailure({
      stage: 'fetch-gemini-selection',
      model,
      endpoint,
      error,
    })
    throw new Error('Gemini request failed before receiving a response.')
  }

  let payload: GeminiGenerateContentResponse
  try {
    payload = (await response.json()) as GeminiGenerateContentResponse
  } catch (error) {
    logPlannerFailure({
      stage: 'decode-gemini-selection-payload',
      model,
      endpoint,
      status: response.status,
      details: {
        contentType: response.headers.get('content-type'),
      },
      error,
    })
    throw new Error('Gemini API returned a non-JSON response payload.')
  }

  if (!response.ok) {
    const providerError = payload.error?.message?.trim()
    logPlannerFailure({
      stage: 'gemini-selection-non-ok-response',
      model,
      endpoint,
      status: response.status,
      providerError,
      payload,
    })
    if (providerError) {
      throw new Error(`Gemini API request failed: ${providerError}`)
    }
    throw new Error(`Gemini API request failed with status ${response.status}.`)
  }

  try {
    const rawContent = extractCandidateText(payload)
    const selections = parseExerciseSelections(rawContent, expectedPrimaryCount)
    return generateLocalMacrocycle(selections, settings)
  } catch (error) {
    logPlannerFailure({
      stage: 'parse-gemini-selection-content',
      model,
      endpoint,
      status: response.status,
      finishReason: payload.candidates?.[0]?.finishReason,
      payload,
      error,
    })
    throw new Error(messageFromUnknownError(error, 'Gemini selection parsing failed.'))
  }
}
