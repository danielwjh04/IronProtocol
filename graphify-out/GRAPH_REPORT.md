# Graph Report - .  (2026-04-11)

## Corpus Check
- Corpus is ~37,888 words - fits in a single context window. You may not need a graph.

## Summary
- 244 nodes · 341 edges · 24 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Database Schema and IndexedDB Constraints (V3)` - 15 edges
2. `planRoutineWorkoutPure()` - 11 edges
3. `Auto Planner Algorithm Logic (V3)` - 11 edges
4. `IronProtocol README` - 9 edges
5. `raw/vision.md â€” App Vision (Offline Gym Tracker, Dexie State Management)` - 9 edges
6. `Step 1: Orientation â€” Read CLAUDE.md and Docs First` - 7 edges
7. `Iterative Trimming Algorithm (Phase Aâ†’Bâ†’C)` - 7 edges
8. `Electric Blue OOP Upgrade Implementation Plan (2026-04-11)` - 7 edges
9. `Dexie.js Schema (user_settings, exercise_library, workout_history, active_session)` - 7 edges
10. `IronProtocol CLAUDE.md â€” Project Rules` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Rule 1: Functional Components & Custom Hooks for DB Logic` --conceptually_related_to--> `Database Schema and IndexedDB Constraints (V3)`  [INFERRED]
  CLAUDE.md → docs/dexie_schema_rules.md
- `Rule 3: Never Deviate from vision.md and GRAPH_REPORT.md Architecture` --references--> `raw/vision.md â€” App Vision (Offline Gym Tracker, Dexie State Management)`  [EXTRACTED]
  CLAUDE.md → raw/vision.md
- `Zod Validation Library` --conceptually_related_to--> `Zero Trust Zod Firewall (strict schema on every write)`  [INFERRED]
  README.md → docs/import_validation.md
- `Step 1: Orientation â€” Read CLAUDE.md and Docs First` --references--> `IronProtocol CLAUDE.md â€” Project Rules`  [EXTRACTED]
  init.md → CLAUDE.md
- `Local-First Architecture Rule (Prefer Dexie over APIs)` --rationale_for--> `100% Offline Resilience via Dexie.js (IndexedDB)`  [INFERRED]
  CLAUDE.md → README.md

## Hyperedges (group relationships)
- **Five Core Reference Docs (Schema, Planner, Validation, UI, Routines)** — dexie_schema_doc, auto_planner_doc, import_validation_doc, ui_guidelines_doc, routine_config_doc [EXTRACTED 1.00]
- **IronProtocol Tech Stack** — claudemd_stack, readme_framer_motion, readme_zod, readme_offline_resilience [INFERRED 0.85]
- **Auto Planner Core Algorithms** — auto_planner_tier_hierarchy, auto_planner_trimming_algo, auto_planner_double_progression, auto_planner_modulo, auto_planner_bodyweight_logic [EXTRACTED 1.00]
- **Dexie.js Database Tables** — dexie_settings_table, dexie_tempsessions_table, dexie_baselines_table, dexie_exercises_table, dexie_workouts_table, dexie_sets_table [EXTRACTED 1.00]
- **Electric Blue OOP Upgrade Tasks** — plan_120m_qos_ceiling, plan_readonly_types, plan_iworkoutaction, plan_schema_v10, plan_services_layer, plan_instant_draft_persistence [EXTRACTED 1.00]
- **IronProtocol Screen Flow (Blueprint to Active Logger to Victory Lap)** — vision_blueprint_screen, vision_active_logger, vision_victory_lap [EXTRACTED 1.00]
- **Dexie.js Tables Defined in Vision (user_settings, exercise_library, workout_history, active_session)** — vision_user_settings_table, vision_exercise_library_table, vision_workout_history_table, vision_active_session_table [EXTRACTED 1.00]
- **Design Rationales in Vision Doc** — rationale_perceived_labor, rationale_local_first_dexie, rationale_high_contrast_visuals, rationale_2s_autosave, rationale_vercel_vs_local [EXTRACTED 1.00]
- **Tech Stack Components Named in Vision** — vision_framer_motion, vision_tech_stack, rule_local_first [INFERRED 0.85]
- **IronProtocol Branding Assets** — favicon_ironprotocol_logo, assets_hero_png, icons_svg_sprite [INFERRED 0.82]
- **Social Platform Icon Set** — icons_bluesky_icon, icons_discord_icon, icons_github_icon, icons_x_icon [INFERRED 0.90]
- **React and Vite Framework Branding** — assets_react_svg, assets_vite_svg [INFERRED 0.95]

## Communities

### Community 0 - "Project Rules & Architecture"
Cohesion: 0.08
Nodes (35): Zero Friction Engine Philosophy (Deterministic Selection, Physiological Primacy, Elastic Volume), Rule 3: Never Deviate from vision.md and GRAPH_REPORT.md Architecture, Rule 1: Functional Components & Custom Hooks for DB Logic, IronProtocol CLAUDE.md â€” Project Rules, Local-First Architecture Rule (Prefer Dexie over APIs), Tech Stack (React 18, Vite, Tailwind, Dexie.js), Rule 2: Launch Vite Dev Server to Visually Verify Tailwind Layout, Data Isolation (Metadata vs Activity vs Drafts Separation) (+27 more)

### Community 1 - "Vision & Design Rationales"
Cohesion: 0.07
Nodes (34): Rationale: 2-Second Auto-Save for Session Resume Capability, Rationale: High-Contrast Visuals for Focus During Workouts, Rationale: Local-First with Dexie.js for Offline Resilience, Rationale: Perceived Labor (Reasoning Time) Builds User Trust, Rationale: Vercel Edge Function vs. Mock Local Function (Phase 1 Priority), 10-Second Reasoning Protocol (Thinking Terminal UI), Active Logger Screen (The Mission), active_session Table (Current State, 2s Save Interval) (+26 more)

### Community 2 - "Test Suite & Backup Utils"
Cohesion: 0.08
Nodes (6): buildBackupPayload(), downloadBackupJson(), exportBackup(), serializeBackup(), PersonalBestsService, IronProtocolDB

### Community 3 - "Planner Algorithm & Progression"
Cohesion: 0.1
Nodes (30): Baseline Anchor Calibration (startWeight from baselines table), Bodyweight Logic Smart Input Rule (isBodyweight tag, weight=0), Auto Planner Algorithm Logic (V3), Double Progression Mathematical Model, Planner Input Parameters (routineType, totalWorkouts, timeLimit, trainingGoal, baselines), Modulo Boundary Enforcement (sessionIndex = totalWorkouts % cycleLength), Tiered Exercise Hierarchy (T1 Anchor, T2 Volume, T3 Finisher), Iterative Trimming Algorithm (Phase Aâ†’Bâ†’C) (+22 more)

### Community 4 - "App Shell & Routing"
Cohesion: 0.09
Nodes (5): handleNavigate(), handlePopState(), resolveRoute(), getPlanSignature(), refreshPlan()

### Community 5 - "Auto Planner Engine"
Cohesion: 0.15
Nodes (22): baselineRepGoal(), bodyRegion(), calcEstimatedMinutes(), dedupeExercisesById(), dedupePlannedById(), detectSessionIndex(), filterBySessionRule(), generateWorkout() (+14 more)

### Community 6 - "Workout Logging UI"
Cohesion: 0.12
Nodes (2): handleCompleteSet(), persistDraft()

### Community 7 - "Activity & Metrics Manager"
Cohesion: 0.17
Nodes (2): ActivityManager, ProgressIndicator

### Community 8 - "UI Icon Assets"
Cohesion: 0.33
Nodes (7): Bluesky Social Icon, Discord Social Icon, Documentation Icon (Purple Code File), GitHub Icon, Social Profile Icon (User with Star Badge), SVG Icon Sprite Sheet, X (Twitter) Social Icon

### Community 9 - "Import Schema & Validation"
Cohesion: 0.4
Nodes (0): 

### Community 10 - "Exercise Card Component"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Phase 1 Onboarding Schema"
Cohesion: 0.67
Nodes (3): AppSettings Interface v11 (northStar, purposeChip, qosMinutes), IdentitySplash Component (Full Onboarding Form), PurposeChip Union Type

### Community 12 - "Brand Assets"
Cohesion: 1.0
Nodes (2): Hero Image (Isometric Layered Slab, Purple Theme), IronProtocol Favicon (Lightning Bolt Logo)

### Community 13 - "Framework Logos"
Cohesion: 1.0
Nodes (2): React Framework Logo, Vite Build Tool Logo

### Community 14 - "Foundation Onboarding Plan & Spec"
Cohesion: 1.0
Nodes (2): Foundation & Phase 1 Onboarding Implementation Plan, Foundation & Phase 1 Onboarding Design Spec

### Community 15 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Vitest Config"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "App Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Vite Type Declarations"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Test Setup"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Gemini Config"
Cohesion: 1.0
Nodes (1): IronProtocol GEMINI.md (empty)

### Community 22 - "Electric Navy Theme Tokens"
Cohesion: 1.0
Nodes (1): Electric Navy Color Palette (@theme tokens)

### Community 23 - "Graph Report Meta"
Cohesion: 1.0
Nodes (1): Graph Report - IronProtocol

## Knowledge Gaps
- **37 isolated node(s):** `Tech Stack (React 18, Vite, Tailwind, Dexie.js)`, `Rule 2: Launch Vite Dev Server to Visually Verify Tailwind Layout`, `IronProtocol GEMINI.md (empty)`, `Step 4: Quality Gates (typecheck + lint, zero errors)`, `Step 5: Stop Points and Status Summary` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Brand Assets`** (2 nodes): `Hero Image (Isometric Layered Slab, Purple Theme)`, `IronProtocol Favicon (Lightning Bolt Logo)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Framework Logos`** (2 nodes): `React Framework Logo`, `Vite Build Tool Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Foundation Onboarding Plan & Spec`** (2 nodes): `Foundation & Phase 1 Onboarding Implementation Plan`, `Foundation & Phase 1 Onboarding Design Spec`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Entry Point`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Type Declarations`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Setup`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gemini Config`** (1 nodes): `IronProtocol GEMINI.md (empty)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Electric Navy Theme Tokens`** (1 nodes): `Electric Navy Color Palette (@theme tokens)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Graph Report Meta`** (1 nodes): `Graph Report - IronProtocol`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `raw/vision.md â€” App Vision (Offline Gym Tracker, Dexie State Management)` connect `Vision & Design Rationales` to `Project Rules & Architecture`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `IronProtocol CLAUDE.md â€” Project Rules` connect `Project Rules & Architecture` to `Planner Algorithm & Progression`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `Rule 3: Never Deviate from vision.md and GRAPH_REPORT.md Architecture` connect `Project Rules & Architecture` to `Vision & Design Rationales`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Database Schema and IndexedDB Constraints (V3)` (e.g. with `Rule 1: Functional Components & Custom Hooks for DB Logic` and `New src/services/ Layer (ActivityManager, ProgressIndicator, PersonalBestsService)`) actually correct?**
  _`Database Schema and IndexedDB Constraints (V3)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tech Stack (React 18, Vite, Tailwind, Dexie.js)`, `Rule 2: Launch Vite Dev Server to Visually Verify Tailwind Layout`, `IronProtocol GEMINI.md (empty)` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Rules & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Vision & Design Rationales` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._