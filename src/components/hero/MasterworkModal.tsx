import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHeroProgress } from '../../hooks/useHeroProgress'

interface MasterworkModalProps {
  onPrestige?: () => void
}

const springIn = { type: 'spring', stiffness: 300, damping: 24 } as const
const springOut = { duration: 0.18 } as const

export function MasterworkModal({ onPrestige }: MasterworkModalProps) {
  const { progress } = useHeroProgress()
  const [dismissed, setDismissed] = useState(false)

  const visible = progress >= 1.0 && !dismissed

  function handlePrestige() {
    onPrestige?.()
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="masterwork-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: springOut }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setDismissed(true)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: springIn }}
            exit={{ opacity: 0, scale: 0.9, y: 12, transition: springOut }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'linear-gradient(160deg, #1c0800 0%, #2e1100 55%, #1a0600 100%)',
              border: '1px solid rgba(255, 110, 20, 0.45)',
              borderRadius: 18,
              padding: '2.5rem 2rem 2rem',
              maxWidth: 360,
              width: '90vw',
              textAlign: 'center',
              boxShadow:
                '0 0 0 1px rgba(255,80,10,0.12), 0 8px 40px rgba(255,70,10,0.4), 0 0 80px rgba(255,40,0,0.15)',
            }}
          >
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #ff6a10 0%, #cc3300 60%, #4d1000 100%)',
                boxShadow: '0 0 28px rgba(255, 90, 10, 0.7)',
              }}
            />

            <h2
              style={{
                color: '#ff9040',
                fontSize: '1.35rem',
                fontWeight: 800,
                margin: '0 0 10px',
                letterSpacing: '0.02em',
              }}
            >
              The Forge is Complete
            </h2>

            <p
              style={{
                color: 'rgba(255, 200, 150, 0.78)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                margin: '0 0 28px',
              }}
            >
              You have mastered the Hypertrophy track. Forge your Masterwork and begin the next cycle — stronger.
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springIn}
              onClick={handlePrestige}
              style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(135deg, #ff6010 0%, #c23000 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0.8rem 0',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 22px rgba(255, 70, 10, 0.45)',
              }}
            >
              Forge Masterwork
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
