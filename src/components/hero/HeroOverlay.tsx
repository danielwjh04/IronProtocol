import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUIMode } from '../../context/UIModeContext'
import { useCombatTrigger } from '../../hooks/useCombatTrigger'
import { useTrackProgress } from '../../hooks/useTrackProgress'
import { CombatCanvas } from './CombatCanvas'
import { ImpactStars } from './ImpactStars'
import { ObsidianStairs } from './ObsidianStairs'

interface BurstState {
  key:       string
  x:         number
  y:         number
  intensity: number
}

export function HeroOverlay() {
  const { uiMode, pendingBash } = useUIMode()
  useCombatTrigger()
  const track = useTrackProgress()
  const [burst, setBurst] = useState<BurstState | null>(null)
  const lastBurstId = useRef<string | null>(null)

  useEffect(() => {
    if (pendingBash && lastBurstId.current !== pendingBash.id) {
      lastBurstId.current = pendingBash.id
      setBurst({
        key:       pendingBash.id,
        x:         window.innerWidth / 2,
        y:         window.innerHeight / 2,
        intensity: pendingBash.intensity,
      })
    }
  }, [pendingBash])

  function handleBurstDone() {
    setBurst(null)
  }

  if (uiMode !== 'hero') return null

  return (
    <>
      {track.active === 'power' && <ObsidianStairs progress={track.power} />}
      <CombatCanvas />
      <AnimatePresence>
        {burst && (
          <ImpactStars
            key={burst.key}
            originX={burst.x}
            originY={burst.y}
            intensity={burst.intensity}
            onDone={handleBurstDone}
          />
        )}
      </AnimatePresence>
    </>
  )
}
