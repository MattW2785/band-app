"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const StagePlotItemSchema = z.object({
  instrument: z.string().trim().min(1, { message: "Inserisci lo strumento/postazione." }),
  position: z.string().trim().min(1, { message: "Inserisci la posizione sul palco." }),
  notes: z.string().trim().optional(),
});

export type StagePlotItemState = { error?: string } | undefined;

export async function addStagePlotItem(
  _prevState: StagePlotItemState,
  formData: FormData
): Promise<StagePlotItemState> {
  const { userId } = await requireSessionProfile();

  const parsed = StagePlotItemSchema.safeParse({
    instrument: formData.get("instrument"),
    position: formData.get("position"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("stage_plot_items").insert({
    instrument: parsed.data.instrument,
    position: parsed.data.position,
    notes: parsed.data.notes || null,
    created_by: userId,
    updated_by: userId,
  });

  if (error) {
    return { error: "Impossibile salvare. Riprova." };
  }

  await logActivity(supabase, userId, "created", "stage_plot_item", parsed.data.instrument);

  revalidatePath("/stage-plot");
  revalidatePath("/epk");
  return undefined;
}

export async function deleteStagePlotItem(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: item } = await supabase.from("stage_plot_items").select("*").eq("id", id).single();
  await supabase.from("stage_plot_items").delete().eq("id", id);
  await logActivity(
    supabase,
    userId,
    "deleted",
    "stage_plot_item",
    item?.instrument,
    null,
    item ? { row: item } : null
  );

  revalidatePath("/stage-plot");
  revalidatePath("/epk");
}
