import { useEffect } from 'react'
import { subscribe } from '../events/setCommitEvents'
import { useUIMode } from '../context/UIModeContext'

export function useCombatTrigger(): void {
  const { uiMode, dispatchCombat } = useUIMode()

  useEffect(() => {
    return subscribe((event) => {
      if (uiMode !== 'hero') return
      const intensity = Math.min(event.volume / 2000, 1)
      dispatchCombat(intensity)
    })
  }, [uiMode, dispatchCombat])
}
