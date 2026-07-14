# BandSpace

Workspace operativo per una band che vuole funzionare come un business: calendario disponibilità, proposte/voto brani con generazione automatica della scaletta, task assegnabili, gestione eventi, pipeline booking/locali, economia e compensi, notifiche email, EPK pubblico, statistiche, bacheca commenti.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Postgres, RLS) + Resend (email).

## Setup

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto.
2. In **Project Settings > API** copia `Project URL`, `anon public key` e `service_role key`.
3. In **SQL Editor**, incolla ed esegui il contenuto di [`supabase/schema.sql`](supabase/schema.sql) (progetto nuovo) — crea tutte le tabelle, gli enum, il trigger che genera il profilo alla creazione di un utente, il bucket Storage per l'archivio media, e le policy RLS di Fase 1 + Fase 2 + Fase 3 + Fase 4.
   - Se stai invece aggiornando un progetto già esistente, esegui in ordine le migrazioni incrementali `supabase/001_*.sql` → ... → `008_*.sql`.
4. In **Authentication > Providers**, assicurati che "Email" sia abilitato. In **Authentication > Settings**, disabilita "Allow new users to sign up" se vuoi impedire la registrazione pubblica (l'accesso è comunque solo su invito tramite la pagina Membri, ma questa opzione blocca anche eventuali signup diretti).
5. In **Authentication > URL Configuration**, imposta il "Site URL" sull'indirizzo dove gira l'app (es. `http://localhost:3000` in sviluppo) e aggiungi `http://localhost:3000/auth/callback` tra i Redirect URLs.

### 2. Crea un account Resend (per le notifiche email)

1. Registrati su [resend.com](https://resend.com) e crea una API key.
2. Senza verificare un dominio proprio, il piano gratuito invia email solo all'indirizzo con cui ti sei registrato (utile per provare in locale, non per notificare tutta la band). Per notificare tutti i membri, verifica un dominio in **Domains** su Resend e usa un mittente su quel dominio.

### 3. Configura le variabili d'ambiente

Copia `.env.local.example` in `.env.local` e compila i valori copiati ai punti precedenti:

```bash
cp .env.local.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY` è usata solo lato server (per invitare i membri) e non deve mai essere esposta al client.

### 4. Installa le dipendenze e avvia il progetto

```bash
npm install
npm run dev
```

### 5. Crea il primo admin

Il primo utente non può auto-registrarsi (gruppo chiuso). Per crearlo:

1. In Supabase, vai su **Authentication > Users > Add user** e crea un utente con la tua email e una password.
2. Nel **SQL Editor**, promuovilo ad admin e impostagli un nome:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Il tuo nome'
   where id = '<uuid dell-utente appena creato>';
   ```
3. Accedi su `/login` con quell'email e password.

Da qui puoi invitare gli altri membri della band dalla pagina **Membri** (visibile solo agli admin): riceveranno un'email con un link per impostare nome e password al primo accesso.

## Deploy in produzione (Vercel)

1. Crea un account su [github.com](https://github.com) e uno su [vercel.com](https://vercel.com) (consigliato: registrati su Vercel con "Continue with GitHub" così sono già collegati).
2. Crea un repository **privato** su GitHub, poi collega questo progetto locale e pusha (vedi comandi guidati in chat, oppure `git remote add origin <url>` seguito da `git push -u origin master`).
3. Su Vercel: **Add New... > Project**, importa il repository — Vercel riconosce Next.js automaticamente, nessuna configurazione di build necessaria.
4. Prima del primo deploy, in **Environment Variables** inserisci le stesse chiavi di `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`) — quest'ultima va impostata sull'URL che Vercel assegnerà (es. `https://band-app.vercel.app`, oppure il tuo dominio personalizzato se ne colleghi uno).
5. Dopo il primo deploy, torna su Supabase in **Authentication > URL Configuration** e aggiorna "Site URL" con l'URL di produzione, aggiungendo anche `https://<il-tuo-dominio>/auth/callback` tra i Redirect URLs (puoi tenere anche quelli di `localhost` per continuare a sviluppare in locale).
6. Ogni `git push` sul branch principale attiva automaticamente un nuovo deploy.

## Struttura del progetto

- `supabase/schema.sql` — schema completo del database per installazioni nuove (tabelle, enum, RLS, trigger)
- `supabase/00N_*.sql` — migrazioni incrementali applicate in ordine su un progetto già esistente
- `src/proxy.ts` — refresh sessione Supabase e protezione delle route (equivalente al `middleware.ts` classico, rinominato in Next.js 16); `/epk` è l'unica route pubblica, senza login
- `src/lib/supabase/` — client Supabase per browser, server e operazioni admin
- `src/lib/auth.ts` — helper per leggere sessione/profilo e proteggere pagine e azioni
- `src/lib/event-automation.ts` — genera automaticamente la checklist di task quando un evento passa a "confermato"
- `src/lib/email.ts` — invio notifiche via Resend, rispettando le preferenze per utente
- `src/lib/activity-log.ts` — registro attività (solo admin, `/registro`) con possibilità di ripristinare gli elementi eliminati
- `src/app/(dashboard)/` — moduli applicativi: calendario, brani, scalette, task, eventi, booking, locali, economia, press-kit, statistiche, media, attrezzatura, siae, membri, profilo
- `src/app/epk/` — pagina pubblica del press kit (nessun login richiesto)
- `src/lib/storage.ts` — upload e URL firmate per il bucket Storage `media` (archivio file)

## Roadmap

- **Fase 1 (MVP)** — completata: autenticazione, calendario, brani/voto/scaletta, task, eventi base
- **Fase 2 (motore di business)** — completata: pipeline booking/locali con automazione evento+checklist, eventi estesi (cachet, acconto, rider tecnico), economia e compensi, notifiche email, registro attività con ripristino
- **Fase 3 (crescita e professionalità)** — completata: EPK/press kit con pagina pubblica stampabile, statistiche come cruscotto di business, bacheca commenti su brani/eventi/task/trattative
- **Fase 4 (gestione operativa avanzata)** — completata: archivio media con upload reale su Supabase Storage (bucket privato, limite 50MB/file), inventario attrezzatura, deposito SIAE e ripartizione diritti d'autore per i brani originali
- **Non ancora implementato**:
  - i promemoria basati sul tempo (disponibilità mancante, scadenza acconto/saldo) richiedono un job schedulato (Supabase Edge Function + `pg_cron`)
  - la lavagna collaborativa (Modulo 10, tldraw + realtime) è stata deliberatamente rimandata: è il modulo più complesso e lo stesso spec la segna come deprioritizzata rispetto ai moduli di business
