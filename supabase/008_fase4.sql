-- BandSpace — Fase 4: archivio media, inventario attrezzatura, SIAE/split diritti
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 001-007.

-- ============================================================
-- Storage: bucket privato per l'archivio media
-- ============================================================
insert into storage.buckets (id, name, public) values ('media', 'media', false);

create policy "media bucket: lettura autenticati" on storage.objects
  for select to authenticated using (bucket_id = 'media');
create policy "media bucket: upload autenticati" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "media bucket: eliminazione autenticati" on storage.objects
  for delete to authenticated using (bucket_id = 'media');

-- ============================================================
-- media_items — archivio file (registrazioni, basi, foto/video, spartiti)
-- ============================================================
create type media_type as enum ('audio', 'video', 'immagine', 'documento');

create table media_items (
  id uuid primary key default gen_random_uuid(),
  type media_type not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  title text not null,
  related_song_id uuid references songs (id) on delete set null,
  related_event_id uuid references events (id) on delete set null,
  uploaded_by uuid references profiles (id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- ============================================================
-- equipment — inventario attrezzatura
-- ============================================================
create type equipment_category as enum ('chitarra', 'basso', 'batteria', 'ampli', 'microfoni', 'cavi', 'altro');

create table equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_type text not null check (owner_type in ('membro', 'band')),
  owner_id uuid references profiles (id) on delete set null,
  category equipment_category not null,
  last_maintenance_date date,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- original_works — deposito SIAE e ripartizione diritti (1:1 con songs)
-- ============================================================
create table original_works (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null unique references songs (id) on delete cascade,
  siae_deposit_date date,
  siae_code text,
  authors_split jsonb not null default '{}',
  notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table media_items enable row level security;
alter table equipment enable row level security;
alter table original_works enable row level security;

create policy "media_items: full access autenticati" on media_items
  for all to authenticated using (true) with check (true);
create policy "equipment: full access autenticati" on equipment
  for all to authenticated using (true) with check (true);
create policy "original_works: full access autenticati" on original_works
  for all to authenticated using (true) with check (true);
