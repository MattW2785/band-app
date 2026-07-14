"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const VenueSchema = z.object({
  name: z.string().trim().min(1, { message: "Inserisci il nome del locale." }),
  contact_name: z.string().trim().optional(),
  contact_email: z.string().trim().optional(),
  contact_phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  capacity: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type VenueFormState = { error?: string } | undefined;

export async function createVenue(_prevState: VenueFormState, formData: FormData): Promise<VenueFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = VenueSchema.safeParse({
    name: formData.get("name"),
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    city: formData.get("city"),
    capacity: formData.get("capacity") || undefined,
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      name: parsed.data.name,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      city: parsed.data.city || null,
      capacity: parsed.data.capacity ? Number(parsed.data.capacity) : null,
      notes: parsed.data.notes || null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error || !venue) {
    return { error: "Impossibile creare il locale. Riprova." };
  }

  await logActivity(supabase, userId, "created", "venue", venue.name);

  revalidatePath("/locali");
  redirect(`/locali/${venue.id}`);
}

export async function updateVenue(_prevState: VenueFormState, formData: FormData): Promise<VenueFormState> {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const parsed = VenueSchema.safeParse({
    name: formData.get("name"),
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    city: formData.get("city"),
    capacity: formData.get("capacity") || undefined,
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("venues")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      city: parsed.data.city || null,
      capacity: parsed.data.capacity ? Number(parsed.data.capacity) : null,
      notes: parsed.data.notes || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Impossibile salvare le modifiche. Riprova." };
  }

  await logActivity(supabase, userId, "updated", "venue", parsed.data.name);

  revalidatePath("/locali");
  revalidatePath(`/locali/${id}`);
  return undefined;
}

export async function deleteVenue(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: venue } = await supabase.from("venues").select("*").eq("id", id).single();
  await supabase.from("venues").delete().eq("id", id);
  await logActivity(supabase, userId, "deleted", "venue", venue?.name, null, venue ? { row: venue } : null);

  revalidatePath("/locali");
  redirect("/locali");
}
