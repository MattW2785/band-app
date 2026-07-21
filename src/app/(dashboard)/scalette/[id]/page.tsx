import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { LastEdited } from "@/components/ui/last-edited";
import { SetlistEditor, type SetlistSongItem } from "@/components/setlist/setlist-editor";
import { AddSongForm } from "@/components/setlist/add-song-form";
import { TopVotedSongs } from "@/components/setlist/top-voted-songs";
import { DeleteSetlistButton } from "@/components/setlist/delete-setlist-button";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function SetlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, setlistResult, { data: items }, { data: allSongs }, { data: eligibleMembers }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("setlists").select("*, events!setlists_event_id_fkey(title)").eq("id", id).single(),
    supabase
      .from("setlist_items")
      .select("song_id, position, songs(proposed_by, title, artist, duration_seconds, votes(user_id, score))")
      .eq("setlist_id", id)
      .order("position"),
    supabase.from("songs").select("id,title,artist,proposed_by,reference_links,votes(user_id,score)").order("title"),
    supabase.from("profiles").select("id").eq("suspended", false),
  ]);
  const { data: setlist, error: setlistError } = setlistResult;
  if (!setlist) {
    if (setlistError) console.error("scalette/[id] fetch error:", setlistError.message);
    notFound();
  }

  const editorName =
    setlist.updated_by && !hiddenIds.has(setlist.updated_by)
      ? (await supabase.from("profiles").select("full_name").eq("id", setlist.updated_by).single()).data
          ?.full_name ?? null
      : null;

  const initialItems: SetlistSongItem[] = (items ?? [])
    .filter((item) => {
      const song = item.songs as unknown as { proposed_by: string | null };
      return !song.proposed_by || !hiddenIds.has(song.proposed_by);
    })
    .map((item) => {
      const song = item.songs as unknown as {
        title: string;
        artist: string | null;
        duration_seconds: number;
        votes: { user_id: string; score: number }[];
      };
      const votes = song.votes.filter((v) => !hiddenIds.has(v.user_id));
      const avgVote = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : null;
      return {
        songId: item.song_id,
        title: song.title,
        artist: song.artist,
        durationSeconds: song.duration_seconds,
        avgVote,
        voteCount: votes.length,
      };
    });

  const includedIds = new Set(initialItems.map((i) => i.songId));
  const availableSongs = (allSongs ?? []).filter(
    (s) => !includedIds.has(s.id) && (!s.proposed_by || !hiddenIds.has(s.proposed_by))
  );

  const eligibleIds = new Set((eligibleMembers ?? []).map((m) => m.id));
  const topVoted = availableSongs
    .map((s) => {
      const votes = (s.votes as unknown as { user_id: string; score: number }[]).filter((v) =>
        eligibleIds.has(v.user_id)
      );
      const avg = votes.length ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : 0;
      return {
        id: s.id,
        title: s.title,
        artist: s.artist,
        avg,
        voterCount: votes.length,
        referenceLink: s.reference_links[0] ?? null,
      };
    })
    .filter((s) => eligibleIds.size > 0 && s.voterCount === eligibleIds.size)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const eventTitle = (setlist.events as unknown as { title: string } | null)?.title;

  return (
    <div className="max-w-5xl">
      <Link href="/scalette" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
        ← Torna alle scalette
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{setlist.title}</h1>
      {eventTitle && <p className="text-sm text-zinc-500 dark:text-zinc-400">evento: {eventTitle}</p>}
      <LastEdited name={editorName} at={setlist.updated_at} className="mb-6 mt-1 text-xs text-zinc-400 dark:text-zinc-500" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="max-w-2xl">
          <Card className="mb-4">
            <SetlistEditor
              key={initialItems.map((i) => i.songId).join(",")}
              setlistId={id}
              initialItems={initialItems}
              targetMinutes={setlist.target_duration_minutes}
            />
          </Card>

          <Card className="mb-4">
            <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Aggiungi un brano</h2>
            <AddSongForm setlistId={id} availableSongs={availableSongs} />
          </Card>

          <DeleteSetlistButton setlistId={id} />
        </div>

        <Card>
          <h2 className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">Più votati da tutti</h2>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Brani non ancora in scaletta votati da tutti i membri della band, in ordine di voto medio.
          </p>
          <TopVotedSongs setlistId={id} songs={topVoted} />
        </Card>
      </div>
    </div>
  );
}
