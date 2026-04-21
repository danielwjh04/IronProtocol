import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import CoreIgnition from './components/CoreIgnition'
import TabBar from './components/nav/TabBar'
import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
import { HeroOverlay } from './components/hero/HeroOverlay'
import { UIModeProvider, useUIMode } from './context/UIModeContext'
import { db } from './db/db'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import RoutinesPage from './pages/RoutinesPage'
import SettingsPage from './pages/SettingsPage'

type RoutePath = '/' | '/history' | '/routines' | '/settings'

function resolveRoute(pathname: string): RoutePath {
  if (pathname === '/history') {
    return '/history'
  }
  if (pathname === '/routines') {
    return '/routines'
  }
  if (pathname === '/settings') {
    return '/settings'
  }
  return '/'
}

function HeroOverlayWithBoundary() {
  const { setUIMode } = useUIMode()
  return (
    <HeroErrorBoundary onFallback={() => {
      setUIMode('focus')
      toast.error('Hero overlay crashed — switched to Focus Mode', { duration: 4000 })
    }}>
      <HeroOverlay />
    </HeroErrorBoundary>
  )
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() => resolveRoute(window.location.pathname))
  const [isIgniting, setIsIgniting] = useState(true)

  useEffect(() => {
    const handlePopState = () => setRoute(resolveRoute(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleNavigate = useCallback((path: string): void => {
    const nextRoute = resolveRoute(path)
    setRoute((current) => {
      if (nextRoute === current) {
        return current
      }
      window.history.pushState({}, '', nextRoute)
      return nextRoute
    })
  }, [])

  const currentPage = useMemo(() => {
    if (route === '/history') {
      return <HistoryPage db={db} />
    }

    if (route === '/routines') {
      return <RoutinesPage db={db} onNavigate={handleNavigate} />
    }

    if (route === '/settings') {
      return <SettingsPage db={db} />
    }

    return <HomePage db={db} />
  }, [route, handleNavigate])

  return (
    <UIModeProvider>
      <div
        className="relative min-h-svh"
        style={{ backgroundColor: 'var(--color-surface-base)' }}
      >
        <AnimatePresence>
          {isIgniting && (
            <CoreIgnition onComplete={() => setIsIgniting(false)} db={db} />
          )}
        </AnimatePresence>

        {!isIgniting && (
          <>
            {currentPage}
            <TabBar currentPath={route} onNavigate={handleNavigate} />
          </>
        )}

        <HeroOverlayWithBoundary />
      </div>
    </UIModeProvider>
  )
}
