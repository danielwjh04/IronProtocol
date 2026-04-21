# IronProtocol 💪

An offline-first Progressive Web App for strength training. IronProtocol is a session orchestrator, not a logbook. It plans your next workout, walks you through it set by set, and adapts to your performance and recovery signals in real time.

Every byte of data lives locally in IndexedDB. No account, no sync requirement, no network dependency for core use.

---

## What It Does ❓

- **Plans your next session.** A rules-based planner reads your routine (PPL, Upper/Lower, Full Body, GZCL, 5/3/1, PHUL, Arnold, Bro Split, TimeCrunch) and generates a blueprint: which exercises, how many sets and reps, at what weight. Output is derived from calibrated baselines, recent history, and the chosen training goal (Hypertrophy vs Power).
- **Per-routine outcome goals.** Type a free-text aim such as *"raise my bench 1RM to 225 lb"* or *"increase running speed"* into the routine editor. An offline regex parser classifies the intent (`lift-pr`, `jump`, `run`, `stamina`, `fat-loss`, `mobility`) and biases the planner, reordering accessories, auto-picking the right session day, and adjusting rep ranges.
- **Per-routine time cap.** Each routine carries its own session time budget (30 to 120 min). The planner sizes exercise count, tier cap, and volume to fit, so no global setting gets in the way.
- **Live logging with combat-skin UI.** `ActiveLogger` takes you through the session with a flush bottom dock, ring-progress tier icons, rest timer swapped into the dock, per-set RPE, and a substitution drawer. Gesture-driven and one-handed, designed for high-fatigue sets.
- **Automated progressive overload.** Double-progression math: add reps within the rep range, then add weight and reset. Zero manual tracking.
- **QoS session trimming.** A per-routine minute ceiling dynamically trims T2 and T3 exercises if estimated duration runs long.
- **Recovery auditing.** A rules-based heuristic reads soreness, sleep, and fatigue logs, then flags when the upcoming session should be scaled back.
- **Baselines plus history-aware progression.** Calibrate working weights once; the planner anchors future prescriptions on real numbers instead of the 20 kg default.
- **Installable PWA.** Built via `vite-plugin-pwa`. Add to home screen, works offline after first load, uses the device safe-area insets.

---

## Tech Stack ⚙️

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 7 |
| Styling  | Tailwind CSS 4, Inter via Google Fonts, design tokens in `src/design/designSystem.ts` and `src/index.css`, Framer Motion (spring physics) |
| Data     | Dexie.js (IndexedDB wrapper), Zod validation, `lz-string` for export compression |
| Planner  | Pure functions in `src/planner/autoPlanner.ts`, offline goal parser in `src/planner/goalParser.ts` |
| Backend (optional) | Supabase edge functions in `supabase/functions/*` for Lab-side plan generation, retrieval, feedback, and swap suggestions. Backed by `pgvector` for semantic exercise lookup. |
| Testing  | Vitest, Testing Library, `fake-indexeddb` |
| Tooling  | ESLint 9 (flat config), TypeScript strict mode |

**Architecture.** Two halves. *Lab* runs online and AI-assisted (Supabase edge functions, Gemini retrieval, pgvector). *Gantry* runs fully offline on the client (Dexie, local planner). Session flow: **Blueprint -> Review -> Ignition -> ActiveLogger -> Recovery**.

---

## Design System ⚙️

Three text styles, Apple iOS dark-mode system grays as neutrals, goal-driven accent swap (Hypertrophy green `#30D158`, Power red `#FF453A`), and an opt-in combat skin with pixel fonts for Ignition, per-set flashes, and completion screens. Tokens live in `src/index.css` under `@theme` and mirror into `src/design/designSystem.ts` for component use.

- `text-display` 34 / 700
- `text-body` 17 / 400
- `text-label` 13 / 600
- 8pt spacing scale (`--space-0` through `--space-8`)
- Fixed app chrome heights (`--space-tabbar`, `--space-pill`) for safe-area-aware layouts.

---

## Local Development 👌

```bash
git clone https://github.com/danielwjh04/IronProtocol.git
cd IronProtocol
npm install
npm run dev
```

Scripts:

```bash
npm run dev          # Vite dev server with HMR
npm run build        # type-check + production build
npm run preview      # preview the built PWA
npm run test         # Vitest unit + integration tests
npm run lint         # ESLint (max-warnings 0)
npm run typecheck    # tsc -b, no emit
```

The offline client runs without any environment variables. Supabase keys are only needed if you plan to exercise the Lab edge functions locally (see `supabase/config.toml`).

---

## Usage Guide 📖

### 1. First launch: onboarding

A three-step flow in `IdentitySplash`:

1. **Baselines.** Age and body weight. These anchor every prescription.
2. **Equipment.** Commercial gym vs bodyweight-only. Determines which exercises the planner considers.
3. **Calibrate.** Working weights for Squat, Bench, Deadlift, OHP. Replaces the 20 kg default.

### 2. Create a routine

Open **Routines -> New Routine**. Configure:

- **Name.** Auto-suggested from your outcome goal (for example *"Bench Press Builder"*, *"Endurance Foundation"*).
- **Goal.** Hypertrophy or Power. Drives rep ranges and accent theme.
- **Your Goal** (optional free text). Drives per-routine planner bias.
- **Days Per Week.** 3, 4, or 5.
- **Time Cap Per Session.** 30 to 120 min. Sizes exercise count and tier cap.
- **Cycle Length** in weeks.

Save, then the routine becomes active and the home dashboard starts planning against it.

### 3. Run a workout

From the dashboard:

1. **Blueprint.** Review the auto-generated exercise list. Reorder, swap, or remove anything via the swap drawer.
2. **Review lock.** Confirms the plan.
3. **ActiveLogger.** Set-by-set execution. Log the set, the dock flips to a rest timer with the same footprint, then back to the log form. The current exercise tier icon stays accent-green; completed exercises fade to muted; upcoming exercises sit in secondary.
4. **Complete.** Results persist to Dexie and the recovery log prompt fires afterwards.

### 4. Log recovery

After a workout, `RecoveryLogForm` captures sleep quality, fatigue, and soreness per muscle group. `RecoveryAuditorCard` on the Core Ignition surface reads these and surfaces warnings before the next session (for example *"heavy lower-body soreness, consider a push day"*).

### 5. Review history

The **History** tab lists workouts with rich summaries. Tap a row to open `WorkoutDetailSheet`. Destructive actions are gated behind a confirm step.

### 6. Settings

Tune time caps, swap goal theme, inspect baselines, re-run the onboarding, or export your data.

---

## Data Ownership

Your data belongs to you. IronProtocol ships an export utility that generates a portable JSON backup of your workout history, baseline calibrations, recovery logs, and personal records. Import works symmetrically: move devices, restore backups, or fork your own analysis pipeline.

---

## In Progress 🏗️

### Hero Mode

Hero progression (lifetime Hero Level, completed Ascensions, Power vs Hypertrophy tracks, Summit and Masterwork celebrations, the Obsidian Stairs UI) is partially scaffolded in `src/components/hero/*` but **not yet wired into the mainline session flow**. The schema carries `lifetimeHeroLevel`, `completedAscensions`, `activeTrack`, `macrocycleClosedAt`, while the macrocycle-close trigger, XP awards, and celebration timings are still being tuned. Expect shape changes.

### App Design

The current UI is a working draft, not a final language. Component layouts, typography scale, motion timings, and surface hierarchy are subject to change as the app matures toward v1. Design tokens in `src/design/designSystem.ts` and `src/index.css` are the source of truth while the system settles.

### Educational + form-guard anatomy

The 3D anatomy model in `FunctionalWhy.tsx` is being reworked to add zone pills plus an activation-bar strip, mirroring the hybrid mockup in `design-sketch-anatomy-hybrid.html`.

### Planner quality

The offline planner is still being tuned. Current work targets smarter exercise selection (better T2/T3 accessory pairing, less repetition week-to-week, sharper responsiveness to the free-text outcome goal) and cleaner volume ramps across a cycle. Expect the output blueprint to shift as the heuristics get dialed in.

### Macrocycle calendar

A 12-week calendar view that maps out the full routine (session days, deload weeks, peak weeks, projected PR attempts) is in progress. The data is already persisted through `macrocyclePersistence`, but the visual calendar surface and the per-week drilldown are not yet shipped.

---

## Project Layout ⚙️

```
src/
  components/       UI components (ActiveLogger, IdentitySplash, hero/*, dashboard/*, UI/*)
  context/          React contexts (UIMode)
  data/             Static data (functionalMapping, goalAccessories)
  db/               Dexie schema and live-query helpers
  design/           Design tokens mirror for component code
  events/           Set-commit event bus
  hooks/            Custom hooks (useActiveRoutine, useCombatTrigger, useHomePageController, ...)
  pages/            Route pages (Home, History, Routines, Settings)
  planner/          Offline planner (autoPlanner, goalParser, recoveryAuditorHeuristics)
  services/         Domain services (exerciseQoS, fallbackPoolManager, macrocyclePersistence, ...)
  test/             Vitest suites
supabase/
  functions/        Edge functions (plans-query, plans-swap, plans-feedback)
  migrations/       SQL migrations (pgvector, planning tables, RLS, RPC, swap-signals view)
  seed/             Seed scripts (exercises, embeddings, plan templates)
```
