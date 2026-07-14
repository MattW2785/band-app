import { voteSong } from "@/app/(dashboard)/brani/actions";
import { cn } from "@/lib/utils";

export function VoteButtons({ songId, ownScore }: { songId: string; ownScore: number | null }) {
  return (
    <form action={voteSong} className="flex gap-1">
      <input type="hidden" name="song_id" value={songId} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="submit"
          name="score"
          value={n}
          className={cn(
            "h-7 w-7 rounded-md border text-xs font-medium transition-colors",
            ownScore === n
              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
          )}
        >
          {n}
        </button>
      ))}
    </form>
  );
}
