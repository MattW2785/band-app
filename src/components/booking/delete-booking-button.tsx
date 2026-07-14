"use client";

import { deleteBookingLead } from "@/app/(dashboard)/booking/actions";
import { Button } from "@/components/ui/button";

export function DeleteBookingButton({ bookingId }: { bookingId: string }) {
  return (
    <form
      action={deleteBookingLead}
      onSubmit={(e) => {
        if (!confirm("Eliminare questa trattativa? L'azione non è reversibile.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={bookingId} />
      <Button type="submit" variant="danger">
        Elimina trattativa
      </Button>
    </form>
  );
}
