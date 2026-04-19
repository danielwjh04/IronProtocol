---
type: community
cohesion: 0.11
members: 24
---

# json(), makeServiceClient(), requireAuth()

**Cohesion:** 0.11 - loosely connected
**Members:** 24 nodes

## Members
- [[GEMINI_KEY()]] - code - supabase\functions\_shared\gemini.ts
- [[auth.ts]] - code - supabase\functions\_shared\auth.ts
- [[buildRetrievalText()]] - code - supabase\functions\_shared\gemini.ts
- [[composePlan()]] - code - supabase\functions\_shared\composePlan.ts
- [[composePlan.ts]] - code - supabase\functions\_shared\composePlan.ts
- [[embedText()]] - code - supabase\functions\_shared\gemini.ts
- [[embedText()_1]] - code - supabase\seed\generate_embeddings.ts
- [[exerciseText()]] - code - supabase\seed\generate_embeddings.ts
- [[gemini.ts]] - code - supabase\functions\_shared\gemini.ts
- [[generateTemplateWithGemini()]] - code - supabase\functions\_shared\gemini.ts
- [[generate_embeddings.ts]] - code - supabase\seed\generate_embeddings.ts
- [[getTestJwt()]] - code - supabase\functions\_tests\plans-feedback.test.ts
- [[getTestJwt()_1]] - code - supabase\functions\_tests\plans-query.test.ts
- [[getTestJwt()_2]] - code - supabase\functions\_tests\plans-swap.test.ts
- [[json()]] - code - supabase\functions\_shared\auth.ts
- [[makeServiceClient()]] - code - supabase\functions\_shared\auth.ts
- [[parseIntentWithGemini()]] - code - supabase\functions\_shared\gemini.ts
- [[plans-feedback.test.ts]] - code - supabase\functions\_tests\plans-feedback.test.ts
- [[plans-query.test.ts]] - code - supabase\functions\_tests\plans-query.test.ts
- [[plans-swap.test.ts]] - code - supabase\functions\_tests\plans-swap.test.ts
- [[repSchemes.ts]] - code - supabase\functions\_shared\repSchemes.ts
- [[requireAuth()]] - code - supabase\functions\_shared\auth.ts
- [[run()]] - code - supabase\seed\generate_embeddings.ts
- [[templateText()]] - code - supabase\seed\generate_embeddings.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/json(),_makeServiceClient(),_requireAuth()
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_CoreIgnition(), PulsingBarbell(), extractCandidate]]

## Top bridge nodes
- [[json()]] - degree 9, connects to 1 community