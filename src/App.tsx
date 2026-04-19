import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import CalibrateBaselinesCard from './components/CalibrateBaselinesCard'
import CoreIgnition from './components/CoreIgnition'
import DataOwnershipCard from './components/DataOwnershipCard'
import NavDropdown from './components/NavDropdown'
import { HeroErrorBoundary } from './components/UI/HeroErrorBoundary'
import { HeroOverlay } from './components/hero/HeroOverlay'
import { UIModeProvider, useUIMode } from './context/UIModeContext'
import { db } from './db/db'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'

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

  function handleNavigate(path: string): void {
    const nextRoute = resolveRoute(path)
    if (nextRoute === route) {
      return
    }
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
  }

  const currentPage = useMemo(() => {
    if (route === '/history') {
      return <HistoryPage db={db} />
    }

    if (route === '/routines') {
      return (
        <main
          className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-20 pt-16"
          style={{ backgroundColor: 'var(--color-surface-base)' }}
        >
          <h1 className="text-display" style={{ color: 'var(--color-text-primary)' }}>
            Routines
          </h1>
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
            Create and manage training routines. Each routine holds goal, days per week, and cycle length.
          </p>
        </main>
      )
    }

    if (route === '/settings') {
      return (
        <main
          className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-20 pt-16"
          style={{ backgroundColor: 'var(--color-surface-base)' }}
        >
          <motion.section
            whileTap={{ scale: 0.98 }}
            className="rounded-3xl border p-6"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-subtle)',
            }}
          >
            <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
              Settings
            </p>
            <h1 className="text-display mt-3" style={{ color: 'var(--color-text-primary)' }}>
              Routine Preferences
            </h1>
          </motion.section>

          <CalibrateBaselinesCard db={db} />
          <DataOwnershipCard db={db} />
        </main>
      )
    }

    return <HomePage db={db} />
  }, [route])

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
            <NavDropdown currentPath={route} onNavigate={handleNavigate} />
          </>
        )}

        <HeroOverlayWithBoundary />
      </div>
    </UIModeProvider>
  )
}
