-- BandSpace — consente l'eliminazione di un membro
-- Da eseguire una sola volta nell'SQL editor del progetto Supabase, dopo schema.sql.
--
-- Di default, eliminare un profilo che ha proposto brani, creato eventi o scalette
-- sarebbe bloccato dai vincoli di chiave esterna. Questa migrazione li cambia in
-- "on delete set null": eliminando un membro, i contenuti che ha creato restano
-- (con autore impostato a null) invece di essere bloccati o cancellati.

alter table songs drop constraint songs_proposed_by_fkey;
alter table songs add constraint songs_proposed_by_fkey
  foreign key (proposed_by) references profiles (id) on delete set null;

alter table events drop constraint events_created_by_fkey;
alter table events add constraint events_created_by_fkey
  foreign key (created_by) references profiles (id) on delete set null;

alter table setlists drop constraint setlists_created_by_fkey;
alter table setlists add constraint setlists_created_by_fkey
  foreign key (created_by) references profiles (id) on delete set null;

alter table tasks drop constraint tasks_created_by_fkey;
alter table tasks add constraint tasks_created_by_fkey
  foreign key (created_by) references profiles (id) on delete set null;
