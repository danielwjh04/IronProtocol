import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import BottomNav from './components/BottomNav'
import CalibrateBaselinesCard from './components/CalibrateBaselinesCard'
import CoreIgnition from './components/CoreIgnition'
import DataOwnershipCard from './components/DataOwnershipCard'
import { db } from './db/db'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'

type RoutePath = '/' | '/history' | '/settings'

function resolveRoute(pathname: string): RoutePath {
  if (pathname === '/history') {
    return '/history'
  }
  if (pathname === '/settings') {
    return '/settings'
  }
  return '/'
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() => resolveRoute(window.location.pathname))
  // Core Ignition: show the boot screen for ~2.5s on first load
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

    if (route === '/settings') {
      return (
        <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 bg-navy px-4 pb-28 pt-5 text-zinc-100">
          <motion.section whileTap={{ scale: 0.95 }} className="rounded-3xl border border-electric/20 bg-navy-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">Settings</p>
            <h1 className="mt-3 text-3xl font-black text-zinc-100">Routine Preferences</h1>
            <p className="mt-3 text-sm text-zinc-200">
              Production controls for offline readiness, export ownership, and portable safety backups.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              className="mt-4 h-11 rounded-2xl border border-electric/20 bg-[#091020] px-4 text-sm font-bold text-zinc-100 transition-colors hover:border-electric/40 active:bg-[#091020]"
            >
              Local Mode Active
            </motion.button>
          </motion.section>

          <CalibrateBaselinesCard db={db} />
          <DataOwnershipCard db={db} />
        </main>
      )
    }

    return <HomePage db={db} />
  }, [route])

  return (
    <div className="relative min-h-svh bg-navy">
      {/* ── Core Ignition boot overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {isIgniting && (
          <CoreIgnition onComplete={() => setIsIgniting(false)} db={db} />
        )}
      </AnimatePresence>

      {/* ── App shell (renders behind ignition; revealed on exit) ────────── */}
      {!isIgniting && (
        <>
          {currentPage}
          <BottomNav currentPath={route} onNavigate={handleNavigate} />
        </>
      )}
    </div>
  )
}
