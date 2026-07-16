-- BandSpace — Stage plot e rider tecnico come moduli interni strutturati, al posto dei
-- due campi link esterni sull'EPK. Da eseguire una sola volta nell'SQL editor del
-- progetto Supabase, dopo 001-011.

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

alter table stage_plot_items enable row level security;
alter table tech_rider enable row level security;
alter table tech_rider_channels enable row level security;

-- lettura pubblica (servono nell'EPK, come press_kit), scrittura solo autenticati
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

-- press_kit: i due link vengono sostituiti dalle pagine interne
alter table press_kit drop column stage_plot_url;
alter table press_kit drop column tech_rider_url;
