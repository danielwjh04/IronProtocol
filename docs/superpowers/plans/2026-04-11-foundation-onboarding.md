# Foundation & Phase 1 Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Dexie schema to v11 with onboarding fields, inject Electric Navy Tailwind v4 design tokens, and rebuild `IdentitySplash` with the full 4-field onboarding form (Name, North Star, Purpose Chips, QoS Slider).

**Architecture:** Schema-first — `AppSettings` gets three optional fields (`northStar`, `purposeChip`, `qosMinutes`) and a new Dexie version block. A `PurposeChip` union type is co-located in `schema.ts`. `IdentitySplash.tsx` is a self-contained form component; it writes directly to `db.settings` and relies on `useLiveQuery` in the parent (`HomePage`) to reactively unmount the splash. Tailwind v4 uses CSS `@theme` blocks — no `tailwind.config.js` exists or is needed.

**Tech Stack:** React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion 12, Dexie.js 4, Vitest 4, @testing-library/react 16, fake-indexeddb

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/index.css` | Add `@theme` block with Electric Navy color + font tokens |
| Modify | `src/db/schema.ts` | Add `PurposeChip` type, extend `AppSettings`, add version 11 |
| Modify | `src/test/db.test.ts` | Update `verno` assertion 10→11; add v11 fields test |
| Modify | `src/components/IdentitySplash.tsx` | Rebuild with Name, North Star, Purpose Chips, QoS, Days/Week |
| Create | `src/test/IdentitySplash.test.tsx` | Render + submit integration tests |

---

## Task 1: Inject Electric Navy design tokens into Tailwind v4

**Files:**
- Modify: `src/index.css`

This task has no automated test — correctness is verified by running the dev server (Rule 2 in CLAUDE.md). The `@theme` block exposes Electric Navy as Tailwind utility classes so inline hex values can be replaced throughout the app.

- [ ] **Step 1: Add `@theme` block to `src/index.css`**

Insert immediately after `@import "tailwindcss";` (line 2). The block registers color and font tokens. Keep existing CSS variables below it for backward compat.

```css
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800;900&display=swap');
@import "tailwindcss";

@theme {
  --color-navy: #0A0E1A;
  --color-navy-card: #0D1626;
  --color-navy-border: #1a2a5e;
  --color-electric: #3B71FE;
  --color-pink: #FF89D6;
  --color-vivid-red: #FF3B3B;
  --font-display: 'Barlow', sans-serif;
  --font-ui: 'Inter', 'Segoe UI', sans-serif;
}

:root {
  /* ... rest of file unchanged ... */
```

Generated Tailwind utilities: `bg-navy`, `bg-navy-card`, `bg-navy-border`, `bg-electric`, `bg-pink`, `bg-vivid-red`, `text-navy`, `text-electric`, `text-pink`, `text-vivid-red`, `border-navy-border`, `border-electric`, `border-pink`, `font-display`, `font-ui`.

- [ ] **Step 2: Verify dev server compiles without errors**

```bash
npm run dev
```

Expected: Vite starts, no CSS errors in the terminal. Open `http://localhost:5173` in the browser to confirm the app still renders the Electric Navy background. If you see a blank page or missing styles, check the `@theme` block is placed before `:root {}`.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(theme): inject Electric Navy @theme tokens for Tailwind v4"
```

---

## Task 2: Extend AppSettings schema to version 11

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/test/db.test.ts`

- [ ] **Step 1: Write the failing tests in `src/test/db.test.ts`**

Update the version assertion and add a new describe block for v11 fields. These tests will fail until the schema is updated.

Change line 18 (`expect(db.verno).toBe(10)`) and add the new describe block after the existing `v10 schema` block:

```ts
// Change in existing test:
it('opens at schema version 11', async () => {
  db = new IronProtocolDB()
  await db.open()
  expect(db.verno).toBe(11)
})
```

Add after the closing `})` of the `v10 schema` describe block:

```ts
describe('v11 schema — onboarding fields', () => {
  let db: IronProtocolDB

  beforeEach(() => { db = new IronProtocolDB() })
  afterEach(async () => { if (db.isOpen()) await db.close(); await db.delete() })

  it('persists northStar, purposeChip, and qosMinutes on AppSettings', async () => {
    await db.open()
    await db.settings.put({
      id: APP_SETTINGS_ID,
      hasCompletedOnboarding: false,
      preferredRoutineType: 'PPL',
      daysPerWeek: 4,
      userName: 'Atlas',
      northStar: 'Build elite strength',
      purposeChip: 'strength',
      qosMinutes: 60,
    })
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings?.userName).toBe('Atlas')
    expect(settings?.northStar).toBe('Build elite strength')
    expect(settings?.purposeChip).toBe('strength')
    expect(settings?.qosMinutes).toBe(60)
  })

  it('existing settings rows without new fields remain valid (fields are optional)', async () => {
    await db.open()
    const settings = await db.settings.get(APP_SETTINGS_ID)
    expect(settings).toBeDefined()
    expect(settings?.northStar).toBeUndefined()
    expect(settings?.purposeChip).toBeUndefined()
    expect(settings?.qosMinutes).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/db.test.ts --reporter=verbose
```

Expected: `opens at schema version 11` FAILS with `expected 10 to be 11`. The v11 tests FAIL because `purposeChip` etc. are not on the type yet.

- [ ] **Step 3: Add `PurposeChip` type and extend `AppSettings` in `src/db/schema.ts`**

Add the `PurposeChip` type immediately before the `AppSettings` interface:

```ts
export type PurposeChip = 'strength' | 'hypertrophy' | 'fat-loss' | 'endurance' | 'health'
```

Add three optional fields to `AppSettings`:

```ts
export interface AppSettings {
  id: string
  hasCompletedOnboarding: boolean
  preferredRoutineType: string
  daysPerWeek: number
  userName?: string
  northStar?: string       // free-text goal from onboarding
  purposeChip?: PurposeChip // training intent from onboarding
  qosMinutes?: number      // session time budget from onboarding (15–120)
}
```

- [ ] **Step 4: Add version 11 block to `IronProtocolDB` constructor in `src/db/schema.ts`**

Append after the existing `version(10)` block, before the `this.on('populate', ...)` hook:

```ts
// Version 11 — adds onboarding identity fields to settings:
// northStar (free-text goal), purposeChip (training intent),
// qosMinutes (session time budget). All optional; no data migration
// needed because absent rows get undefined for new fields.
this.version(11).stores({
  exercises:     'id, name, muscleGroup, tier, *tags',
  workouts:      'id, date, routineType, sessionIndex',
  sets:          'id, workoutId, exerciseId, orderIndex',
  settings:      'id, preferredRoutineType',
  tempSessions:  'id, updatedAt',
  baselines:     'exerciseName',
  dailyTargets:  'date',
  personalBests: 'exerciseId',
})
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/test/db.test.ts --reporter=verbose
```

Expected: All tests PASS. `opens at schema version 11` passes. Both v11 tests pass.

- [ ] **Step 6: Run the full test suite to confirm no regressions**

```bash
npx vitest run --reporter=verbose
```

Expected: All existing tests pass. The UI tests seed settings without `northStar`/`purposeChip`/`qosMinutes` — this is fine because those fields are optional.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/test/db.test.ts
git commit -m "feat(schema): extend AppSettings v11 with northStar, purposeChip, qosMinutes"
```

---

## Task 3: Rebuild IdentitySplash with full onboarding form

**Files:**
- Create: `src/test/IdentitySplash.test.tsx`
- Modify: `src/components/IdentitySplash.tsx`

- [ ] **Step 1: Create the failing test file `src/test/IdentitySplash.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import IdentitySplash from '../components/IdentitySplash'
import { APP_SETTINGS_ID, IronProtocolDB } from '../db/schema'

afterEach(() => cleanup())

describe('IdentitySplash', () => {
  let db: IronProtocolDB

  beforeEach(async () => {
    db = new IronProtocolDB()
    await db.open()
  })

  afterEach(async () => {
    if (db.isOpen()) await db.close()
    await db.delete()
  })

  it('renders name input, north star textarea, purpose chips, and QoS slider', () => {
    render(<IdentitySplash db={db} />)
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/train to/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^strength$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^hypertrophy$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^fat loss$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^endurance$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^health$/i })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('submit is disabled when name is empty', () => {
    render(<IdentitySplash db={db} />)
    expect(screen.getByRole('button', { name: /enter protocol/i })).toBeDisabled()
  })

  it('submit is disabled when name is filled but no purpose chip is selected', () => {
    render(<IdentitySplash db={db} />)
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    expect(screen.getByRole('button', { name: /enter protocol/i })).toBeDisabled()
  })

  it('submit is enabled when name and a purpose chip are both provided', () => {
    render(<IdentitySplash db={db} />)
    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    expect(screen.getByRole('button', { name: /enter protocol/i })).toBeEnabled()
  })

  it('saves all onboarding fields to db.settings on submit', async () => {
    render(<IdentitySplash db={db} />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.change(screen.getByPlaceholderText(/train to/i), { target: { value: 'Build elite strength' } })
    fireEvent.click(screen.getByRole('button', { name: /^strength$/i }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: /enter protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.northStar).toBe('Build elite strength')
      expect(settings?.purposeChip).toBe('strength')
      expect(settings?.qosMinutes).toBe(60)
    })
  })

  it('northStar is optional — submits successfully with empty north star', async () => {
    render(<IdentitySplash db={db} />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Atlas' } })
    fireEvent.click(screen.getByRole('button', { name: /^hypertrophy$/i }))
    fireEvent.click(screen.getByRole('button', { name: /enter protocol/i }))

    await waitFor(async () => {
      const settings = await db.settings.get(APP_SETTINGS_ID)
      expect(settings?.userName).toBe('Atlas')
      expect(settings?.purposeChip).toBe('hypertrophy')
      expect(settings?.northStar).toBe('')
    })
  })
})
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```bash
npx vitest run src/test/IdentitySplash.test.tsx --reporter=verbose
```

Expected: Tests that check for North Star textarea and QoS slider FAIL because the current `IdentitySplash` doesn't have those fields. The purpose chip tests also FAIL.

- [ ] **Step 3: Replace `src/components/IdentitySplash.tsx` with the full implementation**

```tsx
import { motion } from 'framer-motion'
import { useState } from 'react'
import { APP_SETTINGS_ID, type IronProtocolDB, type PurposeChip } from '../db/schema'

interface Props {
  db: IronProtocolDB
}

const TITLE = 'IRONPROTOCOL'
const CHARS = TITLE.split('')
const CHAR_DELAY = 0.055
const POST_TITLE_DELAY = CHARS.length * CHAR_DELAY

const PURPOSE_CHIPS: { value: PurposeChip; label: string }[] = [
  { value: 'strength',    label: 'Strength'    },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'fat-loss',    label: 'Fat Loss'    },
  { value: 'endurance',   label: 'Endurance'   },
  { value: 'health',      label: 'Health'      },
]

export default function IdentitySplash({ db }: Props) {
  const [name,        setName]        = useState('')
  const [northStar,   setNorthStar]   = useState('')
  const [purposeChip, setPurposeChip] = useState<PurposeChip | null>(null)
  const [qosMinutes,  setQosMinutes]  = useState(45)
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5>(3)
  const [submitting,  setSubmitting]  = useState(false)

  const canSubmit = name.trim().length > 0 && purposeChip !== null && !submitting

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    const existing = await db.settings.get(APP_SETTINGS_ID)
    await db.settings.put({
      id:                      APP_SETTINGS_ID,
      hasCompletedOnboarding:  existing?.hasCompletedOnboarding ?? false,
      preferredRoutineType:    existing?.preferredRoutineType   ?? 'PPL',
      daysPerWeek,
      userName:    name.trim(),
      northStar:   northStar.trim(),
      purposeChip,
      qosMinutes,
    })
    // useLiveQuery in HomePage reactively re-renders — no callback needed
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center gap-8 bg-navy px-6 pb-16 pt-16">

      {/* ── TextReveal: IRONPROTOCOL ──────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-[1px]" aria-label={TITLE}>
        {CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * CHAR_DELAY, duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
            className="text-4xl font-black tracking-tight text-white"
          >
            {char}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.1, duration: 0.4 }}
        className="text-center text-sm leading-relaxed text-electric/60"
      >
        Zero-friction progressive overload.
        <br />
        Identify yourself to initialize the engine.
      </motion.p>

      {/* ── Identity Form ─────────────────────────────────────────────────── */}
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: POST_TITLE_DELAY + 0.28, duration: 0.4 }}
        onSubmit={(e) => { void handleSubmit(e) }}
        className="flex w-full flex-col gap-4"
      >
        <div className="rounded-3xl bg-gradient-to-br from-pink/20 to-electric/20 p-[1px]">
          <div className="flex flex-col gap-5 rounded-3xl bg-navy-card p-5">

            {/* Call Sign ───────────────────────────────────────────────────── */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Call Sign
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={32}
                autoFocus
                className="w-full rounded-2xl border border-electric/20 bg-[#091020] px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 transition-colors focus:border-electric focus:outline-none"
              />
            </label>

            {/* North Star ──────────────────────────────────────────────────── */}
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                North Star
              </span>
              <textarea
                value={northStar}
                onChange={(e) => setNorthStar(e.target.value)}
                placeholder="Train to..."
                maxLength={140}
                rows={2}
                className="w-full resize-none rounded-2xl border border-electric/20 bg-[#091020] px-4 py-3 text-base font-bold text-white placeholder:text-zinc-600 transition-colors focus:border-electric focus:outline-none"
              />
            </label>

            {/* Purpose Chips ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Purpose
              </span>
              <div className="flex flex-wrap gap-2">
                {PURPOSE_CHIPS.map(({ value, label }) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={value}
                    type="button"
                    onClick={() => setPurposeChip(value)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-black transition-all ${
                      purposeChip === value
                        ? 'border-electric bg-electric/15 text-electric'
                        : 'border-electric/20 bg-[#091020] text-zinc-400 hover:border-electric/40'
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* QoS Slider ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                  Session Budget
                </span>
                <span className="text-sm font-black text-electric">{qosMinutes} min</span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={qosMinutes}
                onChange={(e) => setQosMinutes(Number(e.target.value))}
                className="w-full cursor-pointer appearance-none"
              />
              <div className="flex justify-between text-[10px] font-semibold text-zinc-600">
                <span>15 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Days / Week ─────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-electric/70">
                Training Days / Week
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 5] as const).map((d) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`rounded-2xl border py-3 text-sm font-black transition-all ${
                      daysPerWeek === d
                        ? 'border-electric bg-electric/15 text-electric'
                        : 'border-electric/20 bg-[#091020] text-zinc-400 hover:border-electric/40'
                    }`}
                  >
                    {d}×
                  </motion.button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!canSubmit}
          className="h-14 w-full cursor-pointer rounded-3xl bg-electric px-6 text-base font-black uppercase tracking-[0.12em] text-white shadow-[0_8px_24px_-8px_rgba(59,113,254,0.6)] transition-colors hover:bg-[#5585ff] active:bg-[#2860ee] disabled:cursor-not-allowed disabled:bg-blue-900/30 disabled:text-blue-900/50 disabled:shadow-none"
        >
          {submitting ? 'Initializing…' : 'Enter Protocol'}
        </motion.button>
      </motion.form>
    </main>
  )
}
```

- [ ] **Step 4: Run the IdentitySplash tests to confirm they pass**

```bash
npx vitest run src/test/IdentitySplash.test.tsx --reporter=verbose
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Run the full suite to confirm no regressions**

```bash
npx vitest run --reporter=verbose
```

Expected: All tests pass. Pay special attention to `UI.test.tsx` — the `HomePage` tests that set `userName: 'TestUser'` in settings will correctly bypass `IdentitySplash` (the `!onboardingRecord?.userName` gate in `HomePage.tsx:427`).

- [ ] **Step 6: Run the dev server and visually verify the onboarding form**

```bash
npm run dev
```

Open `http://localhost:5173` in the browser. Navigate to the onboarding screen (fresh state or clear IndexedDB from DevTools → Application → Storage). Verify:

1. Title "IRONPROTOCOL" reveals character-by-character ✓
2. Name input is autofocused ✓
3. North Star textarea accepts input ✓
4. Five purpose chips render; selected chip highlights in Electric Blue ✓
5. QoS slider moves 15–120 min; live label updates ✓
6. Days/Week 3×/4×/5× toggle works ✓
7. "Enter Protocol" button is disabled until name + purpose are set ✓
8. Submitting advances the app to the onboarding tour (OnboardingHero screen) ✓

- [ ] **Step 7: Commit**

```bash
git add src/components/IdentitySplash.tsx src/test/IdentitySplash.test.tsx
git commit -m "feat(onboarding): rebuild IdentitySplash with North Star, Purpose Chips, QoS Slider"
```

---

## Self-Review

**Spec coverage:**
- ✅ `src/index.css` `@theme` tokens — Task 1
- ✅ `src/db/schema.ts` v11 with `northStar`, `purposeChip`, `qosMinutes` — Task 2
- ✅ `IdentitySplash` Name field — Task 3
- ✅ `IdentitySplash` North Star textarea — Task 3
- ✅ `IdentitySplash` Purpose Chips (5) — Task 3
- ✅ `IdentitySplash` QoS Slider 15–120 min — Task 3
- ✅ Saves all fields to `user_settings` on submit — Task 3
- ✅ `hasCompletedOnboarding` stays `false` at this stage — Task 3, `handleSubmit`
- ✅ `tailwind.config.js` NOT created — v4 uses CSS, documented in spec

**Placeholder scan:** None found.

**Type consistency:**
- `PurposeChip` defined in `schema.ts` (Task 2), imported in `IdentitySplash.tsx` (Task 3) ✓
- `APP_SETTINGS_ID` imported from `schema.ts` in both component and test ✓
- `db.settings.put()` shape in `IdentitySplash.tsx` matches `AppSettings` interface including all new optional fields ✓
- Test assertions use the same field names as the interface (`northStar`, `purposeChip`, `qosMinutes`) ✓
