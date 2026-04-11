import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'

interface FeaturePulseProps {
  title: string
  message: string
  pulseAriaLabel: string
  isVisible: boolean
  isCleared: boolean
  onClear: () => void
  autoOpen?: boolean
  portalTop?: number
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  className?: string
}

export default function FeaturePulse({
  title,
  message,
  pulseAriaLabel,
  isVisible,
  isCleared,
  onClear,
  autoOpen = false,
  portalTop = 160,
  actionLabel,
  onAction,
  showAction = true,
  className,
}: FeaturePulseProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [tooltipAnchor, setTooltipAnchor] = useState({ top: portalTop, left: 0 })
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const tooltipId = useId()
  const tooltipTitleId = `${tooltipId}-title`
  const tooltipMessageId = `${tooltipId}-message`

  useEffect(() => {
    if (autoOpen || !isOpen) {
      return undefined
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [autoOpen, isOpen])

  useEffect(() => {
    if (!isClearing) {
      return undefined
    }

    const timerId = window.setTimeout(() => {
      onClear()
      setIsClearing(false)
    }, 220)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [isClearing, onClear])

  function handleDismiss(): void {
    setIsOpen(false)
    setIsClearing(true)
  }

  function handleAction(): void {
    if (onAction) {
      onAction()
      return
    }

    if (autoOpen) {
      onClear()
      return
    }

    handleDismiss()
  }

  const tooltipOpen = autoOpen || isOpen

  useEffect(() => {
    if (!tooltipOpen || autoOpen || !triggerRef.current) {
      return undefined
    }

    function updateTooltipAnchor(): void {
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      if (!triggerRect) {
        return
      }

      setTooltipAnchor({
        top: triggerRect.bottom + 12,
        left: triggerRect.left + (triggerRect.width / 2),
      })
    }

    updateTooltipAnchor()
    window.addEventListener('resize', updateTooltipAnchor)
    window.addEventListener('scroll', updateTooltipAnchor, true)

    return () => {
      window.removeEventListener('resize', updateTooltipAnchor)
      window.removeEventListener('scroll', updateTooltipAnchor, true)
    }
  }, [autoOpen, tooltipOpen])

  const portalTarget = typeof document !== 'undefined' ? document.body : null

  if (!isVisible || isCleared) {
    return null
  }

  return (
    <div className={className ?? ''}>
      {!autoOpen && (
        <motion.button
          ref={triggerRef}
          type="button"
          aria-label={pulseAriaLabel}
          aria-expanded={isOpen}
          aria-controls={tooltipId}
          onClick={() => setIsOpen((current) => !current)}
          className="relative z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#6b90ff] bg-[#3B71FE] text-white shadow-[0_8px_18px_-12px_rgba(59,113,254,0.9)] active:scale-[0.94] active:bg-[#2860ee]"
          animate={
            isClearing
              ? { scale: [1, 1.2, 0.4], opacity: [1, 1, 0] }
              : { scale: [1, 1.07, 1] }
          }
          transition={
            isClearing
              ? { duration: 0.16, ease: 'easeOut' }
              : { duration: 1.2, repeat: Number.POSITIVE_INFINITY, repeatType: 'mirror', ease: 'easeInOut' }
          }
        >
          <motion.span
            className="absolute inset-0 rounded-full border border-[#6b90ff]"
            animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' }}
          />
          <span aria-hidden="true" className="relative text-lg leading-none">+</span>
        </motion.button>
      )}

      {portalTarget && createPortal(
        <AnimatePresence mode="wait">
          {tooltipOpen && (
            <motion.div
              id={tooltipId}
              role="dialog"
              aria-modal="false"
              aria-labelledby={tooltipTitleId}
              aria-describedby={tooltipMessageId}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={
                autoOpen
                  ? { top: `${portalTop}px` }
                  : { top: `${tooltipAnchor.top}px`, left: `${tooltipAnchor.left}px`, transform: 'translateX(-50%)' }
              }
              className={`fixed z-[9999] w-[calc(100vw-2rem)] rounded-3xl border border-[#1a2a5e] bg-[#0D1626] p-4 text-left shadow-[0_20px_42px_-28px_rgba(59,113,254,0.6)] ${
                autoOpen
                  ? 'left-1/2 max-w-[398px] -translate-x-1/2'
                  : 'max-w-[340px]'
              }`}
            >
              <p id={tooltipTitleId} className="text-sm font-black uppercase tracking-[0.16em] text-[#3B71FE]">
                {title}
              </p>
              <p id={tooltipMessageId} className="mt-2 text-sm leading-relaxed text-zinc-200">
                {message}
              </p>
              {showAction && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAction}
                    className="h-9 cursor-pointer rounded-2xl bg-[#3B71FE] px-4 text-xs font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#5585ff] active:bg-[#2860ee]"
                  >
                    {actionLabel ?? 'Got It'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget,
      )}
    </div>
  )
}
