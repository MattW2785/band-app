"use client";

import { deleteMediaItem } from "@/app/(dashboard)/media/actions";

export function DeleteMediaButton({ mediaId }: { mediaId: string }) {
  return (
    <form
      action={deleteMediaItem}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo file dall'archivio?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={mediaId} />
      <button type="submit" className="text-xs text-zinc-400 hover:text-red-500">
        Elimina
      </button>
    </form>
  );
}
