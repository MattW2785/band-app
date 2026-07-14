# BandSpace — Specifiche di Sviluppo

Documento di specifica funzionale e tecnica per lo sviluppo di una web app collaborativa per la gestione di una band musicale. Da usare come brief per Claude Code.

> **Nota di revisione (2026-07-13):** priorità riviste con un'ottica da management musicale. La Fase 1 (MVP operativo) è completata ed è la base solida su cui costruire. Da qui in avanti la priorità va ai moduli che generano o proteggono fatturato — booking, economia, eventi estesi, notifiche — spostati avanti rispetto ai moduli "creativi" (lavagna, archivio media), che restano utili ma non urgenti. Vedi sezione 8 per la roadmap aggiornata.

---

## 1. Obiettivo del prodotto

Creare lo spazio di lavoro operativo di una band che vuole funzionare come un vero business, non solo come un gruppo di amici che suona. La app deve permettere di:

- coordinare la disponibilità dei membri per prove e concerti
- proporre e votare i brani da inserire in scaletta, con generazione automatica della scaletta
- **procacciare e gestire ingaggi** (locali, promoter, trattative, conferme)
- **tracciare entrate, uscite e compensi** legati a ogni concerto
- gestire tutto il resto del "lavoro sporco" della band (task, repertorio, media, attrezzatura)
- collaborare visivamente su una lavagna condivisa (tipo Miro)

Utenti: gruppo chiuso di 3-8 persone (i membri della band), accesso tramite login, nessun pubblico esterno salvo condivisioni specifiche (es. link scaletta per il fonico, press kit per i locali).

---

## 2. Stack tecnico

Stack confermato e già in uso nell'MVP:

- **Frontend**: Next.js (App Router) + TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions / Route Handlers
- **Database**: Supabase Postgres (RLS attiva, gruppo chiuso via invito)
- **Auth**: Supabase Auth, invito via email, no self-signup pubblico
- **Drag&drop**: @dnd-kit (già in uso per scaletta e kanban task)
- **Storage file**: Supabase Storage (per contratti, rider, foto, audio/video)
- **Realtime**: Supabase Realtime, da introdurre quando si costruisce la lavagna condivisa
- **Notifiche email**: da integrare (es. Resend o provider SMTP via Supabase Edge Function) — non ancora implementate, vedi Modulo 8
- **Hosting**: Vercel (frontend) + Supabase (database, auth, storage)

---

## 3. Ruoli utente

- **Admin/Leader**: gestisce membri, trattative di booking, economia; può modificare/eliminare tutto
- **Membro**: accesso completo in lettura/scrittura alle funzioni collaborative (calendario, voti, lavagna, task, media); accesso in lettura ai dati economici, scrittura solo sulle proprie spese
- (Opzionale futuro) **Ospite/Fonico**: accesso in sola lettura a una scaletta condivisa via link pubblico, senza login
- (Opzionale futuro) **Locale/Promoter**: accesso in sola lettura al press kit via link pubblico, senza login

---

## 4. Modulo 1 — Calendario disponibilità *(Fase 1 — implementato)*

### Funzionalità
- Vista calendario mensile/settimanale condivisa
- Ogni membro inserisce la propria disponibilità per giorno/fascia oraria (mattina/pomeriggio/sera)
- Stati possibili: Disponibile / Non disponibile / Forse
- Vista d'insieme che mostra sovrapposizione disponibilità di tutti i membri (evidenziare automaticamente i giorni in cui TUTTI sono disponibili)
- Possibilità di creare un evento (prova o concerto) direttamente su una data con disponibilità confermata

### Modello dati
```
Availability {
  id
  user_id
  date
  time_slot (enum: mattina | pomeriggio | sera)
  status (enum: disponibile | non_disponibile | forse)
  note (opzionale)
}
```

### UI
- Calendario con celle colorate per densità di disponibilità (verde = tutti disponibili, giallo = parziale, rosso = pochi disponibili)
- Click su cella → dettaglio di chi è disponibile e chi no

---

## 5. Modulo 2 — Proposte brani, votazione e scaletta automatica *(Fase 1 — implementato)*

### Funzionalità
- Ogni membro può proporre un brano (titolo, artista/originale, link riferimento audio/video, note)
- Ogni membro vota da 1 a 5 ogni brano proposto (un voto solo a testa, modificabile)
- Calcolo automatico: media voti → ranking
- Generazione automatica di una scaletta proposta in base al ranking, con parametro di durata totale del set
- **Override manuale obbligatorio**: la scaletta generata è riordinabile a mano (drag&drop)
- Scaletta collegata a un Evento specifico
- Storico scalette passate

### Modello dati
```
Song {
  id
  title
  artist (o "originale")
  proposed_by (user_id)
  reference_link
  key (tonalità, opzionale)
  bpm (opzionale)
  duration_seconds
  status (enum: proposto | in_prova | pronto_live | scartato)
  notes
}

Vote {
  id
  song_id
  user_id
  score (1-5)
}

Setlist {
  id
  event_id (nullable se è una scaletta "modello" non ancora legata a un evento)
  title
  target_duration_minutes
  created_at
}

SetlistItem {
  id
  setlist_id
  song_id
  position (ordine manuale)
}
```

### Logica generazione automatica
1. Calcolare punteggio medio per ogni brano con stato "pronto_live" o "in_prova" (escludere "scartato")
2. Ordinare per punteggio decrescente
3. Aggiungere brani alla scaletta finché la somma delle durate non supera il target_duration_minutes
4. Presentare risultato come bozza modificabile

---

## 6. Modulo 3 — Task assegnabili *(Fase 1 — implementato)*

```
Task {
  id
  title
  description
  assigned_to (user_id, nullable)
  due_date (nullable)
  status (enum: da_fare | in_corso | fatto)
  related_event_id (nullable, collega il task a un concerto/prova specifico)
}
```
UI: board kanban (da fare / in corso / fatto), filtro per persona assegnata.

---

## 7. Modulo 4 — Pipeline booking e locali *(NUOVO — Fase 2, priorità alta)*

Questo è il modulo che manca di più a un'app che vuole far vivere di musica la band: senza una pipeline di trattative non c'è modo di procacciare lavoro in modo organizzato, si finisce a gestire tutto su WhatsApp e si perdono occasioni.

### Funzionalità
- Anagrafica locali/promoter con contatti e storico
- Ogni trattativa è tracciata con uno stato (contattato → in negoziazione → confermato → annullato → pagato)
- Cachet proposto vs concordato, acconto richiesto/versato
- Promemoria di follow-up (per non lasciar cadere una trattativa)
- Alla conferma, la trattativa genera automaticamente l'Evento collegato (vedi Modulo 5)

### Modello dati
```
Venue {
  id
  name
  contact_name
  contact_email
  contact_phone
  city
  capacity (opzionale)
  notes
}

BookingLead {
  id
  venue_id
  event_id (nullable, valorizzato alla conferma)
  status (enum: contattato | in_negoziazione | confermato | annullato | pagato)
  proposed_date
  fee_proposed
  fee_agreed (opzionale)
  deposit_amount (opzionale)
  deposit_paid (bool)
  contract_url (opzionale, link a file in storage)
  follow_up_date (opzionale)
  owner (user_id, chi segue la trattativa)
  created_at
  updated_at
}
```

### UI
- Board kanban per stato trattativa (simile a quello già usato per i task)
- Vista lista locali con storico concerti fatti presso ciascuno
- Alert per trattative senza follow-up da più di N giorni

---

## 8. Modulo 5 — Eventi estesi e automazione *(ex 7.2 — Fase 2, priorità alta)*

Estende l'entità Event già esistente (Modulo 1) con i dati necessari a trattare con un locale da professionisti, e automatizza il lavoro "sporco" che circonda ogni data confermata.

### Modello dati
```
Event {
  ...
  venue_id (nullable, collega al Modulo 4)
  venue_contact_name
  venue_contact_phone
  venue_contact_email
  load_in_time
  soundcheck_time
  fee_amount (opzionale)
  deposit_amount (opzionale)
  deposit_paid (bool)
  technical_rider_notes
  setlist_id
}
```

### Automazione task
Quando un Evento passa a stato "confermato", generare automaticamente una checklist di task standard collegati (related_event_id), ad esempio:
- Invia contratto/conferma scritta al locale
- Richiedi acconto
- Pubblica annuncio sui social
- Invia fattura/richiesta saldo (a ridosso della data)
- Prepara/controlla attrezzatura

Lista di task di default configurabile per tipo evento (prova / concerto), non hardcoded nel codice.

---

## 9. Modulo 6 — Economia e compensi *(ex 7.4 — Fase 2, priorità alta)*

Anticipato dalla Fase 4 originale: un manager deve sapere in ogni momento se la band ci sta guadagnando o rimettendoci. Questo modulo è il cruscotto finanziario, non un accessorio.

### Modello dati
```
Transaction {
  id
  type (enum: entrata | uscita)
  amount
  description
  category (enum: cachet | attrezzatura | trasporto | sala_prove | promozione | commissione_booking | altro)
  related_event_id (nullable)
  date
  paid_by (user_id, opzionale)
  created_by
}
```

### UI
- Saldo totale e andamento nel tempo
- Storico movimenti filtrabile per categoria/evento
- Margine per singolo concerto (entrate legate all'evento − uscite legate all'evento)
- Calcolo automatico della quota spettante a testa

---

## 10. Modulo 7 — Notifiche *(Fase 2, priorità alta)*

Era già prevista come requisito non funzionale ma mai costruita: senza notifiche nessuno vota i brani in tempo, nessuno inserisce la disponibilità, e le trattative di booking muoiono per mancanza di follow-up. Va trattata come modulo a sé, non come dettaglio finale.

### Funzionalità
- Email automatiche su: nuovo brano proposto, promemoria disponibilità mancante, task assegnato, nuova trattativa booking creata/aggiornata, scadenza acconto/saldo in avvicinamento
- Preferenze di notifica per utente (quali email ricevere)
- Provider consigliato: Resend o SMTP via Supabase Edge Function

### Modello dati
```
NotificationPreference {
  user_id
  email_enabled (bool)
  notify_new_song (bool)
  notify_availability_reminder (bool)
  notify_task_assigned (bool)
  notify_booking_update (bool)
  notify_payment_due (bool)
}
```

---

## 11. Modulo 8 — EPK / Press kit *(NUOVO — Fase 3)*

Strumento standard di qualsiasi manager: un kit pronto da mandare a locali, festival e promoter senza doverlo rimontare ogni volta a mano.

### Funzionalità
- Bio breve e lunga, foto, stage plot, rider tecnico, link audio/video
- Esportabile in PDF e/o pagina pubblica condivisibile via link (no login), sullo stesso principio della scaletta pubblica per il fonico

### Modello dati
```
PressKit {
  id
  bio_short
  bio_long
  photo_urls (array)
  stage_plot_url (opzionale)
  tech_rider_url (opzionale)
  audio_links (array)
  video_links (array)
  contact_email
  updated_at
}
```

---

## 12. Modulo 9 — Statistiche come cruscotto di business *(ex 7.7 — Fase 3)*

Non più "nice to have" generico ma KPI orientati a capire se la band sta crescendo come attività:

- margine medio per concerto, cachet medio, costo medio
- tasso di conversione booking (trattative contattate → confermate)
- numero concerti fatti nell'anno e trend
- affidabilità disponibilità per membro (% di richieste a cui risponde in tempo)
- brano più suonato dal vivo (da storico scalette) e brano più votato di sempre

---

## 13. Modulo 10 — Lavagna collaborativa (tipo Miro) *(ex Modulo 3 — Fase 3/4, deprioritizzata)*

Utile per il lavoro creativo (arrangiamenti, brainstorming), ma non incide direttamente su ingaggi o incassi: spostata dopo i moduli di business.

### Funzionalità
- Canvas infinito con zoom/pan
- Elementi inseribili: post-it colorati con testo, testo libero, immagini (upload), frecce/linee di collegamento, forme semplici, evidenziatore
- Multi-utente in tempo reale (cursori degli altri membri, aggiornamenti live)
- Board multiple, organizzabili per argomento
- Salvataggio automatico

### Note tecniche
- Consigliata libreria **tldraw** (open source, React, canvas infinito, collaborazione realtime) invece di costruire da zero un motore canvas
- In alternativa **Excalidraw**
- Sincronizzazione realtime tramite Supabase Realtime o backend realtime di tldraw/Excalidraw

### Modello dati
```
Board {
  id
  title
  created_by
  updated_at
}

BoardSnapshot {
  board_id
  data (JSON, contenuto serializzato del canvas — formato dipende dalla libreria scelta)
  updated_at
}
```

---

## 14. Modulo 11 — Archivio media *(ex 7.3 — Fase 4)*

```
MediaItem {
  id
  type (enum: audio | video | immagine | documento)
  file_url
  title
  related_song_id (nullable)
  related_event_id (nullable)
  uploaded_by
  uploaded_at
}
```
Uso: registrazioni prove, basi/backing track, foto/video per social, spartiti/tab in PDF.

---

## 15. Modulo 12 — Bacheca annunci/commenti *(ex 7.6 — Fase 4)*

```
Comment {
  id
  parent_type (enum: song | event | task | booking_lead)
  parent_id
  user_id
  text
  created_at
}
```
Commenti agganciati a brani/eventi/task/trattative specifiche invece di una chat generica.

---

## 16. Modulo 13 — Inventario attrezzatura *(ex 7.5 — Fase 4)*

```
Equipment {
  id
  name
  owner (user_id o "band")
  category (enum: chitarra | basso | batteria | ampli | microfoni | cavi | altro)
  last_maintenance_date (nullable)
  notes
}
```

---

## 17. Modulo 14 — SIAE / split diritti d'autore *(ex 7.8 — condizionale, solo se la band scrive brani originali)*

```
OriginalWork {
  id
  song_id
  siae_deposit_date (nullable)
  siae_code (nullable)
  authors_split (JSON: { user_id: percentuale })
  notes
}
```

---

## 18. Roadmap di sviluppo aggiornata

### Fase 1 — MVP operativo (COMPLETATA)
1. Autenticazione + gestione membri (invito via email)
2. Calendario disponibilità (Modulo 1)
3. Proposte brani + votazione + generazione scaletta (Modulo 2)
4. Task assegnabili (Modulo 3)
5. Gestione eventi base (data, luogo, orario)

### Fase 2 — Motore di business (priorità immediata)
6. Pipeline booking e locali (Modulo 4)
7. Eventi estesi e automazione task (Modulo 5)
8. Economia e compensi (Modulo 6)
9. Notifiche email (Modulo 7)

### Fase 3 — Crescita e professionalità
10. EPK / press kit (Modulo 8)
11. Statistiche come cruscotto KPI di business (Modulo 9)
12. Lavagna collaborativa (Modulo 10)
13. Bacheca commenti (Modulo 12)

### Fase 4 — Gestione operativa avanzata
14. Archivio media (Modulo 11)
15. Inventario attrezzatura (Modulo 13)
16. SIAE/split diritti (Modulo 14, solo se rilevante per la band)

---

## 19. Requisiti non funzionali

- Responsive: utilizzo previsto sia da desktop (per la lavagna) che da smartphone (per inserire disponibilità/votare al volo, o aggiornare una trattativa di booking in mobilità)
- Notifiche email trattate come modulo prioritario (vedi Modulo 7), non più opzionale
- Numero utenti contenuto (3-8 persone): non servono ottimizzazioni per scala, ma serve buona UX realtime sulla lavagna
- Backup automatico del database
- Dati economici e trattative di booking visibili a tutti i membri in lettura, per trasparenza sul reale stato del "business band"

---

## 20. Prompt di avvio suggerito per Claude Code (prossima fase)

> "Continua lo sviluppo di BandSpace, web app Next.js + TypeScript + Tailwind + Supabase già in Fase 1 (MVP) completata. Implementa ora la Fase 2 della roadmap in specifiche-band-workspace.md: pipeline booking/locali (Modulo 4), eventi estesi con automazione task (Modulo 5), economia e compensi (Modulo 6), notifiche email (Modulo 7). Struttura il database secondo i modelli dati descritti nelle sezioni 7, 8, 9 e 10, mantenendo lo stesso stile di RLS e audit trail (created_by/updated_by) già usato nello schema esistente. Riusa i componenti UI esistenti (kanban, drag&drop, form pattern) dove possibile."

---

*Documento aggiornato dopo revisione delle priorità con logica di management musicale (2026-07-13).*
