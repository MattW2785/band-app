-- BandSpace — traccia chi ha fatto l'ultima modifica
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 002.

alter table songs add column updated_by uuid references profiles (id) on delete set null;
alter table songs add column updated_at timestamptz not null default now();
update songs set updated_by = proposed_by, updated_at = created_at;

alter table events add column updated_by uuid references profiles (id) on delete set null;
alter table events add column updated_at timestamptz not null default now();
update events set updated_by = created_by, updated_at = created_at;

alter table tasks add column updated_by uuid references profiles (id) on delete set null;
alter table tasks add column updated_at timestamptz not null default now();
update tasks set updated_by = created_by, updated_at = created_at;

alter table setlists add column updated_by uuid references profiles (id) on delete set null;
alter table setlists add column updated_at timestamptz not null default now();
update setlists set updated_by = created_by, updated_at = created_at;
