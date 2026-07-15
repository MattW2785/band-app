-- BandSpace — Membri invisibili: consente all'admin di marcare un profilo come "nascosto"
-- (es. un proprio account di lavoro/test), i cui contenuti spariscono dalle viste dei
-- membri non admin. Da eseguire una sola volta nell'SQL editor del progetto Supabase,
-- dopo 001-008.

alter table profiles add column hidden boolean not null default false;
