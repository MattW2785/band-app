"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { VenueFormState } from "@/app/(dashboard)/locali/actions";
import type { Venue } from "@/types/database";

export function VenueForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: VenueFormState, formData: FormData) => Promise<VenueFormState>;
  initial?: Partial<Venue>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <Label htmlFor="name">Nome del locale</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ""} required />
      </div>
      <div>
        <Label htmlFor="city">Città</Label>
        <Input id="city" name="city" defaultValue={initial?.city ?? ""} />
      </div>
      <div>
        <Label htmlFor="contact_name">Referente</Label>
        <Input id="contact_name" name="contact_name" defaultValue={initial?.contact_name ?? ""} />
      </div>
      <div>
        <Label htmlFor="capacity">Capienza</Label>
        <Input id="capacity" name="capacity" type="number" defaultValue={initial?.capacity ?? ""} />
      </div>
      <div>
        <Label htmlFor="contact_email">Email</Label>
        <Input id="contact_email" name="contact_email" type="email" defaultValue={initial?.contact_email ?? ""} />
      </div>
      <div>
        <Label htmlFor="contact_phone">Telefono</Label>
        <Input id="contact_phone" name="contact_phone" defaultValue={initial?.contact_phone ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
