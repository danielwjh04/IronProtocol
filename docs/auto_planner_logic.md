# Auto Planner Algorithm Logic (V3: High-Availability Specification)

## 1. Algorithmic Philosophy: The "Zero Friction" Engine
* **Deterministic Selection:** Given a `RoutineType` and `TotalWorkouts`, the engine must return exactly one valid `SessionBlueprint`.
* **Physiological Primacy:** Neurological tax is prioritized. Heavy compound movements (T1) occupy the earliest slots in the session to ensure maximum intensity.
* **Elastic Volume:** The workout expands or contracts based on a "Quality of Service" (QoS) slider without breaking the structural integrity of the routine.

## 2. Input & State Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `routineType` | `Enum` | PPL, GZCL, 5/3/1, Arnold, etc. |
| `totalWorkouts` | `Integer` | Total historical sessions logged (used for Modulo calculation). |
| `timeLimit` | `Integer` | User-defined constraint (25m to 120m). |
| `trainingGoal` | `String` | Determines rest periods and set volume (Power vs. Hypertrophy). |
| `baselines` | `Map` | User-defined starting weights from the Calibration Bento. |

## 3. The Tiered Hierarchy (QoS) & Trimming Logic
The engine treats a workout as a stack of priority-weighted tasks. 

### Quality of Service (QoS) Rules
* **Tier 1 (T1):** The "Anchor." Multi-joint compounds. **Non-negotiable.**
* **Tier 2 (T2):** The "Volume Drivers." Secondary compounds. Trimmed if `timeLimit < 30m`.
* **Tier 3 (T3):** The "Finishers." Isolation movements. Trimmed if `timeLimit < 45m`.

### The Trimming Algorithm (Iterative Reduction)
1. **Initialize:** Load all exercises assigned to the current `sessionIndex`.
2. **Deduplicate:** Pass the array through a `uniqueBy(name)` filter to prevent double-loading state/UI duplication.
3. **Calculate Duration:** $$D = \sum (\text{Sets} \times \text{Rest}) + (\text{Sets} \times \text{60s Execution})$$.
4. **Trim Phase A:** If $$D > \text{timeLimit}$$, filter out all `T3` exercises. Recalculate $$D$$.
5. **Trim Phase B:** If $$D > \text{timeLimit}$$, filter out all `T2` exercises. Recalculate $$D$$.
6. **Trim Phase C:** If $$D > \text{timeLimit}$$ and only `T1` remains, reduce `T1` sets from 5 down to 3.

## 4. Progression & Calibration Models

### The Baseline Anchor (Calibration)
Before history exists, the engine pulls from the `baselines` table. 
* **Rule:** If `exercise.name` exists in `Baselines`, `startWeight = Baselines[name]`.
* **Fallback:** If no baseline exists, `startWeight = 20kg` (Standard Barbell) or `0kg` (Bodyweight).

### Double Progression Model (Mathematical Formula)
Used to drive Hypertrophy. Logic is executed during the "Post-Workout Sync" phase.

$$\text{If } \forall \text{ sets, } \text{Reps}_{\text{actual}} \ge \text{Reps}_{\text{maxTarget}}:$$
$$\text{Weight}_{\text{next}} = \text{Weight}_{\text{current}} + \Delta_{w}$$
$$\text{Reps}_{\text{next}} = \text{Reps}_{\text{minTarget}}$$

$$\text{Else if } \text{Session}_{\text{success}} = \text{True}:$$
$$\text{Weight}_{\text{next}} = \text{Weight}_{\text{current}}$$
$$\text{Reps}_{\text{next}} = \text{Reps}_{\text{prev}} + 1$$

## 5. Bodyweight Logic (The "Smart Input" Rule)
To eliminate friction for movements like **Burpees** or **Air Squats**:
* **Tag:** `isBodyweight = true`.
* **Behavior:** UI ignores Weight input focus; `autoPlanner` enforces `Weight = 0` regardless of progression. 
* **Progression:** Tracked strictly through Rep count and Tempo/Rest intensity.

## 6. Modulo Boundary Enforcement
To ensure routine continuity across months of training:
* **Formula:** `currentIndex = totalWorkouts % routine.cycleLength`.
* **Reset Trigger:** When `currentIndex == 0`, the engine initiates a "New Cycle" check, clearing any temporary QoS overrides from the previous cycle.