---
type: community
cohesion: 0.70
members: 5
---

# buildBackupPayload(), downloadBackupJson(), export

**Cohesion:** 0.70 - tightly connected
**Members:** 5 nodes

## Members
- [[backup.ts]] - code - src\utils\backup.ts
- [[buildBackupPayload()]] - code - src\utils\backup.ts
- [[downloadBackupJson()]] - code - src\utils\backup.ts
- [[exportBackup()]] - code - src\utils\backup.ts
- [[serializeBackup()]] - code - src\utils\backup.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/buildBackupPayload(),_downloadBackupJson(),_export
SORT file.name ASC
```
