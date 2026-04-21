import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIMode } from '../../context/UIModeContext'
import { useCombatTrigger } from '../../hooks/useCombatTrigger'
import { useHitCombo } from '../../hooks/useHitCombo'
import { useSensoryFeedback } from '../../hooks/useSensoryFeedback'
import { useTrackProgress } from '../../hooks/useTrackProgress'
import { CombatCanvas } from './CombatCanvas'
import { ComboCounter } from './ComboCounter'
import { DamageNumber } from './DamageNumber'
import { MasterworkModal } from './MasterworkModal'
import { ObsidianStairs } from './ObsidianStairs'
import { TheForge } from './TheForge'
import { PrestigeFlash } from './PrestigeFlash'
import { SummitModal } from './SummitModal'

export function HeroOverlay() {
  const { uiMode, pendingBash } = useUIMode()
  useCombatTrigger()
  const track = useTrackProgress()
  const { comboCount } = useHitCombo()
  const { crunch, heavyDouble } = useSensoryFeedback()
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: string; value: number; intensity: number; offsetX: number }>>([])
  const lastBurstId = useRef<string | null>(null)
  const [prestigeFlashActive, setPrestigeFlashActive] = useState(false)

  useEffect(() => {
    if (pendingBash && lastBurstId.current !== pendingBash.id) {
      lastBurstId.current = pendingBash.id
      const displayValue = pendingBash.tonnage
        ? Math.round(pendingBash.tonnage)
        : Math.round(pendingBash.intensity * 100)
      const offsetX = (Math.random() - 0.5) * 60
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pendingBash is an event-like signal guarded by lastBurstId ref; functional update is intentional
      setDamageNumbers(prev =>
        [...prev, { id: pendingBash.id, value: displayValue, intensity: pendingBash.intensity, offsetX }].slice(-6)
      )
    }
  }, [pendingBash])

  if (uiMode !== 'hero') return null

  return (
    <>
      <AnimatePresence mode="wait">
        {track.active === 'power' ? (
          <motion.div
            key="stairs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ObsidianStairs progress={track.power} />
          </motion.div>
        ) : (
          <motion.div
            key="forge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TheForge />
          </motion.div>
        )}
      </AnimatePresence>
      <CombatCanvas
        onStrike={(intensity) => {
          crunch(intensity)
          if (intensity > 0.7) heavyDouble()
        }}
      />
      <SummitModal onAscend={() => setPrestigeFlashActive(true)} />
      <MasterworkModal onPrestige={() => setPrestigeFlashActive(true)} />
      <PrestigeFlash active={prestigeFlashActive} onDone={() => setPrestigeFlashActive(false)} />
      <ComboCounter count={comboCount} />
      <AnimatePresence>
        {damageNumbers.map(d => <DamageNumber key={d.id} {...d} />)}
      </AnimatePresence>
    </>
  )
}
