---
type: community
cohesion: 0.25
members: 8
---

# InMemoryStorage, .clear(), .getItem()

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[.clear()]] - code - src\test\setup.ts
- [[.getItem()]] - code - src\test\setup.ts
- [[.key()]] - code - src\test\setup.ts
- [[.length()]] - code - src\test\setup.ts
- [[.removeItem()]] - code - src\test\setup.ts
- [[.setItem()]] - code - src\test\setup.ts
- [[InMemoryStorage]] - code - src\test\setup.ts
- [[setup.ts]] - code - src\test\setup.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/InMemoryStorage,_.clear(),_.getItem()
SORT file.name ASC
```
