# IronProtocol Initialization and Workflow Prompt

## Step 1: Orientation and Source of Truth
1. Read CLAUDE.md in full. This is the ultimate source of truth for architecture and quality rules.
2. Run a recursive file search to map the current project tree.
3. Locate and read the five core @docs reference files:
   * dexie_schema_rules.md (UUIDs and Tiered Schema)
   * auto_planner_logic.md (Tiered QoS and Double Progression)
   * import_validation.md (Hardened Zod Firewall)
   * ui_guidelines.md (The Bento Box Design System)
   * routine_config.md (The 10 Routine Templates)
4. Do NOT write or propose any code until you have synchronized with these specific domain rules.

## Step 2: Phase 6 Execution Plan
Produce a numbered implementation sequence for the Multi Routine and Bento UI overhaul. The plan must cover:
1. Updating Dexie schema to Version 2 with Tier and Tag support.
2. Implementing the Tiered Trimming and Double Progression math in the planner.
3. Overhauling the UI to the Bento Box aesthetic (rounded 3xl, Safety Orange accents).
4. Wiring the Auto Detect Session logic to the workout history.
5. Present the plan as a numbered checklist and wait for my explicit approval.

## Step 3: TDD Mandate (Absolute Requirement)
After plan approval, your first action must be writing failing tests. The test suite must include:
1. Integration Test: Confirm that completing a workout correctly triggers the +2.5kg Double Progression on the next plan.
2. Routing Test: Verify that selecting a specific Routine (Example: PPL) returns only exercises with the correct pattern tags.
3. Tier Test: Confirm that low Time Available inputs correctly trim Tier 3 exercises first.
4. Only begin implementation once these tests fail for the correct logical reasons.

## Step 4: Quality Gates
After every significant file change, you must execute:
1. npm run typecheck (Must include the standard flag to not emit files).
2. npm run lint.
3. Zero errors and zero warnings are permitted. If a gate fails, fix the issue immediately before moving to the next file. Do not batch multiple broken files.

## Step 5: Stop Point and Status Summary
STOP and ask for explicit approval once a major logic block or UI component is completed. Present a brief status summary:
1. What was created or modified.
2. The result of the Vitest suite.
3. The next proposed step in the implementation sequence.
4. Wait for my go ahead before proceeding to the next block.