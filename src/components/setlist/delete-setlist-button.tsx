"use client";

import { deleteSetlist } from "@/app/(dashboard)/scalette/actions";
import { Button } from "@/components/ui/button";

export function DeleteSetlistButton({ setlistId }: { setlistId: string }) {
  return (
    <form
      action={deleteSetlist}
      onSubmit={(e) => {
        if (!confirm("Eliminare questa scaletta? L'azione non è reversibile.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="setlist_id" value={setlistId} />
      <Button type="submit" variant="danger">
        Elimina scaletta
      </Button>
    </form>
  );
}
