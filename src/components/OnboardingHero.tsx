import { motion } from 'framer-motion'
import { ROUTINE_OPTIONS, type CanonicalRoutineType } from '../planner/autoPlanner'
import FeaturePulse from './FeaturePulse'

type TourStep = 0 | 1 | 2

interface OnboardingHeroProps {
  selectedRoutine: CanonicalRoutineType
  sessionLabel: string
  cycleLength: number
  sessionIndex: number
  timeAvailable: number
  progressionPreview: string
  isTourStarted: boolean
  tourStep: TourStep
  onSelectRoutine: (routineType: CanonicalRoutineType) => void
  onTimeAvailableChange: (minutes: number) => void
  onInitialize: (routineType: CanonicalRoutineType) => void
  onTourNext: () => void
  onTourFinish: () => void
}

export default function OnboardingHero({
  selectedRoutine,
  sessionLabel,
  cycleLength,
  sessionIndex,
  timeAvailable,
  progressionPreview,
  isTourStarted,
  tourStep,
  onSelectRoutine,
  onTimeAvailableChange,
  onInitialize,
  onTourNext,
  onTourFinish,
}: OnboardingHeroProps) {
  const noop = () => {}
  const tourContentByStep: Record<TourStep, { title: string; message: string; top: number }> = {
    0: {
      title: 'QoS Governor',
      message: 'Adjust time and the planner trims accessories first to keep your session frictionless.',
      top: 210,
    },
    1: {
      title: 'Cycle Memory',
      message: 'Session order is modulo-driven. After the final day, the next session resets to Day 1 automatically.',
      top: 278,
    },
    2: {
      title: 'Progression Engine',
      message: 'Reps and load are pre-computed. Log your actual set data and the next session is auto-adjusted.',
      top: 346,
    },
  }
  const activeTourContent = tourContentByStep[tourStep]

  return (
    <motion.section
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-3xl border border-[#3c281b] bg-[#171717] p-5 shadow-[0_24px_52px_-28px_rgba(255,107,0,0.92)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FF6B00]">IronProtocol</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-50">IronProtocol: Initialize Engine</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        Pick your opening routine and reveal the planner laws. The system will auto-detect sessions, progression, and trimming in real-time.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {ROUTINE_OPTIONS.map((option) => (
          <motion.button
            whileTap={{ scale: 0.95 }}
            key={option.type}
            type="button"
            onClick={() => onSelectRoutine(option.type)}
            className={`cursor-pointer rounded-2xl border px-3 py-3 text-left text-xs font-bold transition-all active:scale-[0.98] ${
              selectedRoutine === option.type
                ? 'border-[#FF6B00] bg-[#2a1a10] text-[#FF6B00] active:bg-[#24170f]'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 active:bg-zinc-800'
            }`}
          >
            <span className="block leading-tight">{option.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="relative mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-3 min-h-[96px]">
        <div className="flex items-center justify-between">
          <label htmlFor="onboarding-qos" className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            QoS Slider
          </label>
          <span className="text-sm font-black text-[#FF6B00]">{timeAvailable} min</span>
        </div>
        <input
          id="onboarding-qos"
          type="range"
          min={15}
          max={120}
          step={5}
          value={timeAvailable}
          onChange={(event) => onTimeAvailableChange(Number(event.target.value))}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#FF6B00]"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="relative rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-black text-zinc-100">
          Workout Day {sessionIndex + 1} of {cycleLength}
        </span>
        <span className="rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-black text-zinc-100">
          {sessionLabel}
        </span>
      </div>

      <div className="relative mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Progression Goal</p>
        <p className="mt-2 text-sm font-bold text-zinc-200">{progressionPreview}</p>
      </div>

      {isTourStarted && (
        <FeaturePulse
          title={activeTourContent.title}
          pulseAriaLabel="Guided onboarding tooltip"
          message={activeTourContent.message}
          isVisible
          isCleared={false}
          onClear={noop}
          autoOpen
          portalTop={activeTourContent.top}
          actionLabel={tourStep === 2 ? 'Finish Setup' : 'Next'}
          onAction={tourStep === 2 ? onTourFinish : onTourNext}
        />
      )}

      <div className="mt-4">
        {!isTourStarted && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            type="button"
            onClick={() => onInitialize(selectedRoutine)}
            className="h-14 w-full cursor-pointer rounded-3xl bg-[#FF6B00] px-6 text-base font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#ff7d24] active:bg-[#e66000]"
          >
            Initialize Engine
          </motion.button>
        )}
      </div>
    </motion.section>
  )
}
