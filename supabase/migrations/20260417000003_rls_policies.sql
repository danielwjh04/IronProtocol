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
