# Graph Report - .  (2026-04-12)

## Corpus Check
- Corpus is ~48,344 words - fits in a single context window. You may not need a graph.

## Summary
- 328 nodes · 485 edges · 27 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `planRoutineWorkoutPure()` - 15 edges
2. `Database Schema and IndexedDB Constraints (V3)` - 15 edges
3. `IronProtocolDB Class (Dexie)` - 13 edges
4. `IdentitySplash Component (Onboarding Form)` - 12 edges
5. `Auto Planner Algorithm Logic (V3)` - 11 edges
6. `AppSettings Interface (v11)` - 9 edges
7. `IronProtocol README` - 9 edges
8. `persistPlanDraft()` - 7 edges
9. `Step 1: Orientation â€” Read CLAUDE.md and Docs First` - 7 edges
10. `Iterative Trimming Algorithm (Phase Aâ†’Bâ†’C)` - 7 edges

## Surprising Connections (you probably didn't know these)
- `BOOT_LINES Terminal Log Sequence` --semantically_similar_to--> `10-Second Reasoning Protocol (ThinkingTerminal)`  [INFERRED] [semantically similar]
  src/components/CoreIgnition.tsx → raw/vision.md
- `Framer Motion Spring Physics Spec (Stiffness 300, Damping 30)` --references--> `IdentitySplash Component (Onboarding Form)`  [INFERRED]
  raw/vision.md → src/components/IdentitySplash.tsx
- `Framer Motion Spring Physics Spec (Stiffness 300, Damping 30)` --references--> `CoreIgnition Component`  [INFERRED]
  raw/vision.md → src/components/CoreIgnition.tsx
- `Electric Navy Color Palette (vision.md I)` --references--> `PulsingBarbell SVG Component`  [INFERRED]
  raw/vision.md → src/components/CoreIgnition.tsx
- `Electric Navy Color Palette (vision.md I)` --references--> `Form Guard Toggle (FunctionalWhy)`  [INFERRED]
  raw/vision.md → src/components/FunctionalWhy.tsx

## Hyperedges (group relationships)
- **Boot Sequence Implementation (CoreIgnition + BOOT_LINES + Vision Spec)** — coreignition_coreignition, coreignition_boot_lines, vision_core_ignition [EXTRACTED 1.00]
- **Five Core Reference Docs (Schema, Planner, Validation, UI, Routines)** — dexie_schema_doc, auto_planner_doc, import_validation_doc, ui_guidelines_doc, routine_config_doc [EXTRACTED 1.00]
- **IronProtocol Tech Stack** — claudemd_stack, readme_framer_motion, readme_zod, readme_offline_resilience [INFERRED 0.85]
- **Auto Planner Core Algorithms** — auto_planner_tier_hierarchy, auto_planner_trimming_algo, auto_planner_double_progression, auto_planner_modulo, auto_planner_bodyweight_logic [EXTRACTED 1.00]
- **Dexie.js Database Tables** — dexie_settings_table, dexie_tempsessions_table, dexie_baselines_table, dexie_exercises_table, dexie_workouts_table, dexie_sets_table [EXTRACTED 1.00]
- **Electric Blue OOP Upgrade Tasks** — plan_120m_qos_ceiling, plan_readonly_types, plan_iworkoutaction, plan_schema_v10, plan_services_layer, plan_instant_draft_persistence [EXTRACTED 1.00]
- **IronProtocol Branding Assets** — favicon_ironprotocol_logo, assets_hero_png, icons_svg_sprite [INFERRED 0.82]
- **Social Platform Icon Set** — icons_bluesky_icon, icons_discord_icon, icons_github_icon, icons_x_icon [INFERRED 0.90]
- **Onboarding Identity Form Data Flow (IdentitySplash to AppSettings to DB)** — identitysplash_identitysplash, schema_appsettings, schema_ironprotocoldb [EXTRACTED 1.00]
- **Boot Sequence Implementation (CoreIgnition + BOOT_LINES + Vision Spec)** — coreignition_coreignition, coreignition_boot_lines, vision_core_ignition [EXTRACTED 1.00]
- **Form Guard Educational Mode (FunctionalWhy + functionalMapping + Vision Spec)** — functionalwhy_functionalwhy, functionalmapping_getfunctionalinfo, vision_form_guard [EXTRACTED 0.95]
- **IronProtocol Screen Flow (Boot to Onboarding to Blueprint to Active Logger to Victory Lap)** — vision_core_ignition, vision_identity_inputs, vision_blueprint_audit_screen, vision_active_logger_spec, vision_victory_lap_spec [EXTRACTED 0.95]
- **Visual and Interactive DNA (Color Palette + Haptics + Asset Pipeline)** — vision_electric_navy_palette, vision_haptic_design_rationale, vision_asset_directory [EXTRACTED 0.90]
- **React and Vite Framework Branding Assets** — assets_react_svg, assets_vite_svg [INFERRED 0.92]
- **Graph Report Structure (Summary + Communities + God Nodes + Knowledge Gaps + Hyperedges)** — graph_report_summary, graph_report_god_nodes, graph_report_communities, graph_report_knowledge_gaps, graph_report_hyperedges_section [EXTRACTED 1.00]
- **Trust Building Triad (Perceived Labor + Haptics + Zero Friction Philosophy)** — vision_perceived_labor_rationale, vision_haptic_design_rationale, vision_zero_friction_philosophy [INFERRED 0.82]

## Communities

### Community 0 - "Auto Planner Logic"
Cohesion: 0.05
Nodes (65): Baseline Anchor Calibration (startWeight from baselines table), Bodyweight Logic Smart Input Rule (isBodyweight tag, weight=0), Auto Planner Algorithm Logic (V3), Double Progression Mathematical Model, Planner Input Parameters (routineType, totalWorkouts, timeLimit, trainingGoal, baselines), Modulo Boundary Enforcement (sessionIndex = totalWorkouts % cycleLength), Tiered Exercise Hierarchy (T1 Anchor, T2 Volume, T3 Finisher), Iterative Trimming Algorithm (Phase Aâ†’Bâ†’C) (+57 more)

### Community 1 - "Tests, Specs & Reports"
Cohesion: 0.08
Nodes (38): IronProtocolDB Happy Path Tests, v10 Schema Tests (DailyTargets, PersonalBests), v11 Schema Tests (Onboarding Fields), Community Structure (23 Detected Communities), God Nodes List (Top 10 Most Connected), Hyperedge Groups (11 Group Relationships), Knowledge Gaps (33 Isolated Nodes, Thin Communities), Graph Report Summary (249 nodes, 364 edges, 23 communities) (+30 more)

### Community 2 - "AutoPlanner Module"
Cohesion: 0.1
Nodes (27): applyGoalPrescription(), baselineRepGoal(), bodyRegion(), buildCoreBlueprintByTier(), buildVolumeExpansionCandidates(), calcEstimatedMinutes(), dedupeExercisesById(), dedupePlannedById() (+19 more)

### Community 3 - "Active Workout Logger"
Cohesion: 0.07
Nodes (8): handleCancelWorkout(), handleCompleteSet(), isDatabaseClosedError(), persistDraft(), clonePlan(), getPlanSignature(), openLoggerWithPlan(), refreshPlan()

### Community 4 - "Draft Blueprint Review"
Cohesion: 0.16
Nodes (21): buildUpdatedPlanFromCards(), clampWorkoutLengthMinutes(), createInstanceId(), exerciseIdentityKey(), fetchAllAlts(), getSwapGuardLists(), handleRemove(), handleReorder() (+13 more)

### Community 5 - "App Shell & Boot Sequence"
Cohesion: 0.12
Nodes (16): App Component (Root Shell), isIgniting State (Boot Gate), Route State (SPA Routing), Hero Image (Isometric Layered Slab, Purple/Violet Gradient Theme), BOOT_LINES Terminal Log Sequence, CoreIgnition Component, onComplete Callback (Boot Finish), PulsingBarbell SVG Component (+8 more)

### Community 6 - "Exercise Service Layer"
Cohesion: 0.23
Nodes (10): applySmartSwapGuards(), dedupeExercises(), getAlternatives(), getExercisesInSameCategory(), getSmartSwapAlternatives(), getSwapRepTarget(), isCompoundExercise(), normalizeExerciseName() (+2 more)

### Community 7 - "Functional Anatomy Mapping"
Cohesion: 0.17
Nodes (12): ExerciseFunctionalInfo Interface, functionalMapping Record (Exercise Educational Data), getExerciseCategory(), getFunctionalInfo(), normalizeExerciseName(), AnatomyPlaceholder Component, AnatomyVideo Component, Form Guard Toggle (FunctionalWhy) (+4 more)

### Community 8 - "Activity & Metrics Manager"
Cohesion: 0.17
Nodes (2): ActivityManager, ProgressIndicator

### Community 9 - "Baseline Calibration (1RM)"
Cohesion: 0.35
Nodes (9): announceIncrement(), clamp(), handleRangeChange(), handleSubmit(), snapToStep(), updateFromKnob(), valueToX(), vibrate() (+1 more)

### Community 10 - "Thinking Terminal (Reasoning UI)"
Cohesion: 0.22
Nodes (0): 

### Community 11 - "Data Backup & Export"
Cohesion: 0.36
Nodes (4): buildBackupPayload(), downloadBackupJson(), exportBackup(), serializeBackup()

### Community 12 - "Personal Bests Tracker"
Cohesion: 0.29
Nodes (1): PersonalBestsService

### Community 13 - "Social Icons"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (Purple Code File), GitHub Icon, Social Profile Icon (User with Star Badge), SVG Icon Sprite Sheet, X (Twitter) Social Icon

### Community 14 - "Import Schema Validation"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Exercise Card UI"
Cohesion: 0.67
Nodes (0): 

### Community 16 - "Calibrate Baselines Card"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Framework Brand Assets"
Cohesion: 1.0
Nodes (2): React Framework Logo (Cyan Atom Iconify SVG), Vite Build Tool Logo (Purple Lightning Bolt with Gradient)

### Community 18 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Vite Build Config"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Vitest Test Config"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "App Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Vite Type Declarations"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Workout Action Schema"
Cohesion: 1.0
Nodes (1): IWorkoutAction Interface (Unit of Work)

### Community 24 - "Test Setup"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Gemini Config"
Cohesion: 1.0
Nodes (1): IronProtocol GEMINI.md (empty)

### Community 26 - "Settings Drawer Spec"
Cohesion: 1.0
Nodes (1): Settings Drawer Specification (Hamburger Trigger, User Hub, Unit Switch, DB Export)

## Knowledge Gaps
- **42 isolated node(s):** `isIgniting State (Boot Gate)`, `Route State (SPA Routing)`, `onComplete Callback (Boot Finish)`, `Exercise Interface`, `Workout Interface` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Calibrate Baselines Card`** (2 nodes): `CalibrateBaselinesCard.tsx`, `CalibrateBaselinesCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Framework Brand Assets`** (2 nodes): `React Framework Logo (Cyan Atom Iconify SVG)`, `Vite Build Tool Logo (Purple Lightning Bolt with Gradient)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Test Config`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Point`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Type Declarations`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workout Action Schema`** (1 nodes): `IWorkoutAction Interface (Unit of Work)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Setup`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gemini Config`** (1 nodes): `IronProtocol GEMINI.md (empty)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Drawer Spec`** (1 nodes): `Settings Drawer Specification (Hamburger Trigger, User Hub, Unit Switch, DB Export)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `IdentitySplash Component (Onboarding Form)` connect `Tests, Specs & Reports` to `App Shell & Boot Sequence`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Database Schema and IndexedDB Constraints (V3)` (e.g. with `Rule 1: Functional Components & Custom Hooks for DB Logic` and `New src/services/ Layer (ActivityManager, ProgressIndicator, PersonalBestsService)`) actually correct?**
  _`Database Schema and IndexedDB Constraints (V3)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `isIgniting State (Boot Gate)`, `Route State (SPA Routing)`, `onComplete Callback (Boot Finish)` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auto Planner Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Tests, Specs & Reports` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `AutoPlanner Module` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Active Workout Logger` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._