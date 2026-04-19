import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import CalibrateBaselinesCard from '../components/CalibrateBaselinesCard'
import {
  APP_SETTINGS_ID,
  createDefaultV11PromptContract,
  type IronProtocolDB,
  type V11EquipmentAvailability,
} from '../db/schema'

interface Props {
  db: IronProtocolDB
}

const EQUIPMENT_OPTIONS: Array<{ value: V11EquipmentAvailability; label: string; helper: string }> = [
  { value: 'bodyweight-only', label: 'Bodyweight Only', helper: 'No external load — bands + BW selections.' },
  { value: 'commercial-gym',  label: 'Gym Access',      helper: 'Full commercial-gym selection pool.' },
]

export default function SettingsPage({ db }: Props) {
  const settings = useLiveQuery(() => db.settings.get(APP_SETTINGS_ID), [db])
  const contract = settings?.v11PromptContract ?? createDefaultV11PromptContract()

  const equipment  = contract.equipmentAvailability ?? 'commercial-gym'

  async function handleEquipmentChange(next: V11EquipmentAvailability) {
    if (!settings) return
    const nextContract = {
      ...contract,
      equipmentAvailability: next,
    }
    await db.settings.put({ ...settings, v11PromptContract: nextContract })
  }

  const sectionClass = 'rounded-3xl border p-5'
  const sectionStyle = {
    backgroundColor: 'var(--color-surface-raised)',
    borderColor:     'var(--color-border-subtle)',
  }

  return (
    <main
      className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col gap-4 px-4 pb-24 pt-16"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
    >
      <header>
        <p className="text-label" style={{ color: 'var(--color-accent-primary)' }}>
          Controls
        </p>
        <h1 className="text-display mt-2" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </h1>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className={sectionClass}
        style={sectionStyle}
      >
        <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
          Planner Defaults
        </p>
        <h2 className="text-display mt-2" style={{ color: 'var(--color-text-primary)' }}>
          Equipment
        </h2>

        <div className="mt-5 flex gap-2">
          {EQUIPMENT_OPTIONS.map((option) => {
            const isActive = equipment === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => void handleEquipmentChange(option.value)}
                aria-pressed={isActive}
                className="flex-1 rounded-2xl border px-4 py-3 text-left transition-colors"
                style={{
                  borderColor: isActive
                    ? 'var(--color-accent-primary)'
                    : 'var(--color-border-subtle)',
                  backgroundColor: isActive
                    ? 'var(--color-accent-soft)'
                    : 'var(--color-surface-base)',
                }}
              >
                <p
                  className="text-body"
                  style={{
                    color: isActive
                      ? 'var(--color-accent-primary)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {option.label}
                </p>
                <p
                  className="text-label mt-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {option.helper}
                </p>
              </button>
            )
          })}
        </div>
      </motion.section>

      <div
        className="h-px"
        style={{ backgroundColor: 'var(--color-border-subtle)' }}
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.05 }}
        className={sectionClass}
        style={sectionStyle}
      >
        <p className="text-label" style={{ color: 'var(--color-text-secondary)' }}>
          Your Numbers
        </p>
        <h2 className="text-display mt-2" style={{ color: 'var(--color-text-primary)' }}>
          Baselines
        </h2>
        <div className="mt-4">
          <CalibrateBaselinesCard db={db} />
        </div>
      </motion.section>
    </main>
  )
}
