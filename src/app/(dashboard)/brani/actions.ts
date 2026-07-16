"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyNewSong } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import type { SongStatus } from "@/types/database";

const DURATION_RE = /^\d{1,2}:\d{2}$/;

function durationToSeconds(value: string): number {
  const [minutes, seconds] = value.split(":").map(Number);
  return minutes * 60 + seconds;
}

function linesToArray(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const SongFieldsSchema = z.object({
  title: z.string().trim().min(1, { message: "Inserisci il titolo del brano." }),
  artist: z.string().trim().optional(),
  reference_links: z.string().optional(),
  key: z.string().trim().optional(),
  bpm: z.string().trim().optional(),
  duration: z.string().regex(DURATION_RE, { message: "Durata nel formato mm:ss." }),
  notes: z.string().trim().optional(),
  is_original: z.string().nullish(),
});

function readSongFields(formData: FormData) {
  return {
    title: formData.get("title"),
    artist: formData.get("artist"),
    reference_links: formData.get("reference_links"),
    key: formData.get("key"),
    bpm: formData.get("bpm"),
    duration: formData.get("duration"),
    notes: formData.get("notes"),
    is_original: formData.get("is_original"),
  };
}

export type ProposeSongState = { error?: string } | undefined;

export async function proposeSong(_prevState: ProposeSongState, formData: FormData): Promise<ProposeSongState> {
  const { userId } = await requireSessionProfile();

  const parsed = SongFieldsSchema.safeParse(readSongFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const isOriginal = parsed.data.is_original === "true";
  const links = linesToArray(parsed.data.reference_links);
  if (!isOriginal && links.length === 0) {
    return { error: "Inserisci almeno un link di riferimento." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("songs").insert({
    title: parsed.data.title,
    artist: parsed.data.artist || null,
    reference_links: links,
    key: parsed.data.key || null,
    bpm: parsed.data.bpm ? Number(parsed.data.bpm) : null,
    duration_seconds: durationToSeconds(parsed.data.duration),
    notes: parsed.data.notes || null,
    is_original: isOriginal,
    proposed_by: userId,
    updated_by: userId,
  });

  if (error) {
    console.error("proposeSong insert error:", error);
    return { error: "Impossibile salvare il brano. Riprova." };
  }

  const { data: proposer } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  await notifyNewSong(supabase, parsed.data.title, proposer?.full_name ?? "Un membro della band", userId);
  await logActivity(supabase, userId, "created", "song", parsed.data.title);

  revalidatePath("/brani");
  return undefined;
}

export type UpdateSongState = { error?: string } | undefined;

export async function updateSong(_prevState: UpdateSongState, formData: FormData): Promise<UpdateSongState> {
  const { userId } = await requireSessionProfile();
  const songId = String(formData.get("song_id"));

  const parsed = SongFieldsSchema.safeParse(readSongFields(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const isOriginal = parsed.data.is_original === "true";
  const links = linesToArray(parsed.data.reference_links);
  if (!isOriginal && links.length === 0) {
    return { error: "Inserisci almeno un link di riferimento." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("songs")
    .update({
      title: parsed.data.title,
      artist: parsed.data.artist || null,
      reference_links: links,
      key: parsed.data.key || null,
      bpm: parsed.data.bpm ? Number(parsed.data.bpm) : null,
      duration_seconds: durationToSeconds(parsed.data.duration),
      notes: parsed.data.notes || null,
      is_original: isOriginal,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", songId);

  if (error) {
    console.error("updateSong error:", error.message);
    return { error: "Impossibile salvare le modifiche. Riprova." };
  }

  await logActivity(supabase, userId, "updated", "song", parsed.data.title);

  revalidatePath("/brani");
  return undefined;
}

export async function voteSong(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const songId = String(formData.get("song_id"));
  const score = Number(formData.get("score"));

  if (!songId || score < 1 || score > 5) return;

  const supabase = await createClient();
  await supabase.from("votes").upsert(
    { song_id: songId, user_id: userId, score },
    { onConflict: "song_id,user_id" }
  );

  const { data: song } = await supabase.from("songs").select("title").eq("id", songId).single();
  await logActivity(supabase, userId, "voted", "song", song?.title, `punteggio ${score}`);

  revalidatePath("/brani");
}

export async function updateSongStatus(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const songId = String(formData.get("song_id"));
  const status = String(formData.get("status")) as SongStatus;

  console.log("updateSongStatus called:", { songId, status });

  const supabase = await createClient();
  const { error } = await supabase
    .from("songs")
    .update({ status, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", songId);

  if (error) {
    console.error("updateSongStatus update error:", error);
    return;
  }

  const { data: song } = await supabase.from("songs").select("title").eq("id", songId).single();
  await logActivity(supabase, userId, "status_changed", "song", song?.title, status);

  revalidatePath("/brani");
  console.log("updateSongStatus done, revalidated /brani");
}

export async function deleteSong(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const songId = String(formData.get("song_id"));

  const supabase = await createClient();
  const [{ data: song }, { data: votes }] = await Promise.all([
    supabase.from("songs").select("*").eq("id", songId).single(),
    supabase.from("votes").select("*").eq("song_id", songId),
  ]);

  await supabase.from("songs").delete().eq("id", songId);
  await logActivity(supabase, userId, "deleted", "song", song?.title, null, song ? { row: song, votes } : null);

  revalidatePath("/brani");
}
