import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUIMode } from '../../context/UIModeContext'
import { CombatCanvas } from './CombatCanvas'
import { ImpactStars } from './ImpactStars'

interface BurstState {
  key: string
  x: number
  y: number
}

export function HeroOverlay() {
  const { uiMode, pendingBash } = useUIMode()
  const [burst, setBurst] = useState<BurstState | null>(null)

  if (uiMode !== 'hero') return null

  function handleBurstDone() {
    setBurst(null)
  }

  if (pendingBash && burst?.key !== pendingBash.id) {
    setBurst({ key: pendingBash.id, x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }

  return (
    <>
      <CombatCanvas />
      <AnimatePresence>
        {burst && (
          <ImpactStars
            key={burst.key}
            originX={burst.x}
            originY={burst.y}
            onDone={handleBurstDone}
          />
        )}
      </AnimatePresence>
    </>
  )
}
