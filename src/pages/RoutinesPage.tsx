import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import RoutineEditor from '../components/routines/RoutineEditor'
import type { IronProtocolDB, Routine } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

export default function RoutinesPage({ db }: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Routine | undefined>(undefined)

  const routines = useLiveQuery(
    async () => {
      const rows = await db.routines.toArray()
      return rows.sort((left, right) => right.createdAt - left.createdAt)
    },
    [db],
    [] as Routine[],
  )

  async function activateRoutine(routineId: string): Promise<void> {
    await db.transaction('rw', db.routines, async () => {
      const all = await db.routines.toArray()
      for (const row of all) {
        const nextActive: 0 | 1 = row.id === routineId ? 1 : 0
        if (row.isActive !== nextActive) {
          await db.routines.update(row.id, { isActive: nextActive })
        }
      }
    })
  }

  function openEditor(routine?: Routine): void {
    setEditing(routine)
    setEditorOpen(true)
  }

  function closeEditor(): void {
    setEditorOpen(false)
    setEditing(undefined)
  }

  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-20 pt-16"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-label"
            style={{ color: 'var(--color-accent-primary)' }}
          >
            Plan
          </p>
          <h1
            className="text-display mt-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Routines
          </h1>
        </div>
      </div>

      {routines && routines.length === 0 && (
        <div
          className="rounded-3xl border p-6 text-center"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-subtle)',
          }}
        >
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
            No routines yet. Create one to start.
          </p>
        </div>
      )}

      {routines && routines.length > 0 && (
        <div className="flex flex-col gap-3">
          {routines.map((routine) => {
            const active = routine.isActive === 1
            return (
              <motion.div
                key={routine.id}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col gap-2 rounded-3xl border p-5"
                style={{
                  backgroundColor: 'var(--color-surface-raised)',
                  borderColor: active
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-border-subtle)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      className="text-display"
                      style={{
                        color: 'var(--color-text-primary)',
                        fontSize: '1.25rem',
                      }}
                    >
                      {routine.name}
                    </h2>
                    <p
                      className="text-label mt-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {routine.goal} · {routine.daysPerWeek}×/week · {routine.cycleLengthWeeks}w cycle
                    </p>
                  </div>
                  {active && (
                    <span
                      className="text-label rounded-full px-3 py-1"
                      style={{
                        backgroundColor: 'var(--color-accent-primary)',
                        color: 'white',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(routine)}
                    className="text-label rounded-2xl border px-3 py-2"
                    style={{
                      borderColor: 'var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Edit
                  </button>
                  {!active && (
                    <button
                      type="button"
                      onClick={() => { void activateRoutine(routine.id) }}
                      className="text-label rounded-2xl px-3 py-2 text-white"
                      style={{ backgroundColor: 'var(--color-accent-primary)' }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => openEditor()}
        aria-label="Create routine"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_18px_38px_-14px_rgba(0,0,0,0.7)]"
        style={{ backgroundColor: 'var(--color-accent-primary)' }}
      >
        <Plus size={24} strokeWidth={2.2} aria-hidden />
      </motion.button>

      <RoutineEditor
        db={db}
        open={editorOpen}
        initial={editing}
        onClose={closeEditor}
        onSaved={closeEditor}
      />
    </main>
  )
}
