// functionalMapping.ts
// Maps a normalised exercise name (lowercase) to its educational metadata.
// Keyed by name rather than UUID because exercise IDs are generated at seed
// time and are not stable across installations.

export interface ExerciseFunctionalInfo {
  /** Bold one-sentence purpose statement shown in the "Why" panel. */
  purpose: string
  /** Slug used as a reference key for the future 3D anatomy viewer. */
  anatomyKey: string
  /** Form Guard: the most common technique error shown when toggle is active. */
  commonMistake: string
}

export const functionalMapping: Record<string, ExerciseFunctionalInfo> = {
  'back squat': {
    purpose:
      'Anchors the entire posterior chain, building the explosive hip and knee drive required for athletic power and lower-body hypertrophy.',
    anatomyKey: 'back-squat',
    commonMistake:
      'Knees caving inward (valgus collapse) under load — forces the glutes to fire and push your knees out on every rep.',
  },
  'bench press': {
    purpose:
      'Develops the primary horizontal pressing muscles — pectorals, anterior deltoids, and triceps — for maximum upper-body pushing strength.',
    anatomyKey: 'bench-press',
    commonMistake:
      'Flaring the elbows to 90° — tuck them to ~45° to protect the shoulder joint and maximise pec recruitment.',
  },
  deadlift: {
    purpose:
      'Trains the full posterior chain in a single movement — the most functional expression of raw pulling strength from the floor.',
    anatomyKey: 'deadlift',
    commonMistake:
      'Rounding the lumbar spine at the start of the pull — brace your core and lock in a neutral spine before the bar leaves the floor.',
  },
  'overhead press': {
    purpose:
      'Builds vertical pressing power through the deltoids and triceps, strengthening the shoulder girdle and core for overhead stability.',
    anatomyKey: 'overhead-press',
    commonMistake:
      'Excessive lumbar extension (lower-back arch) to compensate for limited shoulder mobility — squeeze the glutes and keep the core braced.',
  },
  'barbell row': {
    purpose:
      'Counterbalances horizontal pressing by building the lats, rhomboids, and rear deltoids for a strong, balanced upper back.',
    anatomyKey: 'barbell-row',
    commonMistake:
      'Using momentum and hip drive to "cheat" the bar up — control the eccentric and initiate each rep with the lats, not the lower back.',
  },
  'pull up': {
    purpose:
      'Builds elite vertical pulling strength through the lats and biceps — the definitive test of relative upper-body pulling power.',
    anatomyKey: 'pull-up',
    commonMistake:
      'Shrugging the shoulders at the top — depress and retract the scapulae before pulling to prevent shoulder impingement.',
  },
  'incline press': {
    purpose:
      'Emphasises the clavicular head of the pectorals to build upper-chest fullness and improve strength at the top of the pressing arc.',
    anatomyKey: 'incline-press',
    commonMistake:
      'Setting the bench too steep (>45°) shifts load from upper pec to front delt — stay between 30–45° for true upper-chest stimulus.',
  },
  'romanian deadlift': {
    purpose:
      'Isolates the hamstrings and glutes through a controlled hip-hinge, building posterior-chain resilience, flexibility, and hypertrophy.',
    anatomyKey: 'romanian-deadlift',
    commonMistake:
      'Bending the knees too much turns it into a squat — keep a soft knee and hinge purely at the hip to maintain hamstring tension.',
  },
  'leg press': {
    purpose:
      'Overloads the quads in a controlled closed-chain environment, allowing high-volume lower-body work with reduced spinal load.',
    anatomyKey: 'leg-press',
    commonMistake:
      'Letting the lower back peel off the pad at the bottom — stop the descent when hips start to tuck to avoid lumbar flexion under load.',
  },
  'biceps curl': {
    purpose:
      'Directly targets the biceps brachii for arm hypertrophy and elbow-flexion strength that transfers to all pulling movements.',
    anatomyKey: 'biceps-curl',
    commonMistake:
      'Swinging the torso to help the bar up — pin the elbows to your sides and eliminate all momentum to maximise bicep time under tension.',
  },
  'triceps pushdown': {
    purpose:
      'Isolates the triceps for arm hypertrophy and reinforces lockout strength, the limiting factor in every heavy pressing movement.',
    anatomyKey: 'triceps-pushdown',
    commonMistake:
      'Letting the elbows flare out and ride forward — keep them pinned at your sides and only move from the elbow joint.',
  },
  'lateral raise': {
    purpose:
      'Builds the medial deltoid head for shoulder width and overhead stability — the defining muscle of a capped, three-dimensional shoulder.',
    anatomyKey: 'lateral-raise',
    commonMistake:
      'Shrugging the traps to elevate the weight — lead with the elbows, stop at shoulder height, and keep the traps relaxed throughout.',
  },
}

/**
 * Look up functional info for an exercise by its display name.
 * Returns undefined for exercises not yet in the mapping.
 */
export function getFunctionalInfo(exerciseName: string): ExerciseFunctionalInfo | undefined {
  return functionalMapping[exerciseName.toLowerCase()]
}
