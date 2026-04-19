import { useState } from 'react'
import { useHeroProgress } from '../../hooks/useHeroProgress'
import { forgeMasterwork } from '../../services/heroMathService'
import { TrackEndModal } from './TrackEndModal'

interface MasterworkModalProps {
  onPrestige?: () => void
}

export function MasterworkModal({ onPrestige }: MasterworkModalProps) {
  const { progress } = useHeroProgress()
  const [dismissed, setDismissed] = useState(false)

  const visible = progress >= 1.0 && !dismissed

  function handlePrestige() {
    void forgeMasterwork()
    onPrestige?.()
    setDismissed(true)
  }

  return (
    <TrackEndModal
      visible={visible}
      accentColor="#FF6B00"
      accentGlow="rgba(255, 107, 0, 0.4)"
      title="The Forge is Complete"
      description="You have mastered the Hypertrophy track. Forge your Masterwork and begin the next cycle — stronger."
      buttonLabel="Forge Masterwork"
      onConfirm={handlePrestige}
      onDismiss={() => setDismissed(true)}
    />
  )
}
