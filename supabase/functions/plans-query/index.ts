import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'
import { embedText, buildRetrievalText, parseIntentWithGemini, generateTemplateWithGemini } from '../_shared/gemini.ts'
import { rerank } from '../_shared/rerank.ts'
import { composePlan } from '../_shared/composePlan.ts'

const CONFIDENCE_THRESHOLD = 0.72

serve(async (req) => {
  const supabase = makeServiceClient()

  let user: { id: string }
  try {
    user = await requireAuth(req, supabase)
  } catch (res) {
    return res as Response
  }

  let goalText: string
  try {
    const body = await req.json()
    if (!body.goalText || typeof body.goalText !== 'string') return json({ error: 'goalText is required' }, 400)
    goalText = body.goalText
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persistent_injuries, equipment, experience_level, days_per_week, minutes_per_session')
    .eq('id', user.id)
    .single()

  const intent = await parseIntentWithGemini(goalText, profile)
  const injuries: string[] = (profile?.persistent_injuries ?? [])
    .flatMap((inj: { safety_flags: string[] }) => inj.safety_flags)

  const queryVec = await embedText(buildRetrievalText(intent, profile))

  const { data: templates, error: tErr } = await supabase.rpc('search_plan_templates', {
    query_embedding: queryVec,
    p_experience: intent.experience,
    p_max_minutes: intent.minutesPerSession,
    top_k: 40,
  })
  if (tErr) return json({ error: tErr.message }, 500)

  const { data: exercises, error: eErr } = await supabase.rpc('search_safe_exercises', {
    query_embedding: queryVec,
    p_user_id: user.id,
    p_equipment: profile?.equipment ?? [],
    top_k: 120,
  })
  if (eErr) return json({ error: eErr.message }, 500)

  const ranked = rerank(templates ?? [], intent)
  const bestScore = ranked[0]?.score ?? 0

  const template = bestScore >= CONFIDENCE_THRESHOLD
    ? ranked[0]
    : await generateTemplateWithGemini(intent)

  const confidence = Math.min(bestScore, 1)
  let resolvedExercises: ReturnType<typeof composePlan>
  try {
    resolvedExercises = composePlan(template, exercises ?? [], intent.goal)
  } catch (err) {
    return json({ error: (err as Error).message }, 422)
  }

  const violation = resolvedExercises.find(ex =>
    ex.safety_flags.some(f => injuries.includes(f))
  )
  if (violation) {
    console.error(`Safety violation: ${violation.name} for user ${user.id}`)
    return json({ error: 'Safety violation detected. Please update injury profile.' }, 422)
  }

  return json({
    plan: {
      templateId: template.id,
      splitType: template.split_type,
      confidence,
      rationale: `${template.split_type} plan optimised for ${intent.goal}. Confidence: ${Math.round(confidence * 100)}%.`,
      safetyNotes: injuries.length > 0 ? [`Excluded exercises with: ${injuries.join(', ')}`] : [],
      exercises: resolvedExercises,
    },
  })
})
