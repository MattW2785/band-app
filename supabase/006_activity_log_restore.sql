-- BandSpace — supporto al ripristino di elementi eliminati dal registro attività
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 005.

alter table activity_log add column snapshot jsonb;
alter table activity_log add column restored_at timestamptz;
alter table activity_log add column restored_by uuid references profiles (id) on delete set null;
