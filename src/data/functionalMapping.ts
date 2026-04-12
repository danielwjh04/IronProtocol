export interface ExerciseFunctionalInfo {
  purpose: string;
  anatomyKey: string;
  commonMistake: string;
  // Expanded categories for smarter AI swapping
  category: 
    | 'Horizontal Press' 
    | 'Vertical Press' 
    | 'Horizontal Pull' 
    | 'Vertical Pull' 
    | 'Hip Hinge' 
    | 'Knee Dominant' 
    | 'Core' 
    | 'Accessory';
}

  export type ExerciseCategory = ExerciseFunctionalInfo['category']

export const functionalMapping: Record<string, ExerciseFunctionalInfo> = {
  'back squat': {
    purpose: 'Anchors the entire posterior chain, building explosive hip and knee drive.',
    anatomyKey: 'back-squat',
    commonMistake: 'Knees caving inward (valgus collapse) — drive them out.',
    category: 'Knee Dominant',
  },
  'bench press': {
    purpose: 'Develops primary horizontal pressing muscles for maximum pushing strength.',
    anatomyKey: 'bench-press',
    commonMistake: 'Flaring elbows to 90° — tuck to 45° to protect shoulders.',
    category: 'Horizontal Press',
  },
  'deadlift': {
    purpose: 'The most functional expression of raw pulling strength from the floor.',
    anatomyKey: 'deadlift',
    commonMistake: 'Rounding the lumbar spine — brace core and lock neutral spine.',
    category: 'Hip Hinge',
  },
  'overhead press': {
    purpose: 'Builds vertical pressing power and shoulder girdle stability.',
    anatomyKey: 'overhead-press',
    commonMistake: 'Arching the lower back — squeeze glutes and brace core.',
    category: 'Vertical Press',
  },
  'barbell row': {
    purpose: 'Counterbalances horizontal pressing by building a balanced upper back.',
    anatomyKey: 'barbell-row',
    commonMistake: 'Using momentum — control the eccentric and lead with lats.',
    category: 'Horizontal Pull',
  },
  'pull up': {
    purpose: 'The definitive test of relative upper-body vertical pulling power.',
    anatomyKey: 'pull-up',
    commonMistake: 'Shrugging at the top — depress scapulae before pulling.',
    category: 'Vertical Pull',
  },
  'incline press': {
    purpose: 'Emphasizes the upper pectorals for full chest development.',
    anatomyKey: 'incline-press',
    commonMistake: 'Setting bench too steep — stay at 30–45° for chest focus.',
    category: 'Horizontal Press',
  },
  'romanian deadlift': {
    purpose: 'Isolates hamstrings and glutes through a controlled hip-hinge.',
    anatomyKey: 'romanian-deadlift',
    commonMistake: 'Bending knees too much — keep a soft knee and hinge at hips.',
    category: 'Hip Hinge',
  },
  'leg press': {
    purpose: 'Overloads quads with reduced spinal load.',
    anatomyKey: 'leg-press',
    commonMistake: 'Lower back peeling off pad — stop before hips tuck.',
    category: 'Knee Dominant',
  },
  'biceps curl': {
    purpose: 'Directly targets biceps for arm hypertrophy.',
    anatomyKey: 'biceps-curl',
    commonMistake: 'Swinging the torso — pin elbows to your sides.',
    category: 'Accessory',
  },
  'triceps pushdown': {
    purpose: 'Isolates triceps and reinforces pressing lockout strength.',
    anatomyKey: 'triceps-pushdown',
    commonMistake: 'Elbows flaring and riding forward — keep them pinned.',
    category: 'Accessory',
  },
  'lateral raise': {
    purpose: 'Builds medial deltoid head for shoulder width.',
    anatomyKey: 'lateral-raise',
    commonMistake: 'Shrugging with traps — lead with the elbows.',
    category: 'Accessory',
  },
  'bulgarian split squat': {
    purpose: 'Unilateral test that eliminates bilateral deficits.',
    anatomyKey: 'bulgarian-split-squat',
    commonMistake: 'Tightrope stance — widen your base for stability.',
    category: 'Knee Dominant',
  },
  'face pull': {
    purpose: 'Essential prehab for shoulder longevity.',
    anatomyKey: 'face-pull',
    commonMistake: 'Pulling with traps — pull rope ends apart toward forehead.',
    category: 'Accessory',
  },
  'lat pulldown': {
    purpose: 'Vertical pull for high-volume lat isolation.',
    anatomyKey: 'lat-pulldown',
    commonMistake: 'Pulling with biceps — drive elbows into back pockets.',
    category: 'Vertical Pull',
  },
  'hanging leg raise': {
    purpose: 'Gold standard for functional core and grip strength.',
    anatomyKey: 'hanging-leg-raise',
    commonMistake: 'Swinging for momentum — control the pelvic tilt.',
    category: 'Core',
  },
  'cable fly': {
    purpose: 'Constant tension for inner-chest recruitment.',
    anatomyKey: 'cable-fly',
    commonMistake: 'Pressing rather than flying — keep a fixed elbow bend.',
    category: 'Accessory',
  },
  'skull crusher': {
    purpose: 'Overloads the long head of the triceps.',
    anatomyKey: 'skull-crusher',
    commonMistake: 'Lowering to forehead — lower slightly behind the head.',
    category: 'Accessory',
  },
  'goblet squat': {
    purpose: 'Anterior load forces upright torso and perfect depth.',
    anatomyKey: 'goblet-squat',
    commonMistake: 'Elbows collapsing — keep them tucked and high.',
    category: 'Knee Dominant',
  },
  'hammer curl': {
    purpose: 'Targets brachialis for arm thickness.',
    anatomyKey: 'hammer-curl',
    commonMistake: 'Tucking chin and rounding — stand tall, chest up.',
    category: 'Accessory',
  },
  'incline dumbbell press': {
    purpose: 'Isolates upper chest with greater range of motion.',
    anatomyKey: 'incline-db-press',
    commonMistake: 'Clashing weights — stop just before they touch.',
    category: 'Horizontal Press',
  },
  'push up': {
    purpose: 'Integrates core stability with horizontal pressing power.',
    anatomyKey: 'push-up',
    commonMistake: 'Sagging hips — maintain a hollow body plank.',
    category: 'Horizontal Press',
  },
  'seated cable row': {
    purpose: 'Targets mid-back thickness and lat stretch.',
    anatomyKey: 'seated-row',
    commonMistake: 'Leaning back excessively — stay upright.',
    category: 'Horizontal Pull',
  },
  't-bar row': {
    purpose: 'Heavy compound pull for a stable posterior chain.',
    anatomyKey: 't-bar-row',
    commonMistake: 'Rounding the spine — brace core, big chest.',
    category: 'Horizontal Pull',
  },
  'hip thrust': {
    purpose: 'Ultimate glute isolation at full hip extension.',
    anatomyKey: 'hip-thrust',
    commonMistake: 'Hyperextending lower back — tuck chin, move hips only.',
    category: 'Hip Hinge',
  },
  'leg extension': {
    purpose: 'Isolation for quads, perfect for metabolic stress.',
    anatomyKey: 'leg-extension',
    commonMistake: 'Kicking too fast — hold the squeeze for 1 second.',
    category: 'Accessory',
  },
  'lying leg curl': {
    purpose: 'Isolates hamstrings through knee flexion.',
    anatomyKey: 'leg-curl',
    commonMistake: 'Hips lifting off pad — press pelvis down.',
    category: 'Accessory',
  },
  'arnold press': {
    purpose: 'Increased time-under-tension for all delt heads.',
    anatomyKey: 'arnold-press',
    commonMistake: 'Rushing the rotation — rotate as you press.',
    category: 'Vertical Press',
  },
  'hammer strength press': {
    purpose: 'Max pectoral overload without stability demands.',
    anatomyKey: 'machine-press',
    commonMistake: 'Bouncing off stoppers — use a slow eccentric.',
    category: 'Horizontal Press',
  },
  'plank': {
    purpose: 'Trains the core to resist spinal extension.',
    anatomyKey: 'plank',
    commonMistake: 'Looking up — neutral neck, squeeze glutes.',
    category: 'Core',
  },
  'ab wheel rollout': {
    purpose: 'Elite core stability challenge.',
    anatomyKey: 'ab-wheel',
    commonMistake: 'Arching back — only roll as far as you can stay flat.',
    category: 'Core',
  },
}

function normalizeExerciseName(exerciseName: string): string {
  return exerciseName.trim().toLowerCase()
}

export function getFunctionalInfo(exerciseName: string): ExerciseFunctionalInfo | null {
  return functionalMapping[normalizeExerciseName(exerciseName)] ?? null
}

export function getExerciseCategory(exerciseName: string): ExerciseCategory | null {
  return getFunctionalInfo(exerciseName)?.category ?? null
}