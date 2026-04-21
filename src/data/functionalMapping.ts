export type MuscleId =
  | 'chest'
  | 'front-delts' | 'side-delts' | 'rear-delts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques'
  | 'quads' | 'adductors' | 'calves'
  | 'lats' | 'traps-upper' | 'traps-mid' | 'rhomboids' | 'lower-back'
  | 'glutes' | 'hamstrings'

export type JointId =
  | 'neck' | 'shoulders' | 'elbows' | 'wrists'
  | 'lower-back' | 'hips' | 'knees' | 'ankles'

export interface ExerciseFunctionalInfo {
  purpose: string;
  anatomyKey: string;
  commonMistake: string;
  category:
    | 'Horizontal Press'
    | 'Vertical Press'
    | 'Horizontal Pull'
    | 'Vertical Pull'
    | 'Hip Hinge'
    | 'Knee Dominant'
    | 'Core'
    | 'Accessory';
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  injuryRiskJoints: JointId[];
}

export type ExerciseCategory = ExerciseFunctionalInfo['category']

export const functionalMapping: Record<string, ExerciseFunctionalInfo> = {
  // ─── TIER 1: ANCHORS ─────────────────────────────────────────────────────
  'back squat': {
    purpose: 'Anchors the entire posterior chain, building explosive hip and knee drive.',
    anatomyKey: 'back-squat',
    commonMistake: 'Knees caving inward (valgus collapse) — drive them out.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'lower-back', 'abs'],
    injuryRiskJoints: ['knees', 'lower-back'],
  },
  'bench press': {
    purpose: 'Develops primary horizontal pressing muscles for maximum pushing strength.',
    anatomyKey: 'bench-press',
    commonMistake: 'Flaring elbows to 90° — tuck to 45° to protect shoulders.',
    category: 'Horizontal Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts', 'triceps'],
    injuryRiskJoints: ['shoulders', 'elbows'],
  },
  'deadlift': {
    purpose: 'The most functional expression of raw pulling strength from the floor.',
    anatomyKey: 'deadlift',
    commonMistake: 'Rounding the lumbar spine — brace core and lock neutral spine.',
    category: 'Hip Hinge',
    primaryMuscles: ['hamstrings', 'glutes', 'lower-back'],
    secondaryMuscles: ['lats', 'traps-upper', 'forearms'],
    injuryRiskJoints: ['lower-back'],
  },
  'overhead press': {
    purpose: 'Builds vertical pressing power and shoulder girdle stability.',
    anatomyKey: 'overhead-press',
    commonMistake: 'Arching the lower back — squeeze glutes and brace core.',
    category: 'Vertical Press',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps', 'traps-upper'],
    injuryRiskJoints: ['shoulders', 'lower-back'],
  },
  'barbell row': {
    purpose: 'Counterbalances horizontal pressing by building a balanced upper back.',
    anatomyKey: 'barbell-row',
    commonMistake: 'Using momentum — control the eccentric and lead with lats.',
    category: 'Horizontal Pull',
    primaryMuscles: ['lats', 'rhomboids'],
    secondaryMuscles: ['traps-mid', 'biceps', 'rear-delts'],
    injuryRiskJoints: ['lower-back'],
  },
  'pull up': {
    purpose: 'The definitive test of relative upper-body vertical pulling power.',
    anatomyKey: 'pull-up',
    commonMistake: 'Shrugging at the top — depress scapulae before pulling.',
    category: 'Vertical Pull',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'rhomboids'],
    injuryRiskJoints: ['shoulders', 'elbows'],
  },
  'dumbbell bench press': {
    purpose: 'Unilateral press for a deeper chest stretch and balanced side-to-side strength.',
    anatomyKey: 'db-bench-press',
    commonMistake: 'Dumbbells drifting outward — keep them stacked over the elbows.',
    category: 'Horizontal Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts', 'triceps'],
    injuryRiskJoints: ['shoulders', 'elbows'],
  },
  'close grip bench press': {
    purpose: 'Bench variant that shifts load to the triceps for lockout power.',
    anatomyKey: 'close-grip-bench',
    commonMistake: 'Gripping too narrow — stay shoulder-width to spare the wrists.',
    category: 'Horizontal Press',
    primaryMuscles: ['triceps'],
    secondaryMuscles: ['chest', 'front-delts'],
    injuryRiskJoints: ['wrists', 'elbows'],
  },
  'bulgarian split squat': {
    purpose: 'Unilateral test that eliminates bilateral deficits and evens out legs.',
    anatomyKey: 'bulgarian-split-squat',
    commonMistake: 'Tightrope stance — widen the base for stability.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'abs'],
    injuryRiskJoints: ['knees'],
  },
  'hack squat': {
    purpose: 'Machine-guided squat that isolates quads with minimal spinal load.',
    anatomyKey: 'hack-squat',
    commonMistake: 'Cutting depth short — break parallel for full quad recruitment.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    injuryRiskJoints: ['knees'],
  },
  'front squat': {
    purpose: 'Anterior-loaded squat that forces an upright torso and deep quad drive.',
    anatomyKey: 'front-squat',
    commonMistake: 'Elbows dropping — keep them high to hold the rack position.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'abs', 'lower-back'],
    injuryRiskJoints: ['knees', 'wrists'],
  },

  // ─── TIER 2: PUSH ────────────────────────────────────────────────────────
  'incline press': {
    purpose: 'Emphasizes the upper pectorals for full chest development.',
    anatomyKey: 'incline-press',
    commonMistake: 'Setting the bench too steep — stay at 30–45° for chest focus.',
    category: 'Horizontal Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts', 'triceps'],
    injuryRiskJoints: ['shoulders'],
  },
  'dumbbell incline press': {
    purpose: 'Isolates the upper chest with a greater range of motion than the bar.',
    anatomyKey: 'db-incline-press',
    commonMistake: 'Clashing the dumbbells — stop just before they touch.',
    category: 'Horizontal Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts', 'triceps'],
    injuryRiskJoints: ['shoulders'],
  },
  'dips': {
    purpose: 'Bodyweight compound that hits lower chest and triceps through a full press range.',
    anatomyKey: 'dips',
    commonMistake: 'Shrugging at the bottom — depress the shoulders and control the descent.',
    category: 'Horizontal Press',
    primaryMuscles: ['chest', 'triceps'],
    secondaryMuscles: ['front-delts'],
    injuryRiskJoints: ['shoulders', 'elbows'],
  },
  'dumbbell shoulder press': {
    purpose: 'Unilateral overhead press with a freer shoulder path for safer stability.',
    anatomyKey: 'db-shoulder-press',
    commonMistake: 'Arching the lower back — brace the core and lock the ribs down.',
    category: 'Vertical Press',
    primaryMuscles: ['front-delts', 'side-delts'],
    secondaryMuscles: ['triceps'],
    injuryRiskJoints: ['shoulders', 'lower-back'],
  },

  // ─── TIER 2: PULL ────────────────────────────────────────────────────────
  'lat pulldown': {
    purpose: 'Vertical pull for high-volume lat isolation.',
    anatomyKey: 'lat-pulldown',
    commonMistake: 'Pulling with biceps — drive elbows into the back pockets.',
    category: 'Vertical Pull',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'rear-delts', 'rhomboids'],
    injuryRiskJoints: ['shoulders'],
  },
  'seated cable row': {
    purpose: 'Targets mid-back thickness with a controlled lat stretch.',
    anatomyKey: 'seated-row',
    commonMistake: 'Leaning back excessively — stay upright and pull to the sternum.',
    category: 'Horizontal Pull',
    primaryMuscles: ['lats', 'rhomboids', 'traps-mid'],
    secondaryMuscles: ['biceps', 'rear-delts'],
    injuryRiskJoints: ['lower-back'],
  },
  'dumbbell row': {
    purpose: 'Single-arm row that builds unilateral lat thickness and evens out asymmetry.',
    anatomyKey: 'db-row',
    commonMistake: 'Torso twisting up — keep hips square and drive the elbow straight back.',
    category: 'Horizontal Pull',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['rhomboids', 'biceps', 'rear-delts'],
    injuryRiskJoints: ['lower-back'],
  },
  't-bar row': {
    purpose: 'Heavy compound pull for a stable posterior chain.',
    anatomyKey: 't-bar-row',
    commonMistake: 'Rounding the spine — brace the core and lead with a big chest.',
    category: 'Horizontal Pull',
    primaryMuscles: ['lats', 'rhomboids'],
    secondaryMuscles: ['traps-mid', 'biceps', 'lower-back'],
    injuryRiskJoints: ['lower-back'],
  },
  'chin up': {
    purpose: 'Supinated vertical pull that recruits biceps alongside the lats.',
    anatomyKey: 'chin-up',
    commonMistake: 'Kipping for reps — pause at the bottom and pull with the back.',
    category: 'Vertical Pull',
    primaryMuscles: ['lats', 'biceps'],
    secondaryMuscles: ['rhomboids'],
    injuryRiskJoints: ['shoulders', 'elbows'],
  },

  // ─── TIER 2: LEGS ────────────────────────────────────────────────────────
  'romanian deadlift': {
    purpose: 'Isolates hamstrings and glutes through a controlled hip-hinge.',
    anatomyKey: 'romanian-deadlift',
    commonMistake: 'Bending knees too much — keep a soft knee and hinge at the hips.',
    category: 'Hip Hinge',
    primaryMuscles: ['hamstrings', 'glutes'],
    secondaryMuscles: ['lower-back', 'lats'],
    injuryRiskJoints: ['lower-back'],
  },
  'leg press': {
    purpose: 'Overloads quads with reduced spinal load.',
    anatomyKey: 'leg-press',
    commonMistake: 'Lower back peeling off the pad — stop before the hips tuck.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings'],
    injuryRiskJoints: ['knees', 'lower-back'],
  },
  'hip thrust': {
    purpose: 'Ultimate glute isolation at full hip extension.',
    anatomyKey: 'hip-thrust',
    commonMistake: 'Hyperextending the lower back — tuck chin and move hips only.',
    category: 'Hip Hinge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    injuryRiskJoints: ['lower-back'],
  },
  'walking lunges': {
    purpose: 'Dynamic unilateral leg work that trains balance under load.',
    anatomyKey: 'walking-lunges',
    commonMistake: 'Front knee caving inward — track the knee over the middle toe.',
    category: 'Knee Dominant',
    primaryMuscles: ['quads', 'glutes'],
    secondaryMuscles: ['hamstrings', 'calves'],
    injuryRiskJoints: ['knees'],
  },

  // ─── TIER 3: PUSH ISOLATIONS ─────────────────────────────────────────────
  'triceps pushdown': {
    purpose: 'Isolates triceps and reinforces pressing lockout strength.',
    anatomyKey: 'triceps-pushdown',
    commonMistake: 'Elbows flaring and riding forward — keep them pinned.',
    category: 'Accessory',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    injuryRiskJoints: ['elbows'],
  },
  'lateral raise': {
    purpose: 'Builds the medial deltoid head for broader shoulder width.',
    anatomyKey: 'lateral-raise',
    commonMistake: 'Shrugging with traps — lead with the elbows.',
    category: 'Accessory',
    primaryMuscles: ['side-delts'],
    secondaryMuscles: ['traps-upper'],
    injuryRiskJoints: ['shoulders'],
  },
  'cable chest fly': {
    purpose: 'Constant tension for inner-chest recruitment.',
    anatomyKey: 'cable-fly',
    commonMistake: 'Pressing rather than flying — keep a fixed elbow bend.',
    category: 'Accessory',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    injuryRiskJoints: ['shoulders'],
  },
  'pec deck machine': {
    purpose: 'Guided fly path for a safe, focused chest squeeze under constant tension.',
    anatomyKey: 'pec-deck',
    commonMistake: 'Yanking the pads — slow the eccentric and pause in the contraction.',
    category: 'Accessory',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front-delts'],
    injuryRiskJoints: ['shoulders'],
  },
  'skullcrushers': {
    purpose: 'Overloads the long head of the triceps.',
    anatomyKey: 'skull-crusher',
    commonMistake: 'Lowering to the forehead — lower slightly behind the head instead.',
    category: 'Accessory',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    injuryRiskJoints: ['elbows'],
  },
  'overhead triceps extension': {
    purpose: 'Stretches the long head of the triceps for full arm development.',
    anatomyKey: 'oh-triceps-ext',
    commonMistake: 'Flaring the elbows out — keep them pointed straight up.',
    category: 'Accessory',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    injuryRiskJoints: ['elbows', 'shoulders'],
  },
  'front raise': {
    purpose: 'Isolates the anterior delt for front-shoulder definition.',
    anatomyKey: 'front-raise',
    commonMistake: 'Swinging for momentum — raise only to eye level with control.',
    category: 'Accessory',
    primaryMuscles: ['front-delts'],
    secondaryMuscles: [],
    injuryRiskJoints: ['shoulders'],
  },

  // ─── TIER 3: PULL ISOLATIONS ─────────────────────────────────────────────
  'biceps curl': {
    purpose: 'Directly targets biceps for arm hypertrophy.',
    anatomyKey: 'biceps-curl',
    commonMistake: 'Swinging the torso — pin elbows to the sides.',
    category: 'Accessory',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    injuryRiskJoints: ['elbows', 'lower-back'],
  },
  'hammer curl': {
    purpose: 'Targets the brachialis for arm thickness and forearm development.',
    anatomyKey: 'hammer-curl',
    commonMistake: 'Rounding forward — stand tall, chest up, wrists neutral.',
    category: 'Accessory',
    primaryMuscles: ['biceps', 'forearms'],
    secondaryMuscles: [],
    injuryRiskJoints: ['elbows'],
  },
  'preacher curl': {
    purpose: 'Eliminates body swing for pure biceps isolation at the stretched position.',
    anatomyKey: 'preacher-curl',
    commonMistake: 'Dropping the weight at the bottom — keep tension through full extension.',
    category: 'Accessory',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    injuryRiskJoints: ['elbows', 'wrists'],
  },
  'reverse curl': {
    purpose: 'Pronated curl that hits the brachialis and forearm extensors.',
    anatomyKey: 'reverse-curl',
    commonMistake: 'Letting the wrists bend back — keep them flat and locked.',
    category: 'Accessory',
    primaryMuscles: ['forearms'],
    secondaryMuscles: ['biceps'],
    injuryRiskJoints: ['wrists', 'elbows'],
  },
  'rear delt fly': {
    purpose: 'Isolates rear delts and rhomboids for upper-back balance and posture.',
    anatomyKey: 'rear-delt-fly',
    commonMistake: 'Using the back to throw weight — lead with elbows at shoulder height.',
    category: 'Accessory',
    primaryMuscles: ['rear-delts', 'rhomboids'],
    secondaryMuscles: ['traps-mid'],
    injuryRiskJoints: ['shoulders'],
  },
  'barbell shrug': {
    purpose: 'Direct trap loading for upper-back mass and yoke thickness.',
    anatomyKey: 'barbell-shrug',
    commonMistake: 'Rolling the shoulders — shrug straight up and down.',
    category: 'Accessory',
    primaryMuscles: ['traps-upper'],
    secondaryMuscles: ['forearms'],
    injuryRiskJoints: ['neck'],
  },
  'face pull': {
    purpose: 'Essential prehab for shoulder longevity and rear-delt health.',
    anatomyKey: 'face-pull',
    commonMistake: 'Pulling with traps — pull the rope ends apart toward the forehead.',
    category: 'Accessory',
    primaryMuscles: ['rear-delts', 'rhomboids'],
    secondaryMuscles: ['traps-mid'],
    injuryRiskJoints: ['shoulders'],
  },

  // ─── TIER 3: LEG ISOLATIONS ──────────────────────────────────────────────
  'leg extension': {
    purpose: 'Isolation for quads, perfect for metabolic stress.',
    anatomyKey: 'leg-extension',
    commonMistake: 'Kicking too fast — hold the squeeze for one second at the top.',
    category: 'Accessory',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    injuryRiskJoints: ['knees'],
  },
  'seated leg curl': {
    purpose: 'Isolates hamstrings in a hip-flexed position for fuller curl range.',
    anatomyKey: 'seated-leg-curl',
    commonMistake: 'Bouncing at the bottom — control the eccentric to protect the knees.',
    category: 'Accessory',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    injuryRiskJoints: ['knees'],
  },
  'lying leg curl': {
    purpose: 'Isolates hamstrings through controlled knee flexion.',
    anatomyKey: 'lying-leg-curl',
    commonMistake: 'Hips lifting off the pad — press the pelvis down.',
    category: 'Accessory',
    primaryMuscles: ['hamstrings'],
    secondaryMuscles: [],
    injuryRiskJoints: ['knees', 'lower-back'],
  },
  'standing calf raise': {
    purpose: 'Overloads the gastrocnemius with full ankle range of motion.',
    anatomyKey: 'standing-calf',
    commonMistake: 'Short bounces — drop to a deep stretch, drive through the ball of the foot.',
    category: 'Accessory',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    injuryRiskJoints: ['ankles'],
  },
  'seated calf raise': {
    purpose: 'Targets the soleus with a bent-knee position for lower-leg thickness.',
    anatomyKey: 'seated-calf',
    commonMistake: 'Rushing reps — pause at both top and bottom for full tension.',
    category: 'Accessory',
    primaryMuscles: ['calves'],
    secondaryMuscles: [],
    injuryRiskJoints: ['ankles'],
  },

  // ─── TIER 3: CORE ────────────────────────────────────────────────────────
  'cable crunch': {
    purpose: 'Weighted spinal flexion for hypertrophy of the rectus abdominis.',
    anatomyKey: 'cable-crunch',
    commonMistake: 'Pulling with the arms — curl the spine and drive elbows toward thighs.',
    category: 'Core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques'],
    injuryRiskJoints: ['lower-back'],
  },
  'hanging leg raise': {
    purpose: 'Gold standard for functional core and grip strength.',
    anatomyKey: 'hanging-leg-raise',
    commonMistake: 'Swinging for momentum — control the pelvic tilt.',
    category: 'Core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'forearms'],
    injuryRiskJoints: ['shoulders', 'lower-back'],
  },
  'plank': {
    purpose: 'Trains the core to resist spinal extension.',
    anatomyKey: 'plank',
    commonMistake: 'Looking up — keep a neutral neck and squeeze the glutes.',
    category: 'Core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['obliques', 'lower-back'],
    injuryRiskJoints: ['lower-back'],
  },
  'ab wheel rollout': {
    purpose: 'Elite core stability challenge for anti-extension strength.',
    anatomyKey: 'ab-wheel',
    commonMistake: 'Arching the back — only roll as far as you can stay flat.',
    category: 'Core',
    primaryMuscles: ['abs'],
    secondaryMuscles: ['lats', 'lower-back'],
    injuryRiskJoints: ['lower-back', 'shoulders'],
  },
  'russian twist': {
    purpose: 'Trains rotational core strength and oblique endurance.',
    anatomyKey: 'russian-twist',
    commonMistake: 'Swinging the arms only — rotate through the torso, not the shoulders.',
    category: 'Core',
    primaryMuscles: ['obliques'],
    secondaryMuscles: ['abs'],
    injuryRiskJoints: ['lower-back'],
  },

  // ─── TIER 3: PRE-HAB ─────────────────────────────────────────────────────
  'band pull-apart': {
    purpose: 'Activates rear delts and rhomboids to prime the upper back before pressing.',
    anatomyKey: 'band-pull-apart',
    commonMistake: 'Shrugging the traps — retract the scapulae down and back.',
    category: 'Accessory',
    primaryMuscles: ['rear-delts', 'rhomboids'],
    secondaryMuscles: ['traps-mid'],
    injuryRiskJoints: ['shoulders'],
  },
  'external rotation': {
    purpose: 'Prehab for rotator-cuff health and long-term shoulder integrity.',
    anatomyKey: 'external-rotation',
    commonMistake: 'Lifting the elbow — pin it to the side and rotate only the forearm.',
    category: 'Accessory',
    primaryMuscles: ['rear-delts'],
    secondaryMuscles: [],
    injuryRiskJoints: ['shoulders'],
  },
  'pallof press': {
    purpose: 'Anti-rotation drill that teaches the core to resist twisting forces.',
    anatomyKey: 'pallof-press',
    commonMistake: 'Letting the torso rotate — keep the hips square to the anchor.',
    category: 'Core',
    primaryMuscles: ['obliques', 'abs'],
    secondaryMuscles: [],
    injuryRiskJoints: ['lower-back'],
  },
  'glute bridge': {
    purpose: 'Foundational glute activation drill that grooves clean hip extension.',
    anatomyKey: 'glute-bridge',
    commonMistake: 'Overextending the back — finish with a posterior pelvic tilt.',
    category: 'Hip Hinge',
    primaryMuscles: ['glutes'],
    secondaryMuscles: ['hamstrings'],
    injuryRiskJoints: ['lower-back'],
  },
  'bird dog': {
    purpose: 'Trains contralateral core stability and spinal control under movement.',
    anatomyKey: 'bird-dog',
    commonMistake: 'Rocking the hips — keep them level throughout the reach.',
    category: 'Core',
    primaryMuscles: ['lower-back', 'glutes'],
    secondaryMuscles: ['abs'],
    injuryRiskJoints: ['lower-back'],
  },
}

function normalizeExerciseName(exerciseName: string): string {
  return exerciseName
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

const SINGULAR_TO_PLURAL: Record<string, string> = {
  'dip': 'dips',
  'pull up': 'pull up',
  'pull-up': 'pull up',
  'pullup': 'pull up',
  'pullups': 'pull up',
  'pull ups': 'pull up',
  'chin-up': 'chin up',
  'chinup': 'chin up',
  'chin ups': 'chin up',
  'press up': 'dips',
  'tricep pushdown': 'triceps pushdown',
  'tricep extension': 'overhead triceps extension',
  'overhead tricep extension': 'overhead triceps extension',
  'bicep curl': 'biceps curl',
  'dumbbell curl': 'biceps curl',
  'barbell curl': 'biceps curl',
  'skullcrusher': 'skullcrushers',
  'skull crusher': 'skullcrushers',
  'skull crushers': 'skullcrushers',
  'cable fly': 'cable chest fly',
  'chest fly': 'cable chest fly',
  'pec deck': 'pec deck machine',
  'pec fly': 'pec deck machine',
  'rdl': 'romanian deadlift',
  'rdls': 'romanian deadlift',
  'lunges': 'walking lunges',
  'lunge': 'walking lunges',
  'split squat': 'bulgarian split squat',
  'split squats': 'bulgarian split squat',
  'shrug': 'barbell shrug',
  'shrugs': 'barbell shrug',
  'shoulder press': 'overhead press',
  'military press': 'overhead press',
  'ohp': 'overhead press',
  'db shoulder press': 'dumbbell shoulder press',
  'db bench press': 'dumbbell bench press',
  'db bench': 'dumbbell bench press',
  'db incline press': 'dumbbell incline press',
  'db incline': 'dumbbell incline press',
  'incline dumbbell press': 'dumbbell incline press',
  'db row': 'dumbbell row',
  'one arm row': 'dumbbell row',
  'single arm row': 'dumbbell row',
  'tbar row': 't-bar row',
  't bar row': 't-bar row',
  'cable row': 'seated cable row',
  'row': 'barbell row',
  'rows': 'barbell row',
  'squat': 'back squat',
  'squats': 'back squat',
  'deadlifts': 'deadlift',
  'bench': 'bench press',
  'incline bench': 'incline press',
  'incline bench press': 'incline press',
  'leg curl': 'lying leg curl',
  'leg curls': 'lying leg curl',
  'leg extensions': 'leg extension',
  'calf raise': 'standing calf raise',
  'calf raises': 'standing calf raise',
  'crunches': 'cable crunch',
  'crunch': 'cable crunch',
  'leg raise': 'hanging leg raise',
  'leg raises': 'hanging leg raise',
  'planks': 'plank',
  'twist': 'russian twist',
  'twists': 'russian twist',
  'hip thrusts': 'hip thrust',
  'glute bridges': 'glute bridge',
  'lat pull down': 'lat pulldown',
  'lat pull-down': 'lat pulldown',
  'face pulls': 'face pull',
  'rear delt flyes': 'rear delt fly',
  'rear delt flies': 'rear delt fly',
  'rear delt raise': 'rear delt fly',
  'lateral raises': 'lateral raise',
  'side raise': 'lateral raise',
  'side raises': 'lateral raise',
  'front raises': 'front raise',
  'hammer curls': 'hammer curl',
  'preacher curls': 'preacher curl',
  'reverse curls': 'reverse curl',
  'biceps curls': 'biceps curl',
  'pushdowns': 'triceps pushdown',
  'pushdown': 'triceps pushdown',
}

export function getFunctionalInfo(exerciseName: string): ExerciseFunctionalInfo | null {
  const key = normalizeExerciseName(exerciseName)
  const direct = functionalMapping[key]
  if (direct) return direct
  const aliased = SINGULAR_TO_PLURAL[key]
  if (aliased && functionalMapping[aliased]) return functionalMapping[aliased]
  return null
}

export function getExerciseCategory(exerciseName: string): ExerciseCategory | null {
  return getFunctionalInfo(exerciseName)?.category ?? null
}
