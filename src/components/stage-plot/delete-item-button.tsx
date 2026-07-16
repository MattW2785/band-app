"use client";

import { deleteStagePlotItem } from "@/app/(dashboard)/stage-plot/actions";

export function DeleteStagePlotItemButton({ id }: { id: string }) {
  return (
    <form
      action={deleteStagePlotItem}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo elemento dallo stage plot?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-zinc-400 hover:text-red-500">
        Elimina
      </button>
    </form>
  );
}
