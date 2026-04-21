import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { PlannedWorkout } from '../../planner/autoPlanner'
import { PrestigeBadge } from '../PrestigeBadge'

interface Props {
  plan:                 PlannedWorkout | null
  loading?:             boolean
  error?:               string | null
  sessionLabel?:        string
  trainingGoal:         'Hypertrophy' | 'Power'
  timeAvailable:        number
  primaryActionLabel?:  string
  onTrainingGoalChange: (goal: 'Hypertrophy' | 'Power') => void
  onTimeAvailableChange:(minutes: number) => void
  onLockBlueprint:      () => void
  userName?:            string
  completedAscensions?: number
}

type WizardStep = 0 | 1 | 2

const DURATION_PRESETS = [30, 45, 60, 75, 90] as const

function Theme(goal: 'Hypertrophy' | 'Power') {
  if (goal === 'Power') {
    return {
      accent:    '#3B71FE',
      accentDim: '#1E3A8A',
      accentSoft:'#5585ff',
      label:     'POWER',
      icon:      '⚔',
      tagline:   'FORGE THE OBSIDIAN STAIR',
      bgClass:   'pixel-grid-power',
    }
  }
  return {
    accent:    '#FF6A2C',
    accentDim: '#9A2E0A',
    accentSoft:'#FFA35B',
    label:     'HYPERTROPHY',
    icon:      '🔥',
    tagline:   'STOKE THE IRON FORGE',
    bgClass:   'pixel-grid-hyper',
  }
}

export function HeroWizard({
  plan,
  loading,
  error,
  sessionLabel,
  trainingGoal,
  timeAvailable,
  primaryActionLabel = 'IGNITE',
  onTrainingGoalChange,
  onTimeAvailableChange,
  onLockBlueprint,
  userName,
  completedAscensions = 0,
}: Props) {
  const [step, setStep] = useState<WizardStep>(0)
  const theme = useMemo(() => Theme(trainingGoal), [trainingGoal])

  const canAdvance =
    (step === 0) ||
    (step === 1) ||
    (step === 2 && !!plan && (plan.exercises?.length ?? 0) > 0 && !loading)

  function next() {
    if (step < 2) setStep((s) => (s + 1) as WizardStep)
    else onLockBlueprint()
  }

  function back() {
    if (step > 0) setStep((s) => (s - 1) as WizardStep)
  }

  return (
    <main
      data-testid="hero-wizard-root"
      className={[
        'relative z-10 mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-28 pt-5 pixel-font',
        theme.bgClass,
      ].join(' ')}
      style={{ color: theme.accent }}
    >
      <div className="pointer-events-none absolute inset-0 pixel-scanlines" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between text-[9px] tracking-[0.08em]">
        <div className="flex flex-col gap-1">
          <span className="text-zinc-500">PLAYER 1</span>
          <span className="text-zinc-100">{(userName ?? 'CHALLENGER').toUpperCase().slice(0, 12)}</span>
        </div>
        <div className="flex items-center gap-2">
          {completedAscensions > 0 && <PrestigeBadge ascensions={completedAscensions} />}
          <div
            className="flex items-center gap-1 border-2 border-current px-2 py-1"
            style={{ backgroundColor: '#000' }}
          >
            <span className="text-[9px]">LVL</span>
            <span className="text-[11px] text-zinc-100">{completedAscensions + 1}</span>
          </div>
        </div>
      </header>

      <Stepper step={step} theme={theme} />

      <section className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-track"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
            >
              <StepTrack trainingGoal={trainingGoal} onChange={onTrainingGoalChange} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div
              key="step-duration"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
            >
              <StepDuration
                theme={theme}
                value={timeAvailable}
                onChange={onTimeAvailableChange}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step-blueprint"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
            >
              <StepBlueprint
                theme={theme}
                plan={plan}
                loading={loading}
                error={error}
                sessionLabel={sessionLabel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <nav className="relative z-10 flex items-center justify-between gap-3 pt-2">
        <motion.button
          type="button"
          onClick={back}
          disabled={step === 0}
          whileTap={{ scale: 0.95 }}
          className="pixel-btn h-12 flex-1 text-[10px] tracking-[0.15em] disabled:opacity-30"
          style={{
            backgroundColor: '#000',
            color: '#9ca3af',
            border: '2px solid #1f2937',
          }}
        >
          ◀ BACK
        </motion.button>
        <motion.button
          type="button"
          onClick={next}
          disabled={!canAdvance}
          whileTap={{ scale: 0.95 }}
          className="pixel-btn h-12 flex-[1.5] text-[10px] tracking-[0.15em] disabled:opacity-40"
          style={{
            backgroundColor: theme.accent,
            color:           '#000',
            border:          `2px solid ${theme.accent}`,
          }}
        >
          {step < 2 ? 'NEXT ▶' : `${primaryActionLabel.toUpperCase()} ▶`}
        </motion.button>
      </nav>
    </main>
  )
}

interface StepperProps {
  step:  WizardStep
  theme: ReturnType<typeof Theme>
}

function Stepper({ step, theme }: StepperProps) {
  const labels = ['TRACK', 'TIME', 'BLUEPRINT'] as const
  return (
    <ol className="relative z-10 flex items-center gap-1 text-[8px] tracking-[0.1em]">
      {labels.map((label, i) => {
        const isActive = i === step
        const isDone = i < step
        return (
          <li key={label} className="flex flex-1 items-center gap-1">
            <span
              className="flex h-6 flex-1 items-center justify-center border-2"
              style={{
                backgroundColor: isActive ? theme.accent : '#000',
                color:           isActive ? '#000' : isDone ? theme.accent : '#4b5563',
                borderColor:     isDone || isActive ? theme.accent : '#1f2937',
              }}
            >
              {i + 1}. {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

interface StepTrackProps {
  trainingGoal: 'Hypertrophy' | 'Power'
  onChange:     (goal: 'Hypertrophy' | 'Power') => void
}

function StepTrack({ trainingGoal, onChange }: StepTrackProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-[12px] tracking-[0.2em] text-zinc-100">
        <span className="pixel-blink" aria-hidden="true">▸ </span>
        CHOOSE YOUR PATH
      </h2>
      <TrackOption
        selected={trainingGoal === 'Power'}
        accent="#3B71FE"
        accentDim="#1E3A8A"
        title="POWER"
        icon="⚔"
        subtitle="LOW REPS · HIGH INTENT"
        tagline="Obsidian Stair · 5x5 prescriptions"
        onSelect={() => onChange('Power')}
      />
      <TrackOption
        selected={trainingGoal === 'Hypertrophy'}
        accent="#FF6A2C"
        accentDim="#9A2E0A"
        title="HYPERTROPHY"
        icon="🔥"
        subtitle="HIGH REPS · HIGH VOLUME"
        tagline="The Forge · 4x8-15 prescriptions"
        onSelect={() => onChange('Hypertrophy')}
      />
    </div>
  )
}

interface TrackOptionProps {
  selected:  boolean
  accent:    string
  accentDim: string
  title:     string
  icon:      string
  subtitle:  string
  tagline:   string
  onSelect:  () => void
}

function TrackOption({ selected, accent, accentDim, title, icon, subtitle, tagline, onSelect }: TrackOptionProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      data-pressed={selected}
      className="pixel-btn flex w-full items-center gap-4 p-4 text-left"
      style={{
        backgroundColor: selected ? accent : '#000',
        color:           selected ? '#000' : accent,
        border:          `2px solid ${selected ? accent : accentDim}`,
      }}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center text-[24px]"
        style={{
          backgroundColor: selected ? '#000' : accentDim,
          color:           selected ? accent : accent,
          border:          `2px solid ${selected ? '#000' : accent}`,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] tracking-[0.18em]">{title}</span>
        <span className="text-[8px] tracking-[0.15em] opacity-80">{subtitle}</span>
        <span className="text-[7px] tracking-[0.1em] opacity-60">{tagline}</span>
      </div>
      {selected && (
        <span className="ml-auto text-[10px] pixel-blink" aria-hidden="true">◆</span>
      )}
    </motion.button>
  )
}

interface StepDurationProps {
  theme:    ReturnType<typeof Theme>
  value:    number
  onChange: (minutes: number) => void
}

function StepDuration({ theme, value, onChange }: StepDurationProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-[12px] tracking-[0.2em] text-zinc-100">
        <span className="pixel-blink" aria-hidden="true">▸ </span>
        SET THE TIMER
      </h2>
      <div
        className="flex items-center justify-center border-2 py-6"
        style={{ backgroundColor: '#000', borderColor: theme.accent, color: theme.accent }}
      >
        <span className="text-[36px] tracking-[0.1em]">{value}</span>
        <span className="ml-2 text-[10px] tracking-[0.2em] opacity-80">MIN</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {DURATION_PRESETS.map((m) => {
          const selected = m === value
          return (
            <motion.button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              whileTap={{ scale: 0.94 }}
              data-pressed={selected}
              className="pixel-btn h-12 text-[10px] tracking-[0.12em]"
              style={{
                backgroundColor: selected ? theme.accent : '#000',
                color:           selected ? '#000' : theme.accent,
                border:          `2px solid ${selected ? theme.accent : theme.accentDim}`,
              }}
            >
              {m}
            </motion.button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-[8px] tracking-[0.15em] text-zinc-500">
        ◂ PICK A CARTRIDGE · OR TUNE BELOW ▸
      </p>
      <input
        type="range"
        min={20}
        max={120}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Workout duration in minutes"
      />
    </div>
  )
}

interface StepBlueprintProps {
  theme:         ReturnType<typeof Theme>
  plan:          PlannedWorkout | null
  loading?:      boolean
  error?:        string | null
  sessionLabel?: string
}

function StepBlueprint({ theme, plan, loading, error, sessionLabel }: StepBlueprintProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[12px] tracking-[0.2em] text-zinc-100">
          <span className="pixel-blink" aria-hidden="true">▸ </span>
          BLUEPRINT
        </h2>
        {sessionLabel && (
          <span
            className="border-2 px-2 py-1 text-[8px] tracking-[0.15em]"
            style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: '#000' }}
          >
            {sessionLabel.toUpperCase()}
          </span>
        )}
      </div>

      {loading && (
        <div
          className="flex items-center justify-center border-2 p-6 text-[10px] tracking-[0.15em]"
          style={{ borderColor: theme.accentDim, color: theme.accent, backgroundColor: '#000' }}
        >
          <span className="pixel-blink">LOADING...</span>
        </div>
      )}

      {error && (
        <div
          className="border-2 p-3 text-[9px] tracking-[0.1em]"
          style={{ borderColor: '#FF3B3B', color: '#FF3B3B', backgroundColor: '#000' }}
        >
          ERR: {error.toUpperCase()}
        </div>
      )}

      {!loading && plan && plan.exercises.length === 0 && (
        <div
          className="border-2 p-4 text-center text-[9px] tracking-[0.1em]"
          style={{ borderColor: theme.accentDim, color: theme.accent, backgroundColor: '#000' }}
        >
          NO QUEST DATA · RETURN TO PREV STEP
        </div>
      )}

      {!loading && plan && plan.exercises.map((ex, i) => (
        <ExerciseRow key={`${ex.exerciseId}-${i}`} index={i + 1} name={ex.exerciseName} sets={ex.sets} reps={ex.reps} tier={ex.tier} theme={theme} />
      ))}

      {!loading && plan && (
        <div
          className="mt-2 flex items-center justify-between border-2 px-3 py-2 text-[9px] tracking-[0.15em]"
          style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: '#000' }}
        >
          <span>EST TIME</span>
          <span className="text-zinc-100">{plan.estimatedMinutes} MIN</span>
        </div>
      )}
    </div>
  )
}

interface ExerciseRowProps {
  index: number
  name:  string
  sets:  number
  reps:  number
  tier:  number
  theme: ReturnType<typeof Theme>
}

function ExerciseRow({ index, name, sets, reps, tier, theme }: ExerciseRowProps) {
  const tierIcon = tier === 1 ? '★' : tier === 2 ? '◆' : '▲'
  return (
    <div
      className="flex items-center gap-3 border-2 p-3"
      style={{ borderColor: theme.accentDim, backgroundColor: '#000', color: theme.accent }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center text-[12px]"
        style={{ backgroundColor: theme.accent, color: '#000' }}
      >
        {String(index).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[9px] tracking-[0.1em] text-zinc-100">{name.toUpperCase()}</span>
        <span className="text-[8px] tracking-[0.15em] opacity-70">
          {tierIcon} T{tier} · {sets}x{reps}
        </span>
      </div>
    </div>
  )
}
