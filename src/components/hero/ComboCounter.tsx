import { AnimatePresence, motion } from 'framer-motion'

interface ComboCounterProps {
  count: number
}

export function ComboCounter({ count }: ComboCounterProps) {
  return (
    <AnimatePresence>
      {count >= 2 && (
        <motion.div
          key={count}
          initial={{ y: 20, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="pointer-events-none fixed left-1/2 top-1/3 -translate-x-1/2 text-center"
        >
          <span className="text-4xl font-black tracking-widest text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
            {count}x COMBO
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
