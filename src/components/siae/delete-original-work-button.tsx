"use client";

import { deleteOriginalWork } from "@/app/(dashboard)/siae/actions";

export function DeleteOriginalWorkButton({ workId }: { workId: string }) {
  return (
    <form
      action={deleteOriginalWork}
      onSubmit={(e) => {
        if (!confirm("Eliminare i dati SIAE di questo brano?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={workId} />
      <button type="submit" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
        Elimina dati SIAE
      </button>
    </form>
  );
}
