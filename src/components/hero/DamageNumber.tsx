import { motion } from 'framer-motion'

interface DamageNumberProps {
  value: number
  id: string
  intensity: number
}

export function DamageNumber({ value, id, intensity }: DamageNumberProps) {
  const isHeavy = intensity > 0.6
  return (
    <motion.span
      key={id}
      initial={{ y: 0, opacity: 0, x: (Math.random() - 0.5) * 60 }}
      animate={{ y: -80, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className={`pointer-events-none absolute select-none font-black tabular-nums ${
        isHeavy ? 'text-3xl text-red-400' : 'text-xl text-white/70'
      }`}
      style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }}
      aria-hidden
    >
      {value}
    </motion.span>
  )
}
