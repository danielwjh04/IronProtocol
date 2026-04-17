alter table user_profiles      enable row level security;
alter table retrieval_feedback enable row level security;
alter table exercises          enable row level security;
alter table plan_templates     enable row level security;

create policy "own profile select"
  on user_profiles for select
  using (id = auth.uid());

create policy "own profile insert"
  on user_profiles for insert
  with check (id = auth.uid());

create policy "own profile update"
  on user_profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "own profile delete"
  on user_profiles for delete
  using (id = auth.uid());

create policy "own feedback select"
  on retrieval_feedback for select
  using (user_id = auth.uid());

create policy "own feedback insert"
  on retrieval_feedback for insert
  with check (user_id = auth.uid());

create policy "own feedback update"
  on retrieval_feedback for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own feedback delete"
  on retrieval_feedback for delete
  using (user_id = auth.uid());

create policy "authenticated read exercises"
  on exercises for select
  using (auth.role() = 'authenticated');

create policy "authenticated read templates"
  on plan_templates for select
  using (auth.role() = 'authenticated');
