-- BandSpace — registro attività (visibile solo agli admin)
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 001-004.

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_label text,
  detail text,
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on activity_log (created_at desc);

alter table activity_log enable row level security;

-- Solo gli admin possono leggere il registro; ogni utente autenticato può scrivere
-- solo righe attribuite a se stesso (le azioni si auto-registrano).
create policy "activity_log: lettura solo admin" on activity_log
  for select to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "activity_log: inserimento proprio utente" on activity_log
  for insert to authenticated with check (auth.uid() = user_id);
