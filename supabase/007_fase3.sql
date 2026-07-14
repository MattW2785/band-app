-- BandSpace — Fase 3: EPK/press kit, statistiche (nessuna tabella), bacheca commenti
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 001-006.

-- ============================================================
-- press_kit — riga singola con id fisso, sempre aggiornata in place
-- ============================================================
create table press_kit (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  band_name text,
  bio_short text,
  bio_long text,
  photo_urls text[] not null default '{}',
  stage_plot_url text,
  tech_rider_url text,
  audio_links text[] not null default '{}',
  video_links text[] not null default '{}',
  contact_email text,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into press_kit (id) values ('00000000-0000-0000-0000-000000000001');

alter table press_kit enable row level security;

-- Pagina pubblica /epk: leggibile anche senza login.
create policy "press_kit: lettura pubblica" on press_kit
  for select to anon, authenticated using (true);

create policy "press_kit: modifica autenticati" on press_kit
  for update to authenticated using (true) with check (true);

-- ============================================================
-- comments — bacheca agganciata a brani/eventi/task/trattative
-- ============================================================
create table comments (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('song', 'event', 'task', 'booking_lead')),
  parent_id uuid not null,
  user_id uuid references profiles (id) on delete set null,
  text text not null,
  created_at timestamptz not null default now()
);

create index comments_parent_idx on comments (parent_type, parent_id);

alter table comments enable row level security;

create policy "comments: full access autenticati" on comments
  for all to authenticated using (true) with check (true);
