# IronProtocol Architecture & System Context

## 1. Core Architecture: The Hybrid Compromise
IronProtocol is an "Offline-First PWA" with a hybrid AI-planning model. 
* **The Lab (Online/Wi-Fi):** AI handles the heavy lifting. The AI generates a 12-week macrocycle `SessionBlueprint` based on precise user prompts. This blueprint includes pre-calculated fallback pools for exercise swaps.
* **The Gantry (Offline/Gym Floor):** Strict local execution. `WorkoutIgnition` and `ActiveLogger` run 100% offline via Dexie.js. 
* **Crucial Rule:** The app MUST NOT require an active internet connection or API call while the user is executing a workout or swapping an exercise mid-session. All alternatives must be pulled from the locally seeded fallback pool.

## 2. V11 AppSettings Schema (AI Contract)
To generate accurate `SessionBlueprints`, the AI requires high-quality prompt data. The V11 Schema and `IdentitySplash` onboarding flow must capture these exact data points to construct the AI request:
* **Physiological Baselines:** Age, weight, gender.
* **Training Experience:** Beginner, Novice, Intermediate, Advanced.
* **Logistical Constraints:** Target days per week, hard time limits per session (e.g., < 60 mins).
* **Equipment Availability:** Commercial Gym, Home Gym, Dumbbells Only, Bodyweight Only.
* **Primary Goal:** Hypertrophy, Strength, Endurance, Specific lift targets.
* **Injury History / Avoidance:** Explicit structural aversions (e.g., "No spinal loading").

## 3. Code Generation Rules
* Prioritize Dexie.js for data persistence during workout execution.
* Separate state management for Drafting (Lab) vs Execution (Gantry).