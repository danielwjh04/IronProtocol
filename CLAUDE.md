# CRITICAL: [CODE BLOCK] then [MAX 3 SENTENCE SUMMARY]. ZERO filler/intros/sign-offs.

Project: IronProtocol
Stack: React 18, Vite, Tailwind, Dexie.js, Framer Motion
Architecture: Lab (Online/AI) vs Gantry (Offline/Dexie)
Flow: Blueprint -> Review -> Ignition -> ActiveLogger

## Rules
- Components: Functional. DB logic: hooks.
- UI: Physics: Spring. AnimatePresence for mounting. Micro-interactions (hover/layout).
- UI Ecosystem: shadcn/ui or awesome-shadcnui.
- Imports: Named only. No wildcards. Remove unused.
- Content: Use V11 AppSettings Schema constraints.
- Code Style: Zero inline comments. Clean naming > docs.
- Git: Never include any `Co-authored-by:` trailer for Claude in commit messages. If a commit message contains `Co-authored-by: Claude`, rewrite the message before push.
- Context: Only analyze files explicitly tagged with @.
- Ref: graphify-out/GRAPH_REPORT.md (Read only on request).
- Sessions: If >3 turns, suggest /compact.

## Content Navigation
1. Query the knowledge graph first for repo questions.
2. Read raw files only when I explicitly say "read raw files".
3. Do not auto-run /graphify unless I explicitly request it.

## Design System (STRICT)
- All colors, spacing, fonts come from src/design/designSystem.ts. No raw hex in JSX/CSS outside that file and src/index.css.
- Every text node uses exactly one of .text-display / .text-body / .text-label. No ad-hoc sizes/weights/line-heights.
- Spacing uses the 9-step scale (0/4/8/12/16/24/32/48/64 px). Tailwind arbitrary values like mt-[13px] are banned.
- Accent color is goal-driven: swaps via [data-goal-theme] when trainingGoal changes. Never hardcode an accent — always `var(--color-accent-primary)`.
- Legacy tokens (navy, electric, pink, Barlow) are DEPRECATED. New components MUST use design-system tokens. Migrate legacy usages opportunistically during redesign.
- Combat skin (pixel fonts, black surfaces): apply `className="combat-skin"` ONLY on WorkoutIgnition, ActiveLogger per-set combat flashes, and the future WorkoutComplete celebration. Never on planning/history/settings screens.

## Swarm (Ruflo)
- Activation: Trigger `ruflo` for architectural pivots between Lab and Gantry.
- Security: Summon agents to audit Dexie.js persistence against Information Security storage standards.
- Intelligence: Delegate PWA sync research and Vite optimization tasks to specialized agents.