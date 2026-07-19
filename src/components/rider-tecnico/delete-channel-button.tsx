"use client";

import { deleteChannel } from "@/app/(dashboard)/rider-tecnico/actions";

export function DeleteChannelButton({ id }: { id: string }) {
  return (
    <form
      action={deleteChannel}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo canale?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
        Elimina
      </button>
    </form>
  );
}
