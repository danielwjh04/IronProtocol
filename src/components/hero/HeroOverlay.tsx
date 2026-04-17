import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useUIMode } from '../../context/UIModeContext'
import { useCombatTrigger } from '../../hooks/useCombatTrigger'
import { useHitCombo } from '../../hooks/useHitCombo'
import { useTrackProgress } from '../../hooks/useTrackProgress'
import { CombatCanvas } from './CombatCanvas'
import { ComboCounter } from './ComboCounter'
import { DamageNumber } from './DamageNumber'
import { ImpactStars } from './ImpactStars'
import { MasterworkModal } from './MasterworkModal'
import { ObsidianStairs } from './ObsidianStairs'
import { SummitModal } from './SummitModal'

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
  const { comboCount } = useHitCombo()
  const [burst, setBurst] = useState<BurstState | null>(null)
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; value: number; intensity: number }>>([])
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
      const displayValue = pendingBash.tonnage
        ? Math.round(pendingBash.tonnage)
        : Math.round(pendingBash.intensity * 100)
      setDamageNumbers(prev =>
        [...prev, { id: pendingBash.id, value: displayValue, intensity: pendingBash.intensity }].slice(-6)
      )
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
      <SummitModal />
      <MasterworkModal />
      <ComboCounter count={comboCount} />
      <AnimatePresence>
        {damageNumbers.map(d => <DamageNumber key={d.id} {...d} />)}
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
