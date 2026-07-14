"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensureConfirmationChecklist } from "@/lib/event-automation";
import { notifyBookingUpdate } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import type { BookingStatus, Venue } from "@/types/database";

const STATUS_LABEL: Record<BookingStatus, string> = {
  contattato: "Contattato",
  in_negoziazione: "In negoziazione",
  confermato: "Confermato",
  annullato: "Annullato",
  pagato: "Pagato",
};

const BookingLeadSchema = z.object({
  venue_id: z.string().min(1, { message: "Seleziona un locale." }),
  proposed_date: z.string().optional(),
  fee_proposed: z.string().optional(),
  fee_agreed: z.string().optional(),
  deposit_amount: z.string().optional(),
  deposit_paid: z.string().optional(),
  contract_url: z.string().trim().optional(),
  follow_up_date: z.string().optional(),
  owner: z.string().optional(),
});

export type BookingLeadFormState = { error?: string } | undefined;

export async function createBookingLead(
  _prevState: BookingLeadFormState,
  formData: FormData
): Promise<BookingLeadFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = BookingLeadSchema.safeParse({
    venue_id: formData.get("venue_id"),
    proposed_date: formData.get("proposed_date") || undefined,
    fee_proposed: formData.get("fee_proposed") || undefined,
    deposit_amount: formData.get("deposit_amount") || undefined,
    contract_url: formData.get("contract_url"),
    follow_up_date: formData.get("follow_up_date") || undefined,
    owner: formData.get("owner") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from("booking_leads")
    .insert({
      venue_id: parsed.data.venue_id,
      proposed_date: parsed.data.proposed_date || null,
      fee_proposed: parsed.data.fee_proposed ? Number(parsed.data.fee_proposed) : null,
      deposit_amount: parsed.data.deposit_amount ? Number(parsed.data.deposit_amount) : null,
      contract_url: parsed.data.contract_url || null,
      follow_up_date: parsed.data.follow_up_date || null,
      owner: parsed.data.owner || userId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error || !lead) {
    return { error: "Impossibile creare la trattativa. Riprova." };
  }

  const { data: venue } = await supabase.from("venues").select("name").eq("id", lead.venue_id).single();
  await logActivity(supabase, userId, "created", "booking_lead", venue?.name);

  revalidatePath("/booking");
  redirect(`/booking/${lead.id}`);
}

export async function updateBookingDetails(
  _prevState: BookingLeadFormState,
  formData: FormData
): Promise<BookingLeadFormState> {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const parsed = BookingLeadSchema.safeParse({
    venue_id: formData.get("venue_id"),
    proposed_date: formData.get("proposed_date") || undefined,
    fee_proposed: formData.get("fee_proposed") || undefined,
    fee_agreed: formData.get("fee_agreed") || undefined,
    deposit_amount: formData.get("deposit_amount") || undefined,
    deposit_paid: formData.get("deposit_paid") || undefined,
    contract_url: formData.get("contract_url"),
    follow_up_date: formData.get("follow_up_date") || undefined,
    owner: formData.get("owner") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_leads")
    .update({
      venue_id: parsed.data.venue_id,
      proposed_date: parsed.data.proposed_date || null,
      fee_proposed: parsed.data.fee_proposed ? Number(parsed.data.fee_proposed) : null,
      fee_agreed: parsed.data.fee_agreed ? Number(parsed.data.fee_agreed) : null,
      deposit_amount: parsed.data.deposit_amount ? Number(parsed.data.deposit_amount) : null,
      deposit_paid: parsed.data.deposit_paid === "on",
      contract_url: parsed.data.contract_url || null,
      follow_up_date: parsed.data.follow_up_date || null,
      owner: parsed.data.owner || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Impossibile salvare le modifiche. Riprova." };
  }

  const { data: venue } = await supabase.from("venues").select("name").eq("id", parsed.data.venue_id).single();
  await logActivity(supabase, userId, "updated", "booking_lead", venue?.name);

  revalidatePath("/booking");
  revalidatePath(`/booking/${id}`);
  return undefined;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const { userId } = await requireSessionProfile();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("booking_leads")
    .select("*, venues(*)")
    .eq("id", bookingId)
    .single();

  if (!lead) return;

  const venue = lead.venues as unknown as Venue;
  let eventId = lead.event_id;

  if (status === "confermato" && !eventId) {
    const { data: event } = await supabase
      .from("events")
      .insert({
        type: "concerto",
        title: `Concerto @ ${venue.name}`,
        date: lead.proposed_date ?? new Date().toISOString().slice(0, 10),
        venue_id: venue.id,
        venue_contact_name: venue.contact_name,
        venue_contact_phone: venue.contact_phone,
        venue_contact_email: venue.contact_email,
        fee_amount: lead.fee_agreed ?? lead.fee_proposed,
        deposit_amount: lead.deposit_amount,
        deposit_paid: lead.deposit_paid,
        status: "confermato",
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (event) {
      eventId = event.id;
      await ensureConfirmationChecklist(supabase, event.id, "concerto", userId);
    }
  }

  await supabase
    .from("booking_leads")
    .update({ status, event_id: eventId, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  await notifyBookingUpdate(supabase, venue.name, STATUS_LABEL[status], userId);
  await logActivity(supabase, userId, "status_changed", "booking_lead", venue.name, STATUS_LABEL[status]);

  revalidatePath("/booking");
  revalidatePath("/eventi");
  revalidatePath("/calendario");
}

export async function deleteBookingLead(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: lead } = await supabase.from("booking_leads").select("*, venues(name)").eq("id", id).single();
  await supabase.from("booking_leads").delete().eq("id", id);

  if (lead) {
    const { venues, ...row } = lead;
    await logActivity(
      supabase,
      userId,
      "deleted",
      "booking_lead",
      (venues as unknown as { name: string } | null)?.name,
      null,
      { row }
    );
  }

  revalidatePath("/booking");
  redirect("/booking");
}
