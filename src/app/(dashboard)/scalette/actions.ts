"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const GenerateSetlistSchema = z.object({
  title: z.string().trim().min(1, { message: "Inserisci un titolo." }),
  target_duration_minutes: z.coerce.number().int().positive({ message: "Durata non valida." }),
  event_id: z.string().optional(),
});

export type GenerateSetlistState = { error?: string } | undefined;

export async function generateSetlist(
  _prevState: GenerateSetlistState,
  formData: FormData
): Promise<GenerateSetlistState> {
  const { userId } = await requireSessionProfile();

  const parsed = GenerateSetlistSchema.safeParse({
    title: formData.get("title"),
    target_duration_minutes: formData.get("target_duration_minutes"),
    event_id: formData.get("event_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();

  const { data: candidateSongs } = await supabase
    .from("songs")
    .select("id, duration_seconds, votes(score)")
    .in("status", ["pronto_live", "in_prova"]);

  const ranked = (candidateSongs ?? [])
    .map((song) => {
      const votes = song.votes as unknown as { score: number }[];
      const avg = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : 0;
      return { id: song.id, duration_seconds: song.duration_seconds, avg };
    })
    .sort((a, b) => b.avg - a.avg);

  const targetSeconds = parsed.data.target_duration_minutes * 60;
  const selected: string[] = [];
  let total = 0;
  for (const song of ranked) {
    if (total >= targetSeconds) break;
    selected.push(song.id);
    total += song.duration_seconds;
  }

  const { data: setlist, error } = await supabase
    .from("setlists")
    .insert({
      title: parsed.data.title,
      target_duration_minutes: parsed.data.target_duration_minutes,
      event_id: parsed.data.event_id || null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error || !setlist) {
    return { error: "Impossibile creare la scaletta. Riprova." };
  }

  if (selected.length > 0) {
    await supabase.from("setlist_items").insert(
      selected.map((songId, index) => ({ setlist_id: setlist.id, song_id: songId, position: index }))
    );
  }

  if (parsed.data.event_id) {
    await supabase.from("events").update({ setlist_id: setlist.id }).eq("id", parsed.data.event_id);
  }
  await logActivity(supabase, userId, "created", "setlist", parsed.data.title);

  revalidatePath("/scalette");
  redirect(`/scalette/${setlist.id}`);
}

async function touchSetlist(setlistId: string, userId: string) {
  const supabase = await createClient();
  await supabase
    .from("setlists")
    .update({ updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", setlistId);
}

export async function reorderSetlist(setlistId: string, orderedSongIds: string[]) {
  const { userId } = await requireSessionProfile();
  const supabase = await createClient();

  await Promise.all(
    orderedSongIds.map((songId, index) =>
      supabase.from("setlist_items").update({ position: index }).eq("setlist_id", setlistId).eq("song_id", songId)
    )
  );
  await touchSetlist(setlistId, userId);

  revalidatePath(`/scalette/${setlistId}`);
}

export async function addSongToSetlist(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const setlistId = String(formData.get("setlist_id"));
  const songId = String(formData.get("song_id"));
  if (!songId) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("setlist_items")
    .select("*", { count: "exact", head: true })
    .eq("setlist_id", setlistId);

  await supabase.from("setlist_items").insert({ setlist_id: setlistId, song_id: songId, position: count ?? 0 });
  await touchSetlist(setlistId, userId);

  const [{ data: setlist }, { data: song }] = await Promise.all([
    supabase.from("setlists").select("title").eq("id", setlistId).single(),
    supabase.from("songs").select("title").eq("id", songId).single(),
  ]);
  await logActivity(supabase, userId, "updated", "setlist", setlist?.title, `aggiunto "${song?.title}"`);

  revalidatePath(`/scalette/${setlistId}`);
}

export async function duplicateSetlist(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const setlistId = String(formData.get("setlist_id"));

  const supabase = await createClient();
  const { data: original } = await supabase.from("setlists").select("*").eq("id", setlistId).single();
  const { data: items } = await supabase
    .from("setlist_items")
    .select("song_id, position")
    .eq("setlist_id", setlistId)
    .order("position");

  if (!original) return;

  const { data: copy, error } = await supabase
    .from("setlists")
    .insert({
      title: `${original.title} (copia)`,
      target_duration_minutes: original.target_duration_minutes,
      event_id: null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error || !copy) return;

  if (items && items.length > 0) {
    await supabase
      .from("setlist_items")
      .insert(items.map((item) => ({ setlist_id: copy.id, song_id: item.song_id, position: item.position })));
  }
  await logActivity(supabase, userId, "created", "setlist", copy.title, `duplicata da "${original.title}"`);

  revalidatePath("/scalette");
  redirect(`/scalette/${copy.id}`);
}

export async function removeSongFromSetlist(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const setlistId = String(formData.get("setlist_id"));
  const songId = String(formData.get("song_id"));

  const supabase = await createClient();
  await supabase.from("setlist_items").delete().eq("setlist_id", setlistId).eq("song_id", songId);
  await touchSetlist(setlistId, userId);

  const [{ data: setlist }, { data: song }] = await Promise.all([
    supabase.from("setlists").select("title").eq("id", setlistId).single(),
    supabase.from("songs").select("title").eq("id", songId).single(),
  ]);
  await logActivity(supabase, userId, "updated", "setlist", setlist?.title, `rimosso "${song?.title}"`);

  revalidatePath(`/scalette/${setlistId}`);
}

export async function deleteSetlist(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const setlistId = String(formData.get("setlist_id"));

  const supabase = await createClient();
  const [{ data: setlist }, { data: items }] = await Promise.all([
    supabase.from("setlists").select("*").eq("id", setlistId).single(),
    supabase.from("setlist_items").select("*").eq("setlist_id", setlistId),
  ]);
  await supabase.from("setlists").delete().eq("id", setlistId);
  await logActivity(
    supabase,
    userId,
    "deleted",
    "setlist",
    setlist?.title,
    null,
    setlist ? { row: setlist, items } : null
  );

  revalidatePath("/scalette");
  redirect("/scalette");
}
