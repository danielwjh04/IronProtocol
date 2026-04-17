import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'

serve(async (req) => {
  const supabase = makeServiceClient()
  let user: { id: string }
  try { user = await requireAuth(req, supabase) } catch (res) { return res as Response }

  const body = await req.json()

  const { error } = await supabase.from('retrieval_feedback').insert({
    user_id:               user.id,
    plan_id:               body.planId ?? null,
    accepted:              body.accepted,
    swapped_from_exercise: body.swappedFromExerciseId ?? null,
    swapped_to_exercise:   body.swappedToExerciseId   ?? null,
    pain_flag:             body.painFlag ?? false,
    goal_tag:              body.goalTag  ?? null,
  })

  if (error) return json({ error: error.message }, 500)
  return json({ ok: true })
})
