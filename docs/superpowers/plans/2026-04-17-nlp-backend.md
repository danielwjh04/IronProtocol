# NLP Planning — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Supabase backend — migrations, exercise seed, plan template seed, embeddings, and three Edge Functions — so `POST /functions/v1/plans-query`, `plans-swap`, and `plans-feedback` are live and tested.

**Architecture:** Supabase Postgres + pgvector stores exercises and plan templates as 768-dim embeddings. Three Deno Edge Functions handle query (intent parse → embed → SQL hard-filter → vector search → rerank → composePlan → safety scan), swap (candidates by swap_group_id + tier, crowd signal boost, top-5 options, no duplicates), and feedback (insert row, trigger-driven materialized view refresh). All Gemini API calls happen server-side — the key never leaves the Edge Function environment.

**Tech Stack:** Supabase CLI, Postgres + pgvector, Deno (Edge Functions), Google `text-embedding-004`, Gemini 2.5 Flash, Zod (Deno ESM), `@supabase/supabase-js` v2, `tsx` for seed scripts.

**Graph alignment:**
- `GOAL_TIER_PRESCRIPTIONS` and `REST_SECONDS_BY_GOAL_AND_TIER` in `src/planner/autoPlanner.ts` are the source of truth for rep/rest values. The `REP_SCHEMES` constant in Edge Functions must match these exactly for Hypertrophy and Power.
- 54 exercises in `src/db/seedExercises.ts` are the source for the Supabase `exercises` table — same data, new columns added (`movement_pattern`, `safety_flags`, `equipment`, `intensity_band`, `experience_level`, `swap_group_id`).
- `SemanticSwapDrawer` pattern (existing) informs the swap response shape — return ranked options, not a single result.

---

## File Structure

```
supabase/
  migrations/
    20260417000001_enable_pgvector.sql      ← new
    20260417000002_create_planning_tables.sql ← new
    20260417000003_rls_policies.sql         ← new
    20260417000004_rpc_functions.sql        ← new
    20260417000005_swap_signals_view.sql    ← new
  seed/
    seed_exercises.ts                       ← new (migrate from src/db/seedExercises.ts)
    seed_plan_templates.ts                  ← new (50 canonical templates)
    generate_embeddings.ts                  ← new
  functions/
    _shared/
      auth.ts                               ← new (JWT validation helper)
      gemini.ts                             ← new (embedText + parseIntent)
      repSchemes.ts                         ← new (REP_SCHEMES constant)
      composePlan.ts                        ← new (slot-filling algorithm)
      rerank.ts                             ← new (weighted reranker)
    plans-query/
      index.ts                              ← new
    plans-swap/
      index.ts                              ← new
    plans-feedback/
      index.ts                              ← new
    _tests/
      safety.test.ts                        ← new (CI gate — runs first)
      plans-query.test.ts                   ← new
      plans-swap.test.ts                    ← new
      plans-feedback.test.ts                ← new
  .env.test                                 ← new (test project credentials)
.env.development                            ← new
.env.staging                                ← new
.env.production                             ← new
```

**Files NOT touched:** `src/planner/autoPlanner.ts`, `src/components/ActiveLogger.tsx`, `src/db/schema.ts` (V14), any existing test files.

---

## Corrected REP_SCHEMES (graph-aligned)

`REST_SECONDS_BY_GOAL_AND_TIER` in `autoPlanner.ts` (lines 58–69) defines: Hypertrophy T1=90s, T2/T3=60s; Power T1=180s, T2/T3=90s. The spec had incorrect rest values. All tasks use these corrected values.

User-confirmed rep ranges:
- Hypertrophy T1: 5–8 (bench, squat)
- Hypertrophy T2/T3: 8–12 (secondary compounds, isolations like bicep curl)
- Power T1: 3–5 (heavy compounds)
- Power T2/T3: 5–8

---

### Task 1: Supabase CLI + environment config

**Files:**
- Create: `.env.development`
- Create: `.env.staging`
- Create: `.env.production`
- Create: `supabase/.env.test`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install --save-dev supabase
npx supabase --version
```
Expected output: `1.x.x` or higher.

- [ ] **Step 2: Log in and link project**

```bash
npx supabase login
npx supabase init
```
Creates `supabase/` directory with `config.toml`.

- [ ] **Step 3: Create environment files**

`.env.development`:
```bash
VITE_SUPABASE_URL=https://<dev-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<dev-anon-key>
```

`.env.production`:
```bash
VITE_SUPABASE_URL=https://<prod-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>
```

`supabase/.env.test` (used by Deno test runner — never commit):
```bash
SUPABASE_URL=https://<dev-project-ref>.supabase.co
SUPABASE_ANON_KEY=<dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<dev-service-role-key>
GEMINI_API_KEY=<your-gemini-key>
```

Add to `.gitignore`:
```
supabase/.env.test
.env.production
.env.staging
```

- [ ] **Step 4: Set Edge Function secrets on dev project**

```bash
npx supabase secrets set --env-file supabase/.env.test
```
Expected: `Finished supabase secrets set`.

- [ ] **Step 5: Commit**

```bash
git add .env.development .gitignore supabase/config.toml
git commit -m "chore(supabase): init CLI config and environment files"
```

---

### Task 2: Migrations 1–2 — pgvector + planning tables

**Files:**
- Create: `supabase/migrations/20260417000001_enable_pgvector.sql`
- Create: `supabase/migrations/20260417000002_create_planning_tables.sql`

- [ ] **Step 1: Write migration 1**

`supabase/migrations/20260417000001_enable_pgvector.sql`:
```sql
create extension if not exists vector with schema extensions;
```

- [ ] **Step 2: Write migration 2**

`supabase/migrations/20260417000002_create_planning_tables.sql`:
```sql
create table exercises (
  id                uuid        primary key default gen_random_uuid(),
  name              text        not null,
  movement_pattern  text        not null
    check (movement_pattern in ('squat','hinge','push','pull','carry','core')),
  stimulus_tags     text[]      not null default '{}',
  contraindications text[]      not null default '{}',
  safety_flags      text[]      not null default '{}',
  equipment         text[]      not null default '{}',
  intensity_band    text        not null
    check (intensity_band in ('low','medium','high')),
  experience_level  text        not null
    check (experience_level in ('beginner','intermediate','advanced')),
  tier              int         not null check (tier in (1,2,3)),
  swap_group_id     text        not null,
  embedding         vector(768),
  created_at        timestamptz default now()
);

create table plan_templates (
  id               uuid        primary key default gen_random_uuid(),
  split_type       text        not null,
  goal_tags        text[]      not null default '{}',
  duration_minutes int         not null,
  intensity_band   text        not null
    check (intensity_band in ('low','medium','high')),
  experience_level text        not null
    check (experience_level in ('beginner','intermediate','advanced')),
  slots            jsonb       not null default '[]',
  embedding        vector(768),
  created_at       timestamptz default now()
);

create table user_profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  persistent_injuries jsonb       not null default '[]',
  equipment           text[]      not null default '{}',
  experience_level    text        not null default 'beginner',
  goals               text[]      not null default '{}',
  days_per_week       int                  default 3,
  minutes_per_session int                  default 45,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table retrieval_feedback (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  plan_id               uuid        references plan_templates(id),
  accepted              boolean     not null default true,
  swapped_from_exercise uuid        references exercises(id),
  swapped_to_exercise   uuid        references exercises(id),
  pain_flag             boolean     not null default false,
  goal_tag              text,
  created_at            timestamptz default now()
);

create index on exercises      using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on plan_templates using ivfflat (embedding vector_cosine_ops) with (lists = 50);
```

Note: `duration_band` (text) is replaced with `duration_minutes` (int) to avoid lexicographic comparison bugs flagged in the spec assumptions.

- [ ] **Step 3: Apply migrations to dev project**

```bash
npx supabase db push
```
Expected: `Applying migration 20260417000001... ok`, `Applying migration 20260417000002... ok`.

- [ ] **Step 4: Verify tables exist**

```bash
npx supabase db execute --sql "select table_name from information_schema.tables where table_schema = 'public' order by table_name;"
```
Expected output includes: `exercises`, `plan_templates`, `retrieval_feedback`, `user_profiles`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add pgvector + planning tables migration"
```

---

### Task 3: Migration 3 — RLS policies

**Files:**
- Create: `supabase/migrations/20260417000003_rls_policies.sql`

- [ ] **Step 1: Write migration**

```sql
alter table user_profiles      enable row level security;
alter table retrieval_feedback enable row level security;
alter table exercises          enable row level security;
alter table plan_templates     enable row level security;

-- Users can only read/write their own profile
create policy "own profile"
  on user_profiles for all
  using (id = auth.uid());

-- Users can only read/write their own feedback
create policy "own feedback"
  on retrieval_feedback for all
  using (user_id = auth.uid());

-- Exercises readable by any authenticated user
create policy "authenticated read exercises"
  on exercises for select
  using (auth.role() = 'authenticated');

-- Templates readable by any authenticated user
create policy "authenticated read templates"
  on plan_templates for select
  using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```
Expected: `Applying migration 20260417000003... ok`.

- [ ] **Step 3: Verify RLS blocks unauthenticated access**

```bash
npx supabase db execute --sql "set role anon; select count(*) from exercises;"
```
Expected: `ERROR: permission denied for table exercises` or `0` rows (RLS active).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260417000003_rls_policies.sql
git commit -m "feat(db): add RLS policies — per-user isolation"
```

---

### Task 4: Migration 4 — RPC functions

**Files:**
- Create: `supabase/migrations/20260417000004_rpc_functions.sql`

- [ ] **Step 1: Write the three RPC functions**

```sql
-- search_plan_templates: filter by experience + max duration, then cosine ANN
create or replace function search_plan_templates(
  query_embedding  vector(768),
  p_experience     text,
  p_max_minutes    int,
  top_k            int default 40
)
returns table (
  id               uuid,
  split_type       text,
  goal_tags        text[],
  slots            jsonb,
  intensity_band   text,
  duration_minutes int,
  similarity       float
)
language sql stable as $$
  select
    id, split_type, goal_tags, slots, intensity_band, duration_minutes,
    1 - (embedding <=> query_embedding) as similarity
  from plan_templates
  where experience_level = p_experience
    and duration_minutes <= p_max_minutes
  order by embedding <=> query_embedding
  limit top_k;
$$;

-- search_safe_exercises: derive excluded safety flags from user profile, hard filter, then cosine ANN
create or replace function search_safe_exercises(
  query_embedding  vector(768),
  p_user_id        uuid,
  p_equipment      text[],
  top_k            int default 120
)
returns table (
  id               uuid,
  name             text,
  movement_pattern text,
  tier             int,
  safety_flags     text[],
  equipment        text[],
  intensity_band   text,
  swap_group_id    text,
  similarity       float
)
language plpgsql stable as $$
declare
  excluded_flags text[];
begin
  select array_agg(distinct flag)
  into   excluded_flags
  from   user_profiles up,
         jsonb_array_elements(up.persistent_injuries) as inj,
         jsonb_array_elements_text(inj->'safety_flags') as flag
  where  up.id = p_user_id;

  excluded_flags := coalesce(excluded_flags, '{}');

  return query
  select
    e.id, e.name, e.movement_pattern, e.tier,
    e.safety_flags, e.equipment, e.intensity_band, e.swap_group_id,
    1 - (e.embedding <=> query_embedding) as similarity
  from   exercises e
  where  not (e.safety_flags && excluded_flags)
    and  (p_equipment = '{}' or e.equipment && p_equipment)
  order  by e.embedding <=> query_embedding
  limit  top_k;
end;
$$;

-- find_swap_candidates: same swap group + tier + intensity, no excluded flags, no current plan exercises
create or replace function find_swap_candidates(
  p_swap_group_id  text,
  p_intensity_band text,
  p_tier           int,
  p_excluded_flags text[],
  p_equipment      text[],
  p_exclude_ids    uuid[],
  query_embedding  vector(768),
  top_k            int default 10
)
returns table (
  id               uuid,
  name             text,
  movement_pattern text,
  tier             int,
  safety_flags     text[],
  equipment        text[],
  swap_group_id    text,
  similarity       float
)
language sql stable as $$
  select
    e.id, e.name, e.movement_pattern, e.tier,
    e.safety_flags, e.equipment, e.swap_group_id,
    1 - (e.embedding <=> query_embedding) as similarity
  from   exercises e
  where  e.swap_group_id  = p_swap_group_id
    and  e.intensity_band = p_intensity_band
    and  e.tier           = p_tier
    and  not (e.id = any(p_exclude_ids))
    and  not (e.safety_flags && p_excluded_flags)
    and  (p_equipment = '{}' or e.equipment && p_equipment)
  order  by e.embedding <=> query_embedding
  limit  top_k;
$$;
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```
Expected: `Applying migration 20260417000004... ok`.

- [ ] **Step 3: Smoke-test RPC with empty data**

```bash
npx supabase db execute --sql "select * from search_plan_templates('[0.1, 0.2]'::vector(768), 'beginner', 60, 5);"
```
Expected: empty result set (no data yet), no SQL error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260417000004_rpc_functions.sql
git commit -m "feat(db): add vector search RPC functions with hard safety filters"
```

---

### Task 5: Migration 5 — swap signals view + refresh trigger

**Files:**
- Create: `supabase/migrations/20260417000005_swap_signals_view.sql`

- [ ] **Step 1: Write migration**

```sql
create materialized view exercise_swap_signals as
select
  swapped_from_exercise                              as from_id,
  swapped_to_exercise                                as to_id,
  goal_tag,
  count(*)                                           as total_swaps,
  count(*) filter (where pain_flag = false)          as safe_swaps
from   retrieval_feedback
where  swapped_from_exercise is not null
  and  swapped_to_exercise   is not null
group  by from_id, to_id, goal_tag;

create unique index on exercise_swap_signals (from_id, to_id, goal_tag);

create or replace function maybe_refresh_swap_signals()
returns trigger language plpgsql as $$
declare
  pair_count int;
begin
  select count(*) into pair_count
  from   retrieval_feedback
  where  swapped_from_exercise = new.swapped_from_exercise
    and  goal_tag              = new.goal_tag;

  if pair_count % 50 = 0 then
    refresh materialized view concurrently exercise_swap_signals;
  end if;

  return new;
end;
$$;

create trigger refresh_swap_signals_trigger
after insert on retrieval_feedback
for each row
when (new.swapped_from_exercise is not null)
execute function maybe_refresh_swap_signals();
```

- [ ] **Step 2: Apply**

```bash
npx supabase db push
```
Expected: `Applying migration 20260417000005... ok`.

- [ ] **Step 3: Verify view exists**

```bash
npx supabase db execute --sql "select count(*) from exercise_swap_signals;"
```
Expected: `0` (empty, no feedback yet).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260417000005_swap_signals_view.sql
git commit -m "feat(db): add swap signals materialized view with auto-refresh trigger"
```

---

### Task 6: Seed exercises into Supabase

**Files:**
- Create: `supabase/seed/seed_exercises.ts`

Derives from `src/db/seedExercises.ts` (54 exercises) and adds the 5 new columns needed for the Supabase table.

- [ ] **Step 1: Install seed script dependencies**

```bash
npm install --save-dev tsx dotenv
```

- [ ] **Step 2: Write `supabase/seed/seed_exercises.ts`**

```typescript
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type ExerciseSeed = {
  name: string
  movement_pattern: 'squat' | 'hinge' | 'push' | 'pull' | 'carry' | 'core'
  stimulus_tags: string[]
  contraindications: string[]
  safety_flags: string[]
  equipment: string[]
  intensity_band: 'low' | 'medium' | 'high'
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  tier: 1 | 2 | 3
  swap_group_id: string
}

const exercises: ExerciseSeed[] = [
  // ── TIER 1 ───────────────────────────────────────────────────────────────
  {
    name: 'Back Squat',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'glutes', 'core'],
    contraindications: ['knee_pain', 'lower_back_pain'],
    safety_flags: ['high_impact', 'deep_knee_flexion', 'low_back_load'],
    equipment: ['barbell', 'rack'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'squat_primary',
  },
  {
    name: 'Bench Press',
    movement_pattern: 'push',
    stimulus_tags: ['chest', 'triceps', 'shoulders'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['barbell', 'bench', 'rack'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'horizontal_push_primary',
  },
  {
    name: 'Deadlift',
    movement_pattern: 'hinge',
    stimulus_tags: ['hamstrings', 'glutes', 'back', 'traps'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load', 'high_impact'],
    equipment: ['barbell'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'hinge_primary',
  },
  {
    name: 'Overhead Press',
    movement_pattern: 'push',
    stimulus_tags: ['shoulders', 'triceps', 'upper_traps'],
    contraindications: ['shoulder_pain', 'neck_pain'],
    safety_flags: ['shoulder_load', 'overhead_load'],
    equipment: ['barbell', 'rack'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'vertical_push_primary',
  },
  {
    name: 'Barbell Row',
    movement_pattern: 'pull',
    stimulus_tags: ['back', 'biceps', 'rear_delts'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['barbell'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'horizontal_pull_primary',
  },
  {
    name: 'Pull Up',
    movement_pattern: 'pull',
    stimulus_tags: ['back', 'biceps', 'core'],
    contraindications: ['shoulder_pain', 'elbow_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['pull_up_bar'],
    intensity_band: 'high',
    experience_level: 'intermediate',
    tier: 1,
    swap_group_id: 'vertical_pull_primary',
  },
  {
    name: 'Dumbbell Bench Press',
    movement_pattern: 'push',
    stimulus_tags: ['chest', 'triceps', 'shoulders'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['dumbbells', 'bench'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'horizontal_push_primary',
  },
  {
    name: 'Bulgarian Split Squat',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'glutes', 'hamstrings'],
    contraindications: ['knee_pain'],
    safety_flags: ['high_impact', 'deep_knee_flexion'],
    equipment: ['dumbbells', 'bench'],
    intensity_band: 'high',
    experience_level: 'intermediate',
    tier: 1,
    swap_group_id: 'squat_primary',
  },
  {
    name: 'Hack Squat',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'glutes'],
    contraindications: ['knee_pain'],
    safety_flags: ['high_impact', 'deep_knee_flexion'],
    equipment: ['hack_squat_machine'],
    intensity_band: 'high',
    experience_level: 'beginner',
    tier: 1,
    swap_group_id: 'squat_primary',
  },
  {
    name: 'Front Squat',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'core', 'upper_back'],
    contraindications: ['knee_pain', 'wrist_pain'],
    safety_flags: ['high_impact', 'deep_knee_flexion', 'wrist_load'],
    equipment: ['barbell', 'rack'],
    intensity_band: 'high',
    experience_level: 'advanced',
    tier: 1,
    swap_group_id: 'squat_primary',
  },
  {
    name: 'Close Grip Bench Press',
    movement_pattern: 'push',
    stimulus_tags: ['triceps', 'chest'],
    contraindications: ['elbow_pain', 'wrist_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['barbell', 'bench', 'rack'],
    intensity_band: 'high',
    experience_level: 'intermediate',
    tier: 1,
    swap_group_id: 'horizontal_push_primary',
  },

  // ── TIER 2: PUSH ──────────────────────────────────────────────────────────
  {
    name: 'Incline Press',
    movement_pattern: 'push',
    stimulus_tags: ['upper_chest', 'triceps', 'front_delts'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['barbell', 'incline_bench', 'rack'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'incline_push',
  },
  {
    name: 'Dumbbell Incline Press',
    movement_pattern: 'push',
    stimulus_tags: ['upper_chest', 'triceps'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['dumbbells', 'incline_bench'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'incline_push',
  },
  {
    name: 'Dips',
    movement_pattern: 'push',
    stimulus_tags: ['chest', 'triceps', 'front_delts'],
    contraindications: ['shoulder_pain', 'elbow_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['dip_bars'],
    intensity_band: 'medium',
    experience_level: 'intermediate',
    tier: 2,
    swap_group_id: 'incline_push',
  },
  {
    name: 'Dumbbell Shoulder Press',
    movement_pattern: 'push',
    stimulus_tags: ['shoulders', 'triceps'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load', 'overhead_load'],
    equipment: ['dumbbells'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'vertical_push_secondary',
  },

  // ── TIER 2: PULL ──────────────────────────────────────────────────────────
  {
    name: 'Lat Pulldown',
    movement_pattern: 'pull',
    stimulus_tags: ['lats', 'biceps'],
    contraindications: [],
    safety_flags: [],
    equipment: ['cable_machine'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'vertical_pull_secondary',
  },
  {
    name: 'Seated Cable Row',
    movement_pattern: 'pull',
    stimulus_tags: ['mid_back', 'biceps', 'rear_delts'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['cable_machine'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'horizontal_pull_secondary',
  },
  {
    name: 'Dumbbell Row',
    movement_pattern: 'pull',
    stimulus_tags: ['lats', 'mid_back', 'biceps'],
    contraindications: [],
    safety_flags: [],
    equipment: ['dumbbells', 'bench'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'horizontal_pull_secondary',
  },
  {
    name: 'T-Bar Row',
    movement_pattern: 'pull',
    stimulus_tags: ['mid_back', 'lats', 'biceps'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['barbell', 't_bar_attachment'],
    intensity_band: 'medium',
    experience_level: 'intermediate',
    tier: 2,
    swap_group_id: 'horizontal_pull_secondary',
  },
  {
    name: 'Chin Up',
    movement_pattern: 'pull',
    stimulus_tags: ['lats', 'biceps'],
    contraindications: ['shoulder_pain', 'elbow_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['pull_up_bar'],
    intensity_band: 'medium',
    experience_level: 'intermediate',
    tier: 2,
    swap_group_id: 'vertical_pull_secondary',
  },

  // ── TIER 2: LEGS ──────────────────────────────────────────────────────────
  {
    name: 'Romanian Deadlift',
    movement_pattern: 'hinge',
    stimulus_tags: ['hamstrings', 'glutes', 'lower_back'],
    contraindications: ['lower_back_pain', 'hamstring_injury'],
    safety_flags: ['low_back_load'],
    equipment: ['barbell'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'hinge_secondary',
  },
  {
    name: 'Leg Press',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'glutes'],
    contraindications: ['knee_pain'],
    safety_flags: ['deep_knee_flexion'],
    equipment: ['leg_press_machine'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'squat_secondary',
  },
  {
    name: 'Hip Thrust',
    movement_pattern: 'hinge',
    stimulus_tags: ['glutes', 'hamstrings'],
    contraindications: [],
    safety_flags: [],
    equipment: ['barbell', 'bench'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'hinge_secondary',
  },
  {
    name: 'Walking Lunges',
    movement_pattern: 'squat',
    stimulus_tags: ['quads', 'glutes', 'hamstrings'],
    contraindications: ['knee_pain'],
    safety_flags: ['high_impact', 'deep_knee_flexion'],
    equipment: ['dumbbells'],
    intensity_band: 'medium',
    experience_level: 'beginner',
    tier: 2,
    swap_group_id: 'squat_secondary',
  },

  // ── TIER 3: PUSH ISOLATIONS ───────────────────────────────────────────────
  {
    name: 'Triceps Pushdown',
    movement_pattern: 'push',
    stimulus_tags: ['triceps'],
    contraindications: ['elbow_pain'],
    safety_flags: [],
    equipment: ['cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'triceps_isolation',
  },
  {
    name: 'Lateral Raise',
    movement_pattern: 'push',
    stimulus_tags: ['lateral_delts'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['dumbbells'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'delt_isolation',
  },
  {
    name: 'Cable Chest Fly',
    movement_pattern: 'push',
    stimulus_tags: ['chest', 'front_delts'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'chest_isolation',
  },
  {
    name: 'Pec Deck Machine',
    movement_pattern: 'push',
    stimulus_tags: ['chest'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['pec_deck_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'chest_isolation',
  },
  {
    name: 'Skullcrushers',
    movement_pattern: 'push',
    stimulus_tags: ['triceps'],
    contraindications: ['elbow_pain'],
    safety_flags: [],
    equipment: ['barbell', 'bench'],
    intensity_band: 'low',
    experience_level: 'intermediate',
    tier: 3,
    swap_group_id: 'triceps_isolation',
  },
  {
    name: 'Overhead Triceps Extension',
    movement_pattern: 'push',
    stimulus_tags: ['triceps'],
    contraindications: ['elbow_pain', 'shoulder_pain'],
    safety_flags: ['overhead_load'],
    equipment: ['dumbbells'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'triceps_isolation',
  },
  {
    name: 'Front Raise',
    movement_pattern: 'push',
    stimulus_tags: ['front_delts'],
    contraindications: ['shoulder_pain'],
    safety_flags: ['shoulder_load'],
    equipment: ['dumbbells'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'delt_isolation',
  },

  // ── TIER 3: PULL ISOLATIONS ───────────────────────────────────────────────
  {
    name: 'Biceps Curl',
    movement_pattern: 'pull',
    stimulus_tags: ['biceps'],
    contraindications: ['elbow_pain'],
    safety_flags: [],
    equipment: ['barbell'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'biceps_isolation',
  },
  {
    name: 'Hammer Curl',
    movement_pattern: 'pull',
    stimulus_tags: ['biceps', 'brachialis'],
    contraindications: ['elbow_pain'],
    safety_flags: [],
    equipment: ['dumbbells'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'biceps_isolation',
  },
  {
    name: 'Preacher Curl',
    movement_pattern: 'pull',
    stimulus_tags: ['biceps'],
    contraindications: ['elbow_pain'],
    safety_flags: [],
    equipment: ['barbell', 'preacher_bench'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'biceps_isolation',
  },
  {
    name: 'Reverse Curl',
    movement_pattern: 'pull',
    stimulus_tags: ['brachialis', 'forearms'],
    contraindications: ['elbow_pain', 'wrist_pain'],
    safety_flags: [],
    equipment: ['barbell'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'biceps_isolation',
  },
  {
    name: 'Rear Delt Fly',
    movement_pattern: 'pull',
    stimulus_tags: ['rear_delts', 'upper_back'],
    contraindications: ['shoulder_pain'],
    safety_flags: [],
    equipment: ['dumbbells'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'rear_delt_isolation',
  },
  {
    name: 'Barbell Shrug',
    movement_pattern: 'pull',
    stimulus_tags: ['traps'],
    contraindications: ['neck_pain'],
    safety_flags: ['neck_load'],
    equipment: ['barbell'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'trap_isolation',
  },
  {
    name: 'Face Pull',
    movement_pattern: 'pull',
    stimulus_tags: ['rear_delts', 'rotator_cuff'],
    contraindications: [],
    safety_flags: [],
    equipment: ['cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'rear_delt_isolation',
  },

  // ── TIER 3: LEG ISOLATIONS ────────────────────────────────────────────────
  {
    name: 'Leg Extension',
    movement_pattern: 'squat',
    stimulus_tags: ['quads'],
    contraindications: ['knee_pain'],
    safety_flags: ['knee_shear'],
    equipment: ['leg_extension_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'quad_isolation',
  },
  {
    name: 'Seated Leg Curl',
    movement_pattern: 'hinge',
    stimulus_tags: ['hamstrings'],
    contraindications: ['hamstring_injury'],
    safety_flags: [],
    equipment: ['leg_curl_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'hamstring_isolation',
  },
  {
    name: 'Lying Leg Curl',
    movement_pattern: 'hinge',
    stimulus_tags: ['hamstrings'],
    contraindications: ['hamstring_injury'],
    safety_flags: [],
    equipment: ['leg_curl_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'hamstring_isolation',
  },
  {
    name: 'Standing Calf Raise',
    movement_pattern: 'carry',
    stimulus_tags: ['calves'],
    contraindications: ['achilles_injury'],
    safety_flags: [],
    equipment: ['calf_raise_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'calf_isolation',
  },
  {
    name: 'Seated Calf Raise',
    movement_pattern: 'carry',
    stimulus_tags: ['soleus'],
    contraindications: ['achilles_injury'],
    safety_flags: [],
    equipment: ['seated_calf_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'calf_isolation',
  },

  // ── TIER 3: CORE ──────────────────────────────────────────────────────────
  {
    name: 'Cable Crunch',
    movement_pattern: 'core',
    stimulus_tags: ['abs'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'core_flexion',
  },
  {
    name: 'Hanging Leg Raise',
    movement_pattern: 'core',
    stimulus_tags: ['abs', 'hip_flexors'],
    contraindications: ['lower_back_pain', 'shoulder_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['pull_up_bar'],
    intensity_band: 'low',
    experience_level: 'intermediate',
    tier: 3,
    swap_group_id: 'core_flexion',
  },
  {
    name: 'Plank',
    movement_pattern: 'core',
    stimulus_tags: ['core', 'glutes'],
    contraindications: ['wrist_pain'],
    safety_flags: [],
    equipment: [],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'core_stability',
  },
  {
    name: 'Ab Wheel Rollout',
    movement_pattern: 'core',
    stimulus_tags: ['abs', 'lats'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: ['ab_wheel'],
    intensity_band: 'low',
    experience_level: 'intermediate',
    tier: 3,
    swap_group_id: 'core_stability',
  },
  {
    name: 'Russian Twist',
    movement_pattern: 'core',
    stimulus_tags: ['obliques'],
    contraindications: ['lower_back_pain'],
    safety_flags: ['low_back_load'],
    equipment: [],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'core_rotation',
  },

  // ── TIER 3: PREHAB ────────────────────────────────────────────────────────
  {
    name: 'Band Pull-Apart',
    movement_pattern: 'pull',
    stimulus_tags: ['rear_delts', 'rotator_cuff'],
    contraindications: [],
    safety_flags: [],
    equipment: ['resistance_band'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'shoulder_prehab',
  },
  {
    name: 'External Rotation',
    movement_pattern: 'pull',
    stimulus_tags: ['rotator_cuff'],
    contraindications: [],
    safety_flags: [],
    equipment: ['resistance_band', 'cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'shoulder_prehab',
  },
  {
    name: 'Pallof Press',
    movement_pattern: 'core',
    stimulus_tags: ['core', 'obliques'],
    contraindications: [],
    safety_flags: [],
    equipment: ['cable_machine'],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'core_stability',
  },
  {
    name: 'Glute Bridge',
    movement_pattern: 'hinge',
    stimulus_tags: ['glutes', 'hamstrings'],
    contraindications: [],
    safety_flags: [],
    equipment: [],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'hinge_prehab',
  },
  {
    name: 'Bird Dog',
    movement_pattern: 'core',
    stimulus_tags: ['core', 'glutes'],
    contraindications: [],
    safety_flags: [],
    equipment: [],
    intensity_band: 'low',
    experience_level: 'beginner',
    tier: 3,
    swap_group_id: 'core_stability',
  },
]

async function seedExercises() {
  const { error } = await supabase.from('exercises').insert(exercises)
  if (error) throw error
  console.log(`Seeded ${exercises.length} exercises`)
}

seedExercises()
```

- [ ] **Step 3: Run seed against dev project**

```bash
SUPABASE_URL=<dev-url> SUPABASE_SERVICE_ROLE_KEY=<dev-key> npx tsx supabase/seed/seed_exercises.ts
```
Expected: `Seeded 54 exercises`.

- [ ] **Step 4: Verify row count**

```bash
npx supabase db execute --sql "select count(*) from exercises;"
```
Expected: `54`.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/seed_exercises.ts
git commit -m "feat(seed): seed 54 exercises with tier, safety_flags, swap_group_id"
```

---

### Task 7: Seed 50 plan templates

**Files:**
- Create: `supabase/seed/seed_plan_templates.ts`

Slots use the corrected `REP_SCHEMES` aligned with `REST_SECONDS_BY_GOAL_AND_TIER` from `autoPlanner.ts`.

- [ ] **Step 1: Write seed file**

```typescript
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type RepScheme = {
  sets: number; repsMin: number; repsMax: number; restSeconds: number; rpe?: number
}

// Aligned with GOAL_TIER_PRESCRIPTIONS + REST_SECONDS_BY_GOAL_AND_TIER in autoPlanner.ts
const REP_SCHEMES: Record<string, Record<number, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
    2: { sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    3: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 180, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 240 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
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
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 90 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 75 },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60 },
  },
}

function slot(pattern: string, tier: 1|2|3, band: string, goal: string) {
  return { movement_pattern: pattern, tier, intensity_band: band, rep_scheme: REP_SCHEMES[goal][tier] }
}

const templates = [
  // ── HYPERTROPHY ────────────────────────────────────────────────────────────
  { split_type: 'PPL', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'PPL', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('pull',1,'high','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('pull',3,'low','hypertrophy'), slot('pull',3,'low','hypertrophy')] },
  { split_type: 'PPL', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('squat',2,'medium','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('squat',3,'low','hypertrophy')] },
  { split_type: 'Full Body', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy')] },
  { split_type: 'Full Body', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('pull',3,'low','hypertrophy')] },
  { split_type: 'Upper-Lower', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'Upper-Lower', goal_tags: ['hypertrophy'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('hinge',1,'high','hypertrophy'), slot('squat',2,'medium','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('squat',3,'low','hypertrophy')] },
  { split_type: 'PPL', goal_tags: ['hypertrophy'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','hypertrophy'), slot('push',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'Full Body', goal_tags: ['hypertrophy'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('squat',1,'high','hypertrophy')] },

  // ── POWER ──────────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('hinge',1,'high','power'), slot('pull',2,'medium','power')] },
  { split_type: 'Upper-Lower', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','power'), slot('pull',1,'high','power'), slot('push',2,'medium','power'), slot('pull',2,'medium','power')] },
  { split_type: 'Upper-Lower', goal_tags: ['power'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','power'), slot('hinge',1,'high','power'), slot('squat',2,'medium','power'), slot('hinge',2,'medium','power'), slot('squat',3,'low','power')] },
  { split_type: 'Full Body', goal_tags: ['power'], duration_minutes: 45, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('pull',1,'high','power')] },
  { split_type: 'PPL', goal_tags: ['power'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','power'), slot('push',1,'high','power'), slot('push',2,'medium','power'), slot('push',3,'low','power')] },

  // ── STRENGTH ───────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength')] },
  { split_type: 'Full Body', goal_tags: ['strength'], duration_minutes: 75, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('hinge',1,'high','strength'), slot('pull',2,'medium','strength')] },
  { split_type: 'Upper-Lower', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('push',2,'medium','strength'), slot('pull',2,'medium','strength')] },
  { split_type: 'Upper-Lower', goal_tags: ['strength'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','strength'), slot('hinge',1,'high','strength'), slot('squat',2,'medium','strength'), slot('hinge',2,'medium','strength')] },
  { split_type: 'Full Body', goal_tags: ['strength'], duration_minutes: 45, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength')] },

  // ── FAT LOSS ───────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'Full Body', goal_tags: ['fat_loss'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('hinge',2,'medium','fat_loss')] },
  { split_type: 'Full Body', goal_tags: ['fat_loss'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'medium','fat_loss'), slot('hinge',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'Upper-Lower', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('push',1,'medium','fat_loss'), slot('pull',1,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',3,'low','fat_loss')] },
  { split_type: 'Upper-Lower', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'medium','fat_loss'), slot('hinge',2,'medium','fat_loss'), slot('squat',3,'low','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'Full Body', goal_tags: ['fat_loss'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','fat_loss'), slot('pull',2,'low','fat_loss'), slot('squat',2,'low','fat_loss')] },

  // ── ENDURANCE ──────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('squat',1,'low','endurance'), slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'Full Body', goal_tags: ['endurance'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('squat',2,'low','endurance')] },
  { split_type: 'Full Body', goal_tags: ['endurance'], duration_minutes: 60, intensity_band: 'low', experience_level: 'intermediate',
    slots: [slot('squat',1,'low','endurance'), slot('hinge',1,'low','endurance'), slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('core',3,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'Upper-Lower', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('push',3,'low','endurance'), slot('pull',3,'low','endurance')] },
  { split_type: 'Upper-Lower', goal_tags: ['endurance'], duration_minutes: 45, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('squat',2,'low','endurance'), slot('hinge',2,'low','endurance'), slot('squat',3,'low','endurance'), slot('core',3,'low','endurance')] },

  // ── RECOMP ─────────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['recomp'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','recomp'), slot('push',1,'medium','recomp'), slot('pull',2,'medium','recomp'), slot('hinge',2,'medium','recomp')] },
  { split_type: 'Full Body', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','recomp'), slot('push',1,'high','recomp'), slot('pull',1,'medium','recomp'), slot('hinge',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('pull',3,'low','recomp')] },
  { split_type: 'Upper-Lower', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('push',1,'high','recomp'), slot('pull',1,'medium','recomp'), slot('push',2,'medium','recomp'), slot('pull',2,'medium','recomp'), slot('push',3,'low','recomp')] },
  { split_type: 'Upper-Lower', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','recomp'), slot('hinge',1,'medium','recomp'), slot('squat',2,'medium','recomp'), slot('hinge',2,'medium','recomp'), slot('core',3,'low','recomp')] },
  { split_type: 'PPL', goal_tags: ['recomp'], duration_minutes: 60, intensity_band: 'medium', experience_level: 'advanced',
    slots: [slot('push',1,'high','recomp'), slot('push',2,'medium','recomp'), slot('push',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('push',3,'low','recomp')] },
  { split_type: 'Full Body', goal_tags: ['recomp'], duration_minutes: 30, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',1,'medium','recomp'), slot('push',2,'medium','recomp'), slot('pull',2,'medium','recomp')] },

  // ── MIXED GOAL ─────────────────────────────────────────────────────────────
  { split_type: 'Full Body', goal_tags: ['hypertrophy','recomp'], duration_minutes: 60, intensity_band: 'high', experience_level: 'intermediate',
    slots: [slot('squat',1,'high','hypertrophy'), slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('hinge',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'Upper-Lower', goal_tags: ['strength','hypertrophy'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'Full Body', goal_tags: ['fat_loss','recomp'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('squat',2,'medium','fat_loss'), slot('push',2,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('core',3,'low','fat_loss')] },
  { split_type: 'Full Body', goal_tags: ['power','strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','power'), slot('push',1,'high','power'), slot('hinge',1,'high','power'), slot('pull',2,'medium','power')] },
  { split_type: 'Full Body', goal_tags: ['endurance','fat_loss'], duration_minutes: 30, intensity_band: 'low', experience_level: 'beginner',
    slots: [slot('push',2,'low','endurance'), slot('pull',2,'low','endurance'), slot('squat',2,'low','endurance'), slot('core',3,'low','endurance')] },
  { split_type: 'Upper-Lower', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('push',1,'high','hypertrophy'), slot('pull',1,'high','hypertrophy'), slot('push',3,'low','hypertrophy')] },
  { split_type: 'Full Body', goal_tags: ['strength'], duration_minutes: 60, intensity_band: 'high', experience_level: 'beginner',
    slots: [slot('squat',1,'high','strength'), slot('push',1,'high','strength'), slot('pull',1,'high','strength'), slot('hinge',2,'medium','strength')] },
  { split_type: 'PPL', goal_tags: ['fat_loss'], duration_minutes: 45, intensity_band: 'medium', experience_level: 'beginner',
    slots: [slot('pull',1,'medium','fat_loss'), slot('pull',2,'medium','fat_loss'), slot('pull',3,'low','fat_loss'), slot('pull',3,'low','fat_loss')] },
  { split_type: 'Full Body', goal_tags: ['recomp'], duration_minutes: 75, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','recomp'), slot('push',1,'high','recomp'), slot('pull',1,'high','recomp'), slot('hinge',2,'medium','recomp'), slot('push',3,'low','recomp'), slot('pull',3,'low','recomp'), slot('core',3,'low','recomp')] },
  { split_type: 'Full Body', goal_tags: ['hypertrophy'], duration_minutes: 45, intensity_band: 'high', experience_level: 'advanced',
    slots: [slot('squat',1,'high','hypertrophy'), slot('hinge',1,'high','hypertrophy'), slot('push',2,'medium','hypertrophy'), slot('pull',2,'medium','hypertrophy')] },
]

async function seedTemplates() {
  const { error } = await supabase.from('plan_templates').insert(templates)
  if (error) throw error
  console.log(`Seeded ${templates.length} plan templates`)
}

seedTemplates()
```

- [ ] **Step 2: Run seed**

```bash
SUPABASE_URL=<dev-url> SUPABASE_SERVICE_ROLE_KEY=<dev-key> npx tsx supabase/seed/seed_plan_templates.ts
```
Expected: `Seeded 50 plan templates`.

- [ ] **Step 3: Verify count**

```bash
npx supabase db execute --sql "select count(*) from plan_templates;"
```
Expected: `50`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed/seed_plan_templates.ts
git commit -m "feat(seed): seed 50 canonical plan templates with tier-accurate rep schemes"
```

---

### Task 8: Generate embeddings

**Files:**
- Create: `supabase/seed/generate_embeddings.ts`

- [ ] **Step 1: Write embedding generator**

```typescript
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const GEMINI_KEY = process.env.GEMINI_API_KEY!

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    },
  )
  const json = await res.json()
  if (!json.embedding?.values) throw new Error(`Embed failed: ${JSON.stringify(json)}`)
  return json.embedding.values
}

function templateText(t: Record<string, unknown>): string {
  return `Goal: ${(t.goal_tags as string[]).join(', ')} | Split: ${t.split_type} | Intensity: ${t.intensity_band} | Duration: ${t.duration_minutes}min | Experience: ${t.experience_level}`
}

function exerciseText(e: Record<string, unknown>): string {
  return `Exercise: ${e.name} | Pattern: ${e.movement_pattern} | Tags: ${(e.stimulus_tags as string[]).join(', ')} | Equipment: ${(e.equipment as string[]).join(', ')} | Intensity: ${e.intensity_band} | Tier: ${e.tier}`
}

async function run() {
  const { data: templates } = await supabase
    .from('plan_templates').select('id, split_type, goal_tags, duration_minutes, intensity_band, experience_level')
    .is('embedding', null)

  for (const t of templates ?? []) {
    const embedding = await embedText(templateText(t))
    await supabase.from('plan_templates').update({ embedding }).eq('id', t.id)
    console.log(`Embedded template: ${t.split_type} / ${(t.goal_tags as string[]).join(',')}`)
    await new Promise(r => setTimeout(r, 100)) // respect rate limits
  }

  const { data: exercises } = await supabase
    .from('exercises').select('id, name, movement_pattern, stimulus_tags, equipment, intensity_band, tier')
    .is('embedding', null)

  for (const e of exercises ?? []) {
    const embedding = await embedText(exerciseText(e))
    await supabase.from('exercises').update({ embedding }).eq('id', e.id)
    console.log(`Embedded exercise: ${e.name}`)
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('All embeddings generated.')
}

run()
```

- [ ] **Step 2: Run against dev**

```bash
SUPABASE_URL=<dev-url> SUPABASE_SERVICE_ROLE_KEY=<dev-key> GEMINI_API_KEY=<key> npx tsx supabase/seed/generate_embeddings.ts
```
Expected: 104 lines of `Embedded template:...` and `Embedded exercise:...`, then `All embeddings generated.`

- [ ] **Step 3: Verify no nulls**

```bash
npx supabase db execute --sql "select count(*) from exercises where embedding is null;"
npx supabase db execute --sql "select count(*) from plan_templates where embedding is null;"
```
Both expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed/generate_embeddings.ts
git commit -m "feat(seed): generate 768-dim embeddings for exercises and plan templates"
```

---

### Task 9: Shared Edge Function helpers

**Files:**
- Create: `supabase/functions/_shared/auth.ts`
- Create: `supabase/functions/_shared/gemini.ts`
- Create: `supabase/functions/_shared/repSchemes.ts`
- Create: `supabase/functions/_shared/rerank.ts`
- Create: `supabase/functions/_shared/composePlan.ts`

- [ ] **Step 1: Write `auth.ts`**

```typescript
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function makeServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export async function requireAuth(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ id: string }> {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const { data: { user }, error } = await supabase.auth.getUser(jwt)
  if (error || !user) throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  return user
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Write `gemini.ts`**

```typescript
const GEMINI_KEY = () => Deno.env.get('GEMINI_API_KEY')!

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    },
  )
  const payload = await res.json()
  if (!payload.embedding?.values) throw new Error('Embedding failed')
  return payload.embedding.values
}

export interface GoalIntent {
  goal: 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
  daysPerWeek: number
  minutesPerSession: number
  experience: 'beginner' | 'intermediate' | 'advanced'
  swapPreference: 'low' | 'medium' | 'high'
}

export function buildRetrievalText(intent: GoalIntent, profile: Record<string, unknown> | null): string {
  return [
    `Goal: ${intent.goal}`,
    `Experience: ${intent.experience}`,
    `Duration: ${intent.minutesPerSession}min`,
    `Days: ${intent.daysPerWeek}`,
    `Equipment: ${((profile?.equipment as string[]) ?? []).join(', ') || 'any'}`,
  ].join(' | ')
}

export async function parseIntentWithGemini(
  goalText: string,
  profile: Record<string, unknown> | null,
): Promise<GoalIntent> {
  const systemPrompt = `You are a fitness intent parser. Return ONLY valid JSON matching this exact schema:
{"goal":"fat_loss"|"hypertrophy"|"strength"|"endurance"|"recomp"|"power","daysPerWeek":number,"minutesPerSession":number,"experience":"beginner"|"intermediate"|"advanced","swapPreference":"low"|"medium"|"high"}
Default: daysPerWeek=${profile?.days_per_week ?? 3}, minutesPerSession=${profile?.minutes_per_session ?? 45}, experience=${profile?.experience_level ?? 'beginner'}, swapPreference="low"
User goal: "${goalText}"`

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] }),
      },
    )
    const payload = await res.json()
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    try {
      const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned) as GoalIntent
      if (!parsed.goal || !parsed.experience) throw new Error('Invalid intent')
      return parsed
    } catch {
      if (attempt === 1) throw new Error(`Intent parse failed after 2 attempts: ${raw}`)
    }
  }
  throw new Error('Intent parse failed')
}

export async function generateTemplateWithGemini(intent: GoalIntent): Promise<Record<string, unknown>> {
  const prompt = `Generate a workout template JSON for: goal=${intent.goal}, experience=${intent.experience}, duration=${intent.minutesPerSession}min.
Return ONLY: {"split_type":"Full Body"|"PPL"|"Upper-Lower","slots":[{"movement_pattern":"squat"|"hinge"|"push"|"pull"|"carry"|"core","tier":1|2|3,"intensity_band":"low"|"medium"|"high"}]}`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  )
  const payload = await res.json()
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const cleaned = raw.replace(/```json?/g, '').replace(/```/g, '').trim()
  return { ...JSON.parse(cleaned), id: 'gemini-generated', goal_tags: [intent.goal] }
}
```

- [ ] **Step 3: Write `repSchemes.ts`**

```typescript
export interface RepScheme {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  rpe?: number
}

export type GoalKey = 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'recomp' | 'power'
export type Tier = 1 | 2 | 3

// Aligned with GOAL_TIER_PRESCRIPTIONS + REST_SECONDS_BY_GOAL_AND_TIER in src/planner/autoPlanner.ts
export const REP_SCHEMES: Record<GoalKey, Record<Tier, RepScheme>> = {
  hypertrophy: {
    1: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90  },
    2: { sets: 4, repsMin: 8,  repsMax: 12, restSeconds: 60  },
    3: { sets: 3, repsMin: 8,  repsMax: 12, restSeconds: 60  },
  },
  power: {
    1: { sets: 5, repsMin: 3,  repsMax: 5,  restSeconds: 180, rpe: 9 },
    2: { sets: 4, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
    3: { sets: 3, repsMin: 5,  repsMax: 8,  restSeconds: 90           },
  },
  strength: {
    1: { sets: 5, repsMin: 1,  repsMax: 5,  restSeconds: 240 },
    2: { sets: 4, repsMin: 4,  repsMax: 6,  restSeconds: 180 },
    3: { sets: 3, repsMin: 6,  repsMax: 8,  restSeconds: 120 },
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
    1: { sets: 4, repsMin: 6,  repsMax: 10, restSeconds: 90 },
    2: { sets: 3, repsMin: 10, repsMax: 14, restSeconds: 75 },
    3: { sets: 3, repsMin: 12, repsMax: 16, restSeconds: 60 },
  },
}
```

- [ ] **Step 4: Write `rerank.ts`**

```typescript
interface TemplateRow {
  id: string
  split_type: string
  goal_tags: string[]
  slots: unknown[]
  intensity_band: string
  duration_minutes: number
  similarity: number
}

interface RankInput {
  goal: string
  experience: string
}

export function rerank(templates: TemplateRow[], intent: RankInput): Array<TemplateRow & { score: number }> {
  return templates
    .map(t => {
      const semantic    = t.similarity * 0.45
      const goalFit     = (t.goal_tags.includes(intent.goal) ? 1 : 0.3) * 0.25
      const progression = (t.experience_level === intent.experience ? 1 : 0.5) * 0.20
      const adherence   = (t.slots.length <= 6 ? 1 : 0.6) * 0.10
      return { ...t, score: semantic + goalFit + progression + adherence }
    })
    .sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 5: Write `composePlan.ts`**

```typescript
import { REP_SCHEMES, type GoalKey, type Tier } from './repSchemes.ts'

interface Slot { movement_pattern: string; tier: Tier; intensity_band: string }
interface ExerciseRow {
  id: string; name: string; movement_pattern: string; tier: number
  safety_flags: string[]; equipment: string[]; intensity_band: string; swap_group_id: string
}
export interface ResolvedExercise extends ExerciseRow {
  repScheme: ReturnType<typeof REP_SCHEMES[GoalKey][Tier]>
}

export function composePlan(
  template: { id: string; split_type: string; slots: Slot[] },
  exercisePool: ExerciseRow[],
  goal: GoalKey,
): ResolvedExercise[] {
  const usedIds = new Set<string>()

  return template.slots.map(slot => {
    const candidate = exercisePool.find(ex =>
      ex.movement_pattern === slot.movement_pattern &&
      ex.tier             === slot.tier             &&
      ex.intensity_band   === slot.intensity_band   &&
      !usedIds.has(ex.id)
    ) ?? exercisePool.find(ex =>
      ex.movement_pattern === slot.movement_pattern &&
      ex.tier             === slot.tier             &&
      !usedIds.has(ex.id)
    )

    if (!candidate) {
      throw new Error(`No safe candidate for slot: ${slot.movement_pattern} T${slot.tier}`)
    }

    usedIds.add(candidate.id)
    return {
      ...candidate,
      repScheme: REP_SCHEMES[goal][slot.tier as Tier],
    }
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/
git commit -m "feat(functions): add shared Edge Function helpers — auth, gemini, repSchemes, rerank, composePlan"
```

---

### Task 10: plans-query Edge Function + safety tests

**Files:**
- Create: `supabase/functions/plans-query/index.ts`
- Create: `supabase/functions/_tests/safety.test.ts`
- Create: `supabase/functions/_tests/plans-query.test.ts`

- [ ] **Step 1: Write safety tests first (CI gate)**

`supabase/functions/_tests/safety.test.ts`:
```typescript
import { assertEquals, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts'
import { composePlan } from '../_shared/composePlan.ts'
import { REP_SCHEMES } from '../_shared/repSchemes.ts'

const safePool = [
  { id: 'ex-squat', name: 'Back Squat', movement_pattern: 'squat', tier: 1, safety_flags: [], equipment: ['barbell','rack'], intensity_band: 'high', swap_group_id: 'squat_primary' },
  { id: 'ex-bench', name: 'Bench Press', movement_pattern: 'push', tier: 1, safety_flags: [], equipment: ['barbell','bench'], intensity_band: 'high', swap_group_id: 'horizontal_push_primary' },
  { id: 'ex-curl',  name: 'Biceps Curl', movement_pattern: 'pull', tier: 3, safety_flags: [], equipment: ['barbell'], intensity_band: 'low', swap_group_id: 'biceps_isolation' },
]

const flaggedExercise = { id: 'ex-flagged', name: 'Back Squat Variant', movement_pattern: 'squat', tier: 1, safety_flags: ['high_impact', 'deep_knee_flexion'], equipment: ['barbell'], intensity_band: 'high', swap_group_id: 'squat_primary' }

Deno.test('composePlan fills slots without duplicates', () => {
  const template = { id: 'tpl-1', split_type: 'Full Body', slots: [
    { movement_pattern: 'squat', tier: 1, intensity_band: 'high' },
    { movement_pattern: 'push',  tier: 1, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result.length, 2)
  const ids = result.map(e => e.id)
  assertEquals(new Set(ids).size, 2)
})

Deno.test('composePlan throws when no candidate for a slot', async () => {
  const template = { id: 'tpl-2', split_type: 'Full Body', slots: [
    { movement_pattern: 'carry', tier: 1, intensity_band: 'high' },
  ]}
  assertRejects(async () => composePlan(template, safePool, 'hypertrophy'))
})

Deno.test('composePlan: hypertrophy T1 rep scheme = 5-8 reps, 90s rest', () => {
  const template = { id: 'tpl-3', split_type: 'Full Body', slots: [
    { movement_pattern: 'squat', tier: 1, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result[0].repScheme.repsMin, 5)
  assertEquals(result[0].repScheme.repsMax, 8)
  assertEquals(result[0].repScheme.restSeconds, 90)
})

Deno.test('composePlan: hypertrophy T3 rep scheme = 8-12 reps, 60s rest', () => {
  const template = { id: 'tpl-4', split_type: 'Full Body', slots: [
    { movement_pattern: 'pull', tier: 3, intensity_band: 'low' },
  ]}
  const result = composePlan(template, safePool, 'hypertrophy')
  assertEquals(result[0].repScheme.repsMin, 8)
  assertEquals(result[0].repScheme.repsMax, 12)
  assertEquals(result[0].repScheme.restSeconds, 60)
})

Deno.test('composePlan: power T1 rep scheme = 3-5 reps, 180s rest, RPE 9', () => {
  const template = { id: 'tpl-5', split_type: 'Full Body', slots: [
    { movement_pattern: 'squat', tier: 1, intensity_band: 'high' },
  ]}
  const result = composePlan(template, safePool, 'power')
  assertEquals(result[0].repScheme.repsMin, 3)
  assertEquals(result[0].repScheme.repsMax, 5)
  assertEquals(result[0].repScheme.restSeconds, 180)
  assertEquals(result[0].repScheme.rpe, 9)
})

Deno.test('composePlan: power T2/T3 rep scheme = 5-8 reps, 90s rest', () => {
  const template = { id: 'tpl-6', split_type: 'Full Body', slots: [
    { movement_pattern: 'pull', tier: 3, intensity_band: 'low' },
  ]}
  const result = composePlan(template, safePool, 'power')
  assertEquals(result[0].repScheme.repsMin, 5)
  assertEquals(result[0].repScheme.repsMax, 8)
  assertEquals(result[0].repScheme.restSeconds, 90)
})

Deno.test('SAFETY: flagged exercise cannot be assigned to a slot — must be excluded from pool before composePlan', () => {
  const template = { id: 'tpl-7', split_type: 'Full Body', slots: [
    { movement_pattern: 'squat', tier: 1, intensity_band: 'high' },
  ]}
  const userInjuryFlags = ['high_impact', 'deep_knee_flexion']
  const safePoolOnly = [...safePool, flaggedExercise].filter(
    ex => !ex.safety_flags.some(f => userInjuryFlags.includes(f))
  )
  const result = composePlan(template, safePoolOnly, 'hypertrophy')
  assertEquals(result[0].id, 'ex-squat')
  assertEquals(result[0].safety_flags.some(f => userInjuryFlags.includes(f)), false)
})

Deno.test('SAFETY: final safety scan detects violation that bypassed SQL filter', () => {
  const plan = [{ ...flaggedExercise, repScheme: REP_SCHEMES['hypertrophy'][1] }]
  const userInjuryFlags = ['high_impact']
  const violation = plan.find(ex => ex.safety_flags.some(f => userInjuryFlags.includes(f)))
  assertEquals(violation?.name, 'Back Squat Variant')
})

Deno.test('SAFETY: pain_flag=true feedback does not increase safe_swaps signal', () => {
  const feedbackRows = [
    { swapped_from_exercise: 'ex-a', swapped_to_exercise: 'ex-b', pain_flag: true, goal_tag: 'hypertrophy' },
    { swapped_from_exercise: 'ex-a', swapped_to_exercise: 'ex-b', pain_flag: true, goal_tag: 'hypertrophy' },
  ]
  const safeSwaps = feedbackRows.filter(r => !r.pain_flag).length
  assertEquals(safeSwaps, 0)
})
```

- [ ] **Step 2: Run safety tests — expect all pass**

```bash
deno test supabase/functions/_tests/safety.test.ts
```
Expected: `8 passed`.

- [ ] **Step 3: Write `plans-query/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'
import { embedText, buildRetrievalText, parseIntentWithGemini, generateTemplateWithGemini } from '../_shared/gemini.ts'
import { rerank } from '../_shared/rerank.ts'
import { composePlan } from '../_shared/composePlan.ts'
import type { GoalKey } from '../_shared/repSchemes.ts'

const CONFIDENCE_THRESHOLD = 0.72

serve(async (req) => {
  const supabase = makeServiceClient()

  let user: { id: string }
  try {
    user = await requireAuth(req, supabase)
  } catch (res) {
    return res as Response
  }

  const { goalText } = await req.json()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('persistent_injuries, equipment, experience_level, days_per_week, minutes_per_session')
    .eq('id', user.id)
    .single()

  const intent = await parseIntentWithGemini(goalText, profile)
  const injuries: string[] = (profile?.persistent_injuries ?? [])
    .flatMap((inj: { safety_flags: string[] }) => inj.safety_flags)

  const queryVec = await embedText(buildRetrievalText(intent, profile))

  const { data: templates, error: tErr } = await supabase.rpc('search_plan_templates', {
    query_embedding: queryVec,
    p_experience: intent.experience,
    p_max_minutes: intent.minutesPerSession,
    top_k: 40,
  })
  if (tErr) return json({ error: tErr.message }, 500)

  const { data: exercises, error: eErr } = await supabase.rpc('search_safe_exercises', {
    query_embedding: queryVec,
    p_user_id: user.id,
    p_equipment: profile?.equipment ?? [],
    top_k: 120,
  })
  if (eErr) return json({ error: eErr.message }, 500)

  const ranked = rerank(templates ?? [], intent)
  const bestScore = ranked[0]?.score ?? 0

  const template = bestScore >= CONFIDENCE_THRESHOLD
    ? ranked[0]
    : await generateTemplateWithGemini(intent)

  const confidence = Math.min(bestScore, 1)
  let resolvedExercises: ReturnType<typeof composePlan>
  try {
    resolvedExercises = composePlan(template, exercises ?? [], intent.goal as GoalKey)
  } catch (err) {
    return json({ error: (err as Error).message }, 422)
  }

  // Final safety scan — defense in depth
  const violation = resolvedExercises.find(ex =>
    ex.safety_flags.some(f => injuries.includes(f))
  )
  if (violation) {
    console.error(`Safety violation: ${violation.name} for user ${user.id}`)
    return json({ error: 'Safety violation detected. Please update injury profile.' }, 422)
  }

  return json({
    plan: {
      templateId: template.id,
      splitType: template.split_type,
      confidence,
      rationale: `${template.split_type} plan optimised for ${intent.goal}. Confidence: ${Math.round(confidence * 100)}%.`,
      safetyNotes: injuries.length > 0 ? [`Excluded exercises with: ${injuries.join(', ')}`] : [],
      exercises: resolvedExercises,
    },
  })
})
```

- [ ] **Step 4: Deploy and smoke-test**

```bash
npx supabase functions deploy plans-query
```

```bash
# Get a JWT from dev auth
JWT=$(curl -s -X POST "https://<dev-project>.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: <anon-key>" \
  -d '{"email":"test@test.com","password":"test1234"}' | jq -r '.access_token')

curl -s -X POST "https://<dev-project>.supabase.co/functions/v1/plans-query" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"goalText":"build muscle 4 days a week"}'
```
Expected: `200` with `plan.exercises` array, each item containing `repScheme`.

- [ ] **Step 5: Write integration tests**

`supabase/functions/_tests/plans-query.test.ts`:
```typescript
const BASE = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

async function getTestJwt(): Promise<string> {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test1234' }),
  })
  return (await res.json()).access_token
}

Deno.test('plans-query: 401 without Authorization header', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  assertEquals(res.status, 401)
})

Deno.test('plans-query: 200 with valid JWT and non-empty exercises', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle 4 days a week' }),
  })
  assertEquals(res.status, 200)
  const body = await res.json()
  assert(body.plan.exercises.length > 0)
})

Deno.test('plans-query: exercises include repScheme with repsMin and repsMax', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'hypertrophy 5 days a week' }),
  })
  const body = await res.json()
  for (const ex of body.plan.exercises) {
    assert(typeof ex.repScheme.repsMin === 'number')
    assert(typeof ex.repScheme.repsMax === 'number')
    assert(ex.repScheme.repsMin < ex.repScheme.repsMax)
  }
})
```

- [ ] **Step 6: Run integration tests**

```bash
deno test --env supabase/.env.test supabase/functions/_tests/plans-query.test.ts
```
Expected: `3 passed`.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/plans-query/ supabase/functions/_tests/
git commit -m "feat(functions): plans-query Edge Function with safety scan and rep schemes"
```

---

### Task 11: plans-swap + plans-feedback Edge Functions

**Files:**
- Create: `supabase/functions/plans-swap/index.ts`
- Create: `supabase/functions/plans-feedback/index.ts`
- Create: `supabase/functions/_tests/plans-swap.test.ts`
- Create: `supabase/functions/_tests/plans-feedback.test.ts`

- [ ] **Step 1: Write `plans-swap/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'
import { REP_SCHEMES, type GoalKey, type Tier } from '../_shared/repSchemes.ts'

serve(async (req) => {
  const supabase = makeServiceClient()
  let user: { id: string }
  try { user = await requireAuth(req, supabase) } catch (res) { return res as Response }

  const { exerciseId, reason, currentPlanExerciseIds, goalTag } = await req.json()

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

  if (!current) return json({ error: 'Exercise not found' }, 404)

  const { data: candidates } = await supabase.rpc('find_swap_candidates', {
    p_swap_group_id:  current.swap_group_id,
    p_intensity_band: current.intensity_band,
    p_tier:           current.tier,
    p_excluded_flags: excludedFlags,
    p_equipment:      profile?.equipment ?? [],
    p_exclude_ids:    [exerciseId, ...(currentPlanExerciseIds ?? [])],
    query_embedding:  current.embedding,
    top_k:            10,
  })

  const { data: signals } = await supabase
    .from('exercise_swap_signals')
    .select('to_id, safe_swaps')
    .eq('from_id', exerciseId)
    .order('safe_swaps', { ascending: false })

  const signalMap = new Map((signals ?? []).map((s: { to_id: string; safe_swaps: number }) => [s.to_id, s.safe_swaps]))

  const boosted = (candidates ?? [])
    .map((ex: { id: string }) => ({ ...ex, boost: signalMap.get(ex.id) ?? 0 }))
    .sort((a: { similarity: number; boost: number }, b: { similarity: number; boost: number }) =>
      (b.similarity + b.boost * 0.1) - (a.similarity + a.boost * 0.1)
    )
    .slice(0, 5)

  const goalKey = (goalTag ?? 'hypertrophy') as GoalKey
  const tier = (current.tier as Tier)

  return json({
    options: boosted.map((ex: Record<string, unknown>) => ({
      exercise: ex,
      rationale: `${ex.name} — same movement pattern, safe for your profile. ${reason}`,
      repScheme: REP_SCHEMES[goalKey]?.[tier] ?? REP_SCHEMES['hypertrophy'][tier],
    })),
  })
})
```

- [ ] **Step 2: Write `plans-feedback/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { makeServiceClient, requireAuth, json } from '../_shared/auth.ts'

serve(async (req) => {
  const supabase = makeServiceClient()
  let user: { id: string }
  try { user = await requireAuth(req, supabase) } catch (res) { return res as Response }

  const body = await req.json()

  const { error } = await supabase.from('retrieval_feedback').insert({
    user_id:               user.id,
    plan_id:               body.planId ?? null,
    accepted:              body.accepted,
    swapped_from_exercise: body.swappedFromExerciseId ?? null,
    swapped_to_exercise:   body.swappedToExerciseId   ?? null,
    pain_flag:             body.painFlag ?? false,
    goal_tag:              body.goalTag  ?? null,
  })

  if (error) return json({ error: error.message }, 500)
  return json({ ok: true })
})
```

- [ ] **Step 3: Write swap tests**

`supabase/functions/_tests/plans-swap.test.ts`:
```typescript
Deno.test('plans-swap: 401 without auth', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId: 'x', reason: 'test', currentPlanExerciseIds: [] }),
  })
  assertEquals(res.status, 401)
})

Deno.test('plans-swap: options array has length 1-5', async () => {
  const jwt = await getTestJwt()
  // Get a valid exerciseId first
  const qRes = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  const plan = (await qRes.json()).plan
  const exerciseId = plan.exercises[0].id

  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, reason: 'equipment', currentPlanExerciseIds: [exerciseId], goalTag: 'hypertrophy' }),
  })
  assertEquals(res.status, 200)
  const body = await res.json()
  assert(body.options.length >= 1 && body.options.length <= 5)
})

Deno.test('plans-swap: no option id matches currentPlanExerciseIds', async () => {
  const jwt = await getTestJwt()
  const qRes = await fetch(`${BASE}/functions/v1/plans-query`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalText: 'build muscle' }),
  })
  const plan = (await qRes.json()).plan
  const allIds = plan.exercises.map((e: { id: string }) => e.id)
  const exerciseId = allIds[0]

  const res = await fetch(`${BASE}/functions/v1/plans-swap`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, reason: 'preference', currentPlanExerciseIds: allIds, goalTag: 'hypertrophy' }),
  })
  const body = await res.json()
  for (const opt of body.options) {
    assert(!allIds.includes(opt.exercise.id))
  }
})
```

- [ ] **Step 4: Write feedback tests**

`supabase/functions/_tests/plans-feedback.test.ts`:
```typescript
Deno.test('plans-feedback: returns { ok: true } on valid request', async () => {
  const jwt = await getTestJwt()
  const res = await fetch(`${BASE}/functions/v1/plans-feedback`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted: true, painFlag: false, goalTag: 'hypertrophy' }),
  })
  assertEquals(res.status, 200)
  assertEquals((await res.json()).ok, true)
})

Deno.test('plans-feedback: 401 without auth', async () => {
  const res = await fetch(`${BASE}/functions/v1/plans-feedback`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted: true, painFlag: false }),
  })
  assertEquals(res.status, 401)
})
```

- [ ] **Step 5: Deploy both functions**

```bash
npx supabase functions deploy plans-swap
npx supabase functions deploy plans-feedback
```
Expected: `Deployed plans-swap` and `Deployed plans-feedback`.

- [ ] **Step 6: Run all tests**

```bash
deno test supabase/functions/_tests/safety.test.ts
deno test --env supabase/.env.test supabase/functions/_tests/
```
Expected: all tests pass, safety tests run first.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/plans-swap/ supabase/functions/plans-feedback/ supabase/functions/_tests/
git commit -m "feat(functions): plans-swap (top-5 options, no duplicates) and plans-feedback Edge Functions"
```

---

## Self-Review

**Spec coverage check:**
- ✅ POST /api/plans/query — Task 10
- ✅ POST /api/plans/swap — Task 11 (returns 3–5 options, no duplicates via `p_exclude_ids`)
- ✅ POST /api/plans/feedback — Task 11
- ✅ Hard SQL filter before ranking — Task 4 (`search_safe_exercises` WHERE clause)
- ✅ Final safety scan — Task 10 (`plans-query/index.ts` violation check)
- ✅ Injury auto-hydration from user_profiles — Tasks 4 + 10
- ✅ Hybrid fallback at confidence < 0.72 — Task 10
- ✅ Swap: same tier, same swap_group_id, no current plan IDs — Task 11
- ✅ Crowd signal boost — Task 11 (`signalMap` sort)
- ✅ Swap signals materialized view + trigger — Task 5
- ✅ REP_SCHEMES aligned with autoPlanner.ts — Tasks 9 + 7 (corrected rest seconds)
- ✅ Hypertrophy T1: 5–8 reps — Task 9 safety tests
- ✅ Hypertrophy T3: 8–12 reps — Task 9 safety tests
- ✅ Power T1: 3–5 reps, 180s rest — Task 9 safety tests
- ✅ Power T2/T3: 5–8 reps — Task 9 safety tests
- ✅ duration_band replaced with duration_minutes (int) — Task 2 (spec assumption fix)
- ✅ 54 exercises with safety_flags, swap_group_id, tier — Task 6
- ✅ 50 plan templates — Task 7
- ✅ Embeddings generated — Task 8
- ✅ RLS per-user isolation — Task 3
- ✅ App Store safe (no API keys in bundle, keys in Edge Function env) — Task 1

**No placeholders found.**
