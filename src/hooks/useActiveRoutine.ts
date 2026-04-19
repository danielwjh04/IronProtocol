import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb } from '../db/db'
import type { IronProtocolDB, Routine } from '../db/schema'

export function useActiveRoutine(dbInstance: IronProtocolDB = defaultDb): Routine | null | undefined {
  return useLiveQuery(
    async () => {
      const rows = await dbInstance.routines.where('isActive').equals(1).toArray()
      if (rows.length === 0) {
        return null
      }
      return rows.reduce((latest, candidate) =>
        candidate.createdAt > latest.createdAt ? candidate : latest,
      )
    },
    [dbInstance],
  )
}
