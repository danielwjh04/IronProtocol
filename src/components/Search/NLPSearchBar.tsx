import { useState } from 'react'

interface NLPSearchBarProps {
  onSelect: (exerciseId: string) => void
  placeholder?: string
}

export function NLPSearchBar({ onSelect: _onSelect, placeholder = 'Try: upper chest with shoulder injury…' }: NLPSearchBarProps) {
  const [query, setQuery] = useState('')

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
        aria-label={placeholder}
      />
    </div>
  )
}
