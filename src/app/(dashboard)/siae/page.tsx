import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { OriginalWorkForm } from "@/components/siae/original-work-form";
import { DeleteOriginalWorkButton } from "@/components/siae/delete-original-work-button";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function SiaePage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: rawSongs }, { data: rawWorks }, { data: rawMembers }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("songs").select("id,title,artist,proposed_by").eq("is_original", true).order("title"),
    supabase.from("original_works").select("*"),
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);

  const members = (rawMembers ?? []).filter((m) => !hiddenIds.has(m.id));
  const songs = (rawSongs ?? []).filter((s) => !s.proposed_by || !hiddenIds.has(s.proposed_by));
  const works = (rawWorks ?? []).filter((w) => !w.created_by || !hiddenIds.has(w.created_by));
  const workBySong = new Map(works.map((w) => [w.song_id, w]));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="SIAE / SOUNDREEF"
        description="Deposito e ripartizione dei diritti d'autore per i brani propri della band"
      />

      <div className="space-y-3">
        {songs.map((song) => {
          const work = workBySong.get(song.id);
          return (
            <Card key={song.id}>
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {song.title} {song.artist && <span className="font-normal text-zinc-500 dark:text-zinc-400">— {song.artist}</span>}
                  </span>
                  {work ? (
                    <Badge variant="success">Depositato SIAE</Badge>
                  ) : (
                    <Badge variant="neutral">Nessun dato</Badge>
                  )}
                </summary>
                <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <OriginalWorkForm
                    songId={song.id}
                    members={members}
                    initial={
                      work
                        ? {
                            siae_deposit_date: work.siae_deposit_date,
                            siae_code: work.siae_code,
                            notes: work.notes,
                            authors_split: work.authors_split,
                          }
                        : undefined
                    }
                  />
                  {work && (
                    <div className="mt-2">
                      <DeleteOriginalWorkButton workId={work.id} />
                    </div>
                  )}
                </div>
              </details>
            </Card>
          );
        })}

        {songs.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nessun brano proprio ancora. Marca un brano come &quot;Brano proprio&quot; da{" "}
            <a href="/brani" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              /brani
            </a>{" "}
            per vederlo qui.
          </p>
        )}
      </div>
    </div>
  );
}
