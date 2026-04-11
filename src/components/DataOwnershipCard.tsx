import { motion } from 'framer-motion'
import { useState } from 'react'
import type { IronProtocolDB } from '../db/schema'
import { exportBackup } from '../utils/backup'

interface DataOwnershipCardProps {
  db: IronProtocolDB
}

export default function DataOwnershipCard({ db }: DataOwnershipCardProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function handleExport(): Promise<void> {
    setIsExporting(true)
    setStatusMessage(null)

    try {
      await exportBackup(db)
      setStatusMessage('backup.json downloaded successfully.')
    } catch {
      setStatusMessage('Backup failed. Please retry export.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <motion.section
      whileTap={{ scale: 0.95 }}
      className="rounded-3xl border border-zinc-800 bg-[#171717] p-6 shadow-[0_18px_38px_-24px_rgba(255,107,0,0.9)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">Data Ownership</p>
      <h2 className="mt-3 text-2xl font-black text-zinc-100">Your Data. Your Control.</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-200">
        Export your exercises, workouts, sets, and settings into a portable JSON backup that stays fully offline.
      </p>

      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => {
          void handleExport()
        }}
        disabled={isExporting}
        className="mt-5 h-14 w-full cursor-pointer rounded-3xl bg-[#FF6B00] px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_-18px_rgba(255,107,0,1)] transition-all hover:bg-[#ff7d24] active:scale-[0.98] active:bg-[#e66000] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:shadow-none"
      >
        {isExporting ? 'Exporting Backup...' : 'Download backup.json'}
      </motion.button>

      {statusMessage && (
        <p className="mt-3 text-sm font-semibold text-zinc-200">{statusMessage}</p>
      )}
    </motion.section>
  )
}
