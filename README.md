# IronProtocol ⚡️

An offline-first, Progressive Web App (PWA) gym tracker engineered for zero-friction training. 

Moving beyond static digital logbooks, IronProtocol acts as a dynamic session orchestrator. By combining a highly tactile UI with a rigorous mathematical backend, it handles automated progressive overload, smart exercise substitutions, and time-aware session trimming—keeping your focus entirely on the lift.

## 🚀 Core Architecture

* **Zero-Friction Logging:** A floating, gesture-driven interface designed for one-handed operation during high-fatigue sets.
* **Automated Progressive Overload:** The engine calculates and enforces weight increases based on rigorous double-progression mathematical models.
* **QoS Session Trimming:** A 120-minute Quality of Service ceiling dynamically trims Tier 2 and Tier 3 exercises if your session runs long.
* **Smart Orchestration:** Mid-workout exercise swapping matching physiological movement patterns via tag-based queries.
* **100% Offline Resilience:** Powered by Dexie.js for instant read/writes, ensuring your data is safe even in gym basements with no cell service.

## 🛠 Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, Framer Motion (Cyber-Tactile / Electric Navy aesthetic)
* **Local Database:** Dexie.js (IndexedDB wrapper)
* **Validation:** Zod

## ⚙️ Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## 🔐 Git Push Guard

IronProtocol blocks any push that includes a commit message trailer containing `Co-authored-by: Claude`.

Run this once per clone to activate the tracked hook:

```bash
git config core.hooksPath .githooks
```

If a push is blocked, rewrite the commit message to remove the trailer and push again.

## 🔒 Data Ownership

Your data belongs to you. IronProtocol features an export utility that generates a portable JSON backup of your entire workout history, baseline calibrations, and personal records.