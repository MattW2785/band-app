import { prisma } from "@/lib/social/prisma";
import { TargetStatus } from "@/generated/prisma/enums";

const STUCK_THRESHOLD_MS = 15 * 60 * 1000;

// Se la funzione che pubblica crasha a livello di sistema (es. out-of-memory), il nostro
// try/catch non viene mai eseguito e il target resta bloccato in CLAIMED/PUBLISHING per
// sempre. Ad ogni run del cron, chi è fermo lì da troppo tempo viene segnalato per verifica
// manuale invece di restare invisibile.
export async function reconcileStuckTargets(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);
  const result = await prisma.platformTarget.updateMany({
    where: {
      status: { in: [TargetStatus.CLAIMED, TargetStatus.PUBLISHING] },
      claimedAt: { lt: cutoff },
    },
    data: {
      status: TargetStatus.NEEDS_REVIEW,
      lastError: "Bloccato troppo a lungo in elaborazione (probabile crash della funzione) - richiede verifica manuale",
      claimedAt: null,
      claimedBy: null,
    },
  });
  return result.count;
}
