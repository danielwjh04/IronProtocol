import { motion } from 'framer-motion'

interface TempSessionTakeoverProps {
  onResume: () => void
  onDiscard: () => void
}

export default function TempSessionTakeover({
  onResume,
  onDiscard,
}: TempSessionTakeoverProps) {
  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center gap-8 px-6"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      <h1
        className="text-display text-center"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Unfinished Session
      </h1>
      <p
        className="text-body text-center"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        A workout draft was saved in the background. Resume to continue where you left off, or discard to start fresh.
      </p>
      <div className="flex w-full flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onResume}
          className="text-body h-14 w-full rounded-2xl font-bold"
          style={{
            backgroundColor: 'var(--color-accent-primary)',
            color: 'var(--color-accent-on)',
          }}
        >
          Resume
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onDiscard}
          className="text-body h-14 w-full rounded-2xl"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
          }}
        >
          Discard
        </motion.button>
      </div>
    </main>
  )
}
