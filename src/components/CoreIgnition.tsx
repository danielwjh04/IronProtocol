import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { IronProtocolDB } from '../db/schema'

interface Props {
  onComplete: () => void
  // `db` is kept for API compatibility; the splash itself no longer uses it.
  db?: IronProtocolDB
}

// ─── Layout constants ──────────────────────────────────────────────────────
// A single source of truth for the bar geometry, in px. Vertical layout is
// manual (explicit `top`) so Framer Motion transforms never fight with
// translateY centering tricks.
const BAR_W = 240
const BAR_H = 80

const ROD = { w: BAR_W - 56 /* inset 28 each side */, h: 4 }
const SLEEVE = { w: 22, h: 14 }
const PLATE = { w: 16, h: 58 }

const ROD_TOP    = (BAR_H - ROD.h)    / 2  // 38
const SLEEVE_TOP = (BAR_H - SLEEVE.h) / 2  // 33
const PLATE_TOP  = (BAR_H - PLATE.h)  / 2  // 11

// ─── Timing map (seconds) ──────────────────────────────────────────────────
const T = {
  rod:      { delay: 0.00, dur: 0.55 },
  sleeve:   { delay: 0.15, dur: 0.40 },
  plateIn:  { delay: 0.55, dur: 0.35 },
  plateOut: { delay: 0.75, dur: 0.35 },
  text:     { delay: 1.00, dur: 0.55 },
  hold:     0.45,
} as const

const TOTAL_MS = Math.round((T.text.delay + T.text.dur + T.hold) * 1000)

// ─── Sub-primitives ────────────────────────────────────────────────────────

function Sleeve({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        top: SLEEVE_TOP,
        [side]: 12,
        width: SLEEVE.w,
        height: SLEEVE.h,
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 3,
          backgroundColor: 'var(--color-text-muted)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: T.sleeve.delay, duration: T.sleeve.dur, ease: 'easeOut' }}
      />
    </div>
  )
}

function Rod() {
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        top: ROD_TOP,
        left: 28,
        right: 28,
        height: ROD.h,
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 2,
          background: 'linear-gradient(90deg, #78787A, #AEAEB2, #78787A)',
          transformOrigin: 'center',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: T.rod.delay, duration: T.rod.dur, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  )
}

function Plate({
  side,
  offsetPx,
  delay,
}: {
  side: 'left' | 'right'
  offsetPx: number
  delay: number
}) {
  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        top: PLATE_TOP,
        [side]: offsetPx,
        width: PLATE.w,
        height: PLATE.h,
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 6,
          backgroundColor: 'var(--color-accent-primary)',
          boxShadow:
            '0 0 22px rgba(48, 209, 88, 0.55), inset 0 0 0 1px rgba(255,255,255,0.18)',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 1], scale: [0.6, 1.08, 1] }}
        transition={{
          delay,
          duration: T.plateIn.dur,
          times: [0, 0.6, 1],
          ease: 'easeOut',
        }}
      />
    </div>
  )
}

function PlateLoadingBar() {
  return (
    <div className="relative" style={{ width: BAR_W, height: BAR_H }}>
      <Sleeve side="left" />
      <Rod />
      {/* Inner plates pop first so the outer ones settle last. */}
      <Plate side="left"  offsetPx={48} delay={T.plateIn.delay} />
      <Plate side="right" offsetPx={48} delay={T.plateIn.delay} />
      <Plate side="left"  offsetPx={68} delay={T.plateOut.delay} />
      <Plate side="right" offsetPx={68} delay={T.plateOut.delay} />
      <Sleeve side="right" />
    </div>
  )
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function CoreIgnition({ onComplete }: Props) {
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), TOTAL_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: 'var(--color-surface-base)' }}
      aria-label="Starting IronProtocol"
      role="status"
    >
      {/* Radial accent halo behind the bar. Pure decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-[44%] rounded-full"
          style={{
            width: 400,
            height: 400,
            marginLeft: -200,
            marginTop: -200,
            background:
              'radial-gradient(circle, rgba(48,209,88,0.22) 0%, rgba(48,209,88,0) 60%)',
            filter: 'blur(24px)',
          }}
        />
      </div>

      <PlateLoadingBar />

      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: T.text.delay, duration: T.text.dur, ease: 'easeOut' }}
      >
        <span
          style={{
            color: 'var(--color-accent-primary)',
            fontFamily:
              '"Geist Mono", "SF Mono", ui-monospace, monospace',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
          }}
        >
          IronProtocol
        </span>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            background:
              'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Load the bar.
        </h1>
      </motion.div>
    </motion.main>
  )
}
