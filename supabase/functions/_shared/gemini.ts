const GEMINI_KEY = () => Deno.env.get('GEMINI_API_KEY')!

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    },
  )
  const payload = await res.json()
  if (!payload.embedding?.values) throw new Error('Embedding failed')
  return payload.embedding.values
}

export interface GoalIntent {
  goal: 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
  daysPerWeek: number
  minutesPerSession: number
  experience: 'beginner' | 'intermediate' | 'advanced'
  swapPreference: 'low' | 'medium' | 'high'
}

export function buildRetrievalText(intent: GoalIntent, profile: Record<string, unknown> | null): string {
  return [
    `Goal: ${intent.goal}`,
    `Experience: ${intent.experience}`,
    `Duration: ${intent.minutesPerSession}min`,
    `Days: ${intent.daysPerWeek}`,
    `Equipment: ${((profile?.equipment as string[]) ?? []).join(', ') || 'any'}`,
  ].join(' | ')
}

export async function parseIntentWithGemini(
  goalText: string,
  profile: Record<string, unknown> | null,
): Promise<GoalIntent> {
  const systemPrompt = `You are a fitness intent parser. Return ONLY valid JSON matching this exact schema:
{"goal":"fat_loss"|"hypertrophy"|"strength"|"endurance"|"recomp"|"power","daysPerWeek":number,"minutesPerSession":number,"experience":"beginner"|"intermediate"|"advanced","swapPreference":"low"|"medium"|"high"}
Default: daysPerWeek=${profile?.days_per_week ?? 3}, minutesPerSession=${profile?.minutes_per_session ?? 45}, experience=${profile?.experience_level ?? 'beginner'}, swapPreference="low"
User goal: "${goalText}"`

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
      },
    )
    const payload = await res.json()
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    try {
      const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned) as GoalIntent
      if (!parsed.goal || !parsed.experience) throw new Error('Invalid intent')
      return parsed
    } catch {
      if (attempt === 1) throw new Error(`Intent parse failed after 2 attempts: ${raw}`)
    }
  }
  throw new Error('Intent parse failed')
}

export async function generateTemplateWithGemini(intent: GoalIntent): Promise<Record<string, unknown>> {
  const prompt = `Generate a workout template JSON for: goal=${intent.goal}, experience=${intent.experience}, duration=${intent.minutesPerSession}min.
Return ONLY: {"split_type":"Full Body"|"PPL"|"Upper-Lower","slots":[{"movement_pattern":"squat"|"hinge"|"push"|"pull"|"carry"|"core","tier":1|2|3,"intensity_band":"low"|"medium"|"high"}]}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )
  const payload = await res.json()
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
  return { ...JSON.parse(cleaned), id: 'gemini-generated', goal_tags: [intent.goal] }
}
