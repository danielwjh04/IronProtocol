---
type: community
cohesion: 0.12
members: 21
---

# CoreIgnition(), PulsingBarbell(), extractCandidate

**Cohesion:** 0.12 - loosely connected
**Members:** 21 nodes

## Members
- [[CoreIgnition()]] - code - src\components\CoreIgnition.tsx
- [[CoreIgnition.tsx]] - code - src\components\CoreIgnition.tsx
- [[PulsingBarbell()]] - code - src\components\CoreIgnition.tsx
- [[SemanticSwapDrawer()]] - code - src\components\SemanticSwapDrawer.tsx
- [[SemanticSwapDrawer.tsx]] - code - src\components\SemanticSwapDrawer.tsx
- [[buildAuditPrompt()]] - code - src\services\recoveryAuditorService.ts
- [[buildSwapPrompt()]] - code - src\services\semanticSwapService.ts
- [[extractCandidateText()]] - code - src\services\geminiClient.ts
- [[extractJsonBlock()]] - code - src\services\geminiClient.ts
- [[fetchGemini()]] - code - src\services\geminiClient.ts
- [[geminiClient.ts]] - code - src\services\geminiClient.ts
- [[generateRecoveryAudit()]] - code - src\services\recoveryAuditorService.ts
- [[generateSemanticSwap()]] - code - src\services\semanticSwapService.ts
- [[isLabAvailable()]] - code - src\services\geminiClient.ts
- [[logGeminiFailure()]] - code - src\services\geminiClient.ts
- [[recoveryAuditorService.ts]] - code - src\services\recoveryAuditorService.ts
- [[semanticSwapService.ts]] - code - src\services\semanticSwapService.ts
- [[useRecoveryAudit()]] - code - src\hooks\useRecoveryAudit.ts
- [[useRecoveryAudit.ts]] - code - src\hooks\useRecoveryAudit.ts
- [[useSemanticSwap()]] - code - src\hooks\useSemanticSwap.ts
- [[useSemanticSwap.ts]] - code - src\hooks\useSemanticSwap.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CoreIgnition(),_PulsingBarbell(),_extractCandidate
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_addUniqueSeed(), buildDayBuckets(), buildExpandedD]]
- 1 edge to [[_COMMUNITY_json(), makeServiceClient(), requireAuth()]]

## Top bridge nodes
- [[fetchGemini()]] - degree 8, connects to 2 communities
- [[generateSemanticSwap()]] - degree 4, connects to 1 community