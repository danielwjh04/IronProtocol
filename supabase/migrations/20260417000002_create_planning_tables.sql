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
