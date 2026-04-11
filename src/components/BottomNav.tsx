interface Props {
  currentPath?: string
  onNavigate?: (path: string) => void
}

const NAV_ITEMS = [
  { path: '/', label: 'Home' },
  { path: '/history', label: 'History' },
  { path: '/settings', label: 'Settings' },
] as const

export default function BottomNav({ currentPath = '/', onNavigate }: Props) {
  function linkClass(path: string): string {
    const isActive = currentPath === path
    return `flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-all active:scale-[0.98] ${
      isActive
        ? 'text-[#FF6B00]'
        : 'text-zinc-300 hover:text-zinc-100 active:text-[#FF6B00]'
    }`
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 border-t border-zinc-800 bg-[#171717]/90 backdrop-blur-xl safe-area-pb">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.path}
          href={item.path}
          onClick={(event) => {
            if (!onNavigate) {
              return
            }
            event.preventDefault()
            onNavigate(item.path)
          }}
          aria-current={currentPath === item.path ? 'page' : undefined}
          className={linkClass(item.path)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
