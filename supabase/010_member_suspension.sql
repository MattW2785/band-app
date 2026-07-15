-- BandSpace — Blocco temporaneo dell'accesso di un membro: a differenza di "hidden"
-- (solo un filtro di visibilità), questa colonna impedisce davvero l'accesso, applicata
-- in src/proxy.ts su ogni richiesta. Da eseguire una sola volta nell'SQL editor del
-- progetto Supabase, dopo 001-009.

alter table profiles add column suspended boolean not null default false;
