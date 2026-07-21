import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { AccountStatus, Platform } from "@/generated/prisma/enums";
import MessagesInbox from "./messages-inbox";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";
  const account = await prisma.platformAccount.findUnique({ where: { platform: Platform.INSTAGRAM } });

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Messaggi</h1>

      {!account ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-neutral-800 py-16 text-center">
          <p className="mb-2 text-zinc-500 dark:text-neutral-500">Nessun account Instagram collegato.</p>
          <Link href="/social/accounts" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 underline">
            Collega un account
          </Link>
        </div>
      ) : account.status === AccountStatus.NEEDS_REAUTH ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
          <p className="mb-2">
            L&apos;account Instagram richiede una nuova autorizzazione (serve anche il permesso per leggere i
            messaggi).
          </p>
          <Link href="/social/accounts" className="font-medium underline">
            Riconnetti l&apos;account
          </Link>
        </div>
      ) : (
        <MessagesInbox canSend={isAdmin} />
      )}
    </div>
  );
}
