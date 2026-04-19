import { useState } from 'react'
import { useTrackProgress } from '../../hooks/useTrackProgress'
import { ascend } from '../../services/heroMathService'
import { TrackEndModal } from './TrackEndModal'

interface SummitModalProps {
  onAscend?: () => void
}

export function SummitModal({ onAscend }: SummitModalProps) {
  const track = useTrackProgress()
  const [dismissed, setDismissed] = useState(false)

  const visible = track.power >= 1.0 && !dismissed

  function handleAscend() {
    setDismissed(true)
    ascend()
    onAscend?.()
  }

  return (
    <TrackEndModal
      visible={visible}
      accentColor="#00C7FF"
      accentGlow="rgba(0, 199, 255, 0.35)"
      title="The Summit is Attained"
      description="You have conquered the Power track. Ascend and carry your strength into eternity."
      buttonLabel="Ascend"
      onConfirm={handleAscend}
      onDismiss={() => setDismissed(true)}
    />
  )
}
