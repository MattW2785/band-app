import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { formatInAppTimezone } from "@/lib/social/timezone";
import { Platform, TargetStatus } from "@/generated/prisma/enums";
import { fetchMediaMetrics, type MediaMetrics } from "@/lib/social/insights/instagram";
import { fetchVideoMetrics, type VideoMetrics } from "@/lib/social/insights/youtube";

export const dynamic = "force-dynamic";

const numberFmt = new Intl.NumberFormat("it-IT");
const fmt = (n: number | null | undefined) => (n == null ? "—" : numberFmt.format(n));

function sum(values: (number | null)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <p className="mb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function ReauthNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
      <p className="mb-2">Impossibile recuperare i dati: {message}</p>
      <p>
        Se il token è scaduto,{" "}
        <Link href="/social/accounts" className="font-medium underline">
          riconnetti l&apos;account
        </Link>{" "}
        dalla pagina Account.
      </p>
    </div>
  );
}

export default async function AnalyticsPage() {
  await requireSessionProfile();
  const targets = await prisma.platformTarget.findMany({
    where: {
      status: TargetStatus.PUBLISHED,
      platform: { in: [Platform.INSTAGRAM, Platform.YOUTUBE] },
      externalPostId: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
    include: { post: true },
  });

  const igTargets = targets.filter((t) => t.platform === Platform.INSTAGRAM);
  const ytTargets = targets.filter((t) => t.platform === Platform.YOUTUBE);

  let igMetrics: Record<string, MediaMetrics> = {};
  let igError: string | null = null;
  if (igTargets.length > 0) {
    try {
      igMetrics = await fetchMediaMetrics(igTargets.map((t) => t.externalPostId!));
    } catch (err) {
      igError = err instanceof Error ? err.message : String(err);
    }
  }

  let ytMetrics: Record<string, VideoMetrics> = {};
  let ytError: string | null = null;
  if (ytTargets.length > 0) {
    try {
      ytMetrics = await fetchVideoMetrics(ytTargets.map((t) => t.externalPostId!));
    } catch (err) {
      ytError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <div>
      <PageHeader title="Analytics" />

      {targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 py-16 text-center">
          <p className="text-zinc-500 dark:text-zinc-500">Nessun post pubblicato ancora.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {igTargets.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">Instagram</h2>
              {igError ? (
                <ReauthNotice message={igError} />
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiCard label="Post pubblicati" value={fmt(igTargets.length)} />
                    <KpiCard label="Reach totale" value={fmt(sum(igTargets.map((t) => igMetrics[t.externalPostId!]?.reach ?? null)))} />
                    <KpiCard label="Like totali" value={fmt(sum(igTargets.map((t) => igMetrics[t.externalPostId!]?.likeCount ?? null)))} />
                    <KpiCard label="Commenti totali" value={fmt(sum(igTargets.map((t) => igMetrics[t.externalPostId!]?.commentsCount ?? null)))} />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">Data</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">Caption</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Reach</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Like</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Commenti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {igTargets.map((t) => {
                          const m = igMetrics[t.externalPostId!];
                          return (
                            <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                                {t.publishedAt ? formatInAppTimezone(t.publishedAt) : "—"}
                              </td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-zinc-700 dark:text-zinc-200">
                                {t.externalPermalink ? (
                                  <a href={t.externalPermalink} target="_blank" rel="noreferrer" className="hover:underline">
                                    {t.description || t.post.baseCaption || "(nessuna caption)"}
                                  </a>
                                ) : (
                                  t.description || t.post.baseCaption || "(nessuna caption)"
                                )}
                              </td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.reach)}</td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.likeCount)}</td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.commentsCount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

          {ytTargets.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">YouTube</h2>
              {ytError ? (
                <ReauthNotice message={ytError} />
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <KpiCard label="Video pubblicati" value={fmt(ytTargets.length)} />
                    <KpiCard label="Visualizzazioni totali" value={fmt(sum(ytTargets.map((t) => ytMetrics[t.externalPostId!]?.viewCount ?? null)))} />
                    <KpiCard label="Like totali" value={fmt(sum(ytTargets.map((t) => ytMetrics[t.externalPostId!]?.likeCount ?? null)))} />
                    <KpiCard label="Commenti totali" value={fmt(sum(ytTargets.map((t) => ytMetrics[t.externalPostId!]?.commentCount ?? null)))} />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">Data</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">Titolo</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Visualizzazioni</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Like</th>
                          <th className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-right">Commenti</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ytTargets.map((t) => {
                          const m = ytMetrics[t.externalPostId!];
                          return (
                            <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                                {t.publishedAt ? formatInAppTimezone(t.publishedAt) : "—"}
                              </td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-zinc-700 dark:text-zinc-200">
                                {t.externalPermalink ? (
                                  <a href={t.externalPermalink} target="_blank" rel="noreferrer" className="hover:underline">
                                    {t.title || t.post.baseCaption || "(senza titolo)"}
                                  </a>
                                ) : (
                                  t.title || t.post.baseCaption || "(senza titolo)"
                                )}
                              </td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.viewCount)}</td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.likeCount)}</td>
                              <td className="border-b border-zinc-100 dark:border-zinc-900 px-3 py-2 text-right text-zinc-700 dark:text-zinc-200">{fmt(m?.commentCount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
