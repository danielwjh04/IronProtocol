Project: IronProtocol
Stack: React 18, Vite, Tailwind CSS, Dexie.js
Architecture: Local priority. Always prefer Dexie.js for data storage over external APIs.
Status: Lab-vs-Gantry pivot is complete. The canonical session flow is SessionBlueprint (editable drafting lab) -> DraftBlueprintReview (read-only launch gantry) -> WorkoutIgnition -> ActiveLogger.
Rule 1: Use functional components and custom hooks for database logic.
Rule 2: Whenever you update the UI, launch the Vite dev server on localhost and use your integrated browser to visually verify the Tailwind layout.
Rule 3: Never deviate from the architecture described in raw/vision.md and GRAPH_REPORT.md.
Rule 4: Keep HomePage as a thin phase router (idle -> review -> ignition -> logging); do not merge drafting and review concerns into one screen.