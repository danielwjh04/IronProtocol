import { Settings } from 'lucide-react'

interface HeaderBarProps {
  sessionLabel: string
  sessionIndex: number
  cycleLength: number
  onOpenSettings: () => void
}

export default function HeaderBar({
  sessionLabel,
  sessionIndex,
  cycleLength,
  onOpenSettings,
}: HeaderBarProps) {
  const position = cycleLength > 0
    ? `Day ${Math.min(sessionIndex + 1, cycleLength)}/${cycleLength}`
    : ''

  return (
    <header
      className="sticky top-0 z-40 flex h-12 w-full items-center justify-between border-b px-4"
      style={{
        backgroundColor: 'var(--color-surface-base)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="text-label truncate uppercase"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {sessionLabel}
        </span>
        {position && (
          <>
            <span
              aria-hidden
              className="text-label"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ·
            </span>
            <span
              className="text-label"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {position}
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings"
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Settings size={24} strokeWidth={1.75} aria-hidden />
      </button>
    </header>
  )
}
