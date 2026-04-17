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
  and  goal_tag              is not null
group  by from_id, to_id, goal_tag;

create unique index on exercise_swap_signals (from_id, to_id, goal_tag)
  where goal_tag is not null;

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
    refresh materialized view exercise_swap_signals;
  end if;

  return new;
end;
$$;

create trigger refresh_swap_signals_trigger
after insert on retrieval_feedback
for each row
when (new.swapped_from_exercise is not null and new.goal_tag is not null)
execute function maybe_refresh_swap_signals();
