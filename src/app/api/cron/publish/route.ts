import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/social/prisma";
import { claimDueTargets } from "@/lib/social/publishing/claim";
import { dispatchClaimedTarget } from "@/lib/social/publishing/orchestrator";
import { reconcileStuckTargets } from "@/lib/social/publishing/reconcile";

// Massimo consentito sul piano Vercel Hobby: senza questo la funzione usa il default
// (molto più corto), rischiando il timeout durante il download+upload di video pesanti.
export const maxDuration = 60;
// Senza questo, Next.js può servire una risposta 200 già in cache invece di rieseguire
// davvero la logica ad ogni chiamata del cron esterno.
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const startedAt = new Date();
  const errors: string[] = [];
  let claimedCount = 0;
  let publishedCount = 0;
  let failedCount = 0;

  try {
    await reconcileStuckTargets();

    const { claimed } = await claimDueTargets();
    claimedCount = claimed.length;

    for (const target of claimed) {
      const outcome = await dispatchClaimedTarget(target);
      if (outcome.success) {
        publishedCount++;
      } else {
        failedCount++;
      }
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  await prisma.cronRunLog.create({
    data: {
      startedAt,
      finishedAt: new Date(),
      claimedCount,
      publishedCount,
      failedCount,
      errors: errors.length ? errors : undefined,
    },
  });

  return NextResponse.json({ ok: errors.length === 0, claimedCount, publishedCount, failedCount, errors });
}
