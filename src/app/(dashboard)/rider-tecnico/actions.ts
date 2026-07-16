"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const TECH_RIDER_ID = "00000000-0000-0000-0000-000000000002";

const TechRiderSchema = z.object({
  pa_requirements: z.string().trim().optional(),
  monitor_requirements: z.string().trim().optional(),
  power_requirements: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TechRiderFormState = { error?: string; success?: string } | undefined;

export async function updateTechRider(
  _prevState: TechRiderFormState,
  formData: FormData
): Promise<TechRiderFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = TechRiderSchema.safeParse({
    pa_requirements: formData.get("pa_requirements"),
    monitor_requirements: formData.get("monitor_requirements"),
    power_requirements: formData.get("power_requirements"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tech_rider")
    .update({
      pa_requirements: parsed.data.pa_requirements || null,
      monitor_requirements: parsed.data.monitor_requirements || null,
      power_requirements: parsed.data.power_requirements || null,
      notes: parsed.data.notes || null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", TECH_RIDER_ID);

  if (error) {
    return { error: "Impossibile salvare il rider tecnico. Riprova." };
  }

  revalidatePath("/rider-tecnico");
  revalidatePath("/epk");
  return { success: "Rider tecnico aggiornato." };
}

const ChannelSchema = z.object({
  channel_number: z.string().trim().optional(),
  source: z.string().trim().min(1, { message: "Inserisci la sorgente del canale." }),
  mic_or_di: z.string().trim().optional(),
  stand: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ChannelFormState = { error?: string } | undefined;

export async function addChannel(_prevState: ChannelFormState, formData: FormData): Promise<ChannelFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = ChannelSchema.safeParse({
    channel_number: formData.get("channel_number"),
    source: formData.get("source"),
    mic_or_di: formData.get("mic_or_di"),
    stand: formData.get("stand"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tech_rider_channels").insert({
    channel_number: parsed.data.channel_number ? Number(parsed.data.channel_number) : null,
    source: parsed.data.source,
    mic_or_di: parsed.data.mic_or_di || null,
    stand: parsed.data.stand || null,
    notes: parsed.data.notes || null,
    created_by: userId,
    updated_by: userId,
  });

  if (error) {
    return { error: "Impossibile salvare il canale. Riprova." };
  }

  await logActivity(supabase, userId, "created", "tech_rider_channel", parsed.data.source);

  revalidatePath("/rider-tecnico");
  revalidatePath("/epk");
  return undefined;
}

export async function deleteChannel(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: channel } = await supabase.from("tech_rider_channels").select("*").eq("id", id).single();
  await supabase.from("tech_rider_channels").delete().eq("id", id);
  await logActivity(
    supabase,
    userId,
    "deleted",
    "tech_rider_channel",
    channel?.source,
    null,
    channel ? { row: channel } : null
  );

  revalidatePath("/rider-tecnico");
  revalidatePath("/epk");
}
