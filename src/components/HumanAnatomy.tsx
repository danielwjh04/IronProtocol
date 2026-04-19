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
  if (formGuard) return { fill: 'var(--color-text-muted)', fillOpacity: 0.22 }
  if (primary.includes(id))   return { fill: 'var(--color-accent-primary)', fillOpacity: 1 }
  if (secondary.includes(id)) return { fill: 'var(--color-accent-primary)', fillOpacity: 0.36 }
  return { fill: 'var(--color-text-muted)', fillOpacity: 0.32 }
}

interface JointSpot {
  id: JointId
  cx: number
  cy: number
  label: string
}

const FRONT_JOINTS: JointSpot[] = [
  { id: 'neck',       cx: 60,  cy: 34,  label: 'Neck' },
  { id: 'shoulders',  cx: 33,  cy: 44,  label: 'Shoulder' },
  { id: 'shoulders',  cx: 87,  cy: 44,  label: 'Shoulder' },
  { id: 'elbows',     cx: 21,  cy: 92,  label: 'Elbow' },
  { id: 'elbows',     cx: 99,  cy: 92,  label: 'Elbow' },
  { id: 'wrists',     cx: 21,  cy: 128, label: 'Wrist' },
  { id: 'wrists',     cx: 99,  cy: 128, label: 'Wrist' },
  { id: 'lower-back', cx: 60,  cy: 116, label: 'Lower back' },
  { id: 'hips',       cx: 44,  cy: 138, label: 'Hip' },
  { id: 'hips',       cx: 76,  cy: 138, label: 'Hip' },
  { id: 'knees',      cx: 46,  cy: 178, label: 'Knee' },
  { id: 'knees',      cx: 74,  cy: 178, label: 'Knee' },
  { id: 'ankles',     cx: 46,  cy: 212, label: 'Ankle' },
  { id: 'ankles',     cx: 74,  cy: 212, label: 'Ankle' },
]

const BACK_JOINTS: JointSpot[] = [
  { id: 'neck',       cx: 60,  cy: 34,  label: 'Neck' },
  { id: 'shoulders',  cx: 33,  cy: 44,  label: 'Shoulder' },
  { id: 'shoulders',  cx: 87,  cy: 44,  label: 'Shoulder' },
  { id: 'elbows',     cx: 21,  cy: 92,  label: 'Elbow' },
  { id: 'elbows',     cx: 99,  cy: 92,  label: 'Elbow' },
  { id: 'wrists',     cx: 21,  cy: 128, label: 'Wrist' },
  { id: 'wrists',     cx: 99,  cy: 128, label: 'Wrist' },
  { id: 'lower-back', cx: 60,  cy: 114, label: 'Lower back' },
  { id: 'hips',       cx: 44,  cy: 138, label: 'Hip' },
  { id: 'hips',       cx: 76,  cy: 138, label: 'Hip' },
  { id: 'knees',      cx: 46,  cy: 178, label: 'Knee' },
  { id: 'knees',      cx: 74,  cy: 178, label: 'Knee' },
  { id: 'ankles',     cx: 46,  cy: 212, label: 'Ankle' },
  { id: 'ankles',     cx: 74,  cy: 212, label: 'Ankle' },
]

const SILHOUETTE = 'var(--color-border-strong)'
const SILHOUETTE_OPACITY = 0.35

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
    <svg
      viewBox="0 0 120 230"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill={SILHOUETTE} fillOpacity={SILHOUETTE_OPACITY}>
        <ellipse cx="60" cy="18" rx="11" ry="13" />
        <path d="M52 30 L68 30 L68 40 L52 40 Z" />
        <path d="M30 42 Q60 34 90 42 L94 70 L92 100 L86 144 L82 144 L80 218 L70 222 L62 218 L62 144 L58 144 L58 218 L50 222 L40 218 L38 144 L34 144 L28 100 L26 70 Z" />
        <path d="M30 42 L18 48 L14 92 L18 130 L24 134 L30 130 L32 92 Z" />
        <path d="M90 42 L102 48 L106 92 L102 130 L96 134 L90 130 L88 92 Z" />
      </g>

      <g>
        <ellipse cx="33" cy="46" rx="9" ry="7" {...paintMuscle('front-delts', primary, secondary, formGuard)} />
        <ellipse cx="87" cy="46" rx="9" ry="7" {...paintMuscle('front-delts', primary, secondary, formGuard)} />

        <ellipse cx="20" cy="54" rx="5" ry="9" {...paintMuscle('side-delts', primary, secondary, formGuard)} />
        <ellipse cx="100" cy="54" rx="5" ry="9" {...paintMuscle('side-delts', primary, secondary, formGuard)} />

        <ellipse cx="49" cy="60" rx="13" ry="10" {...paintMuscle('chest', primary, secondary, formGuard)} />
        <ellipse cx="71" cy="60" rx="13" ry="10" {...paintMuscle('chest', primary, secondary, formGuard)} />

        <rect x="52" y="76" width="16" height="34" rx="2" {...paintMuscle('abs', primary, secondary, formGuard)} />

        <path d="M40 76 L52 78 L52 110 L42 108 Z" {...paintMuscle('obliques', primary, secondary, formGuard)} />
        <path d="M80 76 L68 78 L68 110 L78 108 Z" {...paintMuscle('obliques', primary, secondary, formGuard)} />

        <ellipse cx="22" cy="74" rx="5" ry="13" {...paintMuscle('biceps', primary, secondary, formGuard)} />
        <ellipse cx="98" cy="74" rx="5" ry="13" {...paintMuscle('biceps', primary, secondary, formGuard)} />

        <ellipse cx="22" cy="112" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />
        <ellipse cx="98" cy="112" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />

        <ellipse cx="46" cy="160" rx="9" ry="22" {...paintMuscle('quads', primary, secondary, formGuard)} />
        <ellipse cx="74" cy="160" rx="9" ry="22" {...paintMuscle('quads', primary, secondary, formGuard)} />

        <ellipse cx="55" cy="160" rx="3" ry="18" {...paintMuscle('adductors', primary, secondary, formGuard)} />
        <ellipse cx="65" cy="160" rx="3" ry="18" {...paintMuscle('adductors', primary, secondary, formGuard)} />

        <ellipse cx="46" cy="200" rx="6" ry="12" {...paintMuscle('calves', primary, secondary, formGuard)} />
        <ellipse cx="74" cy="200" rx="6" ry="12" {...paintMuscle('calves', primary, secondary, formGuard)} />
      </g>

      {formGuard &&
        FRONT_JOINTS.filter(j => injuryRiskJoints.includes(j.id)).map((j, idx) => (
          <motion.circle
            key={`${j.id}-${idx}`}
            cx={j.cx}
            cy={j.cy}
            r={5}
            fill="var(--color-utility-danger)"
            animate={{ r: [4, 7, 4], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.08 }}
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
    <svg
      viewBox="0 0 120 230"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill={SILHOUETTE} fillOpacity={SILHOUETTE_OPACITY}>
        <ellipse cx="60" cy="18" rx="11" ry="13" />
        <path d="M52 30 L68 30 L68 40 L52 40 Z" />
        <path d="M30 42 Q60 34 90 42 L94 70 L92 100 L86 144 L82 144 L80 218 L70 222 L62 218 L62 144 L58 144 L58 218 L50 222 L40 218 L38 144 L34 144 L28 100 L26 70 Z" />
        <path d="M30 42 L18 48 L14 92 L18 130 L24 134 L30 130 L32 92 Z" />
        <path d="M90 42 L102 48 L106 92 L102 130 L96 134 L90 130 L88 92 Z" />
      </g>

      <g>
        <path d="M50 32 L70 32 L88 46 L76 52 L60 48 L44 52 L32 46 Z" {...paintMuscle('traps-upper', primary, secondary, formGuard)} />

        <ellipse cx="33" cy="48" rx="9" ry="7" {...paintMuscle('rear-delts', primary, secondary, formGuard)} />
        <ellipse cx="87" cy="48" rx="9" ry="7" {...paintMuscle('rear-delts', primary, secondary, formGuard)} />

        <rect x="44" y="52" width="32" height="14" rx="2" {...paintMuscle('traps-mid', primary, secondary, formGuard)} />
        <rect x="48" y="62" width="24" height="20" rx="2" {...paintMuscle('rhomboids', primary, secondary, formGuard)} />

        <path d="M28 62 L46 70 L48 108 L34 102 Z" {...paintMuscle('lats', primary, secondary, formGuard)} />
        <path d="M92 62 L74 70 L72 108 L86 102 Z" {...paintMuscle('lats', primary, secondary, formGuard)} />

        <ellipse cx="22" cy="74" rx="5" ry="13" {...paintMuscle('triceps', primary, secondary, formGuard)} />
        <ellipse cx="98" cy="74" rx="5" ry="13" {...paintMuscle('triceps', primary, secondary, formGuard)} />

        <ellipse cx="22" cy="112" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />
        <ellipse cx="98" cy="112" rx="5" ry="14" {...paintMuscle('forearms', primary, secondary, formGuard)} />

        <rect x="48" y="100" width="24" height="26" rx="3" {...paintMuscle('lower-back', primary, secondary, formGuard)} />

        <ellipse cx="50" cy="142" rx="12" ry="13" {...paintMuscle('glutes', primary, secondary, formGuard)} />
        <ellipse cx="70" cy="142" rx="12" ry="13" {...paintMuscle('glutes', primary, secondary, formGuard)} />

        <ellipse cx="46" cy="172" rx="9" ry="20" {...paintMuscle('hamstrings', primary, secondary, formGuard)} />
        <ellipse cx="74" cy="172" rx="9" ry="20" {...paintMuscle('hamstrings', primary, secondary, formGuard)} />

        <ellipse cx="46" cy="202" rx="7" ry="13" {...paintMuscle('calves', primary, secondary, formGuard)} />
        <ellipse cx="74" cy="202" rx="7" ry="13" {...paintMuscle('calves', primary, secondary, formGuard)} />
      </g>

      {formGuard &&
        BACK_JOINTS.filter(j => injuryRiskJoints.includes(j.id)).map((j, idx) => (
          <motion.circle
            key={`${j.id}-${idx}`}
            cx={j.cx}
            cy={j.cy}
            r={5}
            fill="var(--color-utility-danger)"
            animate={{ r: [4, 7, 4], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.08 }}
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
  const backPrimaryCount = primaryMuscles.filter(m => BACK_MUSCLES.includes(m)).length
  const frontPrimaryCount = primaryMuscles.length - backPrimaryCount
  const [showBack, setShowBack] = useState(backPrimaryCount > frontPrimaryCount)

  return (
    <div
      className="relative"
      style={{
        width: 160,
        height: 230,
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

      <button
        type="button"
        onClick={() => setShowBack(prev => !prev)}
        aria-label={showBack ? 'Show front view' : 'Show back view'}
        className="absolute -bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full border text-base transition-colors"
        style={{
          backgroundColor: 'var(--color-surface-overlay)',
          borderColor: 'var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1,
        }}
      >
        ↻
      </button>

      <p
        className="text-label absolute -bottom-1 left-0"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}
      >
        {showBack ? 'BACK' : 'FRONT'}
      </p>
    </div>
  )
}
