import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Il Band App usa .env.local (convenzione Next.js), non .env: dotenv/config
// di default caricherebbe .env, quindi qui va specificato il path esplicito.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Il CLI (migrate/introspect) usa la connessione diretta: le migration richiedono
    // DDL e lock che non funzionano bene attraverso il pooler transaction-mode di Supabase.
    url: process.env["DIRECT_URL"],
  },
});
