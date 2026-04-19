---
type: community
cohesion: 0.11
members: 36
---

# applyGoalPrescription(), baselineRepGoal(), bodyRe

**Cohesion:** 0.11 - loosely connected
**Members:** 36 nodes

## Members
- [[applyGoalPrescription()]] - code - src\planner\autoPlanner.ts
- [[autoPlanner.ts]] - code - src\planner\autoPlanner.ts
- [[baselineRepGoal()]] - code - src\planner\autoPlanner.ts
- [[bodyRegion()]] - code - src\planner\autoPlanner.ts
- [[buildCategoryExpansionQueue()]] - code - src\planner\autoPlanner.ts
- [[buildCoreBlueprintByTier()]] - code - src\planner\autoPlanner.ts
- [[buildVolumeExpansionCandidates()]] - code - src\planner\autoPlanner.ts
- [[calcEstimatedMinutes()]] - code - src\planner\autoPlanner.ts
- [[classifyExpansionCandidate()]] - code - src\planner\autoPlanner.ts
- [[classifyExpansionName()]] - code - src\planner\autoPlanner.ts
- [[dedupeExercisesById()]] - code - src\planner\autoPlanner.ts
- [[dedupePlannedById()]] - code - src\planner\autoPlanner.ts
- [[detectSessionIndex()]] - code - src\planner\autoPlanner.ts
- [[estimateExerciseDurationSeconds()]] - code - src\planner\autoPlanner.ts
- [[expandForTimeBudget()]] - code - src\planner\autoPlanner.ts
- [[filterBySessionRule()]] - code - src\planner\autoPlanner.ts
- [[generateWorkout()]] - code - src\planner\autoPlanner.ts
- [[getBlueprint()]] - code - src\planner\autoPlanner.ts
- [[getBlueprintExercises()]] - code - src\planner\autoPlanner.ts
- [[getMaxExercisesForTime()]] - code - src\planner\autoPlanner.ts
- [[getRecommendedRoutinesForDays()]] - code - src\planner\autoPlanner.ts
- [[getRoutineSessionLabel()]] - code - src\planner\autoPlanner.ts
- [[hasSessionTag()]] - code - src\planner\autoPlanner.ts
- [[inferAxis()]] - code - src\planner\autoPlanner.ts
- [[isLikelyPrimaryCompound()]] - code - src\planner\autoPlanner.ts
- [[isUuidV4()]] - code - src\planner\autoPlanner.ts
- [[mapRecentSetsByExercise()]] - code - src\planner\autoPlanner.ts
- [[normalizeExerciseName()_2]] - code - src\planner\autoPlanner.ts
- [[normalizeRoutineType()]] - code - src\planner\autoPlanner.ts
- [[normalizeStoredRoutineType()]] - code - src\planner\autoPlanner.ts
- [[pickLowerBodySessionIndex()]] - code - src\planner\autoPlanner.ts
- [[planExerciseFromHistory()]] - code - src\planner\autoPlanner.ts
- [[planRoutineWorkoutPure()]] - code - src\planner\autoPlanner.ts
- [[remapGzclTiers()]] - code - src\planner\autoPlanner.ts
- [[runPlannerPreflightAudit()]] - code - src\planner\autoPlanner.ts
- [[tierCapForTime()]] - code - src\planner\autoPlanner.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/applyGoalPrescription(),_baselineRepGoal(),_bodyRe
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_applyQosToPlan(), buildUpdatedPlanFromCards(), cla]]
- 2 edges to [[_COMMUNITY_buildPlanFromDraft(), cloneExercises(), clonePlan(]]
- 1 edge to [[_COMMUNITY_applySmartSwapGuards(), dedupeExercises(), getAlte]]
- 1 edge to [[_COMMUNITY_addConstraintField(), goToNextStep(), goToPrevious]]

## Top bridge nodes
- [[generateWorkout()]] - degree 6, connects to 2 communities
- [[calcEstimatedMinutes()]] - degree 5, connects to 2 communities
- [[classifyExpansionName()]] - degree 3, connects to 1 community
- [[getRoutineSessionLabel()]] - degree 3, connects to 1 community