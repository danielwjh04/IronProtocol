import { AnimatePresence, motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useUIMode } from '../context/UIModeContext'

interface NavDropdownProps {
  currentPath: string
  onNavigate: (path: string) => void
}

interface NavItem {
  path: string
  label: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Home' },
  { path: '/history', label: 'History' },
  { path: '/routines', label: 'Routines' },
  { path: '/settings', label: 'Settings' },
]

export default function NavDropdown({ currentPath, onNavigate }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const { uiMode, setUIMode } = useUIMode()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    function handleClick(event: MouseEvent): void {
      const target = event.target as Node | null
      if (!target) {
        return
      }
      if (panelRef.current?.contains(target)) {
        return
      }
      if (buttonRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('mousedown', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  function selectPath(path: string): void {
    setOpen(false)
    onNavigate(path)
  }

  function toggleMode(): void {
    setUIMode(uiMode === 'hero' ? 'focus' : 'hero')
    setOpen(false)
  }

  return (
    <div className="fixed left-4 top-4 z-[60]">
      <motion.button
        ref={buttonRef}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open navigation menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border"
        style={{
          backgroundColor: 'var(--color-surface-base)',
          borderColor: 'var(--color-border-strong)',
          color: 'var(--color-text-primary)',
        }}
      >
        <Menu size={22} strokeWidth={1.75} aria-hidden />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="nav-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            role="menu"
            className="mt-2 flex w-52 flex-col overflow-hidden rounded-2xl border shadow-[0_18px_36px_-20px_rgba(0,0,0,0.8)]"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-strong)',
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = currentPath === item.path
              return (
                <button
                  key={item.path}
                  type="button"
                  role="menuitem"
                  onClick={() => selectPath(item.path)}
                  className="text-body flex items-center justify-between px-4 py-3 text-left"
                  style={{
                    backgroundColor: active
                      ? 'var(--color-surface-base)'
                      : 'transparent',
                    color: active
                      ? 'var(--color-accent-primary)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="text-label"
                      style={{ color: 'var(--color-accent-primary)' }}
                    >
                      ·
                    </span>
                  )}
                </button>
              )
            })}
            <div
              className="h-px w-full"
              style={{ backgroundColor: 'var(--color-border-subtle)' }}
            />
            <button
              type="button"
              role="menuitem"
              onClick={toggleMode}
              className="text-body flex items-center justify-between px-4 py-3 text-left"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span>{uiMode === 'hero' ? 'Focus Mode' : 'Hero Mode'}</span>
              <span
                className="text-label uppercase"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {uiMode}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
