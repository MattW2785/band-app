"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import type { AvailabilityStatus, TimeSlot } from "@/types/database";

const SLOTS: TimeSlot[] = ["mattina", "pomeriggio", "sera"];

const SetAvailabilitySchema = z.object({
  date: z.string(),
  mattina: z.string(),
  pomeriggio: z.string(),
  sera: z.string(),
  note: z.string().optional(),
});

export type SetAvailabilityState = { error?: string } | undefined;

export async function setAvailability(
  _prevState: SetAvailabilityState,
  formData: FormData
): Promise<SetAvailabilityState> {
  const { userId } = await requireSessionProfile();

  const parsed = SetAvailabilitySchema.safeParse({
    date: formData.get("date"),
    mattina: formData.get("mattina"),
    pomeriggio: formData.get("pomeriggio"),
    sera: formData.get("sera"),
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const { date, note } = parsed.data;
  const supabase = await createClient();

  for (const slot of SLOTS) {
    const status = parsed.data[slot] as AvailabilityStatus | "";
    if (!status) continue;

    const { error } = await supabase
      .from("availability")
      .upsert(
        { user_id: userId, date, time_slot: slot, status, note: note || null },
        { onConflict: "user_id,date,time_slot" }
      );

    if (error) {
      return { error: "Impossibile salvare la disponibilità. Riprova." };
    }
  }

  await logActivity(supabase, userId, "updated", "availability", date);

  revalidatePath(`/calendario/${date}`);
  revalidatePath("/calendario");
  return undefined;
}
