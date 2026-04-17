import { motion } from 'framer-motion'
import { useUIMode } from '../../context/UIModeContext'

export function ModeToggleButton() {
  const { uiMode, setUIMode } = useUIMode()
  const isHero = uiMode === 'hero'

  return (
    <motion.button
      onClick={() => setUIMode(isHero ? 'focus' : 'hero')}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      aria-label={isHero ? 'Switch to Focus mode' : 'Switch to Hero mode'}
      className={[
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide',
        isHero
          ? 'bg-yellow-400 text-black'
          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700',
      ].join(' ')}
    >
      {isHero ? '⚔️ HERO' : '🎯 FOCUS'}
    </motion.button>
  )
}
