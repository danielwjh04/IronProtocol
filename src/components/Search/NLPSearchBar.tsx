import { useEffect, useRef, useState } from 'react'
import { subscribeToModelLoading } from '../../services/localAIService'
import { searchExercises } from '../../services/exerciseSearchService'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

type SearchResult = Awaited<ReturnType<typeof searchExercises>>[number]

interface NLPSearchBarProps {
  onSelect: (exerciseId: string) => void
  placeholder?: string
}

export function NLPSearchBar({ onSelect, placeholder = 'Try: upper chest with shoulder injury…' }: NLPSearchBarProps) {
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex]   = useState(-1)
  const [modelLoading, setModelLoading] = useState(false)
  const activeQuery                     = useRef('')
  const debouncedQuery                  = useDebouncedValue(query, 300)

  useEffect(() => subscribeToModelLoading((loading) => setModelLoading(loading)), [])

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return }
    activeQuery.current = debouncedQuery
    searchExercises(debouncedQuery).then(res => {
      if (activeQuery.current === debouncedQuery) setResults(res)
    })
  }, [debouncedQuery])

  useEffect(() => setActiveIndex(-1), [results])

  function handleSelect(id: string) {
    onSelect(id)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative w-full">
      {modelLoading && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300">Brain Initializing…</span>
        </div>
      )}
      <input
        type="text"
        value={query}
        disabled={modelLoading}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') { setQuery(''); setResults([]) }
          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
          if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
          if (e.key === 'Enter' && activeIndex >= 0) handleSelect(results[activeIndex].exerciseId)
        }}
        placeholder={modelLoading ? 'Loading AI model…' : placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50"
        aria-label={placeholder}
      />
      {results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
          style={{ maxHeight: '60vh' }}
        >
          {results.map((r, idx) => {
            const pct    = Math.round(((r.score + 1) / 2) * 100)
            const colour = pct >= 85 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
            const active = idx === activeIndex
            return (
              <li
                key={r.exerciseId}
                role="option"
                aria-selected={active}
                tabIndex={0}
                className={`flex cursor-pointer items-center justify-between px-4 py-3 outline-none ${active ? 'bg-slate-700' : 'hover:bg-slate-800 focus:bg-slate-800'}`}
                onClick={() => handleSelect(r.exerciseId)}
                onKeyDown={e => { if (e.key === 'Enter') handleSelect(r.exerciseId) }}
              >
                <span className="truncate text-sm font-semibold text-white">{r.name}</span>
                <span className={`ml-3 shrink-0 text-xs font-bold ${colour}`}>{pct}% Match</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
