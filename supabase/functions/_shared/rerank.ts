interface TemplateRow {
  id: string
  split_type: string
  goal_tags: string[]
  slots: unknown[]
  intensity_band: string
  duration_minutes: number
  similarity: number
  experience_level: string
}

interface RankInput {
  goal: string
  experience: string
}

export function rerank(templates: TemplateRow[], intent: RankInput): Array<TemplateRow & { score: number }> {
  return templates
    .map(t => {
      const semantic    = t.similarity * 0.45
      const goalFit     = (t.goal_tags.includes(intent.goal) ? 1 : 0.3) * 0.25
      const progression = (t.experience_level === intent.experience ? 1 : 0.5) * 0.20
      const adherence   = (t.slots.length <= 6 ? 1 : 0.6) * 0.10
      return { ...t, score: semantic + goalFit + progression + adherence }
    })
    .sort((a, b) => b.score - a.score)
}
