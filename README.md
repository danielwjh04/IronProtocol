# IronProtocol ⚡️

An **offline-first Progressive Web App** for strength training. IronProtocol is a session orchestrator, not a logbook — it plans your next workout, walks you through it set-by-set, and adapts the plan in real time based on your performance and recovery signals.

Every piece of data lives locally in IndexedDB. No account, no sync, no network dependency.

---

## 🎯 What It Does

- **Plans your next session.** A local rules-based planner reads your routine (PPL, Upper/Lower, Full Body, GZCL, 5/3/1, PHUL, Arnold, Bro Split, TimeCrunch) and generates a blueprint: which exercises, how many sets/reps, at what weight — derived from your calibrated baselines, recent history, and training goal (Hypertrophy vs Power).
- **Per-routine outcome goals.** Type a free-text goal like *"raise my bench 1RM to 225 lb"* or *"increase running speed"* into the routine editor. An offline regex parser classifies the aim (`lift-pr`, `jump`, `run`, `stamina`, `fat-loss`, `mobility`) and biases the planner — reordering accessories, auto-picking the right session day, and adjusting rep ranges.
- **Per-routine time cap.** Each routine carries its own session time budget (30–120 min). The planner sizes the exercise count, tier cap, and volume to fit — no global setting to wrestle with.
- **Live logging with combat-skin UI.** `ActiveLogger` takes you through the session with pixel-font HUDs, rest timers, and substitution drawers. Gesture-driven, one-handed, designed for high-fatigue sets.
- **Automated progressive overload.** Double-progression math — add reps within the rep range, then add weight and reset. Zero manual updating.
- **QoS session trimming.** A 120-minute ceiling dynamically trims T2/T3 exercises if estimated duration runs long.
- **Recovery auditing.** Rules-based heuristic reads your soreness + sleep + fatigue logs and flags when a session should be scaled back.
- **Baselines + history-aware progression.** Calibrate your working weights once; the planner starts from your real numbers instead of a 20 kg default.

---

## 🛠 Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling  | Tailwind CSS, design tokens in `src/design/designSystem.ts`, Framer Motion (spring physics) |
| Data     | Dexie.js (IndexedDB wrapper), Zod validation |
| Planner  | Pure functions in `src/planner/autoPlanner.ts`, offline goal parser in `src/planner/goalParser.ts` |

**Architecture:** Lab (online, AI-assisted) vs Gantry (offline, Dexie-backed). Flow: **Blueprint → Review → Ignition → ActiveLogger**.

---

## ⚙️ Local Development

```bash
git clone https://github.com/danielwjh04/IronProtocol.git
cd IronProtocol
npm install
npm run dev          # Vite dev server on :5173
```

Other scripts:

```bash
npm run build        # type-check + production build
npm run test         # Vitest unit + integration tests
npm run lint         # ESLint
```

---

## 🚀 Usage Guide

### 1. First launch — onboarding

On a fresh install, **IdentitySplash** walks you through:

- Your physiological baselines (age, body weight, gender).
- Training experience level.
- Primary goal focus (hypertrophy / strength / endurance / specific lift target).
- Equipment availability (commercial gym / bodyweight only).
- Any injury constraints.

This seeds the V11 prompt contract that informs every future planning decision.

### 2. Create a routine

Open **Routines** → *New Routine*. Configure:

- **Name** (auto-suggested from your outcome goal — e.g. *"Bench Press Builder"*, *"Endurance Foundation"*).
- **Goal** — Hypertrophy or Power (sets rep ranges).
- **Your Goal** (optional free text) — drives per-routine planner bias.
- **Days Per Week** — 3, 4, or 5.
- **Time Cap Per Session** — 30–120 min slider. Determines exercise count and tier cap.
- **Cycle Length** in weeks.

Save — the routine becomes active; the home-page dashboard starts planning against it.

### 3. Calibrate baselines

**Settings → Baselines**. Enter your current working weights for Squat / Bench / Deadlift / OHP. The planner uses these instead of the 20 kg default.

### 4. Run a workout

From the dashboard:

1. **Blueprint** — review the auto-generated exercise list. Reorder, swap, or remove anything via the swap drawer.
2. **Review** lock — confirms the plan.
3. **Ignition** — combat-skin transition screen.
4. **ActiveLogger** — set-by-set execution with rest timers, per-set RPE, and substitution hotkeys.
5. **Complete** — results persist to Dexie; recovery log prompt fires afterwards.

### 5. Log recovery

After a workout, **RecoveryLogForm** captures sleep quality, fatigue, and soreness per muscle group. `RecoveryAuditorCard` on the Core Ignition surface reads these and surfaces warnings before the next session (e.g. *"heavy lower-body soreness — consider a push day"*).

### 6. Review history

**History** tab shows rich rows with workout summaries. Tap any row to open the `WorkoutDetailSheet` (deletion is buried behind a confirm step).

---

## 🚧 In Progress

### Hero Mode

**Hero Mode is still in work.** The hero progression system (lifetime Hero Level, completed Ascensions, Power vs Hypertrophy tracks, Summit/Masterwork celebrations, Obsidian Stairs UI) is partially scaffolded but **not yet wired into the mainline session flow**. The hero overlay, Forge surface, and track-end modals exist in `src/components/hero/*` and the schema carries `lifetimeHeroLevel`, `completedAscensions`, `activeTrack`, `macrocycleClosedAt` — but the macrocycle-close trigger, XP awards, and celebration timings are still being tuned. Expect shape changes in upcoming streams.

---

## 🔐 Git Push Guard

IronProtocol blocks any push that includes a commit message trailer containing `Co-authored-by: Claude`. Activate the tracked hook once per clone:

```bash
git config core.hooksPath .githooks
```

If a push is blocked, rewrite the commit message to drop the trailer and push again.

---

## 🔒 Data Ownership

Your data belongs to you. IronProtocol ships an export utility that generates a portable JSON backup of your entire workout history, baseline calibrations, recovery logs, and personal records. Import works symmetrically — move devices, restore backups, or fork your own analysis pipeline.

---

## 🧭 Knowledge Graph

The repo is indexed by [graphify](https://github.com/safishamsi/graphify). Outputs live in `graphify-out/`:

- `graph.html` — interactive visualization, open in any browser.
- `graph.json` — raw graph data.
- `GRAPH_REPORT.md` — audit report with god nodes, communities, and surprising connections.
- `obsidian/` — Obsidian vault with one note per concept.
