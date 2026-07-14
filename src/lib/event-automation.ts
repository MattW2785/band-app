import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Genera la checklist di task di default per un evento appena confermato.
 * Idempotente: non duplica task il cui titolo esiste già per lo stesso evento,
 * così può essere richiamata ogni volta che un evento viene salvato come "confermato".
 */
export async function ensureConfirmationChecklist(
  supabase: SupabaseServerClient,
  eventId: string,
  eventType: EventType,
  userId: string
) {
  const { data: templates } = await supabase
    .from("event_checklist_templates")
    .select("title")
    .eq("event_type", eventType)
    .order("position");

  if (!templates || templates.length === 0) return;

  const { data: existingTasks } = await supabase.from("tasks").select("title").eq("related_event_id", eventId);
  const existingTitles = new Set((existingTasks ?? []).map((t) => t.title));

  const toInsert = templates
    .filter((t) => !existingTitles.has(t.title))
    .map((t) => ({
      title: t.title,
      related_event_id: eventId,
      created_by: userId,
      updated_by: userId,
    }));

  if (toInsert.length > 0) {
    await supabase.from("tasks").insert(toInsert);
  }
}
