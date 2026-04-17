import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Star {
  id:    number
  angle: number
  dist:  number
}

interface ImpactStarsProps {
  originX:   number
  originY:   number
  intensity: number
  onDone:    () => void
}

function buildStars(count: number, spread: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    dist:  spread * (0.6 + Math.random() * 0.4),
  }))
}

export function ImpactStars({ originX, originY, intensity, onDone }: ImpactStarsProps) {
  const count    = Math.max(4, Math.round(4 + intensity * 8))
  const spread   = 40 + intensity * 80
  const size     = 4 + intensity * 6
  const duration = 0.5 + intensity * 0.4

  const [stars] = useState<Star[]>(() => buildStars(count, spread))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onDone()
    }, (duration + (count - 1) * 0.04 + 0.05) * 1000)
    return () => clearTimeout(t)
  }, [onDone, duration, count])

  return (
    <AnimatePresence>
      {visible &&
        stars.map((star, i) => {
          const rad = (star.angle * Math.PI) / 180
          const tx  = Math.cos(rad) * star.dist
          const ty  = Math.sin(rad) * star.dist
          return (
            <motion.div
              key={star.id}
              style={{
                position:     'fixed',
                left:         originX,
                top:          originY,
                width:        size,
                height:       size,
                borderRadius: '50%',
                background:   '#facc15',
                pointerEvents:'none',
                zIndex:        9999,
              }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
              transition={{ duration, delay: i * 0.04, ease: 'easeOut' }}
            />
          )
        })}
    </AnimatePresence>
  )
}
