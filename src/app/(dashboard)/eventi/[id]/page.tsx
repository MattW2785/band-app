import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/events/event-form";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { LastEdited } from "@/components/ui/last-edited";
import { CommentsSection } from "@/components/comments/comments-section";
import { updateEvent } from "../actions";
import { getHiddenUserIds } from "@/lib/visibility";

const STATUS_BADGE = {
  da_confermare: { label: "Da confermare", variant: "warning" as const },
  confermato: { label: "Confermato", variant: "success" as const },
  annullato: { label: "Annullato", variant: "danger" as const },
  concluso: { label: "Concluso", variant: "neutral" as const },
};

export default async function EventoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: event }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("events").select("*").eq("id", id).single(),
  ]);
  if (!event) notFound();

  const [editorNameResult, setlistResult, bookingLeadResult, venuesResult, commentsResult, profilesResult] =
    await Promise.all([
      event.updated_by && !hiddenIds.has(event.updated_by)
        ? supabase.from("profiles").select("full_name").eq("id", event.updated_by).single()
        : null,
      event.setlist_id ? supabase.from("setlists").select("id,title").eq("id", event.setlist_id).single() : null,
      supabase.from("booking_leads").select("id").eq("event_id", id).maybeSingle(),
      supabase.from("venues").select("id,name").order("name"),
      supabase.from("comments").select("*").eq("parent_type", "event").eq("parent_id", id).order("created_at"),
      supabase.from("profiles").select("id,full_name"),
    ]);

  const editorName = editorNameResult?.data?.full_name ?? null;
  const setlist = setlistResult?.data ?? null;
  const bookingLead = bookingLeadResult.data;
  const venues = venuesResult.data ?? [];
  const statusBadge = STATUS_BADGE[event.status];
  const nameById = new Map(
    (profilesResult.data ?? []).filter((p) => !hiddenIds.has(p.id)).map((p) => [p.id, p.full_name])
  );
  const comments = (commentsResult.data ?? [])
    .filter((c) => !c.user_id || !hiddenIds.has(c.user_id))
    .map((c) => ({
      id: c.id,
      text: c.text,
      created_at: c.created_at,
      authorName: c.user_id ? (nameById.get(c.user_id) ?? null) : null,
    }));

  return (
    <div className="max-w-2xl">
      <Link href="/eventi" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
        ← Torna agli eventi
      </Link>
      <div className="mb-6 mt-2 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{event.title}</h1>
        <Badge variant={statusBadge.variant} dot>
          {statusBadge.label}
        </Badge>
      </div>

      {bookingLead && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Trattativa di booking collegata</h2>
            <Link href={`/booking/${bookingLead.id}`}>
              <Button variant="secondary">Apri trattativa →</Button>
            </Link>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Scaletta collegata</h2>
          {setlist ? (
            <Link href={`/scalette/${setlist.id}`}>
              <Button variant="secondary">Apri &quot;{setlist.title}&quot;</Button>
            </Link>
          ) : (
            <Link href="/scalette">
              <Button variant="secondary">Genera scaletta per questo evento</Button>
            </Link>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Dettagli evento</h2>
          <LastEdited name={editorName} at={event.updated_at} />
        </div>
        <EventForm action={updateEvent} initial={event} venues={venues} submitLabel="Salva modifiche" />
      </Card>

      <Card className="mb-4">
        <CommentsSection
          comments={comments}
          parentType="event"
          parentId={event.id}
          revalidatePath={`/eventi/${event.id}`}
        />
      </Card>

      <DeleteEventButton eventId={event.id} />
    </div>
  );
}
