import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LastEdited } from "@/components/ui/last-edited";
import { GenerateSetlistForm } from "@/components/setlist/generate-form";
import { DeleteSetlistButton } from "@/components/setlist/delete-setlist-button";
import { duplicateSetlist } from "./actions";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function ScaletteePage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: events }, { data: setlists }, { data: profiles }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("events").select("id,title,date,created_by").order("date"),
    supabase
      .from("setlists")
      .select("*, setlist_items(song_id), events!setlists_event_id_fkey(title)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name"),
  ]);

  const nameById = new Map((profiles ?? []).filter((p) => !hiddenIds.has(p.id)).map((p) => [p.id, p.full_name]));
  const visibleEvents = (events ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));
  const visibleSetlists = (setlists ?? []).filter((s) => !s.created_by || !hiddenIds.has(s.created_by));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Scalette" description="Genera la scaletta dai brani più votati e riordinala a mano" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Genera nuova scaletta</h2>
        <GenerateSetlistForm events={visibleEvents} />
      </Card>

      <div className="space-y-3">
        {visibleSetlists.map((s) => {
          const itemCount = (s.setlist_items as unknown as { song_id: string }[]).length;
          const eventTitle = (s.events as unknown as { title: string } | null)?.title;
          return (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <Link href={`/scalette/${s.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline">
                  {s.title}
                </Link>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {itemCount} brani · target {s.target_duration_minutes} min
                  {eventTitle && ` · ${eventTitle}`}
                </p>
                <LastEdited
                  name={s.updated_by ? (nameById.get(s.updated_by) ?? null) : null}
                  at={s.updated_at}
                  className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500"
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={duplicateSetlist}>
                  <input type="hidden" name="setlist_id" value={s.id} />
                  <Button type="submit" variant="secondary">
                    Duplica
                  </Button>
                </form>
                <DeleteSetlistButton setlistId={s.id} />
              </div>
            </Card>
          );
        })}

        {visibleSetlists.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessuna scaletta creata ancora.</p>}
      </div>
    </div>
  );
}
