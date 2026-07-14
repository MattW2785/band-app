-- BandSpace — Fase 2: motore di business (booking, eventi estesi, economia, notifiche)
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 001-003.

-- ============================================================
-- Nuovi tipi enum
-- ============================================================
create type booking_status as enum ('contattato', 'in_negoziazione', 'confermato', 'annullato', 'pagato');
create type event_status as enum ('da_confermare', 'confermato', 'annullato', 'concluso');
create type transaction_type as enum ('entrata', 'uscita');
create type transaction_category as enum (
  'cachet', 'attrezzatura', 'trasporto', 'sala_prove', 'promozione', 'commissione_booking', 'altro'
);

-- ============================================================
-- profiles — aggiunta email (serve per le notifiche, l'indirizzo vive solo in
-- auth.users di norma; lo copiamo qui per poterlo leggere dal client via RLS)
-- ============================================================
alter table profiles add column email text;
update profiles set email = u.email from auth.users u where profiles.id = u.id;

create or replace function handle_new_user()
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

-- ============================================================
-- venues — anagrafica locali/promoter
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
-- events — estensione Fase 2
-- ============================================================
alter table events add column venue_id uuid references venues (id) on delete set null;
alter table events add column venue_contact_name text;
alter table events add column venue_contact_phone text;
alter table events add column venue_contact_email text;
alter table events add column load_in_time time;
alter table events add column soundcheck_time time;
alter table events add column fee_amount numeric(10, 2);
alter table events add column deposit_amount numeric(10, 2);
alter table events add column deposit_paid boolean not null default false;
alter table events add column technical_rider_notes text;

-- Gli eventi esistenti erano già pianificati: li segniamo come "confermato" così non
-- scompaiono da eventuali viste filtrate per stato. I nuovi eventi creati dal form
-- partiranno invece da 'da_confermare' (vedi default impostato subito dopo).
alter table events add column status event_status not null default 'confermato';
alter table events alter column status set default 'da_confermare';

-- ============================================================
-- booking_leads — trattative con i locali
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
-- transactions — economia e compensi
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
-- event_checklist_templates — checklist di default alla conferma di un evento
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
-- notification_preferences — preferenze email per utente
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
-- Row Level Security
-- ============================================================
alter table venues enable row level security;
alter table booking_leads enable row level security;
alter table transactions enable row level security;
alter table event_checklist_templates enable row level security;
alter table notification_preferences enable row level security;

create policy "venues: full access autenticati" on venues
  for all to authenticated using (true) with check (true);

create policy "booking_leads: full access autenticati" on booking_leads
  for all to authenticated using (true) with check (true);

create policy "transactions: full access autenticati" on transactions
  for all to authenticated using (true) with check (true);

create policy "event_checklist_templates: lettura autenticati" on event_checklist_templates
  for select to authenticated using (true);

-- Lettura aperta a tutti gli autenticati: serve alla logica di invio notifiche
-- per sapere chi vuole ricevere cosa. Scrittura riservata al proprio utente.
create policy "notification_preferences: lettura autenticati" on notification_preferences
  for select to authenticated using (true);

create policy "notification_preferences: inserimento solo il proprio" on notification_preferences
  for insert to authenticated with check (auth.uid() = user_id);

create policy "notification_preferences: aggiornamento solo il proprio" on notification_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
