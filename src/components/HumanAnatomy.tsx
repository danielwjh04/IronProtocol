import { motion } from 'framer-motion'
import { useState } from 'react'
import type { MuscleId, JointId } from '../data/functionalMapping'

interface Props {
  primaryMuscles: MuscleId[]
  secondaryMuscles: MuscleId[]
  injuryRiskJoints: JointId[]
  formGuard: boolean
}

const BACK_MUSCLES: MuscleId[] = [
  'lats',
  'traps-upper',
  'traps-mid',
  'rhomboids',
  'rear-delts',
  'lower-back',
  'glutes',
  'hamstrings',
  'triceps',
]

interface MusclePaint {
  fill: string
  fillOpacity: number
}

function paintMuscle(
  id: MuscleId,
  primary: MuscleId[],
  secondary: MuscleId[],
  formGuard: boolean,
): MusclePaint {
  if (formGuard)              return { fill: 'var(--color-text-muted)', fillOpacity: 0.22 }
  if (primary.includes(id))   return { fill: 'var(--color-accent-primary)', fillOpacity: 1 }
  if (secondary.includes(id)) return { fill: 'var(--color-accent-primary)', fillOpacity: 0.40 }
  return { fill: 'var(--color-text-muted)', fillOpacity: 0.28 }
}

// ─── Joint coordinates ──────────────────────────────────────────────────────
// ViewBox: 0 0 180 240. Single silhouette, centered at x=90.
interface JointSpot { id: JointId; cx: number; cy: number }

const FRONT_JOINTS: JointSpot[] = [
  { id: 'neck',       cx: 90,  cy: 50  },
  { id: 'shoulders',  cx: 58,  cy: 60  },
  { id: 'shoulders',  cx: 122, cy: 60  },
  { id: 'elbows',     cx: 46,  cy: 108 },
  { id: 'elbows',     cx: 134, cy: 108 },
  { id: 'wrists',     cx: 47,  cy: 148 },
  { id: 'wrists',     cx: 133, cy: 148 },
  { id: 'lower-back', cx: 90,  cy: 130 },
  { id: 'hips',       cx: 74,  cy: 160 },
  { id: 'hips',       cx: 106, cy: 160 },
  { id: 'knees',      cx: 74,  cy: 196 },
  { id: 'knees',      cx: 106, cy: 196 },
  { id: 'ankles',     cx: 70,  cy: 224 },
  { id: 'ankles',     cx: 110, cy: 224 },
]

const BACK_JOINTS: JointSpot[] = FRONT_JOINTS // figure is mirror-symmetric on X

const SILHOUETTE = 'var(--color-border-strong)'

// ─── Silhouette: single continuous body outline, no internal seams ─────────
function Silhouette() {
  return (
    <g
      fill={SILHOUETTE}
      fillOpacity={0.16}
      stroke={SILHOUETTE}
      strokeOpacity={0.5}
      strokeWidth={1.2}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {/* Head */}
      <circle cx="90" cy="24" r="14" />

      {/* Body — one path, head-to-feet.
          Trace: neck → clavicle → left arm down → wrist → back up inner arm →
          armpit → waist → hip → outer leg → foot → inner leg → crotch →
          (mirror for right side) → close. */}
      <path d="
        M 84 40
        L 84 50
        L 58 56
        L 44 66
        L 40 108
        L 42 148
        L 52 148
        L 54 110
        L 60 82
        L 66 130
        L 64 158
        L 60 226
        L 82 228
        L 88 160
        L 92 160
        L 98 228
        L 120 226
        L 116 158
        L 114 130
        L 120 82
        L 126 110
        L 128 148
        L 138 148
        L 140 108
        L 136 66
        L 122 56
        L 96 50
        L 96 40
        Z
      " />
    </g>
  )
}

function FrontFigure({
  primary,
  secondary,
  formGuard,
  injuryRiskJoints,
}: {
  primary: MuscleId[]
  secondary: MuscleId[]
  formGuard: boolean
  injuryRiskJoints: JointId[]
}) {
  return (
    <svg viewBox="0 0 180 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <Silhouette />

      <g>
        {/* Front delts — sitting on the shoulder cap */}
        <ellipse cx="58"  cy="64" rx="9" ry="7" {...paintMuscle('front-delts', primary, secondary, formGuard)} />
        <ellipse cx="122" cy="64" rx="9" ry="7" {...paintMuscle('front-delts', primary, secondary, formGuard)} />

        {/* Side delts — outer shoulder slivers */}
        <ellipse cx="46"  cy="74" rx="4" ry="9" {...paintMuscle('side-delts', primary, secondary, formGuard)} />
        <ellipse cx="134" cy="74" rx="4" ry="9" {...paintMuscle('side-delts', primary, secondary, formGuard)} />

        {/* Chest — soft pectoral curves */}
        <path d="M 60 72 Q 74 68 88 74 L 88 96 Q 74 100 62 94 Z"
          {...paintMuscle('chest', primary, secondary, formGuard)} />
        <path d="M 120 72 Q 106 68 92 74 L 92 96 Q 106 100 118 94 Z"
          {...paintMuscle('chest', primary, secondary, formGuard)} />

        {/* Abs — three stacked blocks */}
        <rect x="82" y="100" width="16" height="8" rx="1.5" {...paintMuscle('abs', primary, secondary, formGuard)} />
        <rect x="82" y="110" width="16" height="8" rx="1.5" {...paintMuscle('abs', primary, secondary, formGuard)} />
        <rect x="82" y="120" width="16" height="8" rx="1.5" {...paintMuscle('abs', primary, secondary, formGuard)} />

        {/* Obliques — flanking the abs */}
        <path d="M 68 100 L 82 104 L 82 128 L 72 124 Z"
          {...paintMuscle('obliques', primary, secondary, formGuard)} />
        <path d="M 112 100 L 98 104 L 98 128 L 108 124 Z"
          {...paintMuscle('obliques', primary, secondary, formGuard)} />

        {/* Biceps */}
        <ellipse cx="46"  cy="88"  rx="5" ry="12" {...paintMuscle('biceps', primary, secondary, formGuard)} />
        <ellipse cx="134" cy="88"  rx="5" ry="12" {...paintMuscle('biceps', primary, secondary, formGuard)} />

        {/* Forearms */}
        <ellipse cx="46"  cy="128" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />
        <ellipse cx="134" cy="128" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />

        {/* Quads — outer thigh mass */}
        <ellipse cx="74"  cy="184" rx="8" ry="20" {...paintMuscle('quads', primary, secondary, formGuard)} />
        <ellipse cx="106" cy="184" rx="8" ry="20" {...paintMuscle('quads', primary, secondary, formGuard)} />

        {/* Adductors — inner thigh */}
        <ellipse cx="84"  cy="184" rx="3" ry="17" {...paintMuscle('adductors', primary, secondary, formGuard)} />
        <ellipse cx="96"  cy="184" rx="3" ry="17" {...paintMuscle('adductors', primary, secondary, formGuard)} />

        {/* Calves */}
        <ellipse cx="72"  cy="214" rx="6" ry="10" {...paintMuscle('calves', primary, secondary, formGuard)} />
        <ellipse cx="108" cy="214" rx="6" ry="10" {...paintMuscle('calves', primary, secondary, formGuard)} />
      </g>

      {formGuard && FRONT_JOINTS.filter((j) => injuryRiskJoints.includes(j.id)).map((j, idx) => (
        <motion.circle
          key={`${j.id}-${idx}`}
          cx={j.cx}
          cy={j.cy}
          r={5}
          fill="var(--color-utility-danger)"
          animate={{ r: [4, 7, 4], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 }}
        />
      ))}
    </svg>
  )
}

function BackFigure({
  primary,
  secondary,
  formGuard,
  injuryRiskJoints,
}: {
  primary: MuscleId[]
  secondary: MuscleId[]
  formGuard: boolean
  injuryRiskJoints: JointId[]
}) {
  return (
    <svg viewBox="0 0 180 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <Silhouette />

      <g>
        {/* Traps upper — trapezoidal cape across the top of the back */}
        <path d="M 78 44 L 102 44 L 122 62 L 108 68 L 90 64 L 72 68 L 58 62 Z"
          {...paintMuscle('traps-upper', primary, secondary, formGuard)} />

        {/* Rear delts */}
        <ellipse cx="58"  cy="66" rx="9" ry="7" {...paintMuscle('rear-delts', primary, secondary, formGuard)} />
        <ellipse cx="122" cy="66" rx="9" ry="7" {...paintMuscle('rear-delts', primary, secondary, formGuard)} />

        {/* Traps mid */}
        <rect x="72" y="70" width="36" height="12" rx="2" {...paintMuscle('traps-mid', primary, secondary, formGuard)} />

        {/* Rhomboids */}
        <rect x="76" y="82" width="28" height="16" rx="2" {...paintMuscle('rhomboids', primary, secondary, formGuard)} />

        {/* Lats — wide wings */}
        <path d="M 56 86 L 76 96 L 78 124 L 64 120 Z"
          {...paintMuscle('lats', primary, secondary, formGuard)} />
        <path d="M 124 86 L 104 96 L 102 124 L 116 120 Z"
          {...paintMuscle('lats', primary, secondary, formGuard)} />

        {/* Triceps */}
        <ellipse cx="46"  cy="88"  rx="5" ry="12" {...paintMuscle('triceps', primary, secondary, formGuard)} />
        <ellipse cx="134" cy="88"  rx="5" ry="12" {...paintMuscle('triceps', primary, secondary, formGuard)} />

        {/* Forearms */}
        <ellipse cx="46"  cy="128" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />
        <ellipse cx="134" cy="128" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />

        {/* Lower back — lumbar block */}
        <rect x="80" y="116" width="20" height="20" rx="3" {...paintMuscle('lower-back', primary, secondary, formGuard)} />

        {/* Glutes */}
        <ellipse cx="80"  cy="158" rx="11" ry="12" {...paintMuscle('glutes', primary, secondary, formGuard)} />
        <ellipse cx="100" cy="158" rx="11" ry="12" {...paintMuscle('glutes', primary, secondary, formGuard)} />

        {/* Hamstrings */}
        <ellipse cx="74"  cy="188" rx="8" ry="18" {...paintMuscle('hamstrings', primary, secondary, formGuard)} />
        <ellipse cx="106" cy="188" rx="8" ry="18" {...paintMuscle('hamstrings', primary, secondary, formGuard)} />

        {/* Calves */}
        <ellipse cx="72"  cy="216" rx="6" ry="10" {...paintMuscle('calves', primary, secondary, formGuard)} />
        <ellipse cx="108" cy="216" rx="6" ry="10" {...paintMuscle('calves', primary, secondary, formGuard)} />
      </g>

      {formGuard && BACK_JOINTS.filter((j) => injuryRiskJoints.includes(j.id)).map((j, idx) => (
        <motion.circle
          key={`${j.id}-${idx}`}
          cx={j.cx}
          cy={j.cy}
          r={5}
          fill="var(--color-utility-danger)"
          animate={{ r: [4, 7, 4], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.1 }}
        />
      ))}
    </svg>
  )
}

export default function HumanAnatomy({
  primaryMuscles,
  secondaryMuscles,
  injuryRiskJoints,
  formGuard,
}: Props) {
  const backPrimaryCount = primaryMuscles.filter((m) => BACK_MUSCLES.includes(m)).length
  const frontPrimaryCount = primaryMuscles.length - backPrimaryCount
  const [showBack, setShowBack] = useState(backPrimaryCount > frontPrimaryCount)

  return (
    <div
      className="relative flex flex-col items-center gap-2"
      style={{ width: 180 }}
    >
      <div
        className="relative"
        style={{
          width: 180,
          height: 240,
          perspective: 900,
        }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: showBack ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <FrontFigure
              primary={primaryMuscles}
              secondary={secondaryMuscles}
              formGuard={formGuard}
              injuryRiskJoints={injuryRiskJoints}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <BackFigure
              primary={primaryMuscles}
              secondary={secondaryMuscles}
              formGuard={formGuard}
              injuryRiskJoints={injuryRiskJoints}
            />
          </div>
        </motion.div>
      </div>

      {/* View label + flip button */}
      <div className="flex w-full items-center justify-between px-1">
        <span
          style={{
            fontFamily: '"Geist Mono", "SF Mono", ui-monospace, monospace',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.18em',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {showBack ? 'BACK' : 'FRONT'}
        </span>
        <button
          type="button"
          onClick={() => setShowBack((prev) => !prev)}
          aria-label={showBack ? 'Show front view' : 'Show back view'}
          className="flex h-7 w-7 items-center justify-center rounded-full border"
          style={{
            backgroundColor: 'var(--color-surface-overlay)',
            borderColor: 'var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12 a9 9 0 1 0 3-6.7" />
            <path d="M3 4 v5 h5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
