import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type UIMode = 'focus' | 'hero'

interface PendingBash {
  intensity: number
  id: string
  tonnage?: number
}

interface UIModeContextValue {
  uiMode: UIMode
  setUIMode: (mode: UIMode) => void
  dispatchCombat: (intensity: number, tonnage?: number) => void
  pendingBash: PendingBash | null
}

const LS_KEY = 'ip_ui_mode'

function readPersistedMode(): UIMode {
  try {
    return localStorage.getItem(LS_KEY) === 'hero' ? 'hero' : 'focus'
  } catch {
    return 'focus'
  }
}

const UIModeContext = createContext<UIModeContextValue | null>(null)

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [uiMode, setUIModeState] = useState<UIMode>(readPersistedMode)
  const [pendingBash, setPendingBash] = useState<PendingBash | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-mode', uiMode)
    document.documentElement.classList.add('pixel-fade')
    const t = setTimeout(() => document.documentElement.classList.remove('pixel-fade'), 500)
    return () => clearTimeout(t)
  }, [uiMode])

  const setUIMode = useCallback((mode: UIMode) => {
    setUIModeState(mode)
    try {
      localStorage.setItem(LS_KEY, mode)
    } catch {}
  }, [])

  const dispatchCombat = useCallback((intensity: number, tonnage?: number) => {
    setPendingBash({ intensity, id: crypto.randomUUID(), ...(tonnage !== undefined ? { tonnage } : {}) })
  }, [])

  return (
    <UIModeContext.Provider value={{ uiMode, setUIMode, dispatchCombat, pendingBash }}>
      {children}
    </UIModeContext.Provider>
  )
}

export function useUIMode(): UIModeContextValue {
  const ctx = useContext(UIModeContext)
  if (!ctx) throw new Error('useUIMode must be used within UIModeProvider')
  return ctx
}
