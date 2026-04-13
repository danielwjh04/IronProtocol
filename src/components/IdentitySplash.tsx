import { motion, type Variants } from 'framer-motion'
import { type CSSProperties, useMemo, useState } from 'react'
import { generateWorkoutBlueprint } from '../services/aiPlannerService'
import { persistMacrocycle } from '../services/macrocyclePersistence'
import {
  APP_SETTINGS_ID,
  type IronProtocolDB,
  type PurposeChip,
  type V11AppSettingsSchema,
  type V11EquipmentAvailability,
  type V11Gender,
  type V11PrimaryGoalFocus,
  type V11TrainingExperienceLevel,
} from '../db/schema'
import ThinkingTerminal from './ThinkingTerminal'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY
const TOTAL_STEPS = 6

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5
type SpecificLiftName = V11AppSettingsSchema['primaryGoals']['specificLiftTargets'][number]['liftName']

const STEP_LABELS = [
  'Identity',
  'Baselines',
  'Experience',
  'Equipment',
  'Goals',
  'Injuries',
] as const

const FORM_STAGGER: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: POST_TITLE_DELAY + 0.24,
      staggerChildren: 0.08,
    },
  },
}

const FORM_SECTION: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

const GENDER_OPTIONS: { value: V11Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
]

const EXPERIENCE_OPTIONS: { value: V11TrainingExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'novice', label: 'Novice' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const EQUIPMENT_OPTIONS: { value: V11EquipmentAvailability; label: string }[] = [
  { value: 'commercial-gym', label: 'Commercial Gym' },
  { value: 'home-gym', label: 'Home Gym' },
  { value: 'dumbbells-only', label: 'Dumbbells Only' },
  { value: 'bodyweight-only', label: 'Bodyweight Only' },
]

const PRIMARY_GOAL_OPTIONS: { value: V11PrimaryGoalFocus; label: string }[] = [
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'specific-lift-target', label: 'Specific Lift Target' },
]

const SPECIFIC_LIFT_OPTIONS: { value: SpecificLiftName; label: string }[] = [
  { value: 'back-squat', label: 'Back Squat' },
  { value: 'bench-press', label: 'Bench Press' },
  { value: 'deadlift', label: 'Deadlift' },
  { value: 'overhead-press', label: 'Overhead Press' },
  { value: 'custom', label: 'Custom Lift' },
]

function parsePositiveInteger(input: string): number | null {
  const value = Number.parseInt(input, 10)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

function parsePositiveNumber(input: string): number | null {
  const value = Number.parseFloat(input)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

function mapPrimaryFocusToPurposeChip(primaryFocus: V11PrimaryGoalFocus): PurposeChip {
  if (primaryFocus === 'specific-lift-target') {
    return 'strength'
  }
  return primaryFocus
}

function resolveSubmitErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }

  return 'Failed to generate your blueprint. Please retry.'
}

export default function IdentitySplash({ db }: Props) {
  const [step, setStep] = useState<StepIndex>(0)
  const [name, setName] = useState('')
  const [northStar, setNorthStar] = useState('')
  const [ageYearsInput, setAgeYearsInput] = useState('')
  const [bodyWeightKgInput, setBodyWeightKgInput] = useState('')
  const [gender, setGender] = useState<V11Gender | null>(null)
  const [trainingExperienceLevel, setTrainingExperienceLevel] = useState<V11TrainingExperienceLevel | null>(null)
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<3 | 4 | 5 | null>(null)
  const [hardSessionLimitMinutes, setHardSessionLimitMinutes] = useState<number | null>(null)
  const [equipmentAvailability, setEquipmentAvailability] = useState<V11EquipmentAvailability | null>(null)
  const [primaryFocus, setPrimaryFocus] = useState<V11PrimaryGoalFocus | null>(null)
  const [specificLiftName, setSpecificLiftName] = useState<SpecificLiftName | null>(null)
  const [specificLiftTargetWeightInput, setSpecificLiftTargetWeightInput] = useState('')
  const [specificLiftTargetRepsInput, setSpecificLiftTargetRepsInput] = useState('')
  const [specificLiftNotes, setSpecificLiftNotes] = useState('')
  const [hasActiveConstraints, setHasActiveConstraints] = useState<boolean | null>(null)
  const [constraintInputs, setConstraintInputs] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)
  const [showThinkingTerminal, setShowThinkingTerminal] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ageYears = useMemo(() => parsePositiveInteger(ageYearsInput), [ageYearsInput])
  const bodyWeightKg = useMemo(() => parsePositiveNumber(bodyWeightKgInput), [bodyWeightKgInput])
  const specificLiftTargetWeightKg = useMemo(
    () => parsePositiveNumber(specificLiftTargetWeightInput),
    [specificLiftTargetWeightInput],
  )
  const specificLiftTargetReps = useMemo(
    () => parsePositiveInteger(specificLiftTargetRepsInput),
    [specificLiftTargetRepsInput],
  )
  const normalizedConstraints = useMemo(
    () => constraintInputs.map((constraint) => constraint.trim()).filter((constraint) => constraint.length > 0),
    [constraintInputs],
  )

  const sliderProgress = (((hardSessionLimitMinutes ?? 45) - 15) / (120 - 15)) * 100

  const currentStepError = useMemo(() => {
    if (step === 0) {
      return name.trim().length > 0
        ? null
        : 'Enter athlete name to continue.'
    }

    if (step === 1) {
      return ageYears !== null && bodyWeightKg !== null && gender !== null
        ? null
        : 'Complete age, body weight, and gender.'
    }

    if (step === 2) {
      return trainingExperienceLevel !== null
        && targetDaysPerWeek !== null
        && hardSessionLimitMinutes !== null
        ? null
        : 'Select experience, training days, and session time cap.'
    }

    if (step === 3) {
      return equipmentAvailability !== null
        ? null
        : 'Select available equipment.'
    }

    if (step === 4) {
      if (primaryFocus === null) {
        return 'Select a primary goal focus.'
      }

      if (primaryFocus !== 'specific-lift-target') {
        return null
      }

      if (specificLiftName === null) {
        return 'Select a target lift.'
      }

      return specificLiftTargetWeightKg !== null || specificLiftTargetReps !== null
        ? null
        : 'Enter target weight and/or target reps.'
    }

    if (step === 5) {
      if (hasActiveConstraints === null) {
        return 'Specify whether injury constraints are active.'
      }

      if (!hasActiveConstraints) {
        return null
      }

      return normalizedConstraints.length > 0
        ? null
        : 'Add at least one injury constraint.'
    }

    return 'Invalid step.'
  }, [
    ageYears,
    bodyWeightKg,
    constraintInputs,
    equipmentAvailability,
    gender,
    hardSessionLimitMinutes,
    hasActiveConstraints,
    name,
    normalizedConstraints.length,
    primaryFocus,
    specificLiftName,
    specificLiftTargetReps,
    specificLiftTargetWeightKg,
    step,
    targetDaysPerWeek,
    trainingExperienceLevel,
  ])

  const isCurrentStepValid = currentStepError === null
  const isLastStep = step === TOTAL_STEPS - 1

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!isLastStep || !isCurrentStepValid || submitting) {
      return
    }

    if (
      ageYears === null
      || bodyWeightKg === null
      || gender === null
      || trainingExperienceLevel === null
      || targetDaysPerWeek === null
      || hardSessionLimitMinutes === null
      || equipmentAvailability === null
      || primaryFocus === null
      || hasActiveConstraints === null
    ) {
      return
    }

    const specificLiftTargets = primaryFocus === 'specific-lift-target'
      ? [{
        liftName: specificLiftName ?? 'custom',
        ...(specificLiftTargetWeightKg !== null ? { targetWeightKg: specificLiftTargetWeightKg } : {}),
        ...(specificLiftTargetReps !== null ? { targetReps: specificLiftTargetReps } : {}),
        ...(specificLiftNotes.trim().length > 0 ? { notes: specificLiftNotes.trim() } : {}),
      }]
      : []

    const v11PromptContract: V11AppSettingsSchema = {
      physiologicalBaselines: {
        ageYears,
        bodyWeightKg,
        gender,
      },
      trainingExperienceLevel,
      logisticalConstraints: {
        targetDaysPerWeek,
        hardSessionLimitMinutes,
      },
      equipmentAvailability,
      primaryGoals: {
        primaryFocus,
        specificLiftTargets,
      },
      injuryConstraints: {
        hasActiveConstraints,
        constraints: hasActiveConstraints
          ? normalizedConstraints.map((constraint) => ({ structuralAversion: constraint }))
          : [],
      },
    }

    if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
      window.navigator.vibrate(100)
    }

    setSubmitting(true)
    setSubmitError(null)
    setShowThinkingTerminal(true)
    try {
      const existing = await db.settings.get(APP_SETTINGS_ID)
      await db.settings.put({
        ...(existing ?? {
          id: APP_SETTINGS_ID,
          hasCompletedOnboarding: false,
          preferredRoutineType: 'PPL',
          daysPerWeek: 3,
        }),
        id: APP_SETTINGS_ID,
        daysPerWeek: targetDaysPerWeek,
        userName: name.trim(),
        northStar: northStar.trim(),
        purposeChip: mapPrimaryFocusToPurposeChip(primaryFocus),
        qosMinutes: hardSessionLimitMinutes,
        v11PromptContract,
        hasCompletedOnboarding: false,
      })

      const generatedMacrocycle = await generateWorkoutBlueprint(v11PromptContract)
      await persistMacrocycle(generatedMacrocycle, db)

      const updates = await db.settings.update(APP_SETTINGS_ID, {
        hasCompletedOnboarding: true,
      })

      if (updates === 0) {
        const latest = await db.settings.get(APP_SETTINGS_ID)
        await db.settings.put({
          ...(latest ?? {
            id: APP_SETTINGS_ID,
            preferredRoutineType: 'PPL',
            daysPerWeek: targetDaysPerWeek,
          }),
          id: APP_SETTINGS_ID,
          hasCompletedOnboarding: true,
        })
      }
    } catch (unknownError) {
      setSubmitError(resolveSubmitErrorMessage(unknownError))
      console.error('Blueprint generation failed:', unknownError)
    } finally {
      setShowThinkingTerminal(false)
      setSubmitting(false)
    }
  }

  function goToPreviousStep(): void {
    setStep((currentStep) => Math.max(0, currentStep - 1) as StepIndex)
  }

  function goToNextStep(): void {
    if (!isCurrentStepValid || isLastStep) {
      return
    }
    setStep((currentStep) => Math.min(TOTAL_STEPS - 1, currentStep + 1) as StepIndex)
  }

  function updateConstraint(index: number, value: string): void {
    setConstraintInputs((current) => current.map((entry, entryIndex) => (entryIndex === index ? value : entry)))
  }

  function addConstraintField(): void {
    setConstraintInputs((current) => [...current, ''])
  }

  function removeConstraintField(index: number): void {
    setConstraintInputs((current) => {
      if (current.length === 1) {
        return ['']
      }
      return current.filter((_, entryIndex) => entryIndex !== index)
    })
  }

  if (showThinkingTerminal) {
    return (
      <ThinkingTerminal
        mode="onboarding"
        onComplete={() => {}}
      />
    )
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center bg-navy px-6 pb-12 pt-10">

      {/* ── TextReveal: IRONPROTOCOL ──────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-[1px]" aria-label={TITLE}>
        {CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * CHAR_DELAY, duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
            className="text-4xl font-black tracking-tight text-white"
          >
            {char}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.1, duration: 0.4 }}
        className="mt-6 text-center text-sm leading-relaxed text-electric/60"
      >
        Zero-friction progressive overload.
        <br />
        Identify yourself to initialize the engine.
      </motion.p>

      {submitError && (
        <p
          role="alert"
          className="mt-4 w-full rounded-2xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm font-semibold text-red-300"
        >
          {submitError}
        </p>
      )}

      {/* ── Identity Form ─────────────────────────────────────────────────── */}
      <motion.form
        variants={FORM_STAGGER}
        initial="hidden"
        animate="visible"
        onSubmit={(e) => { void handleSubmit(e) }}
        className="mt-6 flex w-full flex-col"
      >
        <motion.section
          variants={FORM_SECTION}
          className="flex flex-col gap-5 rounded-3xl border border-electric/20 bg-navy-card p-5"
        >
          <motion.div variants={FORM_SECTION} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                {STEP_LABELS[step]}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-electric transition-all duration-200"
                style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col gap-5"
          >
              {step === 0 && (
                <>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Athlete Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      maxLength={32}
                      autoFocus
                      className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      North Star
                    </span>
                    <textarea
                      value={northStar}
                      onChange={(e) => setNorthStar(e.target.value)}
                      placeholder="Train to..."
                      maxLength={140}
                      rows={2}
                      className="w-full resize-none rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                    />
                  </label>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                        Age
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={ageYearsInput}
                        onChange={(e) => setAgeYearsInput(e.target.value)}
                        placeholder="Years"
                        className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                        Body Weight
                      </span>
                      <input
                        type="number"
                        min={1}
                        step={0.1}
                        value={bodyWeightKgInput}
                        onChange={(e) => setBodyWeightKgInput(e.target.value)}
                        placeholder="kg"
                        className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Gender
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDER_OPTIONS.map((option) => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={option.value}
                          type="button"
                          onClick={() => setGender(option.value)}
                          className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-black transition-all ${
                            gender === option.value
                              ? 'border-electric bg-electric/15 text-electric'
                              : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                          }`}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Training Experience
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {EXPERIENCE_OPTIONS.map((option) => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={option.value}
                          type="button"
                          onClick={() => setTrainingExperienceLevel(option.value)}
                          className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-black transition-all ${
                            trainingExperienceLevel === option.value
                              ? 'border-electric bg-electric/15 text-electric'
                              : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                          }`}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Training Days Per Week
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {([3, 4, 5] as const).map((days) => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={days}
                          type="button"
                          onClick={() => setTargetDaysPerWeek(days)}
                          className={`cursor-pointer rounded-2xl border py-3 text-sm font-black transition-all ${
                            targetDaysPerWeek === days
                              ? 'border-electric bg-electric/15 text-electric'
                              : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                          }`}
                        >
                          {days}x
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                        Session Time Cap
                      </span>
                      <span className="text-sm font-black text-electric">
                        {hardSessionLimitMinutes === null ? 'Set value' : `${hardSessionLimitMinutes} min`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={120}
                      step={5}
                      value={hardSessionLimitMinutes ?? 45}
                      onChange={(e) => setHardSessionLimitMinutes(Number(e.target.value))}
                      className="qos-slider w-full cursor-pointer appearance-none"
                      style={{ '--slider-progress': `${sliderProgress}%` } as CSSProperties}
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
                      <span>15 min</span>
                      <span>120 min</span>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                    Equipment Availability
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={option.value}
                        type="button"
                        onClick={() => setEquipmentAvailability(option.value)}
                        className={`cursor-pointer rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all ${
                          equipmentAvailability === option.value
                            ? 'border-electric bg-electric/15 text-electric'
                            : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Primary Goal Focus
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRIMARY_GOAL_OPTIONS.map((option) => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPrimaryFocus(option.value)
                            if (option.value !== 'specific-lift-target') {
                              setSpecificLiftName(null)
                              setSpecificLiftTargetWeightInput('')
                              setSpecificLiftTargetRepsInput('')
                              setSpecificLiftNotes('')
                            }
                          }}
                          className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm font-black transition-all ${
                            primaryFocus === option.value
                              ? 'border-electric bg-electric/15 text-electric'
                              : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                          }`}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {primaryFocus === 'specific-lift-target' && (
                    <div className="rounded-2xl border border-electric/20 bg-navy p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                            Lift
                          </span>
                          <select
                            value={specificLiftName ?? ''}
                            onChange={(e) => setSpecificLiftName((e.target.value || null) as SpecificLiftName | null)}
                            className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 transition-colors focus:border-electric focus:outline-none"
                          >
                            <option value="">Select lift</option>
                            {SPECIFIC_LIFT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                              Target Weight
                            </span>
                            <input
                              type="number"
                              min={1}
                              step={0.5}
                              value={specificLiftTargetWeightInput}
                              onChange={(e) => setSpecificLiftTargetWeightInput(e.target.value)}
                              placeholder="kg"
                              className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                              Target Reps
                            </span>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={specificLiftTargetRepsInput}
                              onChange={(e) => setSpecificLiftTargetRepsInput(e.target.value)}
                              placeholder="reps"
                              className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                            />
                          </label>
                        </div>

                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                            Notes (Optional)
                          </span>
                          <textarea
                            value={specificLiftNotes}
                            onChange={(e) => setSpecificLiftNotes(e.target.value)}
                            placeholder="Competition timeline, standards, or milestones"
                            rows={2}
                            className="w-full resize-none rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 5 && (
                <>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                      Active Injury Constraints
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setHasActiveConstraints(true)
                          if (constraintInputs.length === 0) {
                            setConstraintInputs([''])
                          }
                        }}
                        className={`cursor-pointer rounded-2xl border py-3 text-sm font-black transition-all ${
                          hasActiveConstraints === true
                            ? 'border-electric bg-electric/15 text-electric'
                            : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                        }`}
                      >
                        Yes
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setHasActiveConstraints(false)}
                        className={`cursor-pointer rounded-2xl border py-3 text-sm font-black transition-all ${
                          hasActiveConstraints === false
                            ? 'border-electric bg-electric/15 text-electric'
                            : 'border-electric/20 bg-navy text-zinc-400 hover:border-electric/40'
                        }`}
                      >
                        No
                      </motion.button>
                    </div>
                  </div>

                  {hasActiveConstraints && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-electric/20 bg-navy p-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                        Constraint List
                      </span>

                      {constraintInputs.map((constraint, index) => (
                        <div key={`constraint-${index}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={constraint}
                            onChange={(e) => updateConstraint(index, e.target.value)}
                            placeholder="Constraint (e.g., No spinal loading)"
                            className="w-full rounded-2xl border border-electric/20 bg-navy px-4 py-3 text-base font-bold text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-electric focus:outline-none"
                          />

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => removeConstraintField(index)}
                            className="cursor-pointer rounded-2xl border border-electric/20 px-3 py-3 text-sm font-black text-zinc-300 transition-all hover:border-electric/40 hover:text-zinc-100"
                            aria-label={`Remove constraint ${index + 1}`}
                          >
                            Remove
                          </motion.button>
                        </div>
                      ))}

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={addConstraintField}
                        className="cursor-pointer rounded-2xl border border-electric/20 bg-transparent px-4 py-3 text-sm font-black uppercase tracking-[0.1em] text-zinc-300 transition-all hover:border-electric/40 hover:bg-electric/5 hover:text-zinc-100"
                      >
                        Add Constraint
                      </motion.button>
                    </div>
                  )}
                </>
              )}
          </motion.div>

          <p className="rounded-2xl border border-electric/15 bg-navy/70 px-3 py-2 text-xs font-semibold text-zinc-300">
            {currentStepError ?? 'All required fields complete for this step.'}
          </p>

          <div className="flex items-center gap-3">
            <motion.button
              variants={FORM_SECTION}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={goToPreviousStep}
              disabled={step === 0 || submitting}
              className="h-12 flex-1 cursor-pointer rounded-3xl border border-electric/20 bg-transparent px-4 text-sm font-black uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:border-electric/40 hover:bg-electric/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:border-electric/10 disabled:text-zinc-600"
            >
              Back
            </motion.button>

            {!isLastStep && (
              <motion.button
                variants={FORM_SECTION}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={goToNextStep}
                disabled={!isCurrentStepValid || submitting}
                className="h-12 flex-[1.4] cursor-pointer rounded-3xl bg-electric px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-electric/90 active:bg-electric/80 disabled:cursor-not-allowed disabled:bg-electric/30 disabled:text-zinc-500 disabled:shadow-none"
              >
                Next
              </motion.button>
            )}

            {isLastStep && (
              <motion.button
                variants={FORM_SECTION}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!isCurrentStepValid || submitting}
                className="h-12 flex-[1.4] cursor-pointer rounded-3xl bg-electric px-6 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-electric/90 active:bg-electric/80 disabled:cursor-not-allowed disabled:bg-electric/30 disabled:text-zinc-500 disabled:shadow-none"
              >
                {submitting ? 'Initializing…' : 'Initialize Protocol'}
              </motion.button>
            )}
          </div>
        </motion.section>

      </motion.form>
    </main>
  )
}
