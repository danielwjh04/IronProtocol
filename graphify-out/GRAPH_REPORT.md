# Graph Report - .  (2026-04-15)

## Corpus Check
- 83 files · ~68,241 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 415 nodes · 538 edges · 61 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Planner Core Algorithm|Planner Core Algorithm]]
- [[_COMMUNITY_Active Session Logger|Active Session Logger]]
- [[_COMMUNITY_Blueprint Builder Functions|Blueprint Builder Functions]]
- [[_COMMUNITY_Architecture & Project Config|Architecture & Project Config]]
- [[_COMMUNITY_QoS & Swap Engine|QoS & Swap Engine]]
- [[_COMMUNITY_AI Service & Prompt Building|AI Service & Prompt Building]]
- [[_COMMUNITY_Onboarding Wizard UI|Onboarding Wizard UI]]
- [[_COMMUNITY_Metrics & Personal Bests|Metrics & Personal Bests]]
- [[_COMMUNITY_Onboarding Step Automation|Onboarding Step Automation]]
- [[_COMMUNITY_Home & Macrocycle Scheduling|Home & Macrocycle Scheduling]]
- [[_COMMUNITY_Macrocycle Persistence|Macrocycle Persistence]]
- [[_COMMUNITY_Smart Swap & Exercise Order|Smart Swap & Exercise Order]]
- [[_COMMUNITY_Backup & Data Export|Backup & Data Export]]
- [[_COMMUNITY_Blueprint Test Contracts|Blueprint Test Contracts]]
- [[_COMMUNITY_Database Schema & Init|Database Schema & Init]]
- [[_COMMUNITY_Progress Indicator|Progress Indicator]]
- [[_COMMUNITY_V11 Design Sprint Plan|V11 Design Sprint Plan]]
- [[_COMMUNITY_Social & Brand Icons|Social & Brand Icons]]
- [[_COMMUNITY_UI Integration Tests|UI Integration Tests]]
- [[_COMMUNITY_Import Validation|Import Validation]]
- [[_COMMUNITY_Boot Ignition Screen|Boot Ignition Screen]]
- [[_COMMUNITY_Workout Start Haptics|Workout Start Haptics]]
- [[_COMMUNITY_History Page|History Page]]
- [[_COMMUNITY_Macrocycle Test Fixtures|Macrocycle Test Fixtures]]
- [[_COMMUNITY_Exercise Card UI|Exercise Card UI]]
- [[_COMMUNITY_Exercise Card Internals|Exercise Card Internals]]
- [[_COMMUNITY_AI Planner Service Tests|AI Planner Service Tests]]
- [[_COMMUNITY_Auto Planner Tests|Auto Planner Tests]]
- [[_COMMUNITY_Exercise Service Tests|Exercise Service Tests]]
- [[_COMMUNITY_Temp Session Schema|Temp Session Schema]]
- [[_COMMUNITY_App Shell & Nav|App Shell & Nav]]
- [[_COMMUNITY_Baseline Calibration Card|Baseline Calibration Card]]
- [[_COMMUNITY_Brand Visual Assets|Brand Visual Assets]]
- [[_COMMUNITY_Vite Build Config|Vite Build Config]]
- [[_COMMUNITY_Exercise Constants|Exercise Constants]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Vitest Config|Vitest Config]]
- [[_COMMUNITY_Write Chunk JS Util|Write Chunk JS Util]]
- [[_COMMUNITY_Write Chunk Py Util|Write Chunk Py Util]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_Draft Blueprint Review Gantry|Draft Blueprint Review Gantry]]
- [[_COMMUNITY_FeaturePulse Tooltip|FeaturePulse Tooltip]]
- [[_COMMUNITY_FunctionalWhy Panel|FunctionalWhy Panel]]
- [[_COMMUNITY_Dexie DB Module|Dexie DB Module]]
- [[_COMMUNITY_Personal Bests Service|Personal Bests Service]]
- [[_COMMUNITY_ActiveLogger Tests|ActiveLogger Tests]]
- [[_COMMUNITY_DB Tests|DB Tests]]
- [[_COMMUNITY_DraftBlueprintReview Tests|DraftBlueprintReview Tests]]
- [[_COMMUNITY_SessionBlueprint Tests|SessionBlueprint Tests]]
- [[_COMMUNITY_Test Setup|Test Setup]]
- [[_COMMUNITY_ThinkingTerminal Tests|ThinkingTerminal Tests]]
- [[_COMMUNITY_Onboarding Read-First Rule|Onboarding Read-First Rule]]
- [[_COMMUNITY_TDD Mandate|TDD Mandate]]
- [[_COMMUNITY_Quality Gates|Quality Gates]]
- [[_COMMUNITY_SessionBlueprint Rationale|SessionBlueprint Rationale]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_ExerciseCard Model Interface|ExerciseCard Model Interface]]
- [[_COMMUNITY_Onboarding Terminal Copy|Onboarding Terminal Copy]]
- [[_COMMUNITY_Preflight Audit Interface|Preflight Audit Interface]]

## God Nodes (most connected - your core abstractions)
1. `planRoutineWorkoutPure()` - 16 edges
2. `IronProtocol Complete System Specification v5.1` - 14 edges
3. `Database Schema and IndexedDB Constraints (V3)` - 12 edges
4. `ActiveLogger Component` - 11 edges
5. `generateWorkoutBlueprint()` - 9 edges
6. `IronProtocol README` - 9 edges
7. `Auto Planner Algorithm Logic (V3)` - 9 edges
8. `PlannedExercise Interface` - 9 edges
9. `generateLocalMacrocycle()` - 8 edges
10. `IronProtocolDB (Dexie Schema)` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Macrocycle Gantry Handoff Test` --conceptually_related_to--> `Gantry (Offline Execution) Mode`  [INFERRED]
  src/test/UI.test.tsx → raw/vision.md
- `Dexie.js Schema Spec` --conceptually_related_to--> `Temp Draft Resumption and Discard Test`  [INFERRED]
  raw/vision.md → src/test/UI.test.tsx
- `AI Architect Pipeline Spec` --conceptually_related_to--> `ThinkingTerminal Pending State Test`  [INFERRED]
  raw/vision.md → src/test/UI.test.tsx
- `Identity Splash Onboarding Spec` --conceptually_related_to--> `IdentitySplash V11 Capture Gate Test`  [INFERRED]
  raw/vision.md → src/test/UI.test.tsx
- `Task 1: Export Time Estimation Utilities from autoPlanner` --references--> `estimateExerciseDurationSeconds()`  [EXTRACTED]
  docs/superpowers/plans/2026-04-12-lab-vs-gantry-ux-pivot.md → src\planner\autoPlanner.ts

## Hyperedges (group relationships)
- **Exercise Data Triad: Schema plus Seed plus FunctionalMapping** — schema_exercise, db_seedexercises, data_functionalmapping [INFERRED 0.80]
- **IronProtocol Service Layer (ActivityManager + PersonalBestsService + ExerciseService)** — activitymanager_activitymanager, personalbestsservice_personalbestsservice, exerciseservice_getsmartswap [INFERRED 0.85]
- **IronProtocol Tech Stack** — claudemd_stack, readme_framer_motion, readme_zod, readme_offline_resilience [INFERRED 0.85]
- **Auto Planner Core Algorithms** — auto_planner_tier_hierarchy, auto_planner_trimming_algo, auto_planner_double_progression, auto_planner_modulo, auto_planner_bodyweight_logic [EXTRACTED 1.00]
- **Dexie.js Database Tables** — dexie_settings_table, dexie_tempsessions_table, dexie_baselines_table, dexie_exercises_table, dexie_workouts_table, dexie_sets_table [EXTRACTED 1.00]
- **Electric Blue OOP Upgrade Tasks** — plan_120m_qos_ceiling, plan_readonly_types, plan_iworkoutaction, plan_schema_v10, plan_services_layer, plan_instant_draft_persistence [EXTRACTED 1.00]
- **Onboarding Feature Triad (Plan + Spec + Tests)** — plan_onboarding_goal, spec_onboarding_context, test_identitysplash_suite [INFERRED 0.85]
- **IronProtocol Branding Assets** — favicon_ironprotocol_logo, assets_hero_png, icons_svg_sprite [INFERRED 0.82]
- **Social Platform Icon Set** — icons_bluesky_icon, icons_discord_icon, icons_github_icon, icons_x_icon [INFERRED 0.90]
- **React and Vite Framework Branding Assets** — assets_react_svg, assets_vite_svg [INFERRED 0.92]
- **Blueprint â†’ Review â†’ Ignition â†’ ActiveLogger App Flow** — identitysplash_component, sessionblueprint_component, coreignition_component, activelogger_component [INFERRED 0.90]
- **Core Planner Data Structures** — autoplanner_plannedworkout, autoplanner_plannedexercise, autoplanner_goaltier, autoplanner_tier_rep_ranges, autoplanner_baselineweight [EXTRACTED 1.00]
- **QoS Time-Budget Enforcement System** — autoplanner_qos, autoplanner_calcestimatedminutes, sessionblueprint_qos, identitysplash_v11contract [INFERRED 0.85]
- **Onboarding Pipeline (Identity â†’ Blueprint â†’ Macrocycle)** — identitysplash_component, identitysplash_handlesubmit, service_aiplanner, service_macrocyclepersistence, thinkingterminal_component [EXTRACTED 1.00]
- **T1 Baseline Calibration System** — calibratebaselines_component, calibratebaselines_t1compounds, calibratebaselines_handlesave, autoplanner_baselineweight, autoplanner_routineinputsnapshot [INFERRED 0.85]
- **Educational Mode + Form Guard System** — functionalwhy_component, functionalwhy_formguard, functionalwhy_anatomyvideo, functionalwhy_anatomyplaceholder, data_functionalmapping [EXTRACTED 1.00]
- **Session Draft Persistence System** — activelogger_persistdraft, activelogger_handlecompleteset, validation_tempsession, db_schema_tempsession, db_schema_ironprotocoldb [EXTRACTED 1.00]
- **Swap Correctness Contract (preserve sets/reps, update pool, no ghost)** — sessionblueprinttest_QuickSwapDrawer, sessionblueprinttest_FallbackPoolBidirectional, sessionblueprinttest_QoSPreviewGhostPrevention, sessionblueprinttest_SlotFootprintPreservation [INFERRED 0.90]
- **Onboarding Flow Test Coverage (V11 gate, steps, ThinkingTerminal)** — uitest_IdentitySplashV11Gate, uitest_V11PromptContract, uitest_ThinkingTerminalPending, uitest_MockCoreIgnition [INFERRED 0.88]
- **Lab vs Gantry Architecture (vision, CLAUDE.md, macrocycle test)** — vision_LabOnlineAI, vision_GantryOffline, claudemd_LabGantryArchitecture, uitest_MacrocycleGantryHandoff [INFERRED 0.87]

## Communities

### Community 0 - "Planner Core Algorithm"
Cohesion: 0.06
Nodes (53): Baseline Anchor Calibration (startWeight from baselines table), Bodyweight Logic Smart Input Rule (isBodyweight tag, weight=0), Auto Planner Algorithm Logic (V3), Double Progression Mathematical Model, Planner Input Parameters (routineType, totalWorkouts, timeLimit, trainingGoal, baselines), Modulo Boundary Enforcement (sessionIndex = totalWorkouts % cycleLength), Tiered Exercise Hierarchy (T1 Anchor, T2 Volume, T3 Finisher), Iterative Trimming Algorithm (Phase Aâ†’Bâ†’C) (+45 more)

### Community 1 - "Active Session Logger"
Cohesion: 0.07
Nodes (36): ActiveLogger Component, Fallback GPP Exercise (Bodyweight Circuit), handleCancelWorkout(), handleCompleteSet(), isDatabaseClosedError(), persistDraft(), ActiveLogger Phase State (active/resting/done), Rest Timer SVG (Circular Countdown) (+28 more)

### Community 2 - "Blueprint Builder Functions"
Cohesion: 0.1
Nodes (35): applyGoalPrescription(), baselineRepGoal(), bodyRegion(), buildCategoryExpansionQueue(), buildCoreBlueprintByTier(), buildVolumeExpansionCandidates(), calcEstimatedMinutes(), classifyExpansionCandidate() (+27 more)

### Community 3 - "Architecture & Project Config"
Cohesion: 0.07
Nodes (34): Blueprint Flow Contract, Lab vs Gantry Architecture Decision, CLAUDE.md Project Instructions, Ruflo Swarm Agent Configuration, V11 AppSettings Schema Constraint, GEMINI.md Project Instructions, Knowledge Graph Report (2026-04-14), BottomNav Navigation Links Test (+26 more)

### Community 4 - "QoS & Swap Engine"
Cohesion: 0.12
Nodes (29): applyQosToPlan(), buildUpdatedPlanFromCards(), clampWorkoutLengthMinutes(), cloneCard(), cloneCards(), cloneExercise(), clonePlan(), createInstanceId() (+21 more)

### Community 5 - "AI Service & Prompt Building"
Cohesion: 0.19
Nodes (20): addUniqueSeed(), buildDayBuckets(), buildExpandedDaySeeds(), buildGlobalFallbackPool(), buildSystemPrompt(), canonicalizeExerciseName(), createExerciseSelectionResponseSchema(), extractCandidateText() (+12 more)

### Community 6 - "Onboarding Wizard UI"
Cohesion: 0.15
Nodes (9): V11AppSettingsSchema Type, IdentitySplash Component (Onboarding Wizard), handleSubmit(), mapPrimaryFocusToPurposeChip(), resolveSubmitErrorMessage(), 6-Step Onboarding Flow (Identity/Baselines/Experience/Equipment/Goals/Injuries), V11AppSettingsSchema Prompt Contract, aiPlannerService (generateWorkoutBlueprint) (+1 more)

### Community 7 - "Metrics & Personal Bests"
Cohesion: 0.18
Nodes (7): ActivityManager Class, IDashboardMetrics Interface, IProgressShape Interface, PersonalBestsService.checkAndUpdate(), PB Detection Algorithm (Weight-Primary, Reps-Secondary), PersonalBestsService Class, PersonalBestsService Test Suite

### Community 8 - "Onboarding Step Automation"
Cohesion: 0.33
Nodes (9): advanceToBaselinesStep(), advanceToEquipmentStep(), advanceToExperienceStep(), advanceToGoalsStep(), advanceToInjuriesStepWithStrengthGoal(), fillBaselinesStep(), fillEquipmentStep(), fillExperienceAndLogisticsStep() (+1 more)

### Community 9 - "Home & Macrocycle Scheduling"
Cohesion: 0.31
Nodes (5): cloneExercises(), clonePlan(), isMacrocycleScheduledWorkout(), loadNextScheduledWorkoutPlan(), resolveScheduledDayLabel()

### Community 10 - "Macrocycle Persistence"
Cohesion: 0.28
Nodes (4): createPlaceholderExercise(), isLikelyPrimaryCompound(), persistMacrocycle(), startOfTodayTimestamp()

### Community 11 - "Smart Swap & Exercise Order"
Cohesion: 0.25
Nodes (6): PlannedExercise Interface, getAlternatives(), getExercisesInSameCategory(), getSmartSwapAlternatives(), SmartSwapGuards Interface, reconcileExerciseCards (Reorder-safe Identity Match)

### Community 12 - "Backup & Data Export"
Cohesion: 0.36
Nodes (4): buildBackupPayload(), downloadBackupJson(), exportBackup(), serializeBackup()

### Community 13 - "Blueprint Test Contracts"
Cohesion: 0.32
Nodes (8): Fallback Pool Bidirectional Update, QoS 75 Min Budget Trim, QoS Preview Ghost Prevention, Quick Swap Drawer Behavior, SessionBlueprint Test Suite, Slot Set-Rep Footprint Preservation on Swap, Blueprint Shortening on Time Reduction, Training Goal Toggle Immediate Remap

### Community 14 - "Database Schema & Init"
Cohesion: 0.33
Nodes (3): createDefaultV11PromptContract(), IronProtocolDB, normalizeV11PromptContract()

### Community 15 - "Progress Indicator"
Cohesion: 0.29
Nodes (1): ProgressIndicator

### Community 16 - "V11 Design Sprint Plan"
Cohesion: 0.29
Nodes (7): Foundation Onboarding Plan Goal (v11 schema + Electric Navy + IdentitySplash rebuild), Task 1: Inject Electric Navy @theme Tokens, Task 2: Extend AppSettings Schema to v11, Task 3: Rebuild IdentitySplash with Full Onboarding Form, Onboarding Design Spec Context (Dexie v10 partial IdentitySplash extension), Electric Navy @theme Token Spec Table, V11 Migration Rationale (No data migration, optional fields, new version block)

### Community 17 - "Social & Brand Icons"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (Purple Code File), GitHub Icon, Social Profile Icon (User with Star Badge), SVG Icon Sprite Sheet, X (Twitter) Social Icon

### Community 18 - "UI Integration Tests"
Cohesion: 0.4
Nodes (2): buildCompleteSettings(), buildCompleteV11PromptContract()

### Community 19 - "Import Validation"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Boot Ignition Screen"
Cohesion: 0.4
Nodes (3): Boot Sequence Log Lines, CoreIgnition Component, PulsingBarbell()

### Community 21 - "Workout Start Haptics"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "History Page"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Macrocycle Test Fixtures"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Exercise Card UI"
Cohesion: 0.5
Nodes (4): ExerciseCard Component, ExerciseData Interface, History Drawer (AnimatePresence Expand), LoggedSet Interface

### Community 25 - "Exercise Card Internals"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "AI Planner Service Tests"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Auto Planner Tests"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Exercise Service Tests"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Temp Session Schema"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "App Shell & Nav"
Cohesion: 1.0
Nodes (2): App Root Component, BottomNav Component

### Community 31 - "Baseline Calibration Card"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Brand Visual Assets"
Cohesion: 1.0
Nodes (2): Hero Image (Isometric Layered Slab, Purple/Violet Gradient Theme), IronProtocol Favicon (Lightning Bolt Logo)

### Community 33 - "Vite Build Config"
Cohesion: 1.0
Nodes (2): Vite Build Tool, Vite Logo SVG

### Community 34 - "Exercise Constants"
Cohesion: 1.0
Nodes (2): GPP_EXERCISES (Empty Pool Fallback), TIER_REP_RANGES (T1/T2/T3 Min-Max Reps)

### Community 35 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Vitest Config"
Cohesion: 1.0
Nodes (1): Vitest Config

### Community 38 - "Write Chunk JS Util"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Write Chunk Py Util"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "App Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Vite Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Draft Blueprint Review Gantry"
Cohesion: 1.0
Nodes (1): DraftBlueprintReview Gantry

### Community 43 - "FeaturePulse Tooltip"
Cohesion: 1.0
Nodes (1): FeaturePulse Tooltip Component

### Community 44 - "FunctionalWhy Panel"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Dexie DB Module"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Personal Bests Service"
Cohesion: 1.0
Nodes (1): PersonalBestsService

### Community 47 - "ActiveLogger Tests"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "DB Tests"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "DraftBlueprintReview Tests"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "SessionBlueprint Tests"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Test Setup"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "ThinkingTerminal Tests"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Onboarding Read-First Rule"
Cohesion: 1.0
Nodes (1): Step 1: Orientation â€” Read CLAUDE.md and Docs First

### Community 54 - "TDD Mandate"
Cohesion: 1.0
Nodes (1): TDD Mandate (Failing Tests Before Implementation)

### Community 55 - "Quality Gates"
Cohesion: 1.0
Nodes (1): Quality Gates (typecheck + lint, zero errors)

### Community 56 - "SessionBlueprint Rationale"
Cohesion: 1.0
Nodes (1): Rationale: SessionBlueprint absorbs all interactive editing; ReviewBlueprint is purely presentational

### Community 57 - "React Logo Asset"
Cohesion: 1.0
Nodes (1): React Framework Logo (Cyan Atom Iconify SVG)

### Community 58 - "ExerciseCard Model Interface"
Cohesion: 1.0
Nodes (1): ExerciseCardModel Interface

### Community 59 - "Onboarding Terminal Copy"
Cohesion: 1.0
Nodes (1): Onboarding Terminal Lines (Architect Engine)

### Community 60 - "Preflight Audit Interface"
Cohesion: 1.0
Nodes (1): PreflightAuditReport Interface

## Knowledge Gaps
- **66 isolated node(s):** `Vitest Config`, `App Root Component`, `BottomNav Component`, `DraftBlueprintReview Gantry`, `FeaturePulse Tooltip Component` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `App Shell & Nav`** (2 nodes): `App Root Component`, `BottomNav Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Baseline Calibration Card`** (2 nodes): `CalibrateBaselinesCard()`, `CalibrateBaselinesCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Visual Assets`** (2 nodes): `Hero Image (Isometric Layered Slab, Purple/Violet Gradient Theme)`, `IronProtocol Favicon (Lightning Bolt Logo)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build Config`** (2 nodes): `Vite Build Tool`, `Vite Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Exercise Constants`** (2 nodes): `GPP_EXERCISES (Empty Pool Fallback)`, `TIER_REP_RANGES (T1/T2/T3 Min-Max Reps)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config`** (1 nodes): `Vitest Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Write Chunk JS Util`** (1 nodes): `write_chunk.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Write Chunk Py Util`** (1 nodes): `write_chunk.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Point`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Env Types`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Draft Blueprint Review Gantry`** (1 nodes): `DraftBlueprintReview Gantry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FeaturePulse Tooltip`** (1 nodes): `FeaturePulse Tooltip Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FunctionalWhy Panel`** (1 nodes): `FunctionalWhy.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dexie DB Module`** (1 nodes): `db.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Personal Bests Service`** (1 nodes): `PersonalBestsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ActiveLogger Tests`** (1 nodes): `ActiveLogger.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DB Tests`** (1 nodes): `db.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DraftBlueprintReview Tests`** (1 nodes): `DraftBlueprintReview.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SessionBlueprint Tests`** (1 nodes): `SessionBlueprint.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Setup`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ThinkingTerminal Tests`** (1 nodes): `ThinkingTerminal.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Read-First Rule`** (1 nodes): `Step 1: Orientation â€” Read CLAUDE.md and Docs First`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TDD Mandate`** (1 nodes): `TDD Mandate (Failing Tests Before Implementation)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Quality Gates`** (1 nodes): `Quality Gates (typecheck + lint, zero errors)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SessionBlueprint Rationale`** (1 nodes): `Rationale: SessionBlueprint absorbs all interactive editing; ReviewBlueprint is purely presentational`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Logo Asset`** (1 nodes): `React Framework Logo (Cyan Atom Iconify SVG)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ExerciseCard Model Interface`** (1 nodes): `ExerciseCardModel Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Onboarding Terminal Copy`** (1 nodes): `Onboarding Terminal Lines (Architect Engine)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preflight Audit Interface`** (1 nodes): `PreflightAuditReport Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SessionBlueprint Component` connect `Active Session Logger` to `Blueprint Builder Functions`, `Smart Swap & Exercise Order`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `calcEstimatedMinutes()` connect `Blueprint Builder Functions` to `Active Session Logger`, `Smart Swap & Exercise Order`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `IronProtocolDB (Dexie Schema)` connect `Active Session Logger` to `Onboarding Wizard UI`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Vitest Config`, `App Root Component`, `BottomNav Component` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Planner Core Algorithm` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Active Session Logger` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Blueprint Builder Functions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._