import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { IronProtocolDB } from '../db/schema'
import RecoveryAuditorCard from './RecoveryAuditorCard'

interface Props {
  onComplete: () => void
  db?: IronProtocolDB
}

const BOOT_LINES = [
  { id: 'init',   delay: 0.1,  text: '> Initializing...'    },
  { id: 'vault',  delay: 0.75, text: '> Checking Vault...'  },
  { id: 'ready',  delay: 1.45, text: '> System Ready.'      },
]

const TOTAL_DURATION_MS = 2500

function PulsingBarbell() {
  return (
    <motion.svg
      width="200"
      height="56"
      viewBox="0 0 200 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IronProtocol barbell"
      animate={{ scale: [1, 1.05, 1], opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
      style={{ color: 'var(--color-accent-primary)' }}
    >
      <rect x="8"   y="8"  width="18" height="40" rx="5" fill="currentColor" opacity="0.9" />
      <rect x="24"  y="16" width="10" height="24" rx="3" fill="currentColor" />
      <rect x="34"  y="25" width="132" height="6"  rx="3" fill="currentColor" />
      <rect x="166" y="16" width="10" height="24" rx="3" fill="currentColor" />
      <rect x="174" y="8"  width="18" height="40" rx="5" fill="currentColor" opacity="0.9" />

      <rect x="52"  y="22" width="6"  height="12" rx="2" fill="#FFFFFF" opacity="0.18" />
      <rect x="142" y="22" width="6"  height="12" rx="2" fill="#FFFFFF" opacity="0.18" />
    </motion.svg>
  )
}

export default function CoreIgnition({ onComplete, db }: Props) {
  const [visibleLines, setVisibleLines] = useState<string[]>([])

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    BOOT_LINES.forEach(({ id, delay }) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(prev => [...prev, id])
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(50)
          }
        }, delay * 1000),
      )
    })

    timers.push(setTimeout(() => onCompleteRef.current(), TOTAL_DURATION_MS))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 3, opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
      aria-label="Core Ignition — booting IronProtocol"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: 'var(--color-accent-primary)' }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="text-label"
        style={{ color: 'var(--color-accent-primary)' }}
      >
        IRONPROTOCOL
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <PulsingBarbell />
      </motion.div>

      <div className="flex min-h-[80px] w-full max-w-[320px] flex-col gap-2 px-4">
        <AnimatePresence initial={false}>
          {BOOT_LINES.map(({ id, text }) =>
            visibleLines.includes(id) ? (
              <motion.p
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-label"
                style={{
                  color: id === 'ready'
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-text-secondary)',
                }}
              >
                {text}
                {id === 'ready' && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                    className="ml-0.5 inline-block"
                  >
                    ▋
                  </motion.span>
                )}
              </motion.p>
            ) : null,
          )}
        </AnimatePresence>
      </div>

      {db && (
        <div className="w-full max-w-[320px] px-4">
          <RecoveryAuditorCard db={db} />
        </div>
      )}
    </motion.main>
  )
}
