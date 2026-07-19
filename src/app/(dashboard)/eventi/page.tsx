import Link from "next/link";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { EventTypeIcon } from "@/components/events/event-type-icon";
import { getHiddenUserIds } from "@/lib/visibility";

const STATUS_BADGE = {
  da_confermare: { label: "da confermare", variant: "warning" as const },
  confermato: { label: "confermato", variant: "success" as const },
  annullato: { label: "annullato", variant: "danger" as const },
  concluso: { label: "concluso", variant: "neutral" as const },
};

export default async function EventiPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: rawEvents }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("events").select("*").order("date"),
  ]);
  const events = (rawEvents ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Eventi"
        description="Prove e concerti in programma"
        action={
          <Link href="/eventi/nuovo">
            <Button>+ Nuovo evento</Button>
          </Link>
        }
      />

      <div className="space-y-2">
        {events.map((e) => (
          <Link key={e.id} href={`/eventi/${e.id}`}>
            <Card className="flex items-center justify-between hover:border-indigo-200 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <EventTypeIcon type={e.type} className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{e.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {format(parseISO(e.date), "EEEE d MMMM yyyy", { locale: it })}
                    {e.start_time && ` · ${e.start_time.slice(0, 5)}`}
                    {e.location && ` · ${e.location}`}
                    {e.fee_amount !== null && ` · ${e.fee_amount}€`}
                  </p>
                </div>
              </div>
              <Badge variant={STATUS_BADGE[e.status].variant} dot>
                {STATUS_BADGE[e.status].label}
              </Badge>
            </Card>
          </Link>
        ))}

        {events.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun evento in programma.</p>
        )}
      </div>
    </div>
  );
}
