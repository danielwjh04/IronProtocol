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
