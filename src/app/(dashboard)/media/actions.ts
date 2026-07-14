"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";
import { uploadMediaFile } from "@/lib/storage";

const MediaSchema = z.object({
  title: z.string().trim().min(1, { message: "Inserisci un titolo." }),
  type: z.enum(["audio", "video", "immagine", "documento"]),
  related_song_id: z.string().optional(),
  related_event_id: z.string().optional(),
});

export type MediaFormState = { error?: string } | undefined;

export async function uploadMediaItem(_prevState: MediaFormState, formData: FormData): Promise<MediaFormState> {
  const { userId } = await requireSessionProfile();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }

  const parsed = MediaSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    related_song_id: formData.get("related_song_id") || undefined,
    related_event_id: formData.get("related_event_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();

  const uploadResult = await uploadMediaFile(supabase, file);
  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { error } = await supabase.from("media_items").insert({
    type: parsed.data.type,
    file_path: uploadResult.path,
    file_name: file.name,
    file_size: file.size,
    title: parsed.data.title,
    related_song_id: parsed.data.related_song_id || null,
    related_event_id: parsed.data.related_event_id || null,
    uploaded_by: userId,
  });

  if (error) {
    return { error: "Impossibile salvare il file. Riprova." };
  }

  await logActivity(supabase, userId, "created", "media_item", parsed.data.title);

  revalidatePath("/media");
  return undefined;
}

export async function deleteMediaItem(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: item } = await supabase.from("media_items").select("*").eq("id", id).single();
  // Il file su Storage viene mantenuto: l'eliminazione è reversibile dal registro attività.
  await supabase.from("media_items").delete().eq("id", id);
  await logActivity(supabase, userId, "deleted", "media_item", item?.title, null, item ? { row: item } : null);

  revalidatePath("/media");
}
