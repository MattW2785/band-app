import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { formatInAppTimezone } from "@/lib/social/timezone";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  await requireSessionProfile();
  const runs = await prisma.cronRunLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const totalPublished = runs.reduce((sum, r) => sum + r.publishedCount, 0);
  const totalFailed = runs.reduce((sum, r) => sum + r.failedCount, 0);

  return (
    <div>
      <PageHeader title="Stato cron di pubblicazione" />

      {runs.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          Nessuna esecuzione registrata. Configura il cron esterno (es. cron-job.org) verso{" "}
          <code className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5">/api/cron/publish</code> con header{" "}
          <code className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5">Authorization: Bearer &lt;CRON_SECRET&gt;</code>.
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Esecuzioni</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{runs.length}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Pubblicati</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{totalPublished}</p>
            </div>
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Falliti</p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{totalFailed}</p>
            </div>
          </div>

          <div className="overflow-hidden overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-left text-zinc-500 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-medium">Avviato</th>
                  <th className="px-4 py-2.5 font-medium">Concluso</th>
                  <th className="px-4 py-2.5 font-medium">Claimed</th>
                  <th className="px-4 py-2.5 font-medium">Pubblicati</th>
                  <th className="px-4 py-2.5 font-medium">Falliti</th>
                  <th className="px-4 py-2.5 font-medium">Errori</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{formatInAppTimezone(run.startedAt)}</td>
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {run.finishedAt ? formatInAppTimezone(run.finishedAt) : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{run.claimedCount}</td>
                    <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400">{run.publishedCount}</td>
                    <td className="px-4 py-2.5 text-red-600 dark:text-red-400">{run.failedCount}</td>
                    <td className="px-4 py-2.5 text-red-600/80 dark:text-red-400/80">{run.errors ? JSON.stringify(run.errors) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
