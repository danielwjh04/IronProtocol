---
type: community
cohesion: 0.70
members: 5
---

# auditRecoveryOffline(), countHighSorenessGroups(),

**Cohesion:** 0.70 - tightly connected
**Members:** 5 nodes

## Members
- [[auditRecoveryOffline()]] - code - src\planner\recoveryAuditorHeuristics.ts
- [[countHighSorenessGroups()]] - code - src\planner\recoveryAuditorHeuristics.ts
- [[mostSoreGroup()]] - code - src\planner\recoveryAuditorHeuristics.ts
- [[recoveryAuditorHeuristics.ts]] - code - src\planner\recoveryAuditorHeuristics.ts
- [[sortedByRecent()]] - code - src\planner\recoveryAuditorHeuristics.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/auditRecoveryOffline(),_countHighSorenessGroups(),
SORT file.name ASC
```
