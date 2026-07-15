import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ProposeSongForm } from "@/components/songs/propose-form";
import { VoteButtons } from "@/components/songs/vote-buttons";
import { StatusSelect } from "@/components/songs/status-select";
import { DeleteSongButton } from "@/components/songs/delete-song-button";
import { LastEdited } from "@/components/ui/last-edited";
import { CollapsibleComments } from "@/components/comments/comments-section";
import { getHiddenUserIds } from "@/lib/visibility";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default async function BraniPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const hiddenIds = await getHiddenUserIds(supabase, userId, profile.role === "admin");

  const [{ data: songs }, { data: profiles }, { data: rawComments }] = await Promise.all([
    supabase.from("songs").select("*, votes(user_id, score)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name"),
    supabase.from("comments").select("*").eq("parent_type", "song").order("created_at"),
  ]);

  const nameById = new Map((profiles ?? []).filter((p) => !hiddenIds.has(p.id)).map((p) => [p.id, p.full_name]));

  const commentsBySong = new Map<string, { id: string; text: string; created_at: string; authorName: string | null }[]>();
  for (const c of rawComments ?? []) {
    if (c.user_id && hiddenIds.has(c.user_id)) continue;
    if (!commentsBySong.has(c.parent_id)) commentsBySong.set(c.parent_id, []);
    commentsBySong.get(c.parent_id)!.push({
      id: c.id,
      text: c.text,
      created_at: c.created_at,
      authorName: c.user_id ? (nameById.get(c.user_id) ?? null) : null,
    });
  }

  const ranked = (songs ?? [])
    .filter((song) => !song.proposed_by || !hiddenIds.has(song.proposed_by))
    .map((song) => {
      const votes = (song.votes as unknown as { user_id: string; score: number }[]).filter(
        (v) => !hiddenIds.has(v.user_id)
      );
      const count = votes.length;
      const avg = count ? votes.reduce((sum, v) => sum + v.score, 0) / count : 0;
      const ownScore = votes.find((v) => v.user_id === userId)?.score ?? null;
      return { ...song, avg, count, ownScore };
    })
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Brani"
        description="Proponi, ascolta e vota il repertorio della band"
        action={
          <Link href="/scalette">
            <Button variant="secondary">Vai alle scalette →</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900">Proponi un brano</h2>
        <ProposeSongForm />
      </Card>

      <div className="space-y-3">
        {ranked.map((song) => (
          <Card key={song.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-zinc-900">
                  {song.title} {song.artist && <span className="font-normal text-zinc-500">— {song.artist}</span>}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatDuration(song.duration_seconds)}
                  {song.key && ` · tonalità ${song.key}`}
                  {song.bpm && ` · ${song.bpm} bpm`}
                  {song.reference_link && (
                    <>
                      {" · "}
                      <a href={song.reference_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        riferimento
                      </a>
                    </>
                  )}
                </p>
                {song.notes && <p className="mt-1 text-sm text-zinc-600">{song.notes}</p>}
              </div>
              <StatusSelect songId={song.id} status={song.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
              <VoteButtons songId={song.id} ownScore={song.ownScore} />
              <span className="text-sm text-zinc-500">
                media <span className="font-medium text-zinc-700">{song.avg.toFixed(1)}</span> · {song.count}{" "}
                {song.count === 1 ? "voto" : "voti"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <LastEdited
                name={song.updated_by ? (nameById.get(song.updated_by) ?? null) : null}
                at={song.updated_at}
                className="text-xs text-zinc-400"
              />
              <DeleteSongButton songId={song.id} />
            </div>
            <CollapsibleComments
              comments={commentsBySong.get(song.id) ?? []}
              parentType="song"
              parentId={song.id}
              revalidatePath="/brani"
            />
          </Card>
        ))}

        {ranked.length === 0 && <p className="text-sm text-zinc-500">Nessun brano proposto ancora.</p>}
      </div>
    </div>
  );
}
