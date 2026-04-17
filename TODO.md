# Iron Protocol: The Endgame Expansion

## Phase 1: The Hypertrophy Environment (The Forge)
- [x] Implement `src/components/Hero/TheForge.tsx`. This is the visual world for the Hypertrophy track.
- [x] Use HTML5 Canvas to create a "Furnace" particle effect. It should render rising embers and an ambient orange/red glow.
- [x] Tie the canvas rendering to `useHeroProgress`: At 0.0, the forge is dim. At 1.0, it is a roaring fire with rapid particle emission.
- [x] Create `src/components/Hero/MasterworkModal.tsx`. This triggers when the Hypertrophy track reaches 1.0 progress. Include a button to "Forge Masterwork" (Prestige).

## Phase 2: The Power Environment Polish (The Monolith)
- [ ] Refactor `src/components/Hero/ObsidianStairs.tsx`. Add three distinct parallax layers (Foreground Fog, Midground Stairs, Background Void).
- [ ] Add a "Weather" state. If a user logs a set that is a Personal Record (PR), trigger a CSS/Canvas "Lightning Strike" effect that flashes the screen white and illuminates the void for 500ms.
- [ ] Create `src/components/Hero/SummitModal.tsx`. This triggers when the Power track reaches 1.0. Include a button to "Ascend" (Prestige).

## Phase 3: The Intelligent Search UI
- [ ] Create `src/components/Search/NLPSearchBar.tsx`. This is a Natural Language search input for exercises.
- [ ] Implement a debounce hook (300ms) on the input field.
- [ ] Connect the input to the `localAIService.getEmbedding()` worker. 
- [ ] Render a dropdown list of `ExerciseCard` components sorted by the `cosineSimilarity` score.
- [ ] Add a visual "Match Score" indicator (e.g., "98% Match") to the search results.

## Phase 4: The Database Seeding (Batch Generation Protocol)
- [ ] Create `src/data/raw/chest_back.json`. Generate 60 distinct exercises for Chest and Back. Each must strictly follow the schema: `{ id: string, name: string, technical_cues: string[], biomechanical_why: string }`. The `biomechanical_why` must be highly detailed (e.g., muscle origins, insertions, leverage curves).
- [ ] Create `src/data/raw/legs_core.json`. Generate 60 distinct exercises for Quads, Hamstrings, Glutes, Calves, and Core following the exact same schema.
- [ ] Create `src/data/raw/shoulders_arms.json`. Generate 60 distinct exercises for Deltoids, Biceps, Triceps, and Forearms following the exact same schema.
- [ ] Create `src/data/raw/functional_cables.json`. Generate 60 distinct exercises focusing on Unilateral movements, Cables, and functional mobility following the exact same schema.
- [ ] Create `src/data/raw/power_strongman.json`. Generate 60 distinct exercises focusing on Olympic lifts, Strongman movements, and heavy compound variations following the exact same schema.
- [ ] Create a utility script `src/utils/mergeExercises.ts` that reads all 5 files from `src/data/raw/`, combines them into a single array, and writes the final 300-item array to `src/data/exercises.json`.
- [ ] Execute `mergeExercises.ts` to generate the final file, then delete the `src/data/raw/` directory.
- [ ] Refactor `src/utils/seedEmbeddings.ts`. The embedding generation must process the final `exercises.json` file in **chunks of 5** to prevent Out-Of-Memory (OOM) crashes in the browser worker. Add console logs for "Processed batch X of Y".

## Phase 5: The Sensory Engine (Audio & Haptics)
- [x] Create `src/hooks/useSensoryFeedback.ts`.
- [x] Implement the `navigator.vibrate` API (Haptics). Trigger a heavy double-vibration `[200, 100, 200]` for a completed heavy set, and a light vibration `[50]` for a UI click. Ensure it fails gracefully on desktop/iOS.
- [x] Implement a synthetic Web Audio API "Crunch" sound function (using an OscillatorNode with a sawtooth wave and exponential decay) to simulate an 8-bit heavy strike without needing external .mp3 files.

## Phase 6: The Combat Engine V2 (Combos)
- [ ] Update `src/components/Hero/CombatCanvas.tsx`.
- [ ] Implement a `HitCombo` multiplier. If a user logs multiple sets within a specific timeframe (e.g., standard rest periods), a floating combo counter (e.g., "3x COMBO") appears.
- [ ] Render floating "Damage Numbers" when `HeavyBash` triggers. The number should be mapped to the `intensity` or `tonnage` of the logged set, floating upwards and fading out (CSS or Canvas text).

## Phase 7: Prestige & Lifetime Persistence
- [x] Update `src/db/schema.ts` to add a `lifetimeHeroLevel` (number) and `completedAscensions` (number) to the User profile table.
- [x] Add `useTrackProgress` hook (power/hypertrophy split) and `heroMathService.computeTrackProgress` helper; fold `activeTrack` into AppSettings v15.
- [x] Implement the "Prestige" logic in `heroMathService.ts`. When a user clicks "Ascend" or "Forge Masterwork", it increments `completedAscensions`, resets the *current* macrocycle progress to 0.0, but leaves the underlying workout data intact.
- [x] Display a small "Prestige Badge" or roman numeral next to the user's name in the `HomePage.tsx` header based on their `completedAscensions`.

## Phase 8: Error Boundaries & Fallbacks
- [ ] Create `src/components/UI/HeroErrorBoundary.tsx`. Wrap the entire Hero Overlay (Stairs/Forge) in this React Error Boundary.
- [ ] If the Canvas crashes or the WebGL context is lost, it should catch the error, hide the game mode, and smoothly return the user to the "Professional Focus Mode" without crashing the entire app.