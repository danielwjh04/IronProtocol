import type { AppSettings, Exercise, IronProtocolDB, Workout, WorkoutSet } from '../db/schema'

export interface BackupPayload {
  exportedAt: number
  exercises: Exercise[]
  workouts: Workout[]
  sets: WorkoutSet[]
  settings: AppSettings[]
}

export async function buildBackupPayload(db: IronProtocolDB): Promise<BackupPayload> {
  const [exercises, workouts, sets, settings] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.sets.toArray(),
    db.settings.toArray(),
  ])

  return {
    exportedAt: Date.now(),
    exercises,
    workouts,
    sets,
    settings,
  }
}

export async function serializeBackup(db: IronProtocolDB): Promise<string> {
  const payload = await buildBackupPayload(db)
  return JSON.stringify(payload, null, 2)
}

export function downloadBackupJson(serializedPayload: string): void {
  const blob = new Blob([serializedPayload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'backup.json'
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function exportBackup(db: IronProtocolDB): Promise<void> {
  const serializedPayload = await serializeBackup(db)
  downloadBackupJson(serializedPayload)
}
