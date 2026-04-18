import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTrackProgress } from '../../hooks/useTrackProgress'
import { ascend } from '../../services/heroMathService'

const springIn  = { type: 'spring', stiffness: 300, damping: 24 } as const
const springOut = { duration: 0.18 } as const

interface SummitModalProps {
  onAscend?: () => void
}

export function SummitModal({ onAscend }: SummitModalProps) {
  const track = useTrackProgress()
  const [dismissed, setDismissed] = useState(false)

  const visible = track.power >= 1.0 && !dismissed

  function handleAscend() {
    setDismissed(true)
    ascend()
    onAscend?.()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="summit-backdrop"
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
              background: 'linear-gradient(160deg, #00101c 0%, #001e2e 55%, #000d1a 100%)',
              border: '1px solid rgba(20, 180, 255, 0.45)',
              borderRadius: 18,
              padding: '2.5rem 2rem 2rem',
              maxWidth: 360,
              width: '90vw',
              textAlign: 'center',
              boxShadow:
                '0 0 0 1px rgba(20,180,255,0.12), 0 8px 40px rgba(20,180,255,0.25), 0 0 80px rgba(0,120,220,0.15)',
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
                background: 'radial-gradient(circle, #40c8ff 0%, #0088cc 60%, #003050 100%)',
                boxShadow: '0 0 28px rgba(20, 180, 255, 0.7)',
              }}
            />
            <h2 style={{ color: '#60d0ff', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 10px', letterSpacing: '0.02em' }}>
              The Summit is Attained
            </h2>
            <p style={{ color: 'rgba(150, 220, 255, 0.78)', fontSize: '0.88rem', lineHeight: 1.65, margin: '0 0 28px' }}>
              You have conquered the Power track. Ascend and carry your strength into eternity.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springIn}
              onClick={handleAscend}
              style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(135deg, #0096d6 0%, #005899 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0.8rem 0',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 22px rgba(20, 180, 255, 0.35)',
              }}
            >
              Ascend
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
