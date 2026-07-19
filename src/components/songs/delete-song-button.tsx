"use client";

import { deleteSong } from "@/app/(dashboard)/brani/actions";

export function DeleteSongButton({ songId }: { songId: string }) {
  return (
    <form
      action={deleteSong}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo brano? Verranno rimossi anche i voti e la presenza in eventuali scalette.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="song_id" value={songId} />
      <button
        type="submit"
        className="flex cursor-pointer items-center appearance-none border-0 bg-transparent p-0 text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
      >
        Elimina
      </button>
    </form>
  );
}
