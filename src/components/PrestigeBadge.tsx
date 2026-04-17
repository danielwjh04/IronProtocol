import { motion } from 'framer-motion'

const NUMERALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'],  [90, 'XC'],  [50, 'L'],  [40, 'XL'],
  [10, 'X'],   [9, 'IX'],   [5, 'V'],   [4, 'IV'], [1, 'I'],
]

function toRoman(n: number): string {
  let result = ''
  for (const [val, sym] of NUMERALS) {
    while (n >= val) { result += sym; n -= val }
  }
  return result
}

interface PrestigeBadgeProps {
  ascensions: number
}

export function PrestigeBadge({ ascensions }: PrestigeBadgeProps) {
  if (ascensions <= 0) return null
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="ml-2 inline-flex items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30"
      aria-label={`Prestige ${ascensions}`}
    >
      {toRoman(ascensions)}
    </motion.span>
  )
}
