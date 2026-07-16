-- BandSpace — I brani possono avere più di un link di riferimento (audio/video), e diventa
-- obbligatorio averne almeno uno (validato lato applicazione, non con un vincolo DB, per non
-- rompere i brani già proposti senza link). Da eseguire una sola volta nell'SQL editor del
-- progetto Supabase, dopo 001-010.

alter table songs add column reference_links text[] not null default '{}';
update songs set reference_links = array[reference_link] where reference_link is not null and reference_link <> '';
alter table songs drop column reference_link;
