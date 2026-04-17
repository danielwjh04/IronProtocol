import { useEffect, useRef, useState } from 'react'
import { useUIMode } from '../context/UIModeContext'

const COMBO_WINDOW_MS = 180_000

export function useHitCombo() {
  const { pendingBash } = useUIMode()
  const [comboCount, setComboCount] = useState(0)
  const lastId    = useRef<string | null>(null)
  const expiresAt = useRef<number>(0)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!pendingBash || pendingBash.id === lastId.current) return
    lastId.current = pendingBash.id
    const now = Date.now()
    if (now > expiresAt.current) {
      setComboCount(1)
    } else {
      setComboCount(prev => prev + 1)
    }
    expiresAt.current = now + COMBO_WINDOW_MS
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setComboCount(0), COMBO_WINDOW_MS)
  }, [pendingBash])

  return { comboCount }
}
