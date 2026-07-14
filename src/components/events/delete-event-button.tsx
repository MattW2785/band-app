"use client";

import { deleteEvent } from "@/app/(dashboard)/eventi/actions";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo evento? L'azione non è reversibile.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={eventId} />
      <Button type="submit" variant="danger">
        Elimina evento
      </Button>
    </form>
  );
}
