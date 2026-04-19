import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ROUTINE_OPTIONS, type CanonicalRoutineType } from '../../planner/autoPlanner'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  userName: string | undefined
  completedAscensions: number
  routineType: CanonicalRoutineType
  cycleLength: number
  sessionIndex: number
  onSelectRoutine: (routineType: CanonicalRoutineType) => void
}

function DrawerSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 px-5 py-5">
      <h2
        className="text-label uppercase"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function SettingsDrawer({
  open,
  onClose,
  userName,
  completedAscensions,
  routineType,
  cycleLength,
  sessionIndex,
  onSelectRoutine,
}: SettingsDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
            aria-hidden
          />
          <motion.aside
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface-base)' }}
            role="dialog"
            aria-label="Settings"
          >
            <header
              className="sticky top-0 flex h-12 items-center justify-between border-b px-4"
              style={{
                backgroundColor: 'var(--color-surface-base)',
                borderColor: 'var(--color-border-subtle)',
              }}
            >
              <span
                className="text-label uppercase"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Settings
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <X size={22} strokeWidth={1.75} aria-hidden />
              </button>
            </header>

            <DrawerSection title="Cycle">
              <p
                className="text-body"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Day {Math.min(sessionIndex + 1, cycleLength)} of {cycleLength}
              </p>
              <p
                className="text-label"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {routineType}
              </p>
            </DrawerSection>

            <div
              className="h-px w-full"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            />

            <DrawerSection title="Routine">
              <div className="flex flex-col gap-1">
                {ROUTINE_OPTIONS.map((option) => {
                  const active = option.type === routineType
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => onSelectRoutine(option.type)}
                      className="text-body flex items-center justify-between rounded-lg px-3 py-3 text-left"
                      style={{
                        backgroundColor: active
                          ? 'var(--color-surface-raised)'
                          : 'transparent',
                        color: active
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      <span>{option.label}</span>
                      {active && (
                        <span
                          className="text-label"
                          style={{ color: 'var(--color-accent-primary)' }}
                        >
                          Active
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </DrawerSection>

            <div
              className="h-px w-full"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            />

            <DrawerSection title="Athlete">
              <p
                className="text-body"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {userName ?? 'Athlete'}
              </p>
              <p
                className="text-label"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {completedAscensions} completed ascensions
              </p>
            </DrawerSection>

            <div
              className="h-px w-full"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            />

            <DrawerSection title="Preferences">
              <p
                className="text-label"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Injuries, fallback pool, and rest-timer controls coming soon.
              </p>
            </DrawerSection>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
