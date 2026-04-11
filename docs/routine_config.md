# Routine Configuration (V4: Professional Engine)

## 1. Quality of Service (QoS) Logic
The engine dynamically trims exercises based on the **Time Available** slider (15m–120m):
* **Tier 1 (Anchor):** Never trimmed. Essential compounds (Squat, Bench, etc.).
* **Tier 2 (Volume):** Trimmed if Time < 30 minutes.
* **Tier 3 (Accessory):** Trimmed if Time < 40 minutes.

## 1a. Frequency Recommendations
The engine maps `daysPerWeek` to best-fit routines:
* **3 Days:** PPL, Full Body.
* **4 Days:** GZCL, Upper/Lower.
* **5 Days:** Arnold Split, Bro Split.

## 2. Deduplication & Routing
* **Deterministic Unique Path:** The planner must apply a `uniqueBy(name)` filter before returning the blueprint to prevent UI duplication (the "Double Vision" bug).
* **Baseline Routing:** If a user has calibrated weights, the planner pulls from the `baselines` table before defaulting to 20kg.

## 3. Supported Templates (Cycle Modulo)
Routine selection calculates `sessionIndex` via: `totalWorkouts % cycleLength`.
* **GZCL (4-Day):** Tier 1 Squat, Bench, Deadlift, OHP focus.
* **PPL (3-Day):** Push, Pull, Legs.
* **PHUL (4-Day):** Power/Hypertrophy split with Tier-gates.
* **Time Crunch (1-Day):** Tier 1 only, 30m maximum.

## 4. Progression Integrity
* **Double Progression:** Increment weight only if all sets reach `Reps_max`. Otherwise, increment `Reps` (+1) toward the cap.
* **Bodyweight Rule:** Bodyweight movements (Burpees, etc.) track progression strictly via Reps/Tempo; weight remains 0kg.