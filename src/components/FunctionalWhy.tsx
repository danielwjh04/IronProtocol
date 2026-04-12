import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { getFunctionalInfo } from '../data/functionalMapping'

interface Props {
  exerciseName: string
}

// ── Anatomy placeholder ─────────────────────────────────────────────────────
// Replaced by a real 3D SVG viewer in a future phase.
// formGuard=false → correct execution (torso highlight = Electric Blue)
// formGuard=true  → common-mistake view (error joints pulse Soft Pink)
function AnatomyPlaceholder({
  anatomyKey,
  formGuard,
}: {
  anatomyKey: string
  formGuard: boolean
}) {
  const accentColor = formGuard ? '#FF89D6' : '#3B71FE'
  const accentOpacity = formGuard ? '0.75' : '0.5'

  return (
    <div
      aria-label={`${formGuard ? 'Form Guard — common mistake' : '3D anatomy diagram'} for ${anatomyKey}`}
      className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-[#0A0E1A]/15 bg-[#0A0E1A]/6"
    >
      {/* Simplified human silhouette */}
      <svg
        viewBox="0 0 64 80"
        width="56"
        height="70"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle cx="32" cy="9" r="8" fill="#0A0E1A" opacity="0.25" />
        {/* Torso — highlighted with accent color */}
        <motion.rect
          x="22" y="20" width="20" height="22" rx="4"
          fill={accentColor}
          opacity={accentOpacity}
          animate={formGuard ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0.5 }}
          transition={formGuard ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {}}
        />
        {/* Left arm */}
        <rect x="10" y="20" width="10" height="18" rx="4" fill="#0A0E1A" opacity="0.2" />
        {/* Right arm */}
        <rect x="44" y="20" width="10" height="18" rx="4" fill="#0A0E1A" opacity="0.2" />
        {/* Left leg */}
        <rect x="20" y="44" width="10" height="24" rx="4" fill="#0A0E1A" opacity="0.2" />
        {/* Right leg */}
        <rect x="34" y="44" width="10" height="24" rx="4" fill="#0A0E1A" opacity="0.2" />

        {/* Form Guard: error joint indicators pulse Pink on knees/shoulders */}
        {formGuard && (
          <>
            <motion.circle
              cx="10" cy="22" r="4" fill="#FF89D6"
              animate={{ opacity: [0.3, 1, 0.3], r: [3, 5, 3] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="54" cy="22" r="4" fill="#FF89D6"
              animate={{ opacity: [0.3, 1, 0.3], r: [3, 5, 3] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
            />
          </>
        )}
      </svg>

      {/* Label */}
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#0A0E1A]/40">
        {formGuard ? 'Mistake' : '3D · Soon'}
      </p>
    </div>
  )
}

// ── Anatomy Video Player ───────────────────────────────────────────────────
// Tries to load the .mp4 from public/assets/exercises. 
// If it fails (e.g., video not generated yet), it falls back to the SVG.
function AnatomyVideo({
  anatomyKey,
  formGuard,
}: {
  anatomyKey: string
  formGuard: boolean
}) {
  const [videoError, setVideoError] = useState(false)
  
  // Construct the exact file path based on our naming convention
  const videoSrc = `/assets/exercises/${anatomyKey}-${formGuard ? 'mistake' : 'correct'}.webm`

  // Reset the error state if the user swaps exercises or toggles the guard
  useEffect(() => {
    setVideoError(false)
  }, [videoSrc])

  if (videoError) {
    return <AnatomyPlaceholder anatomyKey={anatomyKey} formGuard={formGuard} />
  }

  return (
    <div className={`relative flex h-32 w-32 overflow-hidden rounded-full border-2 transition-colors duration-500 ${formGuard ? 'border-pink bg-pink/10' : 'border-[#0A0E1A]/15 bg-[#0A0E1A]/6'}`}>
      <video
        key={videoSrc} // Forces video to reload when src changes
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline // Crucial for iOS so it doesn't open full-screen
        onError={() => setVideoError(true)}
        className="h-full w-full object-cover"
        aria-label={`${formGuard ? 'Mistake' : 'Correct'} execution for ${anatomyKey}`}
      />
    </div>
  )
}

/**
 * FunctionalWhy — Educational Mode panel with Form Guard toggle.
 *
 * Normal mode  → correct execution cue, Electric Blue accent.
 * Form Guard   → common-mistake view, Soft Pink (#FF89D6) error pulse.
 *
 * Rendered inside AnimatePresence in ActiveLogger so it enters/exits with a
 * smooth height-based slide. The `layout` prop on sibling sections ensures
 * the inputs below are pushed down without a jump.
 */
export default function FunctionalWhy({ exerciseName }: Props) {
  const info = getFunctionalInfo(exerciseName)
  const [formGuard, setFormGuard] = useState(false)

  return (
    <motion.div
      key="functional-why"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
      layout
    >
      <div
        className={`rounded-3xl px-5 py-5 transition-colors duration-500 ${
          formGuard ? 'bg-[#1a0a10]' : 'bg-zinc-50'
        }`}
      >
        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors duration-500 ${
              formGuard ? 'bg-pink' : 'bg-electric'
            }`}
          >
            {formGuard ? 'Form Guard' : 'Educational Mode'}
          </span>

          {/* ── Form Guard toggle ─────────────────────────────────────────── */}
          <button
            type="button"
            role="switch"
            aria-checked={formGuard}
            aria-label="Toggle Form Guard — common mistake view"
            onClick={() => setFormGuard(prev => !prev)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink ${
              formGuard
                ? 'border-pink bg-pink/20'
                : 'border-electric/40 bg-electric/10'
            }`}
          >
            <motion.span
              aria-hidden="true"
              className={`h-5 w-5 rounded-full shadow-md transition-colors duration-300 ${
                formGuard ? 'bg-pink' : 'bg-electric'
              }`}
              animate={{ x: formGuard ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            />
          </button>
        </div>

        {/* ── Anatomy model + cue ───────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4">
          <AnatomyVideo
            anatomyKey={info?.anatomyKey ?? exerciseName.toLowerCase().replace(/\s+/g, '-')}
            formGuard={formGuard}
          />

          <AnimatePresence mode="wait" initial={false}>
            {formGuard ? (
              <motion.p
                key="mistake-cue"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-center text-base font-bold leading-snug text-pink"
              >
                {info?.commonMistake ?? `Common mistake: collapsing form under load on ${exerciseName}.`}
              </motion.p>
            ) : (
              <motion.p
                key="purpose-cue"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-center text-base font-bold leading-snug text-navy"
              >
                {info?.purpose ?? (
                  <span className="text-sm font-semibold text-navy/60">
                    No functional data yet for <strong>{exerciseName}</strong>.
                  </span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer badge ──────────────────────────────────────────────── */}
        {info && (
          <p
            className={`mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-500 ${
              formGuard ? 'text-pink/50' : 'text-navy/35'
            }`}
          >
            {formGuard ? 'Error joints · ' : 'Anatomy ref · '}
            {info.anatomyKey}
          </p>
        )}
      </div>
    </motion.div>
  )
}
