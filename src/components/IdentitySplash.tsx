import { motion, type Variants } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  APP_SETTINGS_ID,
  type IronProtocolDB,
  type V11AppSettingsSchema,
  type V11EquipmentAvailability,
} from '../db/schema'
import CalibrateBaselinesCard from './CalibrateBaselinesCard'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY
const TOTAL_STEPS = 3

type StepIndex = 0 | 1 | 2

const STEP_LABELS = ['Baselines', 'Equipment', 'Calibrate'] as const

const EQUIPMENT_OPTIONS: { value: V11EquipmentAvailability; label: string }[] = [
  { value: 'bodyweight-only', label: 'Bodyweight Only' },
  { value: 'commercial-gym', label: 'Gym Access' },
]

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

function resolveSubmitErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }
  return 'Failed to initialize. Please retry.'
}

export default function IdentitySplash({ db }: Props) {
  const [step, setStep] = useState<StepIndex>(0)
  const [ageYearsInput, setAgeYearsInput] = useState('')
  const [bodyWeightKgInput, setBodyWeightKgInput] = useState('')
  const [equipmentAvailability, setEquipmentAvailability] = useState<V11EquipmentAvailability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ageYears = useMemo(() => parsePositiveInteger(ageYearsInput), [ageYearsInput])
  const bodyWeightKg = useMemo(() => parsePositiveNumber(bodyWeightKgInput), [bodyWeightKgInput])

  const currentStepError = useMemo(() => {
    if (step === 0) {
      return ageYears !== null && bodyWeightKg !== null
        ? null
        : 'Enter your age and body weight.'
    }
    if (step === 1) {
      return equipmentAvailability !== null
        ? null
        : 'Select your equipment.'
    }
    return null
  }, [ageYears, bodyWeightKg, equipmentAvailability, step])

  const isCurrentStepValid = currentStepError === null
  const isLastStep = step === TOTAL_STEPS - 1

  async function handleFinish(): Promise<void> {
    if (submitting || ageYears === null || bodyWeightKg === null || equipmentAvailability === null) {
      return
    }

    const v11PromptContract: V11AppSettingsSchema = {
      physiologicalBaselines: {
        ageYears,
        bodyWeightKg,
        gender: 'prefer-not-to-say',
      },
      trainingExperienceLevel: null,
      logisticalConstraints: {
        targetDaysPerWeek: 3,
        hardSessionLimitMinutes: 60,
      },
      equipmentAvailability,
      primaryGoals: {
        primaryFocus: null,
        specificLiftTargets: [],
      },
      injuryConstraints: {
        hasActiveConstraints: false,
        constraints: [],
      },
    }

    if (typeof window !== 'undefined' && typeof window.navigator?.vibrate === 'function') {
      window.navigator.vibrate(100)
    }

    setSubmitting(true)
    setSubmitError(null)
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
        daysPerWeek: 3,
        qosMinutes: 60,
        v11PromptContract,
        hasCompletedOnboarding: true,
      })
    } catch (unknownError) {
      setSubmitError(resolveSubmitErrorMessage(unknownError))
      console.error('Onboarding finalize failed:', unknownError)
    } finally {
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

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center bg-[var(--color-surface-base)] px-6 pb-12 pt-10">
      <div className="flex flex-wrap justify-center gap-[1px]" aria-label={TITLE}>
        {CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * CHAR_DELAY, duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
            className="text-display text-white"
          >
            {char}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.1, duration: 0.4 }}
        className="mt-6 text-center text-body text-zinc-400"
      >
        Offline-first gym tracker. Zero decision fatigue.
      </motion.p>

      {submitError && (
        <p
          role="alert"
          className="mt-4 w-full rounded-2xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-body text-red-300"
        >
          {submitError}
        </p>
      )}

      <motion.section
        variants={FORM_STAGGER}
        initial="hidden"
        animate="visible"
        className="mt-6 flex w-full flex-col gap-5 rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-5"
      >
        <motion.div variants={FORM_SECTION} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-label text-[var(--color-accent-primary)]">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-label text-zinc-300">{STEP_LABELS[step]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-[var(--color-accent-primary)] transition-all duration-200"
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
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-label text-[var(--color-accent-primary)]">Age</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={ageYearsInput}
                  onChange={(e) => setAgeYearsInput(e.target.value)}
                  placeholder="Years"
                  autoFocus
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-body text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-label text-[var(--color-accent-primary)]">Body Weight</span>
                <input
                  type="number"
                  min={1}
                  step={0.1}
                  value={bodyWeightKgInput}
                  onChange={(e) => setBodyWeightKgInput(e.target.value)}
                  placeholder="kg"
                  className="w-full rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-body text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--color-accent-primary)] focus:outline-none"
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-label text-[var(--color-accent-primary)]">Equipment</span>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map((option) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={option.value}
                    type="button"
                    onClick={() => setEquipmentAvailability(option.value)}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-label transition-all ${
                      equipmentAvailability === option.value
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                        : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-zinc-400'
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && <CalibrateBaselinesCard db={db} />}
        </motion.div>

        {step < 2 && (
          <p className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/70 px-3 py-2 text-label text-zinc-300">
            {currentStepError ?? 'Step ready. Continue.'}
          </p>
        )}

        <div className="flex items-center gap-3">
          <motion.button
            variants={FORM_SECTION}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={goToPreviousStep}
            disabled={step === 0 || submitting}
            className="h-12 flex-1 cursor-pointer rounded-3xl border border-[var(--color-border-subtle)] bg-transparent px-4 text-label text-zinc-300 hover:border-[var(--color-accent-primary)]/40 disabled:cursor-not-allowed disabled:text-zinc-600"
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
              className="h-12 flex-[1.4] cursor-pointer rounded-3xl bg-[var(--color-accent-primary)] px-6 text-label text-white disabled:cursor-not-allowed disabled:bg-[var(--color-accent-primary)]/30 disabled:text-zinc-500"
            >
              Next
            </motion.button>
          )}

          {isLastStep && (
            <motion.button
              variants={FORM_SECTION}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { void handleFinish() }}
              disabled={submitting}
              className="h-12 flex-[1.4] cursor-pointer rounded-3xl bg-[var(--color-accent-primary)] px-6 text-label text-white disabled:cursor-not-allowed disabled:bg-[var(--color-accent-primary)]/30 disabled:text-zinc-500"
            >
              {submitting ? 'Initializing…' : 'Enter Protocol'}
            </motion.button>
          )}
        </div>
      </motion.section>
    </main>
  )
}
