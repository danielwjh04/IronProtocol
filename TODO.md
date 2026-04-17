# Iron Protocol: The Final Sprint

## Automation Contract (Stitch Required)
- Global rule: For every UI or visual design task, use the Stitch MCP tools first, then implement the generated design in code.
- For each UI task, generate at least 2 Stitch variants, select 1, and document the selected variant + reasoning in `OVERNIGHT_PLAN.md` before coding.
- Do not skip Stitch for design tasks. If Stitch is unavailable, fix MCP connectivity first, then continue.
- Keep all non-UI tasks (data scripts, embeddings, DB migration, tests) in normal code workflow without Stitch.

## Phase 1: The Local Intelligence Engine (Incomplete)
- [ ] Create/finalize `src/workers/embeddingWorker.ts`. Ensure it loads the `Xenova/all-MiniLM-L6-v2` model and handles the `Float32Array` conversion.
- [ ] [STITCH UI] Design and implement `src/components/Search/NLPSearchBar.tsx` with a 300ms debounce.
- [ ] [STITCH UI] Design and implement the dropdown renderer in the search UI. Use `cosineSimilarity` to rank the 300 exercises based on user input (e.g., "I want to grow my upper chest but I have a shoulder tweak").
- [ ] [STITCH UI] Design and implement a visual "Confidence Score" (e.g., 95% Match) on the `ExerciseCard` component.

## Phase 2: The 300-Exercise Great Seeding (Critical)
- [x] Create `src/data/raw/chest_back.json`. Generate 60 distinct exercises for Chest and Back. Each must strictly follow the schema: `{ id: string, name: string, technical_cues: string[], biomechanical_why: string }`.
- [x] Create `src/data/raw/legs_core.json`. Generate 60 distinct exercises for Quads, Hamstrings, Glutes, Calves, and Core following the exact same schema.
- [x] Create `src/data/raw/shoulders_arms.json`. Generate 60 distinct exercises for Deltoids, Biceps, Triceps, and Forearms following the exact same schema.
- [x] Create `src/data/raw/functional_cables.json`. Generate 60 distinct exercises focusing on Unilateral movements, Cables, and functional mobility following the exact same schema.
- [x] Create `src/data/raw/power_strongman.json`. Generate 60 distinct exercises focusing on Olympic lifts, Strongman movements, and heavy compound variations following the exact same schema.
- [x] Create a utility script `src/utils/mergeExercises.ts` that reads all 5 files from `src/data/raw/`, combines them into a single array, and writes the final 300-item array to `src/data/exercises.json`.
- [ ] Execute `mergeExercises.ts` to generate the final file, then delete the `src/data/raw/` directory.
- [ ] Refactor `src/utils/seedEmbeddings.ts`. The embedding generation must process the final `exercises.json` file in **chunks of 5** to prevent Out-Of-Memory (OOM) crashes in the browser worker. Add console logs for "Processed batch X of Y".

## Phase 3: Combat Engine V2 & Game Feel (Incomplete)
- [x] Update `src/components/Hero/CombatCanvas.tsx` to include Combo Logic. Track `lastSetTimestamp` to determine if a set qualifies for a "HitCombo" (e.g., within 3 minutes).
- [x] Implement the floating combo counter (e.g., "5x COMBO") and floating "Damage Numbers" (mapped to Tonnage) that float upwards and fade out on the canvas.
- [x] Refactor the `HeavyBash` trigger so the `useSensoryFeedback` crunch sound and haptics occur at the *exact* frame the "Strike" connects on the canvas.

## Phase 4: Safety & Fault Tolerance (Incomplete)
- [ ] Create `src/components/UI/HeroErrorBoundary.tsx` and wrap the entire Hero Overlay (Stairs/Forge) in it.
- [ ] Implement a Graceful Fallback: If the Canvas fails to initialize or the WebGL context is lost, catch the error and auto-toggle the app back to "Professional Focus Mode" with a subtle toast notification.

## Phase 5: Redo & Refinement (The "New" Tasks)
- [ ] [STITCH UI] Redo the connection between `MasterworkModal` (Hypertrophy) and `SummitModal` (Power) to the `heroMathService.prestige()` call. Ensure the "Prestige" effect triggers a 2-second full-screen particle "Flash" to celebrate the reset.
- [ ] [STITCH UI] Ensure the transition between the "Obsidian Stairs" and "The Forge" is smooth. Add a 500ms CSS cross-fade when the user switches their Primary Goal in settings.
- [ ] [STITCH UI] Add a "Brain Initializing..." loading state to the `NLPSearchBar` that only shows while the 22MB vector model is downloading for the first time via the worker.
- [ ] Verify that `completedAscensions` correctly updates the Roman Numeral badge in the `HomePage` header in real-time without a page refresh.