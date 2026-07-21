import { randomUUID } from "crypto";
import { prisma } from "@/lib/social/prisma";
import { Platform, TargetStatus } from "@/generated/prisma/enums";

export type ClaimedTarget = {
  id: string;
  postId: string;
  platform: Platform;
  previousStatus: TargetStatus;
};

// Claim atomico via FOR UPDATE SKIP LOCKED: se due esecuzioni del cron si sovrappongono,
// solo una delle due può prendere in carico un dato target, evitando doppie pubblicazioni.
// Reclama sia i target "SCHEDULED" scaduti sia quelli "AWAITING_CONTAINER" (macchina a stati
// Instagram/TikTok, per far avanzare il polling del container) — previousStatus dice
// all'orchestrator se deve avviare la pubblicazione da capo o continuare il polling.
export async function claimDueTargets(limit = 20): Promise<{ runId: string; claimed: ClaimedTarget[] }> {
  const runId = randomUUID();

  // YouTube pubblica nativamente a "publishAt": l'upload deve avvenire in anticipo
  // (qui 60 minuti prima) perché YouTube stesso gestisca la puntualità, non il nostro cron.
  // Per i retry (nextAttemptAt valorizzato) niente anticipo: si ritenta esattamente a quell'orario.
  const claimed = await prisma.$queryRaw<ClaimedTarget[]>`
    UPDATE "PlatformTarget" t
    SET status = 'CLAIMED'::"TargetStatus", "claimedAt" = now(), "claimedBy" = ${runId}
    FROM (
      SELECT t2.id, t2.status AS "previousStatus"
      FROM "PlatformTarget" t2
      JOIN "Post" p ON p.id = t2."postId"
      WHERE (
        t2.status = 'SCHEDULED'::"TargetStatus"
        AND (
          CASE
            WHEN t2."nextAttemptAt" IS NOT NULL THEN t2."nextAttemptAt"
            WHEN t2.platform = 'YOUTUBE'::"Platform" THEN COALESCE(t2."scheduledAt", p."scheduledAt") - interval '60 minutes'
            ELSE COALESCE(t2."scheduledAt", p."scheduledAt")
          END
        ) <= now()
      )
      OR (
        t2.status = 'AWAITING_CONTAINER'::"TargetStatus"
        AND COALESCE(t2."nextAttemptAt", now()) <= now()
      )
      ORDER BY COALESCE(t2."nextAttemptAt", t2."scheduledAt", p."scheduledAt") ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    ) sub
    WHERE t.id = sub.id
    RETURNING t.id, t."postId", t.platform, sub."previousStatus";
  `;

  return { runId, claimed };
}
