-- BandSpace — schema completo (Fase 1 MVP + Fase 2 motore di business)
-- Da eseguire una sola volta nell'SQL editor di un progetto Supabase nuovo.
-- Se stai aggiornando un progetto esistente già in Fase 1, usa invece le
-- migrazioni incrementali 001, 002, 003, 004 in ordine.

-- ============================================================
-- Estensioni
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Tipi enum
-- ============================================================
create type user_role as enum ('admin', 'membro');
create type time_slot as enum ('mattina', 'pomeriggio', 'sera');
create type availability_status as enum ('disponibile', 'non_disponibile', 'forse');
create type event_type as enum ('prova', 'concerto');
create type song_status as enum ('proposto', 'in_prova', 'pronto_live', 'scartato');
create type task_status as enum ('da_fare', 'in_corso', 'fatto');
create type booking_status as enum ('contattato', 'in_negoziazione', 'confermato', 'annullato', 'pagato');
create type event_status as enum ('da_confermare', 'confermato', 'annullato', 'concluso');
create type transaction_type as enum ('entrata', 'uscita');
create type transaction_category as enum (
  'cachet', 'attrezzatura', 'trasporto', 'sala_prove', 'promozione', 'commissione_booking', 'altro'
);

-- ============================================================
-- profiles — riga 1:1 con auth.users
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role user_role not null default 'membro',
  hidden boolean not null default false,
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea automaticamente un profilo quando un utente viene invitato/creato in auth.users
-- (email copiata qui perché auth.users non è leggibile dal client via RLS, serve alle notifiche)
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'membro', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- venues — anagrafica locali/promoter (Fase 2)
-- ============================================================
create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  city text,
  capacity integer,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- events — prove e concerti (definita prima di songs/setlists per via del riferimento incrociato)
-- ============================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  type event_type not null,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  location text,
  notes text,
  setlist_id uuid,
  status event_status not null default 'da_confermare',
  venue_id uuid references venues (id) on delete set null,
  venue_contact_name text,
  venue_contact_phone text,
  venue_contact_email text,
  load_in_time time,
  soundcheck_time time,
  fee_amount numeric(10, 2),
  deposit_amount numeric(10, 2),
  deposit_paid boolean not null default false,
  technical_rider_notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- availability
-- ============================================================
create table availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  time_slot time_slot not null,
  status availability_status not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, date, time_slot)
);

-- ============================================================
-- songs
-- ============================================================
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  proposed_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  reference_links text[] not null default '{}',
  key text,
  bpm integer,
  duration_seconds integer not null,
  status song_status not null default 'proposto',
  notes text,
  is_original boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- votes
-- ============================================================
create table votes (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (song_id, user_id)
);

-- ============================================================
-- setlists + setlist_items
-- ============================================================
create table setlists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id) on delete set null,
  title text not null,
  target_duration_minutes integer not null,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events
  add constraint events_setlist_id_fkey
  foreign key (setlist_id) references setlists (id) on delete set null;

create table setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references setlists (id) on delete cascade,
  song_id uuid not null references songs (id) on delete cascade,
  position integer not null,
  unique (setlist_id, song_id)
);

-- ============================================================
-- tasks
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references profiles (id) on delete set null,
  due_date date,
  status task_status not null default 'da_fare',
  related_event_id uuid references events (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- booking_leads — trattative con i locali (Fase 2)
-- ============================================================
create table booking_leads (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues (id),
  event_id uuid references events (id) on delete set null,
  status booking_status not null default 'contattato',
  proposed_date date,
  fee_proposed numeric(10, 2),
  fee_agreed numeric(10, 2),
  deposit_amount numeric(10, 2),
  deposit_paid boolean not null default false,
  contract_url text,
  follow_up_date date,
  owner uuid references profiles (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- transactions — economia e compensi (Fase 2)
-- ============================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  type transaction_type not null,
  amount numeric(10, 2) not null,
  description text,
  category transaction_category not null default 'altro',
  related_event_id uuid references events (id) on delete set null,
  date date not null default current_date,
  paid_by uuid references profiles (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- event_checklist_templates — checklist di default alla conferma di un evento (Fase 2)
-- Nessuna UI di gestione dedicata: modificabile in futuro direttamente qui via SQL.
-- ============================================================
create table event_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  event_type event_type not null,
  title text not null,
  position integer not null
);

insert into event_checklist_templates (event_type, title, position) values
  ('concerto', 'Invia contratto/conferma scritta al locale', 0),
  ('concerto', 'Richiedi acconto', 1),
  ('concerto', 'Pubblica annuncio sui social', 2),
  ('concerto', 'Prepara/controlla attrezzatura', 3),
  ('concerto', 'Invia fattura/richiesta saldo', 4);

-- ============================================================
-- notification_preferences — preferenze email per utente (Fase 2)
-- ============================================================
create table notification_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  email_enabled boolean not null default true,
  notify_new_song boolean not null default true,
  notify_availability_reminder boolean not null default true,
  notify_task_assigned boolean not null default true,
  notify_booking_update boolean not null default true,
  notify_payment_due boolean not null default true
);

-- ============================================================
-- activity_log — registro attività, visibile solo agli admin
-- ============================================================
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_label text,
  detail text,
  snapshot jsonb,
  restored_at timestamptz,
  restored_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index activity_log_created_at_idx on activity_log (created_at desc);

-- ============================================================
-- press_kit — riga singola con id fisso, pagina pubblica /epk
-- ============================================================
create table press_kit (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  band_name text,
  bio_short text,
  bio_long text,
  photo_urls text[] not null default '{}',
  audio_links text[] not null default '{}',
  video_links text[] not null default '{}',
  contact_email text,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into press_kit (id) values ('00000000-0000-0000-0000-000000000001');

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

-- ============================================================
-- stage_plot_items — elenco strumenti/postazioni sul palco
-- ============================================================
create table stage_plot_items (
  id uuid primary key default gen_random_uuid(),
  instrument text not null,
  position text not null,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- tech_rider — riga singola (stesso pattern di press_kit), campi generali
-- ============================================================
create table tech_rider (
  id uuid primary key default '00000000-0000-0000-0000-000000000002',
  pa_requirements text,
  monitor_requirements text,
  power_requirements text,
  notes text,
  updated_by uuid references profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into tech_rider (id) values ('00000000-0000-0000-0000-000000000002');

-- ============================================================
-- tech_rider_channels — channel list (un microfono/DI per canale)
-- ============================================================
create table tech_rider_channels (
  id uuid primary key default gen_random_uuid(),
  channel_number integer,
  source text not null,
  mic_or_di text,
  stand text,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  updated_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — gruppo chiuso, tutti gli autenticati leggono/scrivono
-- ============================================================
alter table profiles enable row level security;
alter table availability enable row level security;
alter table events enable row level security;
alter table songs enable row level security;
alter table votes enable row level security;
alter table setlists enable row level security;
alter table setlist_items enable row level security;
alter table tasks enable row level security;
alter table venues enable row level security;
alter table booking_leads enable row level security;
alter table transactions enable row level security;
alter table event_checklist_templates enable row level security;
alter table notification_preferences enable row level security;
alter table press_kit enable row level security;
alter table comments enable row level security;
alter table stage_plot_items enable row level security;
alter table tech_rider enable row level security;
alter table tech_rider_channels enable row level security;

create policy "profiles: lettura autenticati" on profiles
  for select to authenticated using (true);
create policy "profiles: modifica solo proprio profilo" on profiles
  for update to authenticated using (auth.uid() = id);

create policy "availability: full access autenticati" on availability
  for all to authenticated using (true) with check (true);

create policy "events: full access autenticati" on events
  for all to authenticated using (true) with check (true);

create policy "songs: full access autenticati" on songs
  for all to authenticated using (true) with check (true);

create policy "votes: full access autenticati" on votes
  for all to authenticated using (true) with check (true);

create policy "setlists: full access autenticati" on setlists
  for all to authenticated using (true) with check (true);

create policy "setlist_items: full access autenticati" on setlist_items
  for all to authenticated using (true) with check (true);

create policy "tasks: full access autenticati" on tasks
  for all to authenticated using (true) with check (true);

create policy "venues: full access autenticati" on venues
  for all to authenticated using (true) with check (true);

create policy "booking_leads: full access autenticati" on booking_leads
  for all to authenticated using (true) with check (true);

create policy "transactions: full access autenticati" on transactions
  for all to authenticated using (true) with check (true);

create policy "event_checklist_templates: lettura autenticati" on event_checklist_templates
  for select to authenticated using (true);

create policy "notification_preferences: lettura autenticati" on notification_preferences
  for select to authenticated using (true);

create policy "notification_preferences: inserimento solo il proprio" on notification_preferences
  for insert to authenticated with check (auth.uid() = user_id);

create policy "notification_preferences: aggiornamento solo il proprio" on notification_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table activity_log enable row level security;

create policy "activity_log: lettura solo admin" on activity_log
  for select to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "activity_log: inserimento proprio utente" on activity_log
  for insert to authenticated with check (auth.uid() = user_id);

create policy "press_kit: lettura pubblica" on press_kit
  for select to anon, authenticated using (true);

create policy "press_kit: modifica autenticati" on press_kit
  for update to authenticated using (true) with check (true);

create policy "comments: full access autenticati" on comments
  for all to authenticated using (true) with check (true);

create policy "stage_plot_items: lettura pubblica" on stage_plot_items
  for select to anon, authenticated using (true);
create policy "stage_plot_items: inserimento autenticati" on stage_plot_items
  for insert to authenticated with check (true);
create policy "stage_plot_items: eliminazione autenticati" on stage_plot_items
  for delete to authenticated using (true);

create policy "tech_rider: lettura pubblica" on tech_rider
  for select to anon, authenticated using (true);
create policy "tech_rider: modifica autenticati" on tech_rider
  for update to authenticated using (true) with check (true);

create policy "tech_rider_channels: lettura pubblica" on tech_rider_channels
  for select to anon, authenticated using (true);
create policy "tech_rider_channels: inserimento autenticati" on tech_rider_channels
  for insert to authenticated with check (true);
create policy "tech_rider_channels: eliminazione autenticati" on tech_rider_channels
  for delete to authenticated using (true);

-- ============================================================
-- Storage: bucket privato per l'archivio media (Fase 4)
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

-- ============================================================
-- Primo admin (facoltativo): dopo aver creato manualmente il tuo utente
-- in Authentication > Users, promuovilo eseguendo:
--   update public.profiles set role = 'admin', full_name = 'Il tuo nome'
--   where id = '<uuid-utente>';
-- ============================================================
