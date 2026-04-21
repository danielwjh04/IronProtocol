import { motion, AnimatePresence } from 'framer-motion'
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

const TOTAL_STEPS = 3
type StepIndex = 0 | 1 | 2

const STEP_LABELS = ['Baselines', 'Equipment', 'Calibrate'] as const
const STEP_KICKERS = ['Your numbers', "What's available", 'Anchor lifts'] as const
const STEP_TITLES  = ["Let's set your baseline.", 'How will you train?', 'Your honest estimates.'] as const
const STEP_SUBS: Array<string | null> = [
  'We use these to scale every prescription. Edit anytime.',
  null,
  null,
]

const EQUIPMENT_OPTIONS: {
  value: V11EquipmentAvailability
  name: string
  helper: string
}[] = [
  { value: 'commercial-gym',  name: 'Gym Access',  helper: 'Full barbell, rack, cable + machines.' },
  { value: 'bodyweight-only', name: 'Bodyweight',  helper: 'Bands + BW-only selections.' },
]

function parsePositiveInteger(input: string): number | null {
  const value = Number.parseInt(input, 10)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

function parsePositiveNumber(input: string): number | null {
  const value = Number.parseFloat(input)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

function resolveSubmitErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message.trim()
  return 'Failed to initialize. Please retry.'
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function BarbellMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 60 24" aria-hidden>
      <rect x="1"    y="9"    width="3.2" height="6"  rx="1.2" fill="currentColor" />
      <rect x="6"    y="5"    width="5"   height="14" rx="1.6" fill="currentColor" />
      <rect x="12.5" y="10.5" width="35"  height="3"  rx="1.5" fill="currentColor" />
      <rect x="49"   y="5"    width="5"   height="14" rx="1.6" fill="currentColor" />
      <rect x="55.8" y="9"    width="3.2" height="6"  rx="1.2" fill="currentColor" />
    </svg>
  )
}

function BodyweightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10 v5" />
      <path d="M8 22 L10 15 L14 15 L16 22" />
      <path d="M8 13 L6 16" />
      <path d="M16 13 L18 16" />
    </svg>
  )
}

function CheckBadge() {
  return (
    <span
      aria-hidden
      className="absolute flex h-4 w-4 items-center justify-center rounded-full"
      style={{ top: 10, right: 10, backgroundColor: 'var(--color-accent-primary)', color: 'var(--color-accent-on)' }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12 L10 17 L19 7" />
      </svg>
    </span>
  )
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18 L9 12 L15 6" />
    </svg>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function IdentitySplash({ db }: Props) {
  const [step, setStep] = useState<StepIndex>(0)
  const [ageYearsInput, setAgeYearsInput] = useState('')
  const [bodyWeightKgInput, setBodyWeightKgInput] = useState('')
  const [equipmentAvailability, setEquipmentAvailability] = useState<V11EquipmentAvailability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ageYears      = useMemo(() => parsePositiveInteger(ageYearsInput),    [ageYearsInput])
  const bodyWeightKg  = useMemo(() => parsePositiveNumber(bodyWeightKgInput), [bodyWeightKgInput])

  const currentStepError = useMemo(() => {
    if (step === 0) {
      if (ageYears === null && bodyWeightKg === null) return 'Enter your age and body weight.'
      if (ageYears === null)     return 'Enter your age to continue.'
      if (bodyWeightKg === null) return 'Enter your body weight to continue.'
      return null
    }
    if (step === 1) return equipmentAvailability !== null ? null : 'Select your equipment.'
    return null
  }, [ageYears, bodyWeightKg, equipmentAvailability, step])

  const isCurrentStepValid = currentStepError === null
  const isLastStep = step === TOTAL_STEPS - 1

  async function handleFinish(): Promise<void> {
    if (submitting || ageYears === null || bodyWeightKg === null || equipmentAvailability === null) return

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
    setStep((cur) => Math.max(0, cur - 1) as StepIndex)
  }

  function goToNextStep(): void {
    if (!isCurrentStepValid || isLastStep) return
    setStep((cur) => Math.min(TOTAL_STEPS - 1, cur + 1) as StepIndex)
  }

  const helperMessage = currentStepError
    ?? (isLastStep ? 'All set. Welcome to the protocol.' : 'Ready to continue.')
  const helperIsError = currentStepError !== null

  return (
    <main
      className="relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-6 pb-6 pt-14"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      {/* Ambient accent halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[110px] -translate-x-1/2"
        style={{
          width: 340,
          height: 340,
          background: 'radial-gradient(circle, rgba(48,209,88,0.20) 0%, rgba(48,209,88,0) 62%)',
          filter: 'blur(20px)',
        }}
      />

      {/* ── Brand block ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-2"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[11px]"
          style={{
            backgroundColor: 'var(--color-accent-soft)',
            color: 'var(--color-accent-primary)',
            boxShadow:
              '0 8px 22px -10px rgba(48,209,88,0.55), inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <BarbellMark size={22} />
        </div>
        <span
          style={{
            fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.38em',
            color: 'var(--color-accent-primary)',
          }}
        >
          IRONPROTOCOL
        </span>
      </motion.div>

      {submitError && (
        <p
          role="alert"
          className="mt-4 w-full rounded-2xl border px-4 py-3 text-body"
          style={{
            borderColor:     'var(--color-utility-danger)',
            backgroundColor: 'var(--color-surface-raised)',
            color:           'var(--color-utility-danger)',
          }}
        >
          {submitError}
        </p>
      )}

      {/* ── Progress ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
        className="relative mt-5 flex flex-col gap-2"
      >
        <div className="flex items-baseline justify-between">
          <span
            style={{
              fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--color-text-secondary)',
            }}
          >
            STEP {String(step + 1).padStart(2, '0')} / {String(TOTAL_STEPS).padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'var(--color-text-primary)',
            }}
          >
            {STEP_LABELS[step]}
          </span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => {
            const filled = i <= step
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  backgroundColor: filled
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-surface-overlay)',
                  boxShadow: filled
                    ? '0 0 12px rgba(48,209,88,0.55)'
                    : '0 0 0 rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="h-1 flex-1 rounded-full"
              />
            )
          })}
        </div>
      </motion.div>

      {/* ── Headline ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`headline-${step}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative mt-5 flex flex-col gap-1"
        >
          <span
            style={{
              fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.26em',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {STEP_KICKERS[step]}
          </span>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.022em',
              lineHeight: 1.15,
              color: 'var(--color-text-primary)',
              marginTop: 2,
            }}
          >
            {STEP_TITLES[step]}
          </h1>
          {STEP_SUBS[step] && (
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.45,
                color: 'var(--color-text-secondary)',
                marginTop: 4,
              }}
            >
              {STEP_SUBS[step]}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Step content ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${step}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative mt-4"
        >
          {step === 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              <NumericField
                label="Age"
                unit="yrs"
                value={ageYearsInput}
                onChange={setAgeYearsInput}
                placeholder="—"
                autoFocus
                inputMode="numeric"
                step={1}
                width={64}
              />
              <NumericField
                label="Body weight"
                unit="kg"
                value={bodyWeightKgInput}
                onChange={setBodyWeightKgInput}
                placeholder="—"
                inputMode="decimal"
                step={0.1}
                width={78}
              />
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2.5">
              {EQUIPMENT_OPTIONS.map((option) => {
                const selected = equipmentAvailability === option.value
                return (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setEquipmentAvailability(option.value)}
                    className="relative flex min-h-[96px] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors"
                    style={{
                      borderColor: selected ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)',
                      background: selected
                        ? 'linear-gradient(180deg, rgba(48,209,88,0.08), var(--color-surface-raised))'
                        : 'var(--color-surface-raised)',
                    }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-[9px]"
                      style={{
                        backgroundColor: selected ? 'var(--color-accent-soft)' : 'var(--color-surface-overlay)',
                        color: selected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {option.value === 'commercial-gym' ? <BarbellMark size={16} /> : <BodyweightIcon size={16} />}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {option.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        lineHeight: 1.35,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {option.helper}
                    </span>
                    {selected && <CheckBadge />}
                  </motion.button>
                )
              })}
            </div>
          )}

          {step === 2 && <CalibrateBaselinesCard db={db} />}
        </motion.div>
      </AnimatePresence>

      {/* ── Footer: helper + CTA ──────────────────────── */}
      <div className="relative mt-auto flex flex-col gap-3 pt-4">
        <motion.div
          key={`helper-${helperMessage}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 rounded-full border px-3 py-2"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-subtle)',
            color: helperIsError ? '#FF8A80' : 'var(--color-text-secondary)',
          }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: helperIsError ? '#FF453A' : 'var(--color-accent-primary)',
              boxShadow: helperIsError
                ? '0 0 8px rgba(255,69,58,0.6)'
                : '0 0 8px rgba(48,209,88,0.7)',
            }}
          />
          <span style={{ fontSize: 11, letterSpacing: '-0.005em' }}>{helperMessage}</span>
        </motion.div>

        <div className="flex items-stretch gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={goToPreviousStep}
            disabled={step === 0 || submitting}
            aria-label="Back"
            className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronLeft />
          </motion.button>

          {!isLastStep && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={goToNextStep}
              disabled={!isCurrentStepValid || submitting}
              className="flex h-[52px] flex-1 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed"
              style={{
                backgroundColor: isCurrentStepValid
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-surface-overlay)',
                color: isCurrentStepValid
                  ? 'var(--color-accent-on)'
                  : 'var(--color-text-muted)',
                boxShadow: isCurrentStepValid
                  ? '0 8px 22px -10px rgba(48,209,88,0.55)'
                  : 'none',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.005em',
              }}
            >
              Continue
            </motion.button>
          )}

          {isLastStep && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => { void handleFinish() }}
              disabled={submitting}
              className="flex h-[52px] flex-1 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-accent-on)',
                boxShadow: '0 8px 22px -10px rgba(48,209,88,0.55)',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.005em',
              }}
            >
              {submitting ? 'Initializing…' : 'Enter Protocol'}
            </motion.button>
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Numeric field ──────────────────────────────────────────────────────────
interface NumericFieldProps {
  label: string
  unit: string
  value: string
  onChange: (next: string) => void
  placeholder: string
  autoFocus?: boolean
  inputMode?: 'numeric' | 'decimal'
  step?: number
  width?: number
}

function NumericField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  autoFocus,
  inputMode = 'numeric',
  step = 1,
  width = 64,
}: NumericFieldProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0
  const active = focused || hasValue

  return (
    <label
      className="flex cursor-text flex-col gap-1 rounded-2xl border px-3.5 py-3 transition-colors"
      style={{
        backgroundColor: active
          ? 'color-mix(in srgb, var(--color-accent-primary) 6%, var(--color-surface-raised))'
          : 'var(--color-surface-raised)',
        borderColor: active
          ? 'var(--color-accent-primary)'
          : 'var(--color-border-subtle)',
      }}
    >
      <span
        style={{
          fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <input
          type="number"
          min={1}
          step={step}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label={label}
          className="no-spinner bg-transparent p-0 outline-none placeholder:text-[color:var(--color-text-muted)]"
          style={{
            width,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text-primary)',
            lineHeight: 1,
            MozAppearance: 'textfield',
          }}
        />
        <span
          style={{
            fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'var(--color-text-secondary)',
          }}
        >
          {unit}
        </span>
      </span>
    </label>
  )
}
