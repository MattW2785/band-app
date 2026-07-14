"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureConfirmationChecklist } from "@/lib/event-automation";
import { logActivity } from "@/lib/activity-log";

const EventSchema = z.object({
  type: z.enum(["prova", "concerto"]),
  title: z.string().trim().min(1, { message: "Inserisci un titolo." }),
  date: z.string().min(1, { message: "Inserisci una data." }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["da_confermare", "confermato", "annullato", "concluso"]),
  venue_id: z.string().optional(),
  load_in_time: z.string().optional(),
  soundcheck_time: z.string().optional(),
  fee_amount: z.string().optional(),
  deposit_amount: z.string().optional(),
  deposit_paid: z.string().optional(),
  technical_rider_notes: z.string().trim().optional(),
});

export type EventFormState = { error?: string } | undefined;

function parseEventForm(formData: FormData) {
  return EventSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    date: formData.get("date"),
    start_time: formData.get("start_time") || undefined,
    end_time: formData.get("end_time") || undefined,
    location: formData.get("location"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    venue_id: formData.get("venue_id") || undefined,
    load_in_time: formData.get("load_in_time") || undefined,
    soundcheck_time: formData.get("soundcheck_time") || undefined,
    fee_amount: formData.get("fee_amount") || undefined,
    deposit_amount: formData.get("deposit_amount") || undefined,
    deposit_paid: formData.get("deposit_paid") || undefined,
    technical_rider_notes: formData.get("technical_rider_notes"),
  });
}

export async function createEvent(_prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const { userId } = await requireSessionProfile();
  const parsed = parseEventForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      type: parsed.data.type,
      title: parsed.data.title,
      date: parsed.data.date,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      venue_id: parsed.data.venue_id || null,
      load_in_time: parsed.data.load_in_time || null,
      soundcheck_time: parsed.data.soundcheck_time || null,
      fee_amount: parsed.data.fee_amount ? Number(parsed.data.fee_amount) : null,
      deposit_amount: parsed.data.deposit_amount ? Number(parsed.data.deposit_amount) : null,
      deposit_paid: parsed.data.deposit_paid === "on",
      technical_rider_notes: parsed.data.technical_rider_notes || null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error || !event) {
    return { error: "Impossibile creare l'evento. Riprova." };
  }

  if (event.status === "confermato") {
    await ensureConfirmationChecklist(supabase, event.id, event.type, userId);
  }
  await logActivity(supabase, userId, "created", "event", event.title);

  revalidatePath("/eventi");
  revalidatePath("/calendario");
  redirect(`/eventi/${event.id}`);
}

export async function updateEvent(_prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));
  const parsed = parseEventForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      type: parsed.data.type,
      title: parsed.data.title,
      date: parsed.data.date,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      venue_id: parsed.data.venue_id || null,
      load_in_time: parsed.data.load_in_time || null,
      soundcheck_time: parsed.data.soundcheck_time || null,
      fee_amount: parsed.data.fee_amount ? Number(parsed.data.fee_amount) : null,
      deposit_amount: parsed.data.deposit_amount ? Number(parsed.data.deposit_amount) : null,
      deposit_paid: parsed.data.deposit_paid === "on",
      technical_rider_notes: parsed.data.technical_rider_notes || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Impossibile salvare le modifiche. Riprova." };
  }

  if (parsed.data.status === "confermato") {
    await ensureConfirmationChecklist(supabase, id, parsed.data.type, userId);
  }
  await logActivity(supabase, userId, "updated", "event", parsed.data.title, `stato: ${parsed.data.status}`);

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${id}`);
  revalidatePath("/calendario");
  return undefined;
}

export async function deleteEvent(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  await supabase.from("events").delete().eq("id", id);
  await logActivity(supabase, userId, "deleted", "event", event?.title, null, event ? { row: event } : null);

  revalidatePath("/eventi");
  revalidatePath("/calendario");
  redirect("/eventi");
}
