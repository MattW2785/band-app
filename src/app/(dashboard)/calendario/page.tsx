import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { EventTypeIcon } from "@/components/events/event-type-icon";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function densityClass(density: "none" | "green" | "yellow" | "red") {
  switch (density) {
    case "green":
      return "bg-emerald-50 hover:bg-emerald-100";
    case "yellow":
      return "bg-amber-50 hover:bg-amber-100";
    case "red":
      return "bg-red-50 hover:bg-red-100";
    default:
      return "bg-white hover:bg-zinc-50";
  }
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireSessionProfile();

  const { month: monthParam } = await searchParams;
  const monthDate = monthParam ? parse(`${monthParam}-01`, "yyyy-MM-dd", new Date()) : new Date();
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const rangeStart = format(gridStart, "yyyy-MM-dd");
  const rangeEnd = format(gridEnd, "yyyy-MM-dd");

  const supabase = await createClient();
  const [{ count: totalMembers }, { data: availability }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("availability").select("*").gte("date", rangeStart).lte("date", rangeEnd),
    supabase.from("events").select("id,date,type,title").gte("date", rangeStart).lte("date", rangeEnd),
  ]);

  const byDay = new Map<string, Map<string, string[]>>();
  for (const a of availability ?? []) {
    if (!byDay.has(a.date)) byDay.set(a.date, new Map());
    const perUser = byDay.get(a.date)!;
    if (!perUser.has(a.user_id)) perUser.set(a.user_id, []);
    perUser.get(a.user_id)!.push(a.status);
  }

  const eventsByDay = new Map<string, typeof events>();
  for (const e of events ?? []) {
    if (!eventsByDay.has(e.date)) eventsByDay.set(e.date, []);
    eventsByDay.get(e.date)!.push(e);
  }

  function density(dateStr: string): "none" | "green" | "yellow" | "red" {
    const perUser = byDay.get(dateStr);
    if (!perUser || perUser.size === 0) return "none";
    let availableCount = 0;
    for (const statuses of perUser.values()) {
      if (statuses.includes("disponibile")) availableCount++;
    }
    if (totalMembers && availableCount === totalMembers) return "green";
    if (availableCount > 0) return "yellow";
    return "red";
  }

  const monthLabel = format(monthDate, "MMMM yyyy", { locale: it });
  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div>
      <PageHeader
        title={<span className="capitalize">{monthLabel}</span>}
        action={
          <div className="flex gap-2">
            <Link
              href={`/calendario?month=${prevMonth}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-zinc-50"
            >
              ← Precedente
            </Link>
            <Link
              href={`/calendario?month=${nextMonth}`}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:bg-zinc-50"
            >
              Successivo →
            </Link>
          </div>
        }
      />

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-zinc-400">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(dateStr) ?? [];
          return (
            <Link
              key={dateStr}
              href={`/calendario/${dateStr}`}
              className={cn(
                "flex min-h-20 flex-col rounded-lg border border-zinc-200/80 p-1.5 text-xs transition-colors",
                densityClass(density(dateStr)),
                !isSameMonth(day, monthDate) && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  isToday(day) ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white" : "text-zinc-700"
                )}
              >
                {format(day, "d")}
              </span>
              {dayEvents.map((e) => (
                <span
                  key={e!.id}
                  className="mt-1 flex items-center gap-1 truncate rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-white"
                >
                  <EventTypeIcon type={e!.type} className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{e!.title}</span>
                </span>
              ))}
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        🟩 tutti disponibili · 🟨 parziale · 🟥 pochi/nessuno disponibile · ⬜ nessuna risposta
      </p>
    </div>
  );
}
