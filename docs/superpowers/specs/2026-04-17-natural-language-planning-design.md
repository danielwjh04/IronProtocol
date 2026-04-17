# Natural Language Planning System — Design Spec
**Date:** 2026-04-17
**Status:** Awaiting implementation plan

---

## Scope

This spec covers Sub-project 1 of the Natural Language Planning system:
backend foundation (Supabase), NLP planning engine, and frontend integration.

PWA installability and Capacitor native packaging are designed in Sections 5 and 8
of this spec. Their implementation plans will be written as separate sub-projects
after the backend and frontend layers are stable.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend / DB | Supabase (Auth + Postgres + pgvector) | One platform for auth, DB, vector search, and API — no CORS between services |
| API layer | Supabase Edge Functions (Deno) | API keys never in bundle — App Store compliant; globally distributed |
| Embeddings | Google `text-embedding-004` (768d) | Already using Gemini; same API key; strong retrieval quality |
| Plan templates | Hybrid: 50 seeded + Gemini fallback at confidence < 0.72 | Predictable latency + infinite flexibility for novel goals |
| Auth in bundle | Supabase anon key only | Designed to be public; RLS + service-role key in Edge Functions protect all data |

---

## 1. System Architecture

### Topology

```
┌─────────────────────────────────────┐
│  Capacitor shell (iOS / Android)    │
│  PWA fallback (browser install)     │
│                                     │
│  React 18 + Vite + Tailwind         │
│  ┌─────────────────────────────┐    │
│  │  planningService.ts         │    │
│  │  - AbortController          │    │
│  │  - 300ms debounce           │    │
│  │  - Dexie offline fallback   │    │
│  └────────────┬────────────────┘    │
└───────────────┼─────────────────────┘
                │ HTTPS + Supabase JWT
┌───────────────▼─────────────────────┐
│  Supabase Edge Functions (Deno)     │
│                                     │
│  POST /functions/v1/plans-query     │
│  POST /functions/v1/plans-swap      │
│  POST /functions/v1/plans-feedback  │
│                                     │
│  Secrets (never in bundle):         │
│  - GEMINI_API_KEY                   │
│  - SUPABASE_SERVICE_ROLE_KEY        │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│  Supabase Postgres + pgvector       │
│                                     │
│  exercises        (embedding 768d)  │
│  plan_templates   (embedding 768d)  │
│  user_profiles                      │
│  retrieval_feedback                 │
│                                     │
│  RLS: all tables row-locked by      │
│  auth.uid() — no app-level guards   │
└─────────────────────────────────────┘
```

### Query data flow

```
User types goal
  → 300ms debounce + AbortController created
  → POST /plans-query { goalText, JWT }
      → validate JWT → extract user_id
      → auto-hydrate user_profiles (injuries, equipment, experience)
      → parseIntent(goalText) via Gemini structured output
          → Zod validation → retry once on failure
      → buildRetrievalText(intent) → embed via text-embedding-004
      → SQL: hard filters first (safety_flags, equipment, experience)
             then ORDER BY embedding <=> $vec LIMIT 40 (templates)
             and  ORDER BY embedding <=> $vec LIMIT 120 (exercises)
      → rerank templates [semantic 0.45, goalFit 0.25,
                          progression 0.20, adherence 0.10]
      → if best score < 0.72 → Gemini generates template (hybrid fallback)
      → composePlan: slot-fill exercises by movementPattern + tier
          → usedIds set prevents duplicate exercises across slots
          → REP_SCHEMES[goal][tier] assigned to each slot
      → FINAL SAFETY SCAN: re-check every chosen exercise vs user safety_flags
          → any hit → throw, never silently pass
      → return { plan, confidence, rationale, safetyNotes }
  → Frontend stores in Dexie cachedPlans as lastSafePlan
  → On network failure: serve Dexie cache with "cached" badge
```

### Key invariants

1. `GEMINI_API_KEY` never in the Capacitor/PWA bundle — App Store compliant
2. Hard SQL filter runs before any vector ranking — injuries cannot be overridden by similarity score
3. Final safety scan after `composePlan` — defense in depth, second independent check
4. Dexie `lastSafePlan` always reflects last server-verified safe plan — offline users never get a blank state
5. `AbortController` ensures no stale responses update UI after a newer request fires
6. Duplicate exercises across plan slots are prevented by `usedIds` set in `composePlan`

---

## 2. Data Model

### `exercises`

```sql
id                uuid PK
name              text
movement_pattern  text  CHECK IN ('squat','hinge','push','pull','carry','core')
stimulus_tags     text[]
contraindications text[]  -- injury condition labels
safety_flags      text[]  -- biomechanical load flags e.g. ["low_back_load","high_impact"]
equipment         text[]
intensity_band    text  CHECK IN ('low','medium','high')
experience_level  text  CHECK IN ('beginner','intermediate','advanced')
tier              int   CHECK IN (1,2,3)
                        -- 1: primary compound (squat, bench, deadlift)
                        -- 2: secondary compound (lunge, dip, row)
                        -- 3: isolation (curl, raise, extension)
swap_group_id     text  -- interchangeable movement family
embedding         vector(768)
created_at        timestamptz
```

Hard SQL filter pattern (safety gate lives in SQL, not application code):

```sql
WITH user_flags AS (
  SELECT ARRAY_AGG(DISTINCT flag) AS excluded
  FROM user_profiles,
       jsonb_array_elements(persistent_injuries) AS inj,
       jsonb_array_elements_text(inj->'safety_flags') AS flag
  WHERE id = $userId
)
SELECT e.* FROM exercises e, user_flags uf
WHERE NOT (e.safety_flags && uf.excluded)
  AND (p_equipment = '{}' OR e.equipment && p_equipment)
ORDER BY e.embedding <=> $queryEmbedding
LIMIT 120
```

### `plan_templates`

```sql
id               uuid PK
split_type       text        -- PPL | Upper-Lower | Full Body | Push-Pull
goal_tags        text[]
duration_band    text        -- 30min | 45min | 60min | 75min | 90min
intensity_band   text  CHECK IN ('low','medium','high')
experience_level text  CHECK IN ('beginner','intermediate','advanced')
slots            jsonb       -- [{ movement_pattern, tier, intensity_band, rep_scheme }]
embedding        vector(768)
created_at       timestamptz
```

### `user_profiles`

```sql
id                  uuid PK → auth.users(id)
persistent_injuries jsonb    -- auto-hydrated server-side; client never sends injuries
                             -- [{ condition, safety_flags: string[], severity }]
equipment           text[]
experience_level    text
goals               text[]
days_per_week       int
minutes_per_session int
created_at          timestamptz
updated_at          timestamptz
```

Example `persistent_injuries`:
```json
[{ "condition": "knee_pain", "safety_flags": ["high_impact","deep_knee_flexion"], "severity": "moderate" }]
```

### `retrieval_feedback`

```sql
id                    uuid PK
user_id               uuid → auth.users(id)
plan_id               uuid → plan_templates(id)
accepted              boolean
swapped_from_exercise uuid → exercises(id)
swapped_to_exercise   uuid → exercises(id)
pain_flag             boolean
goal_tag              text
created_at            timestamptz
```

Swap signals aggregate into a materialized view the reranker reads:

```sql
CREATE MATERIALIZED VIEW exercise_swap_signals AS
SELECT
  swapped_from_exercise AS from_id,
  swapped_to_exercise   AS to_id,
  goal_tag,
  COUNT(*)                                      AS total_swaps,
  COUNT(*) FILTER (WHERE pain_flag = FALSE)     AS safe_swaps
FROM retrieval_feedback
WHERE swapped_from_exercise IS NOT NULL
GROUP BY from_id, to_id, goal_tag;
```

View refreshes via Postgres trigger every 50 new feedback rows per `(from_id, goal_tag)` pair — never blocks the feedback response.

### RLS policies

```sql
-- user_profiles: own row only
CREATE POLICY "own profile"  ON user_profiles      USING (id = auth.uid());
-- retrieval_feedback: own rows only
CREATE POLICY "own feedback" ON retrieval_feedback  USING (user_id = auth.uid());
-- exercises + plan_templates: readable by all authenticated users
CREATE POLICY "authenticated read" ON exercises     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated read" ON plan_templates FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 3. TypeScript Interfaces + API Contracts

### Shared types (`src/types/planning.ts`)

```typescript
type GoalKey = 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
type Tier = 1 | 2 | 3

interface RepScheme {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  rpe?: number
}

const REP_SCHEMES: Record<GoalKey, Record<Tier, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 180 },
    2: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 120 },
    3: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60  },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 300 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 300, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 180, rpe: 8 },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 120 },
  },
  fat_loss: {
    1: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60 },
    2: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 45 },
    3: { sets: 3, repsMin: 12, repsMax: 20, restSeconds: 30 },
  },
  endurance: {
    1: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 45 },
    2: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30 },
    3: { sets: 2, repsMin: 20, repsMax: 30, restSeconds: 20 },
  },
  recomp: {
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 120 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 90  },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60  },
  },
}

interface GoalIntent {
  goal: GoalKey
  injuries: string[]
  equipment: string[]
  daysPerWeek: number
  minutesPerSession: number
  experience: 'beginner' | 'intermediate' | 'advanced'
  swapPreference: 'low' | 'medium' | 'high'
}

interface ResolvedExercise {
  id: string
  name: string
  movementPattern: string
  tier: Tier
  equipment: string[]
  swapGroupId: string
  safetyFlags: string[]
  repScheme: RepScheme
}

interface ComposedPlan {
  templateId: string | 'gemini-generated'
  splitType: string
  confidence: number
  rationale: string
  safetyNotes: string[]
  exercises: ResolvedExercise[]
}

// POST /functions/v1/plans-query
interface QueryRequest  { goalText: string }
interface QueryResponse { plan: ComposedPlan }

// POST /functions/v1/plans-swap
interface SwapRequest {
  exerciseId: string
  reason: string
  currentPlanExerciseIds: string[]
}
interface SwapResponse {
  options: Array<{
    exercise: ResolvedExercise
    rationale: string
    repScheme: RepScheme
  }>
}

// POST /functions/v1/plans-feedback
interface FeedbackRequest {
  planId: string
  accepted: boolean
  swappedFromExerciseId?: string
  swappedToExerciseId?: string
  painFlag: boolean
  goalTag: string
}
interface FeedbackResponse { ok: true }
```

---

## 4. Edge Function Skeletons

### `supabase/functions/plans-query/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3'

const intentSchema = z.object({
  goal: z.enum(['fat_loss','hypertrophy','strength','endurance','recomp','power']),
  daysPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(15).max(120),
  experience: z.enum(['beginner','intermediate','advanced']),
  swapPreference: z.enum(['low','medium','high']),
})

const CONFIDENCE_FALLBACK_THRESHOLD = 0.72

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { goalText } = await req.json()

  // Auto-hydrate — client never sends injury data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persistent_injuries, equipment, experience_level, days_per_week, minutes_per_session')
    .eq('id', user.id).single()

  const rawIntent = await parseIntentWithGemini(goalText, profile)
  const intent = intentSchema.parse(rawIntent)

  const injuries: string[] = (profile?.persistent_injuries ?? [])
    .flatMap((inj: { safety_flags: string[] }) => inj.safety_flags)

  const queryVec = await embedText(buildRetrievalText(intent, profile))

  const { data: templates } = await supabase.rpc('search_plan_templates', {
    query_embedding: queryVec,
    p_experience: intent.experience,
    p_max_minutes: intent.minutesPerSession,
    top_k: 40,
  })

  const { data: exercises } = await supabase.rpc('search_safe_exercises', {
    query_embedding: queryVec,
    p_user_id: user.id,
    p_equipment: profile?.equipment ?? [],
    top_k: 120,
  })

  const ranked = rerank(templates, intent)
  const bestScore = ranked[0]?.score ?? 0

  const template = bestScore >= CONFIDENCE_FALLBACK_THRESHOLD
    ? ranked[0]
    : await generateTemplateWithGemini(intent)

  const plan = composePlan(template, exercises, intent)

  // Defense in depth — final safety scan
  const violation = plan.exercises.find(ex =>
    ex.safetyFlags.some(f => injuries.includes(f))
  )
  if (violation) throw new Error(`Safety violation: ${violation.name}`)

  return json({ plan })
})
```

### `supabase/functions/plans-swap/index.ts`

```typescript
serve(async (req) => {
  // auth (same pattern)...

  const { exerciseId, reason, currentPlanExerciseIds }: SwapRequest = await req.json()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persistent_injuries, equipment')
    .eq('id', user.id).single()

  const excludedFlags: string[] = (profile?.persistent_injuries ?? [])
    .flatMap((inj: { safety_flags: string[] }) => inj.safety_flags)

  const { data: current } = await supabase
    .from('exercises')
    .select('swap_group_id, intensity_band, tier, embedding')
    .eq('id', exerciseId).single()

  const { data: candidates } = await supabase.rpc('find_swap_candidates', {
    p_swap_group_id:       current.swap_group_id,
    p_intensity_band:      current.intensity_band,
    p_tier:                current.tier,
    p_excluded_flags:      excludedFlags,
    p_equipment:           profile?.equipment ?? [],
    p_exclude_ids:         [exerciseId, ...currentPlanExerciseIds],
    query_embedding:       current.embedding,
    top_k:                 10,
  })

  const { data: signals } = await supabase
    .from('exercise_swap_signals')
    .select('to_id, safe_swaps')
    .eq('from_id', exerciseId)
    .order('safe_swaps', { ascending: false })

  const boosted = applyCrowdSignal(candidates, signals).slice(0, 5)

  return json({
    options: boosted.map(ex => ({
      exercise: ex,
      rationale: buildSwapRationale(ex, reason),
      repScheme: ex.repScheme,
    }))
  })
})
```

### `supabase/functions/plans-feedback/index.ts`

```typescript
serve(async (req) => {
  // auth...
  const body: FeedbackRequest = await req.json()

  await supabase.from('retrieval_feedback').insert({
    user_id:               user.id,
    plan_id:               body.planId,
    accepted:              body.accepted,
    swapped_from_exercise: body.swappedFromExerciseId ?? null,
    swapped_to_exercise:   body.swappedToExerciseId ?? null,
    pain_flag:             body.painFlag,
    goal_tag:              body.goalTag,
  })

  // View refresh handled by Postgres trigger — not inline
  return json({ ok: true })
})
```

---

## 5. Frontend Integration

### New files

```
src/
  lib/supabaseClient.ts
  services/planningService.ts
  hooks/useNaturalPlanSearch.ts
  components/
    NaturalPlanSearch.tsx
    SwapOptionsDrawer.tsx
    PlanConfidenceBadge.tsx
  types/planning.ts
  db/schema.ts              ← extend to V15: cachedPlans table
```

### `src/lib/supabaseClient.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

### `src/services/planningService.ts`

```typescript
import { supabase } from '../lib/supabaseClient'
import { db } from '../db/db'
import type { ComposedPlan, SwapResponse, FeedbackRequest } from '../types/planning'

let activeAbort: AbortController | null = null

export async function queryPlan(goalText: string): Promise<ComposedPlan> {
  activeAbort?.abort()
  activeAbort = new AbortController()

  try {
    const { data, error } = await supabase.functions.invoke('plans-query', {
      body: { goalText },
      signal: activeAbort.signal,
    })
    if (error) throw error

    await db.cachedPlans.put({
      id: 'latest', plan: data.plan, goalText, cachedAt: Date.now(), isOffline: false,
    })
    return data.plan
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    const cached = await db.cachedPlans.get('latest')
    if (cached) return { ...cached.plan, _fromCache: true }
    throw err
  }
}

export async function swapExercise(
  exerciseId: string,
  reason: string,
  currentPlanExerciseIds: string[],
): Promise<SwapResponse> {
  const { data, error } = await supabase.functions.invoke('plans-swap', {
    body: { exerciseId, reason, currentPlanExerciseIds },
  })
  if (error) throw error
  return data
}

export async function submitFeedback(payload: FeedbackRequest): Promise<void> {
  await supabase.functions.invoke('plans-feedback', { body: payload })
}
```

### `src/hooks/useNaturalPlanSearch.ts`

```typescript
import { useState, useCallback, useRef } from 'react'
import { queryPlan } from '../services/planningService'
import type { ComposedPlan } from '../types/planning'

interface SearchState {
  plan: ComposedPlan | null
  loading: boolean
  error: string | null
  fromCache: boolean
}

export function useNaturalPlanSearch() {
  const [state, setState] = useState<SearchState>({
    plan: null, loading: false, error: null, fromCache: false,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((goalText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!goalText.trim()) return

    setState(s => ({ ...s, loading: true, error: null }))

    debounceRef.current = setTimeout(async () => {
      try {
        const plan = await queryPlan(goalText)
        setState({
          plan,
          loading: false,
          error: null,
          fromCache: !!(plan as ComposedPlan & { _fromCache?: boolean })._fromCache,
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setState(s => ({ ...s, loading: false, error: 'Search failed. Check connection.' }))
      }
    }, 300)
  }, [])

  return { ...state, search }
}
```

### `NaturalPlanSearch.tsx` — swap flow

```typescript
const [swapTarget, setSwapTarget] = useState<{
  exerciseId: string
  options: SwapResponse['options']
} | null>(null)

// On swap button press:
const result = await swapExercise(ex.id, 'user requested', plan.exercises.map(e => e.id))
setSwapTarget({ exerciseId: ex.id, options: result.options })

// SwapOptionsDrawer commits chosen option:
onSelect={(chosen) => {
  updatePlanExercise(swapTarget.exerciseId, chosen.exercise)
  submitFeedback({
    planId: plan.templateId,
    accepted: true,
    swappedFromExerciseId: swapTarget.exerciseId,
    swappedToExerciseId: chosen.exercise.id,
    painFlag: false,
    goalTag: intent.goal,
  })
  setSwapTarget(null)
}}
```

Each exercise card displays rep scheme:
```typescript
<p className="text-xs text-zinc-400 mt-1">
  {ex.repScheme.sets} × {ex.repScheme.repsMin}–{ex.repScheme.repsMax} reps
  · {ex.repScheme.restSeconds}s rest
  {ex.repScheme.rpe ? ` · RPE ${ex.repScheme.rpe}` : ''}
</p>
```

### Dexie V15 extension

```typescript
export interface CachedPlan {
  id: 'latest'
  plan: ComposedPlan
  goalText: string
  cachedAt: number
  isOffline: boolean
}

// In IronProtocolDB:
cachedPlans!: Table<CachedPlan>

// Version bump:
.version(15).stores({ ...existingV14Stores, cachedPlans: 'id' })
```

---

## 6. PWA + Capacitor

### `vite.config.ts` additions

```typescript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Iron Protocol',
    short_name: 'IronProtocol',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0E1A',
    theme_color: '#3B71FE',
    icons: [
      { src: 'icons/icon-192.png',          sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png',          sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    runtimeCaching: [
      { urlPattern: /supabase\.co\/functions\//, handler: 'NetworkOnly' },
      { urlPattern: /supabase\.co\/storage\//,  handler: 'CacheFirst',
        options: { cacheName: 'supabase-storage', expiration: { maxAgeSeconds: 86400 } } },
    ],
  },
})
```

### `capacitor.config.ts`

```typescript
const config: CapacitorConfig = {
  appId: 'com.ironprotocol.app',
  appName: 'Iron Protocol',
  webDir: 'dist',
  plugins: {
    SplashScreen: { launchShowDuration: 2000, backgroundColor: '#0A0E1A', showSpinner: false },
  },
}
```

### Environment strategy

```bash
.env.development  → VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (dev project)
.env.staging      → (staging project)
.env.production   → (prod project)
```

Both values are safe in the bundle. All secrets live in Supabase Edge Function environment only.

### Build pipeline

```bash
npm run build && npx cap sync
npx cap open ios      # → Xcode → Archive → App Store Connect
npx cap open android  # → Android Studio → Signed Bundle → Play Console
```

---

## 7. Database Migrations

### File layout

```
supabase/migrations/
  20260417000001_enable_pgvector.sql
  20260417000002_create_planning_tables.sql
  20260417000003_rls_policies.sql
  20260417000004_rpc_functions.sql
  20260417000005_swap_signals_view.sql
supabase/seed/
  seed_plan_templates.ts
  generate_embeddings.ts
```

### Migration 1 — pgvector

```sql
create extension if not exists vector with schema extensions;
```

### Migration 2 — tables

```sql
create table exercises (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  movement_pattern  text not null check (movement_pattern in ('squat','hinge','push','pull','carry','core')),
  stimulus_tags     text[]  not null default '{}',
  contraindications text[]  not null default '{}',
  safety_flags      text[]  not null default '{}',
  equipment         text[]  not null default '{}',
  intensity_band    text    not null check (intensity_band in ('low','medium','high')),
  experience_level  text    not null check (experience_level in ('beginner','intermediate','advanced')),
  tier              int     not null check (tier in (1,2,3)),
  swap_group_id     text    not null,
  embedding         vector(768),
  created_at        timestamptz default now()
);

create table plan_templates (
  id               uuid primary key default gen_random_uuid(),
  split_type       text    not null,
  goal_tags        text[]  not null default '{}',
  duration_band    text    not null,
  intensity_band   text    not null check (intensity_band in ('low','medium','high')),
  experience_level text    not null check (experience_level in ('beginner','intermediate','advanced')),
  slots            jsonb   not null default '[]',
  embedding        vector(768),
  created_at       timestamptz default now()
);

create table user_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  persistent_injuries jsonb   not null default '[]',
  equipment           text[]  not null default '{}',
  experience_level    text    not null default 'beginner',
  goals               text[]  not null default '{}',
  days_per_week       int              default 3,
  minutes_per_session int              default 45,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table retrieval_feedback (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  plan_id               uuid references plan_templates(id),
  accepted              boolean not null default true,
  swapped_from_exercise uuid references exercises(id),
  swapped_to_exercise   uuid references exercises(id),
  pain_flag             boolean not null default false,
  goal_tag              text,
  created_at            timestamptz default now()
);

create index on exercises      using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on plan_templates using ivfflat (embedding vector_cosine_ops) with (lists = 50);
```

### Migration 4 — RPC functions

```sql
create or replace function search_plan_templates(
  query_embedding vector(768), p_experience text, p_max_minutes int, top_k int default 40
) returns table (id uuid, split_type text, goal_tags text[], slots jsonb,
                 intensity_band text, similarity float)
language sql stable as $$
  select id, split_type, goal_tags, slots, intensity_band,
         1 - (embedding <=> query_embedding) as similarity
  from plan_templates
  where experience_level = p_experience
    and duration_band <= p_max_minutes::text
  order by embedding <=> query_embedding limit top_k;
$$;

create or replace function search_safe_exercises(
  query_embedding vector(768), p_user_id uuid, p_equipment text[], top_k int default 120
) returns table (id uuid, name text, movement_pattern text, tier int,
                 safety_flags text[], equipment text[], intensity_band text,
                 swap_group_id text, similarity float)
language plpgsql stable as $$
declare excluded_flags text[];
begin
  select array_agg(distinct flag) into excluded_flags
  from user_profiles, jsonb_array_elements(persistent_injuries) as inj,
       jsonb_array_elements_text(inj->'safety_flags') as flag
  where id = p_user_id;
  excluded_flags := coalesce(excluded_flags, '{}');

  return query
  select e.id, e.name, e.movement_pattern, e.tier,
         e.safety_flags, e.equipment, e.intensity_band, e.swap_group_id,
         1 - (e.embedding <=> query_embedding) as similarity
  from exercises e
  where not (e.safety_flags && excluded_flags)
    and (p_equipment = '{}' or e.equipment && p_equipment)
  order by e.embedding <=> query_embedding limit top_k;
end; $$;

create or replace function find_swap_candidates(
  p_swap_group_id text, p_intensity_band text, p_tier int,
  p_excluded_flags text[], p_equipment text[], p_exclude_ids uuid[],
  query_embedding vector(768), top_k int default 10
) returns table (id uuid, name text, movement_pattern text, tier int,
                 safety_flags text[], equipment text[], swap_group_id text, similarity float)
language sql stable as $$
  select e.id, e.name, e.movement_pattern, e.tier,
         e.safety_flags, e.equipment, e.swap_group_id,
         1 - (e.embedding <=> query_embedding) as similarity
  from exercises e
  where e.swap_group_id  = p_swap_group_id
    and e.intensity_band = p_intensity_band
    and e.tier           = p_tier
    and not (e.id = any(p_exclude_ids))
    and not (e.safety_flags && p_excluded_flags)
    and (p_equipment = '{}' or e.equipment && p_equipment)
  order by e.embedding <=> query_embedding limit top_k;
$$;
```

### Migration 5 — swap signals view + refresh trigger

```sql
create materialized view exercise_swap_signals as
select swapped_from_exercise as from_id, swapped_to_exercise as to_id, goal_tag,
       count(*) as total_swaps,
       count(*) filter (where pain_flag = false) as safe_swaps
from retrieval_feedback
where swapped_from_exercise is not null and swapped_to_exercise is not null
group by from_id, to_id, goal_tag;

create unique index on exercise_swap_signals (from_id, to_id, goal_tag);

create or replace function maybe_refresh_swap_signals() returns trigger language plpgsql as $$
declare pair_count int;
begin
  select count(*) into pair_count from retrieval_feedback
  where swapped_from_exercise = new.swapped_from_exercise and goal_tag = new.goal_tag;
  if pair_count % 50 = 0 then
    refresh materialized view concurrently exercise_swap_signals;
  end if;
  return new;
end; $$;

create trigger refresh_swap_signals_trigger
after insert on retrieval_feedback for each row
when (new.swapped_from_exercise is not null)
execute function maybe_refresh_swap_signals();
```

### Seed + embedding generation

`generate_embeddings.ts` uses the same canonical format for both documents and queries:

```typescript
// Templates: "Goal: hypertrophy | Split: PPL | Intensity: high | Duration: 60min | Experience: intermediate"
// Exercises: "Exercise: Bench Press | Pattern: push | Tags: chest, triceps | Equipment: barbell | Intensity: high"
```

Canonical format alignment is what makes cosine similarity meaningful.

---

## 8. Test Plan

### Unit tests

```typescript
// planningService: abort, Dexie fallback, cache write, AbortError not stored
// useNaturalPlanSearch: debounce, loading states, fromCache flag, AbortError ignored
// rerank: weights sum to 1.0, sorted descending, empty input handled
// composePlan: slot filling by pattern+tier, usedIds deduplication, throws on empty pool
// parseIntent: Zod validation, single retry, throws after two failures
// REP_SCHEMES: every goal × tier combination has a valid RepScheme
```

### Integration tests (Supabase test project)

```typescript
// plans-query: 401 on missing JWT, 200 on valid auth, auto-hydrates injuries,
//              equipment filter respected, Gemini fallback at low confidence,
//              p95 < 800ms on warm function
// plans-swap: same swap_group_id, same tier, same intensity_band,
//             no excluded safety_flags, no currentPlanExerciseIds in options,
//             crowd signal boosts high safe_swaps candidate
// RLS: user A cannot read user B profile or feedback, unauthenticated rejected
```

### Safety tests — CI gate, blocks merge

```typescript
// Exercise with safety_flag matching user injury never appears — even at highest cosine similarity
// composePlan only receives pre-filtered pool — flagged exercises cannot re-enter
// Final safety scan throws before response when violation reaches composePlan output
// pain_flag feedback does not increase safe_swaps — injury exclusion remains static
// composePlan throws rather than returning partial plan when pool is empty for a slot
// hypertrophy T1: repsMin=5, repsMax=8, restSeconds=180
// hypertrophy T3: repsMin=12, repsMax=15, restSeconds=60
// power T1: repsMin=3, repsMax=5, restSeconds=300
// power T2/T3: repsMin=5, repsMax=8
// strength T1: repsMin=1, repsMax=5, restSeconds=300
// swap options for T1 slot never contain T2 or T3 exercises
```

### E2E (Playwright)

```typescript
// User types goal → plan renders with rep schemes visible
// Swap button opens drawer with 3–5 options, no option id in current plan
// Selecting swap option updates plan, sends feedback, closes drawer
// Offline mode: cached plan renders with "Cached plan" badge
// Install prompt visible on first visit (non-standalone)
// Use This Plan sends accepted:true feedback
// Not For Me sends accepted:false feedback
```

### CI order

```yaml
safety      → unit → integration → e2e
```

Safety tests run first and block all downstream jobs.

---

## 9. Deployment Checklist

### Pre-deploy

- [ ] Supabase prod project created, pgvector enabled
- [ ] Edge Function secrets set: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.production` confirmed (anon key only)
- [ ] All 5 migrations applied: `supabase db push`
- [ ] RLS verified on all 4 tables
- [ ] IVFFlat indexes confirmed
- [ ] Seed templates run, embedding nulls = 0
- [ ] All 3 Edge Functions deployed and smoke-tested
- [ ] `plans-query` p95 < 800ms (10 warm requests)
- [ ] PWA build: Lighthouse PWA score ≥ 90, offline shell verified
- [ ] Capacitor sync complete, tested on physical device (iOS + Android)
- [ ] Privacy policy live: states "training guidance only, not medical advice"

### Deployment order

```
1. supabase db push
2. seed_plan_templates.ts
3. generate_embeddings.ts
4. supabase functions deploy plans-query plans-swap plans-feedback
5. npm run build → deploy dist/
6. npx cap sync → iOS TestFlight → App Store
7. npx cap sync → Android internal track → Play Console
```

---

## 10. Rollback Plan

| Layer | Mechanism | Recovery time |
|---|---|---|
| Edge Functions | Redeploy previous version from Supabase dashboard | < 2 min |
| Frontend / PWA | Vercel/Netlify instant rollback | < 1 min |
| Migrations | Run down migration scripts manually | 5–10 min |
| Android | Halt Play Console rollout before 100% | < 30 min |
| iOS | Submit hotfix as new version | Hours–days |

### Down migrations

```sql
-- 20260417000002_down.sql
drop table if exists retrieval_feedback;
drop table if exists user_profiles;
drop table if exists plan_templates;
drop table if exists exercises;

-- 20260417000005_down.sql
drop materialized view if exists exercise_swap_signals;
drop trigger if exists refresh_swap_signals_trigger on retrieval_feedback;
drop function if exists maybe_refresh_swap_signals();
```

### Feature flag safety

The NL planning system is additive — new route, new service, new Dexie table. Removing the `NaturalPlanSearch` route from the router in a hotfix deploy hides the feature without touching `ActiveLogger` or any existing write paths. The Dexie V15 `cachedPlans` table is inert when the route is hidden.

---

## Assumptions

1. Auth is net-new — no existing auth system in the codebase
2. `seedExercises.ts` data will be migrated into the new `exercises` table with `tier`, `safety_flags`, and `swap_group_id` columns added manually during seed
3. PWA icons will be created as a separate design task
4. Capacitor submission (App Store / Play Store accounts, certificates) is handled outside this spec
5. `duration_band` on `plan_templates` is stored as a string (`"45min"`) and compared lexicographically — a numeric column is preferred if template count grows beyond 50
