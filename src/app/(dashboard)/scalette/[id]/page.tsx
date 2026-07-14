import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LastEdited } from "@/components/ui/last-edited";
import { SetlistEditor, type SetlistSongItem } from "@/components/setlist/setlist-editor";
import { AddSongForm } from "@/components/setlist/add-song-form";
import { DeleteSetlistButton } from "@/components/setlist/delete-setlist-button";

export default async function SetlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSessionProfile();
  const supabase = await createClient();

  const { data: setlist } = await supabase.from("setlists").select("*, events(title)").eq("id", id).single();
  if (!setlist) notFound();

  const editorName = setlist.updated_by
    ? (await supabase.from("profiles").select("full_name").eq("id", setlist.updated_by).single()).data
        ?.full_name ?? null
    : null;

  const { data: items } = await supabase
    .from("setlist_items")
    .select("song_id, position, songs(title, artist, duration_seconds)")
    .eq("setlist_id", id)
    .order("position");

  const initialItems: SetlistSongItem[] = (items ?? []).map((item) => {
    const song = item.songs as unknown as { title: string; artist: string | null; duration_seconds: number };
    return { songId: item.song_id, title: song.title, artist: song.artist, durationSeconds: song.duration_seconds };
  });

  const includedIds = new Set(initialItems.map((i) => i.songId));
  const { data: allSongs } = await supabase.from("songs").select("id,title,artist").order("title");
  const availableSongs = (allSongs ?? []).filter((s) => !includedIds.has(s.id));

  const eventTitle = (setlist.events as unknown as { title: string } | null)?.title;

  return (
    <div className="max-w-2xl">
      <Link href="/scalette" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Torna alle scalette
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{setlist.title}</h1>
      {eventTitle && <p className="text-sm text-zinc-500">evento: {eventTitle}</p>}
      <LastEdited name={editorName} at={setlist.updated_at} className="mb-6 mt-1 text-xs text-zinc-400" />

      <Card className="mb-4">
        <SetlistEditor setlistId={id} initialItems={initialItems} targetMinutes={setlist.target_duration_minutes} />
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900">Aggiungi un brano</h2>
        <AddSongForm setlistId={id} availableSongs={availableSongs} />
      </Card>

      <DeleteSetlistButton setlistId={id} />
    </div>
  );
}
