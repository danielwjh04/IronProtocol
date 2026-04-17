import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Star {
  id: number
  x: number
  y: number
  angle: number
  dist: number
}

interface ImpactStarsProps {
  originX: number
  originY: number
  onDone: () => void
}

function buildStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    angle: (360 / count) * i + Math.random() * 30 - 15,
    dist: 40 + Math.random() * 60,
  }))
}

export function ImpactStars({ originX, originY, onDone }: ImpactStarsProps) {
  const count = Math.floor(Math.random() * 5) + 8
  const [stars] = useState<Star[]>(() => buildStars(count))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <AnimatePresence>
      {visible &&
        stars.map((star, i) => {
          const rad = (star.angle * Math.PI) / 180
          const tx = Math.cos(rad) * star.dist
          const ty = Math.sin(rad) * star.dist

          return (
            <motion.div
              key={star.id}
              style={{
                position: 'fixed',
                left: originX,
                top: originY,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#facc15',
                pointerEvents: 'none',
                zIndex: 9999,
              }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
              transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
            />
          )
        })}
    </AnimatePresence>
  )
}
