import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const GEMINI_KEY = process.env.GEMINI_API_KEY!

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    },
  )
  const json = await res.json()
  if (!json.embedding?.values) throw new Error(`Embed failed: ${JSON.stringify(json)}`)
  return json.embedding.values
}

function templateText(t: Record<string, unknown>): string {
  return `Goal: ${(t.goal_tags as string[]).join(', ')} | Split: ${t.split_type} | Intensity: ${t.intensity_band} | Duration: ${t.duration_minutes}min | Experience: ${t.experience_level}`
}

function exerciseText(e: Record<string, unknown>): string {
  return `Exercise: ${e.name} | Pattern: ${e.movement_pattern} | Tags: ${(e.stimulus_tags as string[]).join(', ')} | Equipment: ${(e.equipment as string[]).join(', ')} | Intensity: ${e.intensity_band} | Tier: ${e.tier}`
}

async function run() {
  const { data: templates } = await supabase
    .from('plan_templates').select('id, split_type, goal_tags, duration_minutes, intensity_band, experience_level')
    .is('embedding', null)

  for (const t of templates ?? []) {
    const embedding = await embedText(templateText(t))
    const { error: tErr } = await supabase.from('plan_templates').update({ embedding }).eq('id', t.id)
    if (tErr) throw new Error(`Template update failed (${t.id}): ${tErr.message}`)
    console.log(`Embedded template: ${t.split_type} / ${(t.goal_tags as string[]).join(',')}`)
    await new Promise(r => setTimeout(r, 100))
  }

  const { data: exercises } = await supabase
    .from('exercises').select('id, name, movement_pattern, stimulus_tags, equipment, intensity_band, tier')
    .is('embedding', null)

  for (const e of exercises ?? []) {
    const embedding = await embedText(exerciseText(e))
    const { error: eErr } = await supabase.from('exercises').update({ embedding }).eq('id', e.id)
    if (eErr) throw new Error(`Exercise update failed (${e.id}): ${eErr.message}`)
    console.log(`Embedded exercise: ${e.name}`)
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('All embeddings generated.')
}

run().catch((err) => { console.error(err); process.exit(1) })
