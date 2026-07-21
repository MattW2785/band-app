import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { prisma } from "@/lib/social/prisma";
import { APP_TIMEZONE, localDateKey, formatTimeInAppTimezone } from "@/lib/social/timezone";
import { fetchOnlineFollowers, buildHeatmapGrid } from "@/lib/social/insights/instagram";
import WeekDatePicker from "./week-date-picker";

export const dynamic = "force-dynamic";

const PLATFORM_COLOR: Record<string, string> = {
  INSTAGRAM: "bg-purple-600 text-white",
  YOUTUBE: "bg-red-600 text-white",
  TIKTOK: "bg-cyan-600 text-white",
};

const PLATFORM_INITIAL: Record<string, string> = {
  YOUTUBE: "YT",
  INSTAGRAM: "IG",
  TIKTOK: "TT",
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function addDaysToKey(key: string, days: number): string {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayMondayFirst(key: string): number {
  const jsDay = new Date(`${key}T00:00:00.000Z`).getUTCDay();
  return (jsDay + 6) % 7;
}

function mondayOfWeek(key: string): string {
  return addDaysToKey(key, -weekdayMondayFirst(key));
}

function formatRangeLabel(startKey: string, endKey: string): string {
  const fmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const start = fmt.format(new Date(`${startKey}T00:00:00.000Z`));
  const end = fmt.format(new Date(`${endKey}T00:00:00.000Z`));
  return `${start} - ${end}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { profile } = await requireSessionProfile();
  const isAdmin = profile.role === "admin";
  const { date: dateParam } = await searchParams;

  const todayKey = localDateKey(new Date());
  const requestedKey = dateParam && DATE_KEY_RE.test(dateParam) ? dateParam : todayKey;
  const weekStartKey = mondayOfWeek(requestedKey);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysToKey(weekStartKey, i));
  const weekEndKey = weekDates[6];

  const posts = await prisma.post.findMany({
    orderBy: { scheduledAt: "asc" },
    take: 500,
    include: { targets: true },
  });

  type CellItem = { post: (typeof posts)[number]; target: (typeof posts)[number]["targets"][number] };
  const itemsByCell = new Map<string, CellItem[]>();
  for (const post of posts) {
    for (const target of post.targets) {
      const effective = target.scheduledAt ?? post.scheduledAt;
      const key = `${localDateKey(effective)}T${formatTimeInAppTimezone(effective).slice(0, 2)}`;
      if (!itemsByCell.has(key)) itemsByCell.set(key, []);
      itemsByCell.get(key)!.push({ post, target });
    }
  }

  let grid: number[][] | null = null;
  let heatmapError: string | null = null;
  try {
    const points = await fetchOnlineFollowers();
    grid = buildHeatmapGrid(points);
  } catch (err) {
    heatmapError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-3 sm:relative sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Calendario</h1>
        <div className="sm:absolute sm:left-1/2 sm:top-1/2 sm:z-20 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <WeekDatePicker selectedDateKey={requestedKey} rangeLabel={formatRangeLabel(weekStartKey, weekEndKey)} />
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap sm:justify-end">
          <Link
            href="/social/posts/new"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            + Nuovo post
          </Link>
        </div>
      </div>

      {heatmapError && (
        <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300">
          Heatmap del miglior orario non disponibile: {heatmapError}. Il calendario resta comunque utilizzabile,{" "}
          <Link href="/social/accounts" className="font-medium underline">
            riconnetti Instagram
          </Link>{" "}
          per riattivarla.
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <p className="max-w-xl text-xs text-zinc-500 dark:text-neutral-600">
          Clicca su una cella vuota per programmare un nuovo post in quell&apos;orario. Il colore di sfondo indica il
          periodo migliore (follower online) su Instagram. Orari in {APP_TIMEZONE}.
        </p>
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600"></span> Instagram
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600"></span> YouTube
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-600"></span> TikTok
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-16 border-b border-neutral-800 bg-neutral-900/80 p-2"></th>
              {weekDates.map((dateKey, i) => (
                <th
                  key={dateKey}
                  className={`border-b border-l border-neutral-800 bg-neutral-900/80 px-2 py-2 font-medium ${
                    dateKey === todayKey ? "text-indigo-300" : "text-neutral-400"
                  }`}
                >
                  {WEEKDAY_LABELS[i]} {Number(dateKey.slice(8, 10))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-neutral-900 px-2 py-1 text-right align-top text-neutral-500">
                  {pad2(hour)}:00
                </td>
                {weekDates.map((dateKey, dayIdx) => {
                  const value = grid?.[dayIdx]?.[hour] ?? null;
                  const items = itemsByCell.get(`${dateKey}T${pad2(hour)}`) ?? [];
                  const bg = value != null ? `rgba(99, 102, 241, ${Math.max(value, 4) / 200})` : undefined;

                  return (
                    <td
                      key={dateKey}
                      className="relative min-h-[40px] border-b border-l border-neutral-900 p-0 align-top"
                      style={{ backgroundColor: bg }}
                    >
                      <Link
                        href={`/social/posts/new?at=${dateKey}T${pad2(hour)}:00`}
                        aria-label={`Crea post per ${dateKey} alle ${pad2(hour)}:00`}
                        className="absolute inset-0 z-0"
                      />
                      {value != null && (
                        <span className="pointer-events-none absolute right-1 top-0.5 z-[1] text-[10px] text-neutral-500">
                          {value}%
                        </span>
                      )}
                      <div className="pointer-events-none relative z-10 flex min-h-[40px] flex-wrap content-start gap-1 p-1">
                        {items.map(({ post, target }) => {
                          const badgeClassName = `pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                            PLATFORM_COLOR[target.platform] ?? "bg-neutral-800 text-neutral-200"
                          }`;
                          const badgeTitle = `${PLATFORM_INITIAL[target.platform] ?? target.platform} · ${post.baseCaption || "(senza caption)"} · ${target.status}`;
                          return isAdmin ? (
                            <Link
                              key={target.id}
                              href={target.status === "SCHEDULED" ? `/social/posts/${post.id}/edit` : "/social/posts"}
                              className={badgeClassName}
                              title={badgeTitle}
                            >
                              {PLATFORM_INITIAL[target.platform] ?? target.platform}
                            </Link>
                          ) : (
                            <span key={target.id} className={badgeClassName} title={badgeTitle}>
                              {PLATFORM_INITIAL[target.platform] ?? target.platform}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
