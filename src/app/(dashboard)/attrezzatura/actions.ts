"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const CATEGORIES = ["chitarra", "basso", "batteria", "ampli", "microfoni", "cavi", "altro"] as const;

const EquipmentSchema = z.object({
  name: z.string().trim().min(1, { message: "Inserisci il nome dell'attrezzatura." }),
  owner_type: z.enum(["membro", "band"]),
  owner_id: z.string().optional(),
  category: z.enum(CATEGORIES),
  last_maintenance_date: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type EquipmentFormState = { error?: string } | undefined;

export async function addEquipment(
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = EquipmentSchema.safeParse({
    name: formData.get("name"),
    owner_type: formData.get("owner_type"),
    owner_id: formData.get("owner_id") || undefined,
    category: formData.get("category"),
    last_maintenance_date: formData.get("last_maintenance_date") || undefined,
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    name: parsed.data.name,
    owner_type: parsed.data.owner_type,
    owner_id: parsed.data.owner_type === "membro" ? parsed.data.owner_id || null : null,
    category: parsed.data.category,
    last_maintenance_date: parsed.data.last_maintenance_date || null,
    notes: parsed.data.notes || null,
    created_by: userId,
    updated_by: userId,
  });

  if (error) {
    return { error: "Impossibile salvare l'attrezzatura. Riprova." };
  }

  await logActivity(supabase, userId, "created", "equipment", parsed.data.name);

  revalidatePath("/attrezzatura");
  return undefined;
}

export async function updateEquipmentMaintenance(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));
  const lastMaintenanceDate = String(formData.get("last_maintenance_date") || "");

  const supabase = await createClient();
  await supabase
    .from("equipment")
    .update({ last_maintenance_date: lastMaintenanceDate || null, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", id);

  const { data: item } = await supabase.from("equipment").select("name").eq("id", id).single();
  await logActivity(supabase, userId, "updated", "equipment", item?.name, "manutenzione aggiornata");

  revalidatePath("/attrezzatura");
}

export async function deleteEquipment(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: item } = await supabase.from("equipment").select("*").eq("id", id).single();
  await supabase.from("equipment").delete().eq("id", id);
  await logActivity(supabase, userId, "deleted", "equipment", item?.name, null, item ? { row: item } : null);

  revalidatePath("/attrezzatura");
}
