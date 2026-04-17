import { useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface ObsidianStairsProps {
  progress: number
  onLightning?: boolean
}

export function ObsidianStairs({ progress, onLightning = false }: ObsidianStairsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const canPointer = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches

  const fogX  = useTransform(mouseX, [-1, 1], canPointer ? [-15, 15] : [0, 0])
  const fogY  = useTransform(mouseY, [-1, 1], canPointer ? [-8,  8]  : [0, 0])
  const strsX = useTransform(mouseX, [-1, 1], canPointer ? [-35, 35] : [0, 0])
  const strsY = useTransform(mouseY, [-1, 1], canPointer ? [-20, 20] : [0, 0])
  const voidX = useTransform(mouseX, [-1, 1], canPointer ? [-70, 70] : [0, 0])
  const voidY = useTransform(mouseY, [-1, 1], canPointer ? [-40, 40] : [0, 0])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canPointer || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    mouseX.set(((e.clientX - r.left) / r.width) * 2 - 1)
    mouseY.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        data-testid="layer-void"
        className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-black"
        style={{
          x: voidX, y: voidY,
          filter: onLightning ? 'brightness(2.5)' : 'brightness(1)',
          transition: onLightning ? 'filter 0.1s' : undefined,
        }}
      />
      <motion.div
        data-testid="layer-stairs"
        className="absolute inset-0 flex items-end justify-center"
        style={{ x: strsX, y: strsY, opacity: 0.3 + progress * 0.7 }}
      >
        <div className="h-3/4 w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(99,102,241,0.25),transparent)]" />
      </motion.div>
      <motion.div
        data-testid="layer-fog"
        className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"
        style={{ x: fogX, y: fogY }}
      />
    </div>
  )
}
