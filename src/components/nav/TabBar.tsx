import React from 'react'
import { motion } from 'framer-motion'

type RoutePath = '/' | '/history' | '/routines' | '/settings'

interface TabBarProps {
  currentPath: RoutePath
  onNavigate: (path: RoutePath) => void
}

interface TabSpec {
  path: RoutePath
  label: string
  Icon: (props: { active: boolean }) => React.ReactElement
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
      />
      <path
        d="M12 8v4l2.5 2.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RoutinesIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
      />
      <path
        d="M3.5 9.5 h17"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
      />
      <path d="M8 3.5 v3" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
      <path d="M16 3.5 v3" stroke="currentColor" strokeWidth={active ? 2 : 1.8} strokeLinecap="round" />
      <circle cx="8" cy="14" r="0.9" fill="currentColor" />
      <circle cx="12" cy="14" r="0.9" fill="currentColor" />
      <circle cx="16" cy="14" r="0.9" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
      />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2L5.1 6l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TABS: readonly TabSpec[] = [
  { path: '/', label: 'Home', Icon: HomeIcon },
  { path: '/history', label: 'History', Icon: HistoryIcon },
  { path: '/routines', label: 'Routines', Icon: RoutinesIcon },
  { path: '/settings', label: 'Settings', Icon: SettingsIcon },
]

export default function TabBar({ currentPath, onNavigate }: TabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto grid w-full max-w-[430px] grid-cols-4 border-t"
      style={{
        height: 'var(--space-tabbar)',
        paddingTop: 'var(--space-1)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--space-3))',
        backgroundColor: 'color-mix(in srgb, var(--color-surface-raised) 85%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {TABS.map((tab) => {
        const active = currentPath === tab.path
        return (
          <motion.button
            key={tab.path}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onNavigate(tab.path)}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-1"
            style={{
              color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
            }}
          >
            <tab.Icon active={active} />
            <span
              className="text-label"
              style={{
                fontSize: '10px',
                letterSpacing: '0.04em',
                fontWeight: active ? 700 : 600,
              }}
            >
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}
