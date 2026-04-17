import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type RepScheme = {
  sets: number; repsMin: number; repsMax: number; restSeconds: number; rpe?: number
}

const REP_SCHEMES: Record<string, Record<number, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
    2: { sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    3: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 180, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 240 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
  },
  fat_loss: {
    1: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60 },
    2: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45 },
    3: { sets: 3, repsMin: 12, repsMax: 20, restSeconds: 30 },
  },
  endurance: {
    1: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
    2: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30 },
    3: { sets: 2, repsMin: 20, repsMax: 30, restSeconds: 20 },
  },
  recomp: {
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 90 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 75 },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60 },
  },
}

function slot(pattern: string, tier: 1|2|3, band: string, goal: string) {
  return { movement_pattern: pattern, tier, intensity_band: band, rep_scheme: REP_SCHEMES[goal][tier] }
}

const templates = [
  { split_type: 'push_pull_legs', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'push_pull_legs', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('pull',1,'high','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('pull',3,'low','hypertrophy'), slot('pull',3,'low','hypertrophy')] },
  { split_type: 'push_pull_legs', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('squat',2,'medium','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('squat',3,'low','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('pull',3,'low','hypertrophy')] },
  { split_type: 'upper_lower', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'upper_lower', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('hinge',1,'high','hypertrophy'), slot('squat',2,'medium','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('squat',3,'low','hypertrophy')] },
  { split_type: 'push_pull_legs', goal_tags: ['hypertrophy'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','hypertrophy'), slot('push',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['hypertrophy'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('hinge',1,'high','power'), slot('pull',2,'medium','power')] },
  { split_type: 'upper_lower', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','power'), slot('pull',1,'high','power'), slot('push',2,'medium','power'), slot('pull',2,'medium','power')] },
  { split_type: 'upper_lower', goal_tags: ['power'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','power'), slot('hinge',1,'high','power'), slot('squat',2,'medium','power'), slot('hinge',2,'medium','power'), slot('squat',3,'low','power')] },
  { split_type: 'full_body', goal_tags: ['power'], duration_minutes: 45, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('pull',1,'high','power')] },
  { split_type: 'push_pull_legs', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','power'), slot('push',1,'high','power'), slot('push',2,'medium','power'), slot('push',3,'low','power')] },
  { split_type: 'full_body', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength')] },
  { split_type: 'full_body', goal_tags: ['strength'], duration_minutes: 75, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('hinge',1,'high','strength'), slot('pull',2,'medium','strength')] },
  { split_type: 'upper_lower', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('push',2,'medium','strength'), slot('pull',2,'medium','strength')] },
  { split_type: 'upper_lower', goal_tags: ['strength'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','strength'), slot('hinge',1,'high','strength'), slot('squat',2,'medium','strength'), slot('hinge',2,'medium','strength')] },
  { split_type: 'full_body', goal_tags: ['strength'], duration_minutes: 45, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength')] },
  { split_type: 'full_body', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['fat_loss'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('hinge',2,'medium','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['fat_loss'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'medium','fat_loss'), slot('hinge',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'upper_lower', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('push',1,'medium','fat_loss'), slot('pull',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',3,'low','fat_loss')] },
  { split_type: 'upper_lower', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'medium','fat_loss'), slot('hinge',2,'medium','fat_loss'), slot('squat',3,'low','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['fat_loss'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','fat_loss'), slot('pull',2,'low','fat_loss'), slot('squat',2,'low','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('squat',1,'low','endurance'), slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'full_body', goal_tags: ['endurance'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('squat',2,'low','endurance')] },
  { split_type: 'full_body', goal_tags: ['endurance'], duration_minutes: 60, intensity_band: 'low', experience_level: 'intermediate',
    slots: [slot('squat',1,'low','endurance'), slot('hinge',1,'low','endurance'), slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('core',3,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'upper_lower', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('push',3,'low','endurance'), slot('pull',3,'low','endurance')] },
  { split_type: 'upper_lower', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('squat',2,'low','endurance'), slot('hinge',2,'low','endurance'), slot('squat',3,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'full_body', goal_tags: ['recomp'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','recomp'), slot('push',1,'medium','recomp'), slot('pull',2,'medium','recomp'), slot('hinge',2,'medium','recomp')] },
  { split_type: 'full_body', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','recomp'), slot('push',1,'high','recomp'), slot('pull',1,'medium','recomp'), slot('hinge',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('pull',3,'low','recomp')] },
  { split_type: 'upper_lower', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('push',1,'high','recomp'), slot('pull',1,'medium','recomp'), slot('push',2,'medium','recomp'), slot('pull',2,'medium','recomp'), slot('push',3,'low','recomp')] },
  { split_type: 'upper_lower', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','recomp'), slot('hinge',1,'medium','recomp'), slot('squat',2,'medium','recomp'), slot('hinge',2,'medium','recomp'), slot('core',3,'low','recomp')] },
  { split_type: 'push_pull_legs', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'advanced',
    slots: [slot('push',1,'high','recomp'), slot('push',2,'medium','recomp'), slot('push',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('push',3,'low','recomp')] },
  { split_type: 'full_body', goal_tags: ['recomp'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','recomp'), slot('push',2,'medium','recomp'), slot('pull',2,'medium','recomp')] },
  { split_type: 'full_body', goal_tags: ['hypertrophy','recomp'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'upper_lower', goal_tags: ['strength','hypertrophy'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['fat_loss','recomp'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',2,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['power','strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('hinge',1,'high','power'), slot('pull',2,'medium','power')] },
  { split_type: 'full_body', goal_tags: ['endurance','fat_loss'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('squat',2,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'upper_lower', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'full_body', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('hinge',2,'medium','strength')] },
  { split_type: 'push_pull_legs', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('pull',1,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('pull',3,'low','fat_loss'), slot('pull',3,'low','fat_loss')] },
  { split_type: 'full_body', goal_tags: ['recomp'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','recomp'), slot('push',1,'high','recomp'), slot('pull',1,'high','recomp'), slot('hinge',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('pull',3,'low','recomp'), slot('core',3,'low','recomp')] },
  { split_type: 'full_body', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','hypertrophy'), slot('hinge',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy')] },
]

async function seedTemplates() {
  const { error } = await supabase.from('plan_templates').insert(templates)
  if (error) throw error
  console.log(`Seeded ${templates.length} plan templates`)
}

seedTemplates().catch((err) => { console.error(err); process.exit(1) })
