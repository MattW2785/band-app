import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL non impostata");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy: il client (e il controllo su DATABASE_URL) va creato solo alla prima query
// vera, non al semplice import del modulo. Next.js importa i Route Handler durante
// il build per raccoglierne i metadati, senza mai invocarli: se la connessione fosse
// costruita qui a livello di modulo, il build fallirebbe ovunque manchi DATABASE_URL
// anche per route che a runtime non verranno mai chiamate in quel deploy.
function getPrismaClient(): PrismaClient {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  return global.__prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
