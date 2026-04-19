import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { APP_SETTINGS_ID, type HeroTrack } from '../db/schema'
import { computeTrackProgress } from '../services/heroMathService'

export interface TrackProgress {
  power: number
  hypertrophy: number
  active: HeroTrack
}

export function useTrackProgress(): TrackProgress {
  const result = useLiveQuery<TrackProgress>(async () => {
    const [workouts, settings] = await Promise.all([
      db.workouts.toArray(),
      db.settings.get(APP_SETTINGS_ID),
    ])
    const active: HeroTrack = settings?.activeTrack ?? 'power'
    const closedAt = settings?.macrocycleClosedAt
    return {
      power: computeTrackProgress(workouts, active, 'power', Date.now(), closedAt),
      hypertrophy: computeTrackProgress(workouts, active, 'hypertrophy', Date.now(), closedAt),
      active,
    }
  }, [])

  return result ?? { power: 0, hypertrophy: 0, active: 'power' }
}
