import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { getFunctionalInfo } from '../data/functionalMapping'
import HumanAnatomy from './HumanAnatomy'

interface Props {
  exerciseName: string
}

export default function FunctionalWhy({ exerciseName }: Props) {
  const info = getFunctionalInfo(exerciseName)
  const [formGuard, setFormGuard] = useState(false)

  return (
    <div
      className="rounded-3xl border px-5 py-5 transition-colors duration-500"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        borderColor: formGuard ? 'var(--color-utility-danger)' : 'var(--color-border-subtle)',
      }}
    >
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className="text-label rounded-full px-3 py-1 transition-colors duration-500"
            style={{
              backgroundColor: formGuard ? 'var(--color-utility-danger)' : 'var(--color-accent-primary)',
              color: formGuard ? 'var(--color-text-primary)' : 'var(--color-accent-on)',
            }}
          >
            {formGuard ? 'Form Guard' : 'Educational'}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={formGuard}
            aria-label="Toggle Form Guard — common mistake view"
            onClick={() => setFormGuard(prev => !prev)}
            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus:outline-none"
            style={{
              borderColor: formGuard ? 'var(--color-utility-danger)' : 'var(--color-border-strong)',
              backgroundColor: formGuard ? 'rgba(255, 69, 58, 0.16)' : 'var(--color-surface-overlay)',
            }}
          >
            <motion.span
              aria-hidden="true"
              className="h-5 w-5 rounded-full shadow-md transition-colors duration-300"
              style={{
                backgroundColor: formGuard ? 'var(--color-utility-danger)' : 'var(--color-accent-primary)',
              }}
              animate={{ x: formGuard ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <HumanAnatomy
            primaryMuscles={info?.primaryMuscles ?? []}
            secondaryMuscles={info?.secondaryMuscles ?? []}
            injuryRiskJoints={info?.injuryRiskJoints ?? []}
            formGuard={formGuard}
          />

          <div className="relative w-full" style={{ minHeight: '5rem' }}>
            <AnimatePresence initial={false}>
              {formGuard ? (
                <motion.p
                  key="mistake-cue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-body absolute inset-0 flex items-center justify-center text-center"
                  style={{ color: 'var(--color-utility-danger)', fontWeight: 600 }}
                >
                  {info?.commonMistake ?? `Common mistake: collapsing form under load on ${exerciseName}.`}
                </motion.p>
              ) : (
                <motion.p
                  key="purpose-cue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-body absolute inset-0 flex items-center justify-center text-center"
                  style={{
                    color: info ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: info ? 600 : 400,
                  }}
                >
                  {info?.purpose ?? (
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      No functional data yet for <strong style={{ color: 'var(--color-text-primary)' }}>{exerciseName}</strong>.
                    </span>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {info && (
          <p
            className="text-label mt-4 text-center transition-colors duration-500"
            style={{
              color: formGuard ? 'var(--color-utility-danger)' : 'var(--color-text-muted)',
              opacity: formGuard ? 0.7 : 1,
            }}
          >
            {formGuard ? 'Error joints · ' : 'Anatomy ref · '}
            {info.anatomyKey}
          </p>
        )}
      </div>
  )
}
