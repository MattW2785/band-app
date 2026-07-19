"use client";

import { useRef, useState, useTransition } from "react";
import { voteSong } from "@/app/(dashboard)/brani/actions";
import { cn } from "@/lib/utils";

export function VoteButtons({ songId, ownScore }: { songId: string; ownScore: number | null }) {
  const [value, setValue] = useState(ownScore);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleVote(score: number) {
    setValue(score);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowConfirmation(false);

    const formData = new FormData();
    formData.set("song_id", songId);
    formData.set("score", String(score));

    startTransition(async () => {
      await voteSong(formData);
      setShowConfirmation(true);
      hideTimeout.current = setTimeout(() => setShowConfirmation(false), 2500);
    });
  }

  return (
    <div className="relative flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={isPending}
          onClick={() => handleVote(n)}
          className={cn(
            "h-7 w-7 rounded-md border text-xs font-medium transition-colors",
            value === n
              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          )}
        >
          {n}
        </button>
      ))}
      {showConfirmation && (
        <span className="absolute -top-8 left-0 whitespace-nowrap rounded-md bg-zinc-900 dark:bg-zinc-700 px-2 py-1 text-xs text-white shadow-md">
          Voto confermato ✓
        </span>
      )}
    </div>
  );
}
