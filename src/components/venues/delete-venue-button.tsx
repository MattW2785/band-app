"use client";

import { deleteVenue } from "@/app/(dashboard)/locali/actions";
import { Button } from "@/components/ui/button";

export function DeleteVenueButton({ venueId }: { venueId: string }) {
  return (
    <form
      action={deleteVenue}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo locale? L'azione non è reversibile.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={venueId} />
      <Button type="submit" variant="danger">
        Elimina locale
      </Button>
    </form>
  );
}
