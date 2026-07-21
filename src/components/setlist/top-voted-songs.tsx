import { addSongToSetlist } from "@/app/(dashboard)/scalette/actions";
import { Button } from "@/components/ui/button";

type TopVotedSong = { id: string; title: string; artist: string | null; avg: number; referenceLink: string | null };

export function TopVotedSongs({ setlistId, songs }: { setlistId: string; songs: TopVotedSong[] }) {
  if (songs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nessun brano ancora votato da tutti i membri della band.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5 text-sm">
      {songs.map((song, i) => (
        <li key={song.id} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">
            {i + 1}.{" "}
            {song.referenceLink ? (
              <a
                href={song.referenceLink}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                title="Ascolta il brano"
              >
                {song.title}
              </a>
            ) : (
              song.title
            )}
            {song.artist && <span className="text-zinc-500 dark:text-zinc-400"> — {song.artist}</span>}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">{song.avg.toFixed(1)}</span>
            <form action={addSongToSetlist}>
              <input type="hidden" name="setlist_id" value={setlistId} />
              <input type="hidden" name="song_id" value={song.id} />
              <Button type="submit" variant="secondary" className="px-2 py-1 text-xs" aria-label={`Aggiungi ${song.title} alla scaletta`}>
                +
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ol>
  );
}
