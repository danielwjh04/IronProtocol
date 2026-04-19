import { AnimatePresence, motion } from 'framer-motion'

interface TrackEndModalProps {
  visible:      boolean
  accentColor:  string
  accentGlow:   string
  title:        string
  description:  string
  buttonLabel:  string
  onConfirm:    () => void
  onDismiss:    () => void
}

const springIn  = { type: 'spring', stiffness: 300, damping: 24 } as const
const springOut = { duration: 0.18 } as const

export function TrackEndModal({
  visible,
  accentColor,
  accentGlow,
  title,
  description,
  buttonLabel,
  onConfirm,
  onDismiss,
}: TrackEndModalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="track-end-backdrop"
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
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: springIn }}
            exit={{ opacity: 0, scale: 0.9, y: 12, transition: springOut }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'linear-gradient(160deg, #0A0E1A 0%, #101724 55%, #05080F 100%)',
              border: `1px solid ${accentColor}73`,
              borderRadius: 18,
              padding: '2.5rem 2rem 2rem',
              maxWidth: 360,
              width: '90vw',
              textAlign: 'center',
              boxShadow: `0 0 0 1px ${accentColor}1F, 0 8px 40px ${accentGlow}, 0 0 80px ${accentGlow}`,
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
                background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}B3 60%, #000 100%)`,
                boxShadow: `0 0 28px ${accentGlow}`,
              }}
            />
            <h2
              style={{
                color: accentColor,
                fontSize: '1.35rem',
                fontWeight: 800,
                margin: '0 0 10px',
                letterSpacing: '0.02em',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.78)',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                margin: '0 0 28px',
              }}
            >
              {description}
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springIn}
              onClick={onConfirm}
              style={{
                display: 'block',
                width: '100%',
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '0.8rem 0',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                boxShadow: `0 4px 22px ${accentGlow}`,
              }}
            >
              {buttonLabel}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
