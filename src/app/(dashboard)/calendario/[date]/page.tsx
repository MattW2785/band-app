import Link from "next/link";
import { notFound } from "next/navigation";
import { format, isMatch, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { EventTypeIcon } from "@/components/events/event-type-icon";
import type { AvailabilityStatus } from "@/types/database";
import { AvailabilityForm } from "./form";
import { getHiddenUserIds } from "@/lib/visibility";

const STATUS_BADGE: Record<AvailabilityStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  disponibile: { label: "Disponibile", variant: "success" },
  forse: { label: "Forse", variant: "warning" },
  non_disponibile: { label: "Non disponibile", variant: "danger" },
};

export default async function CalendarioDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isMatch(date, "yyyy-MM-dd")) notFound();

  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: rawMembers }, { data: availability }, { data: rawEvents }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("profiles").select("id,full_name").order("full_name"),
    supabase.from("availability").select("*").eq("date", date),
    supabase.from("events").select("*").eq("date", date),
  ]);

  const members = (rawMembers ?? []).filter((m) => !hiddenIds.has(m.id));
  const events = (rawEvents ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));

  const byUser = new Map<string, Record<string, AvailabilityStatus>>();
  for (const a of availability ?? []) {
    if (hiddenIds.has(a.user_id)) continue;
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, {});
    byUser.get(a.user_id)![a.time_slot] = a.status;
  }

  const own = byUser.get(userId) ?? {};

  return (
    <div className="max-w-2xl">
      <BackLink href="/calendario">Torna al calendario</BackLink>
      <h1 className="mb-6 mt-2 text-2xl font-semibold capitalize tracking-tight text-zinc-900 dark:text-zinc-100">
        {format(parseISO(date), "EEEE d MMMM yyyy", { locale: it })}
      </h1>

      {events.length > 0 && (
        <Card className="mb-4">
          <h2 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">Eventi in questa data</h2>
          <ul className="space-y-1 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <EventTypeIcon type={e.type} className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                {e.title}
                {e.start_time && <span className="text-zinc-500 dark:text-zinc-400"> · {e.start_time.slice(0, 5)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Disponibilità dei membri</h2>
          <Link href={`/eventi/nuovo?date=${date}`}>
            <Button variant="secondary">+ Crea evento</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-1 font-normal">Membro</th>
                <th className="py-1 font-normal">Mattina</th>
                <th className="py-1 font-normal">Pomeriggio</th>
                <th className="py-1 font-normal">Sera</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const statuses = byUser.get(m.id) ?? {};
                return (
                  <tr key={m.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1.5 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{m.full_name ?? "—"}</td>
                    {(["mattina", "pomeriggio", "sera"] as const).map((slot) => (
                      <td className="py-1.5 whitespace-nowrap" key={slot}>
                        {statuses[slot] ? (
                          <Badge variant={STATUS_BADGE[statuses[slot]].variant} dot>
                            {STATUS_BADGE[statuses[slot]].label}
                          </Badge>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">La tua disponibilità</h2>
        <AvailabilityForm
          date={date}
          initial={{
            mattina: own.mattina ?? "",
            pomeriggio: own.pomeriggio ?? "",
            sera: own.sera ?? "",
          }}
        />
      </Card>
    </div>
  );
}
