import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface PrestigeFlashProps {
  active: boolean
  onDone: () => void
}

export function PrestigeFlash({ active, onDone }: PrestigeFlashProps) {
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(onDone, 2000)
    return () => clearTimeout(timer)
  }, [active, onDone])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="prestige-flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.85, 0] }}
          transition={{ duration: 2, times: [0, 0.08, 0.45, 1], ease: 'easeOut' }}
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
