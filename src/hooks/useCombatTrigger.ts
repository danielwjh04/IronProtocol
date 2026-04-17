import { useUIMode } from '../context/UIModeContext'

export function useCombatTrigger() {
  const { uiMode, dispatchCombat } = useUIMode()

  function triggerBash(weight: number, reps: number): void {
    if (uiMode !== 'hero') return
    const intensity = Math.min((weight * reps) / 2000, 1)
    navigator.vibrate?.([intensity > 0.7 ? 120 : 60, 30, 40])
    dispatchCombat(intensity)
  }

  return { triggerBash }
}
