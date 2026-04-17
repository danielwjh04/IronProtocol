import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'
import { REP_SCHEMES, type GoalKey, type Tier } from '../_shared/repSchemes.ts'

serve(async (req) => {
  const supabase = makeServiceClient()
  let user: { id: string }
  try { user = await requireAuth(req, supabase) } catch (res) { return res as Response }

  let exerciseId: string, reason: string, currentPlanExerciseIds: string[], goalTag: string | undefined
  try {
    ({ exerciseId, reason, currentPlanExerciseIds, goalTag } = await req.json())
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persistent_injuries, equipment')
    .eq('id', user.id).single()

  const excludedFlags: string[] = (profile?.persistent_injuries ?? [])
    .flatMap((inj: { safety_flags: string[] }) => inj.safety_flags)

  const { data: current } = await supabase
    .from('exercises')
    .select('swap_group_id, intensity_band, tier, embedding')
    .eq('id', exerciseId).single()

  if (!current) return json({ error: 'Exercise not found' }, 404)

  const { data: candidates } = await supabase.rpc('find_swap_candidates', {
    p_swap_group_id:  current.swap_group_id,
    p_intensity_band: current.intensity_band,
    p_tier:           current.tier,
    p_excluded_flags: excludedFlags,
    p_equipment:      profile?.equipment ?? [],
    p_exclude_ids:    [exerciseId, ...(currentPlanExerciseIds ?? [])],
    query_embedding:  current.embedding,
    top_k:            10,
  })

  const { data: signals } = await supabase
    .from('exercise_swap_signals')
    .select('to_id, safe_swaps')
    .eq('from_id', exerciseId)
    .order('safe_swaps', { ascending: false })

  const signalMap = new Map((signals ?? []).map((s: { to_id: string; safe_swaps: number }) => [s.to_id, s.safe_swaps]))

  const boosted = (candidates ?? [])
    .map((ex: { id: string }) => ({ ...ex, boost: signalMap.get(ex.id) ?? 0 }))
    .sort((a: { similarity: number; boost: number }, b: { similarity: number; boost: number }) =>
      (b.similarity + b.boost * 0.1) - (a.similarity + a.boost * 0.1)
    )
    .slice(0, 5)

  const goalKey = (goalTag ?? 'hypertrophy') as GoalKey
  const tier = (current.tier as Tier)

  return json({
    options: boosted.map((ex: Record<string, unknown>) => ({
      exercise: ex,
      rationale: `${ex.name} — same movement pattern, safe for your profile. ${reason}`,
      repScheme: REP_SCHEMES[goalKey]?.[tier] ?? REP_SCHEMES['hypertrophy'][tier],
    })),
  })
})
