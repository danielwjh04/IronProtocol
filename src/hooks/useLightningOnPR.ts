import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function useLightningOnPR() {
  const [striking, setStriking] = useState(false)
  const seenIds = useRef<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flaggedBests = useLiveQuery(
    () => db.personalBests.filter(pb => pb.flagged === true).toArray(),
    []
  )

  useEffect(() => {
    if (!flaggedBests) return
    const newIds = flaggedBests
      .map(pb => pb.exerciseId)
      .filter(id => !seenIds.current.has(id))
    if (newIds.length === 0) return
    newIds.forEach(id => seenIds.current.add(id))
    setStriking(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setStriking(false), 500)
  }, [flaggedBests])

  return { striking }
}
