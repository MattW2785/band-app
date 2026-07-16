-- BandSpace — Un brano può essere marcato come "proprio" (composizione originale) al momento
-- della proposta o della modifica: solo questi compaiono nella sezione SIAE / SOUNDREEF.
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo 001-012.

alter table songs add column is_original boolean not null default false;
