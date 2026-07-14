"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const OriginalWorkSchema = z.object({
  song_id: z.string().min(1),
  siae_deposit_date: z.string().optional(),
  siae_code: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type OriginalWorkFormState = { error?: string } | undefined;

export async function upsertOriginalWork(
  _prevState: OriginalWorkFormState,
  formData: FormData
): Promise<OriginalWorkFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = OriginalWorkSchema.safeParse({
    song_id: formData.get("song_id"),
    siae_deposit_date: formData.get("siae_deposit_date") || undefined,
    siae_code: formData.get("siae_code"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const authorsSplit: Record<string, number> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("split_")) continue;
    const userIdKey = key.slice("split_".length);
    const percentage = Number(value);
    if (percentage > 0) authorsSplit[userIdKey] = percentage;
  }

  const supabase = await createClient();
  const [{ data: song }, { data: existing }] = await Promise.all([
    supabase.from("songs").select("title").eq("id", parsed.data.song_id).single(),
    supabase.from("original_works").select("id").eq("song_id", parsed.data.song_id).maybeSingle(),
  ]);

  const payload = {
    song_id: parsed.data.song_id,
    siae_deposit_date: parsed.data.siae_deposit_date || null,
    siae_code: parsed.data.siae_code || null,
    authors_split: authorsSplit,
    notes: parsed.data.notes || null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("original_works").update(payload).eq("id", existing.id)
    : await supabase.from("original_works").insert({ ...payload, created_by: userId });

  if (error) {
    return { error: "Impossibile salvare i dati SIAE. Riprova." };
  }

  await logActivity(supabase, userId, "updated", "original_work", song?.title);

  revalidatePath("/siae");
  return undefined;
}

export async function deleteOriginalWork(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: work } = await supabase.from("original_works").select("*").eq("id", id).single();
  const { data: song } = work
    ? await supabase.from("songs").select("title").eq("id", work.song_id).single()
    : { data: null };

  await supabase.from("original_works").delete().eq("id", id);
  await logActivity(supabase, userId, "deleted", "original_work", song?.title, null, work ? { row: work } : null);

  revalidatePath("/siae");
}
