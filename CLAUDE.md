Project: IronProtocol
Stack: React 18, Vite, Tailwind CSS, Dexie.js
Architecture: Hybrid Offline-First. 
- The Lab (Online): Use AI APIs to plan `SessionBlueprints` and seed fallback exercise pools. 
- The Gantry (Offline): Local priority execution. Always rely on Dexie.js for `WorkoutIgnition` and `ActiveLogger`. No API calls permitted on the gym floor.
Status: Lab-vs-Gantry pivot is complete. The canonical session flow is SessionBlueprint (editable drafting lab) -> DraftBlueprintReview (read-only launch gantry) -> WorkoutIgnition -> ActiveLogger.

Rule 1: Use functional components and custom hooks for database logic.
Rule 2: Whenever you update the UI, launch the Vite dev server on localhost and use your integrated browser to visually verify the Tailwind layout.
Rule 3: Never deviate from the architecture described in raw/vision.md and GRAPH_REPORT.md.
Rule 4: Keep HomePage as a thin phase router (idle -> review -> ignition -> logging); do not merge drafting and review concerns into one screen.
Rule 5: AI prompts for generation must utilize the exact user constraints defined in the V11 AppSettings Schema (Baselines, Experience, Logistics, Equipment, Goals, Injuries).

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current