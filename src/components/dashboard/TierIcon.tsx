import type { ExerciseTier } from '../../db/schema'

interface TierIconProps {
  tier: ExerciseTier
  size?: number
}

/**
 * Tier icon for exercise rows.
 *  - Tier 1 (main lift)      → barbell (accent)
 *  - Tier 2 (secondary)      → dumbbell (text-primary)
 *  - Tier 3 (accessory)      → plate    (text-muted)
 *
 * Uses currentColor + backgroundColor assigned by the parent row so the
 * icon + chip read as one surface.
 */
export default function TierIcon({ tier, size = 22 }: TierIconProps) {
  const label =
    tier === 1 ? 'Tier 1 main lift' : tier === 2 ? 'Tier 2 secondary' : 'Tier 3 accessory'

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-label={label}
      role="img"
    >
      {tier === 1 && (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="9" width="1.8" height="6" rx="0.4" />
          <rect x="5" y="7" width="2.2" height="10" rx="0.5" />
          <path d="M7.5 12 h9" />
          <rect x="16.8" y="7" width="2.2" height="10" rx="0.5" />
          <rect x="19.7" y="9" width="1.8" height="6" rx="0.4" />
        </g>
      )}
      {tier === 2 && (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8.5" width="3" height="7" rx="0.8" />
          <rect x="18" y="8.5" width="3" height="7" rx="0.8" />
          <path d="M6 12 h12" strokeWidth="2.2" />
        </g>
      )}
      {tier === 3 && (
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
        </g>
      )}
    </svg>
  )
}
