import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  IronProtocolDB,
  ParsedGoal,
  Routine,
  RoutineDaysPerWeek,
  RoutineGoal,
} from '../../db/schema'
import { describeParsedGoal, parseGoalText } from '../../planner/goalParser'

interface RoutineEditorProps {
  db: IronProtocolDB
  open: boolean
  initial?: Routine
  onClose: () => void
  onSaved: (routine: Routine) => void
}

const GOAL_OPTIONS: { value: RoutineGoal; label: string }[] = [
  { value: 'Hypertrophy', label: 'Hypertrophy' },
  { value: 'Power', label: 'Power' },
]

const DAYS_OPTIONS: RoutineDaysPerWeek[] = [3, 4, 5]

function autoSuggestName(
  goal: RoutineGoal,
  days: RoutineDaysPerWeek,
  parsed?: ParsedGoal,
): string {
  if (!parsed || parsed.aim === 'general') {
    return `${goal} ${days}×/week`
  }
  if (parsed.aim === 'lift-pr' && parsed.targetLifts.length === 1) {
    return `${parsed.targetLifts[0]} Builder`
  }
  if (parsed.aim === 'lift-pr' && parsed.targetLifts.length > 1) {
    const head = parsed.targetLifts[0].split(' ')[0]
    return `${head} & Co. Builder`
  }
  if (parsed.aim === 'jump') return 'Vertical Jump Builder'
  if (parsed.aim === 'run') return 'Endurance Foundation'
  if (parsed.aim === 'stamina') return 'Stamina Block'
  if (parsed.aim === 'fat-loss') return 'Cut Phase'
  if (parsed.aim === 'mobility') return 'Mobility Block'
  return `${goal} ${days}×/week`
}

export default function RoutineEditor({
  db,
  open,
  initial,
  onClose,
  onSaved,
}: RoutineEditorProps) {
  const [goal, setGoal] = useState<RoutineGoal>(initial?.goal ?? 'Hypertrophy')
  const [daysPerWeek, setDaysPerWeek] = useState<RoutineDaysPerWeek>(
    initial?.daysPerWeek ?? 3,
  )
  const [nameInput, setNameInput] = useState(initial?.name ?? '')
  const [cycleLengthWeeks, setCycleLengthWeeks] = useState(
    initial?.cycleLengthWeeks ?? 12,
  )
  const [timeAvailableMinutes, setTimeAvailableMinutes] = useState<number>(
    initial?.timeAvailableMinutes ?? 60,
  )
  const [goalText, setGoalText] = useState(initial?.goalText ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo<ParsedGoal | undefined>(
    () => (goalText.trim().length > 0 ? parseGoalText(goalText) : undefined),
    [goalText],
  )
  const parsedHint = useMemo(() => describeParsedGoal(parsed), [parsed])

  const resolvedName = useMemo(() => {
    const trimmed = nameInput.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
    return autoSuggestName(goal, daysPerWeek, parsed)
  }, [nameInput, goal, daysPerWeek, parsed])

  async function handleSave(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const id = initial?.id ?? uuidv4()
      const trimmedGoalText = goalText.trim()
      const record: Routine = {
        id,
        name: resolvedName,
        goal,
        daysPerWeek,
        cycleLengthWeeks,
        createdAt: initial?.createdAt ?? Date.now(),
        isActive: 1,
        timeAvailableMinutes,
        ...(trimmedGoalText.length > 0
          ? { goalText: trimmedGoalText, parsedGoal: parseGoalText(trimmedGoalText) }
          : {}),
      }

      await db.transaction('rw', db.routines, async () => {
        const priorActive = await db.routines.where('isActive').equals(1).toArray()
        for (const row of priorActive) {
          if (row.id !== id) {
            await db.routines.update(row.id, { isActive: 0 })
          }
        }
        await db.routines.put(record)
      })

      onSaved(record)
      onClose()
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : 'Failed to save routine.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="routine-editor-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
            aria-hidden
          />
          <motion.aside
            key="routine-editor-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-3xl border-t p-5"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-strong)',
            }}
            role="dialog"
            aria-label={initial ? 'Edit routine' : 'Create routine'}
          >
            <h2
              className="text-display mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {initial ? 'Edit Routine' : 'New Routine'}
            </h2>

            <label className="mb-4 flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Name
              </span>
              <input
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder={autoSuggestName(goal, daysPerWeek, parsed)}
                className="rounded-2xl border px-4 py-3 text-body"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </label>

            <div className="mb-4 flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Goal
              </span>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((option) => {
                  const active = goal === option.value
                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setGoal(option.value)}
                      className="rounded-2xl border px-3 py-3 text-label"
                      style={{
                        backgroundColor: active
                          ? 'var(--color-surface-base)'
                          : 'transparent',
                        borderColor: active
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-border-subtle)',
                        color: active
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      {option.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <label className="mb-4 flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Your Goal{' '}
                <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
              </span>
              <textarea
                value={goalText}
                onChange={(event) => setGoalText(event.target.value)}
                placeholder="e.g. raise my bench 1RM to 225 lb · improve vertical jump · run a 6-min mile"
                rows={2}
                className="resize-none rounded-2xl border px-4 py-3 text-body"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                }}
              />
              {parsedHint && (
                <p
                  className="text-label"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {parsedHint}
                </p>
              )}
            </label>

            <div className="mb-4 flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Days Per Week
              </span>
              <div className="grid grid-cols-3 gap-2">
                {DAYS_OPTIONS.map((days) => {
                  const active = daysPerWeek === days
                  return (
                    <motion.button
                      key={days}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setDaysPerWeek(days)}
                      className="rounded-2xl border py-3 text-label"
                      style={{
                        backgroundColor: active
                          ? 'var(--color-surface-base)'
                          : 'transparent',
                        borderColor: active
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-border-subtle)',
                        color: active
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      {days}x
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-end justify-between">
                <span
                  className="text-label"
                  style={{ color: 'var(--color-accent-primary)' }}
                >
                  Time Cap Per Session
                </span>
                <span
                  className="text-body"
                  style={{ color: 'var(--color-accent-primary)' }}
                >
                  {timeAvailableMinutes} min
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={120}
                step={5}
                value={timeAvailableMinutes}
                onChange={(event) => setTimeAvailableMinutes(Number(event.target.value))}
                aria-label="Time cap in minutes"
                className="h-2 w-full cursor-pointer appearance-none rounded-full focus:outline-none"
                style={{
                  background: `linear-gradient(to right, var(--color-accent-primary) 0%, var(--color-accent-primary) ${((timeAvailableMinutes - 30) / 90) * 100}%, var(--color-border-subtle) ${((timeAvailableMinutes - 30) / 90) * 100}%, var(--color-border-subtle) 100%)`,
                }}
              />
              <div className="flex justify-between">
                <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                  30 min
                </span>
                <span className="text-label" style={{ color: 'var(--color-text-muted)' }}>
                  120 min
                </span>
              </div>
            </div>

            <label className="mb-4 flex flex-col gap-2">
              <span
                className="text-label"
                style={{ color: 'var(--color-accent-primary)' }}
              >
                Cycle Length (weeks)
              </span>
              <input
                type="number"
                min={4}
                max={24}
                step={1}
                value={cycleLengthWeeks}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  if (Number.isFinite(value) && value > 0) {
                    setCycleLengthWeeks(value)
                  }
                }}
                className="rounded-2xl border px-4 py-3 text-body"
                style={{
                  backgroundColor: 'var(--color-surface-base)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </label>

            {error && (
              <p
                role="alert"
                className="mb-3 rounded-2xl border border-red-500/40 bg-red-900/20 px-4 py-3 text-body text-red-300"
              >
                {error}
              </p>
            )}

            <div className="mt-2 flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-12 flex-1 rounded-3xl border px-4 text-label"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => { void handleSave() }}
                disabled={saving}
                className="h-12 flex-[1.4] rounded-3xl px-6 text-label text-white"
                style={{
                  backgroundColor: 'var(--color-accent-primary)',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save Routine'}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
