import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface PrestigeFlashProps {
  active: boolean
  onDone: () => void
}

const FLASH_DURATION_MS = 800

export function PrestigeFlash({ active, onDone }: PrestigeFlashProps) {
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(onDone, FLASH_DURATION_MS)
    return () => clearTimeout(timer)
  }, [active, onDone])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="prestige-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: FLASH_DURATION_MS / 1000, times: [0, 0.1875, 0.8125, 1], ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.95) 0%, rgba(255,100,0,0.75) 35%, rgba(10,14,26,0.9) 80%)',
          }}
        />
      )}
    </AnimatePresence>
  )
}
