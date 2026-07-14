"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const UpdateProfileSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Inserisci nome e cognome." }),
  password: z.union([z.string().length(0), z.string().min(8, { message: "La password deve avere almeno 8 caratteri." })]),
});

export type UpdateProfileState = { error?: string; success?: string } | undefined;

export async function updateProfile(_prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  const { userId } = await requireSessionProfile();

  const parsed = UpdateProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    password: formData.get("password") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();

  if (parsed.data.password) {
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { error: "Impossibile aggiornare la password. Riprova." };
  }

  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", userId);
  if (error) return { error: "Impossibile salvare il profilo. Riprova." };

  await logActivity(supabase, userId, "updated", "profile", parsed.data.full_name);

  revalidatePath("/profilo");
  revalidatePath("/", "layout");
  return { success: "Profilo aggiornato." };
}

export type NotificationPreferencesState = { success?: string } | undefined;

export async function updateNotificationPreferences(
  _prevState: NotificationPreferencesState,
  formData: FormData
): Promise<NotificationPreferencesState> {
  const { userId } = await requireSessionProfile();
  const supabase = await createClient();

  await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      email_enabled: formData.get("email_enabled") === "on",
      notify_new_song: formData.get("notify_new_song") === "on",
      notify_availability_reminder: formData.get("notify_availability_reminder") === "on",
      notify_task_assigned: formData.get("notify_task_assigned") === "on",
      notify_booking_update: formData.get("notify_booking_update") === "on",
      notify_payment_due: formData.get("notify_payment_due") === "on",
    },
    { onConflict: "user_id" }
  );

  revalidatePath("/profilo");
  return { success: "Preferenze salvate." };
}
