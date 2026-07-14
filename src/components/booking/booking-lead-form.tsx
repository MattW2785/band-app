"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { BookingLeadFormState } from "@/app/(dashboard)/booking/actions";
import type { BookingLead } from "@/types/database";

export function BookingLeadForm({
  action,
  initial,
  venues,
  members,
  submitLabel,
}: {
  action: (state: BookingLeadFormState, formData: FormData) => Promise<BookingLeadFormState>;
  initial?: Partial<BookingLead>;
  venues: { id: string; name: string }[];
  members: { id: string; full_name: string | null }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(initial?.id);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <Label htmlFor="venue_id">Locale</Label>
        <Select id="venue_id" name="venue_id" defaultValue={initial?.venue_id ?? ""} required>
          <option value="" disabled>
            Seleziona un locale…
          </option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="owner">Responsabile trattativa</Label>
        <Select id="owner" name="owner" defaultValue={initial?.owner ?? ""}>
          <option value="">Nessuno</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="proposed_date">Data proposta</Label>
        <Input id="proposed_date" name="proposed_date" type="date" defaultValue={initial?.proposed_date ?? ""} />
      </div>
      <div>
        <Label htmlFor="follow_up_date">Prossimo follow-up</Label>
        <Input id="follow_up_date" name="follow_up_date" type="date" defaultValue={initial?.follow_up_date ?? ""} />
      </div>
      <div>
        <Label htmlFor="fee_proposed">Cachet proposto (€)</Label>
        <Input id="fee_proposed" name="fee_proposed" type="number" step="0.01" defaultValue={initial?.fee_proposed ?? ""} />
      </div>
      {isEdit && (
        <div>
          <Label htmlFor="fee_agreed">Cachet concordato (€)</Label>
          <Input id="fee_agreed" name="fee_agreed" type="number" step="0.01" defaultValue={initial?.fee_agreed ?? ""} />
        </div>
      )}
      <div>
        <Label htmlFor="deposit_amount">Acconto (€)</Label>
        <Input id="deposit_amount" name="deposit_amount" type="number" step="0.01" defaultValue={initial?.deposit_amount ?? ""} />
      </div>
      {isEdit && (
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="deposit_paid" defaultChecked={initial?.deposit_paid ?? false} />
            Acconto versato
          </label>
        </div>
      )}
      <div className="sm:col-span-2">
        <Label htmlFor="contract_url">Link contratto (Drive, Dropbox, ecc.)</Label>
        <Input id="contract_url" name="contract_url" placeholder="https://…" defaultValue={initial?.contract_url ?? ""} />
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
