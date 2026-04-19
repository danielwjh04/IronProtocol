import { AnimatePresence, motion } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="confirm-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="fixed inset-0 z-[70] bg-black/70"
            aria-hidden
          />
          <motion.div
            key="confirm-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-x-0 top-1/2 z-[80] mx-auto w-[92%] max-w-[360px] -translate-y-1/2 rounded-3xl border p-5"
            style={{
              backgroundColor: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-strong)',
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
          >
            <h2
              id="confirm-title"
              className="text-display"
              style={{ color: 'var(--color-text-primary)', fontSize: '1.25rem' }}
            >
              {title}
            </h2>
            <p
              id="confirm-message"
              className="text-body mt-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {message}
            </p>
            <div className="mt-5 flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onCancel}
                className="text-label h-11 flex-1 rounded-2xl border px-4"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onConfirm}
                className="text-label h-11 flex-[1.3] rounded-2xl px-4 text-white"
                style={{
                  backgroundColor: destructive
                    ? '#B91C1C'
                    : 'var(--color-accent-primary)',
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
