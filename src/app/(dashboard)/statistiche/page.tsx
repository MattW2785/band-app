import { format, isWithinInterval, parseISO, startOfYear, endOfYear, subYears, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { getHiddenUserIds } from "@/lib/visibility";

function euro(n: number) {
  return `${n.toFixed(2)}€`;
}

export default async function StatistichePage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const hiddenIds = await getHiddenUserIds(supabase, userId, profile.role === "admin");

  const [
    { data: rawTransactions },
    { data: rawEvents },
    { data: bookingLeads },
    { data: rawSetlistItems },
    { data: rawSongs },
    { data: rawAvailability },
    { data: rawMembers },
  ] = await Promise.all([
    supabase.from("transactions").select("type, amount, related_event_id, created_by"),
    supabase.from("events").select("id, type, date, status, fee_amount, created_by"),
    supabase.from("booking_leads").select("status"),
    supabase.from("setlist_items").select("song_id, songs(proposed_by)"),
    supabase.from("songs").select("id, title, proposed_by, votes(user_id, score)"),
    supabase.from("availability").select("user_id, date"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const members = (rawMembers ?? []).filter((m) => !hiddenIds.has(m.id));
  const transactions = (rawTransactions ?? []).filter((t) => !t.created_by || !hiddenIds.has(t.created_by));
  const events = (rawEvents ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));
  const songs = (rawSongs ?? []).filter((s) => !s.proposed_by || !hiddenIds.has(s.proposed_by));
  const availability = (rawAvailability ?? []).filter((a) => !hiddenIds.has(a.user_id));
  const setlistItems = (rawSetlistItems ?? []).filter((item) => {
    const song = item.songs as unknown as { proposed_by: string | null } | null;
    return !song?.proposed_by || !hiddenIds.has(song.proposed_by);
  });

  // ---- Economia per concerto ----
  const concertEvents = events.filter((e) => e.type === "concerto");
  const concertEventIds = new Set(concertEvents.map((e) => e.id));

  const txByEvent = new Map<string, { entrate: number; uscite: number }>();
  for (const t of transactions) {
    if (!t.related_event_id || !concertEventIds.has(t.related_event_id)) continue;
    const bucket = txByEvent.get(t.related_event_id) ?? { entrate: 0, uscite: 0 };
    if (t.type === "entrata") bucket.entrate += t.amount;
    else bucket.uscite += t.amount;
    txByEvent.set(t.related_event_id, bucket);
  }

  const margini = Array.from(txByEvent.values()).map((b) => b.entrate - b.uscite);
  const margineMedio = margini.length ? margini.reduce((s, v) => s + v, 0) / margini.length : null;

  const costi = Array.from(txByEvent.values())
    .map((b) => b.uscite)
    .filter((v) => v > 0);
  const costoMedio = costi.length ? costi.reduce((s, v) => s + v, 0) / costi.length : null;

  const cachets = concertEvents.map((e) => e.fee_amount).filter((v): v is number => v != null);
  const cachetMedio = cachets.length ? cachets.reduce((s, v) => s + v, 0) / cachets.length : null;

  // ---- Conversione booking ----
  const totalLeads = bookingLeads?.length ?? 0;
  const confirmedLeads = (bookingLeads ?? []).filter(
    (l) => l.status === "confermato" || l.status === "pagato"
  ).length;
  const conversionRate = totalLeads > 0 ? (confirmedLeads / totalLeads) * 100 : null;

  // ---- Concerti nell'anno ----
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));

  const concertiQuestAnno = concertEvents.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: yearStart, end: yearEnd })
  ).length;
  const concertiAnnoScorso = concertEvents.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: lastYearStart, end: lastYearEnd })
  ).length;

  // ---- Affidabilità disponibilità per membro (ultimi 90 giorni) ----
  const rangeStart = subDays(now, 90);
  const eventDatesInRange = new Set(
    events
      .filter((e) => isWithinInterval(parseISO(e.date), { start: rangeStart, end: now }))
      .map((e) => e.date)
  );

  const availByUserDate = new Map<string, Set<string>>();
  for (const a of availability) {
    if (!eventDatesInRange.has(a.date)) continue;
    if (!availByUserDate.has(a.user_id)) availByUserDate.set(a.user_id, new Set());
    availByUserDate.get(a.user_id)!.add(a.date);
  }

  const affidabilita = members.map((m) => {
    const answered = availByUserDate.get(m.id)?.size ?? 0;
    const total = eventDatesInRange.size;
    return { name: m.full_name, pct: total > 0 ? (answered / total) * 100 : null };
  });

  // ---- Top brani suonati dal vivo ----
  const playCount = new Map<string, number>();
  for (const item of setlistItems) {
    playCount.set(item.song_id, (playCount.get(item.song_id) ?? 0) + 1);
  }
  const songTitleById = new Map(songs.map((s) => [s.id, s.title]));
  const topPlayed = Array.from(playCount.entries())
    .map(([songId, count]) => ({ title: songTitleById.get(songId) ?? "—", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ---- Top brani votati ----
  const topVoted = songs
    .map((s) => {
      const votes = (s.votes as unknown as { user_id: string; score: number }[]).filter(
        (v) => !hiddenIds.has(v.user_id)
      );
      const avg = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : 0;
      return { title: s.title, avg, count: votes.length };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const stats = [
    { label: "Margine medio/concerto", value: margineMedio !== null ? euro(margineMedio) : "—" },
    { label: "Cachet medio", value: cachetMedio !== null ? euro(cachetMedio) : "—" },
    { label: "Costo medio/concerto", value: costoMedio !== null ? euro(costoMedio) : "—" },
    {
      label: "Conversione booking",
      value: conversionRate !== null ? `${conversionRate.toFixed(0)}%` : "—",
      hint: `${confirmedLeads}/${totalLeads} trattative`,
    },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="Statistiche" description="Il cruscotto di business della band" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-zinc-400">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-zinc-500">{s.hint}</p>}
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900">Concerti</h2>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-2xl font-semibold text-zinc-900">{concertiQuestAnno}</p>
            <p className="text-xs text-zinc-500">nel {format(now, "yyyy")}</p>
          </div>
          <span className="text-zinc-400">
            {concertiQuestAnno >= concertiAnnoScorso ? "▲" : "▼"} rispetto a {concertiAnnoScorso} nel{" "}
            {format(subYears(now, 1), "yyyy")}
          </span>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900">Affidabilità disponibilità (ultimi 90 giorni)</h2>
        {affidabilita.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun dato disponibile.</p>
        ) : (
          <ul className="space-y-2">
            {affidabilita.map((a) => (
              <li key={a.name} className="flex items-center gap-3 text-sm">
                <Avatar name={a.name ?? "?"} className="h-6 w-6 text-[10px]" />
                <span className="flex-1 text-zinc-700">{a.name}</span>
                <span className="text-zinc-500">{a.pct !== null ? `${a.pct.toFixed(0)}%` : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium text-zinc-900">Brani più suonati dal vivo</h2>
          {topPlayed.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessuna scaletta ancora.</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {topPlayed.map((s, i) => (
                <li key={s.title + i} className="flex items-center justify-between">
                  <span className="text-zinc-700">
                    {i + 1}. {s.title}
                  </span>
                  <span className="text-zinc-500">{s.count}×</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-medium text-zinc-900">Brani più votati</h2>
          {topVoted.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun voto ancora.</p>
          ) : (
            <ol className="space-y-1.5 text-sm">
              {topVoted.map((s, i) => (
                <li key={s.title + i} className="flex items-center justify-between">
                  <span className="text-zinc-700">
                    {i + 1}. {s.title}
                  </span>
                  <span className="text-zinc-500">
                    {s.avg.toFixed(1)} ({s.count})
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
