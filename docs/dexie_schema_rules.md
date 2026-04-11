# Database Schema and IndexedDB Constraints (V3: Resilience Aware)

## 1. Core Architectural Rules
* **Identity Management:** Always use UUID v4 strings for primary keys. Never use auto-incrementing integers. This ensures collision-free imports and robust draft recovery.
* **Migration Protocol:** Use strict versioning (currently v7). Never modify existing version blocks; always create a new `.version(x).stores()` block to handle migrations.
* **Data Isolation:** Maintain separation between metadata (Exercises), user activity (Workouts), and temporary drafts (tempSessions).

## 2. Data Structures

### Settings Table
* **id:** "app_settings" (Singleton).
* **hasCompletedOnboarding:** boolean (Gatekeeper for Home rendering).
* **preferredRoutineType:** string (Selected routine engine).

### TempSessions Table (The Resilience Layer)
* **id:** "temp_session" (Canonical draft ID).
* **data:** object (JSON-safe snapshot of active reps, weight, and timer).
* **lastUpdated:** integer (Unix timestamp).

### Baselines Table (Calibration)
* **exerciseName:** string (Primary Key).
* **weight:** number (User-defined starting load).

### Exercises, Workouts, and Sets
* **Exercises:** id, name, muscleGroup, tier (1-3), tags, mediaRef.
* **Workouts:** id, date, routineType, sessionIndex.
* **Sets:** id, workoutId, exerciseId, weight, reps, orderIndex.