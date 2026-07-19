"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { EventFormState } from "@/app/(dashboard)/eventi/actions";
import type { Event } from "@/types/database";

const STATUS_OPTIONS = [
  { value: "da_confermare", label: "Da confermare" },
  { value: "confermato", label: "Confermato" },
  { value: "annullato", label: "Annullato" },
  { value: "concluso", label: "Concluso" },
];

export function EventForm({
  action,
  initial,
  venues,
  submitLabel,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial?: Partial<Event>;
  venues: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={initial?.type ?? "prova"}>
          <option value="prova">Prova</option>
          <option value="concerto">Concerto</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" defaultValue={initial?.title ?? ""} required />
      </div>
      <div>
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" defaultValue={initial?.date ?? ""} required />
      </div>
      <div>
        <Label htmlFor="status">Stato</Label>
        <Select id="status" name="status" defaultValue={initial?.status ?? "da_confermare"}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="location">Luogo</Label>
        <Input id="location" name="location" defaultValue={initial?.location ?? ""} />
      </div>
      <div>
        <Label htmlFor="venue_id">Locale collegato</Label>
        <Select id="venue_id" name="venue_id" defaultValue={initial?.venue_id ?? ""}>
          <option value="">Nessuno</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="start_time">Ora inizio</Label>
        <Input id="start_time" name="start_time" type="time" defaultValue={initial?.start_time?.slice(0, 5) ?? ""} />
      </div>
      <div>
        <Label htmlFor="end_time">Ora fine</Label>
        <Input id="end_time" name="end_time" type="time" defaultValue={initial?.end_time?.slice(0, 5) ?? ""} />
      </div>
      <div>
        <Label htmlFor="load_in_time">Load-in</Label>
        <Input id="load_in_time" name="load_in_time" type="time" defaultValue={initial?.load_in_time?.slice(0, 5) ?? ""} />
      </div>
      <div>
        <Label htmlFor="soundcheck_time">Soundcheck</Label>
        <Input
          id="soundcheck_time"
          name="soundcheck_time"
          type="time"
          defaultValue={initial?.soundcheck_time?.slice(0, 5) ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="fee_amount">Cachet (€)</Label>
        <Input id="fee_amount" name="fee_amount" type="number" step="0.01" defaultValue={initial?.fee_amount ?? ""} />
      </div>
      <div>
        <Label htmlFor="deposit_amount">Acconto (€)</Label>
        <Input
          id="deposit_amount"
          name="deposit_amount"
          type="number"
          step="0.01"
          defaultValue={initial?.deposit_amount ?? ""}
        />
      </div>
      <div className="flex items-end pb-2 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="deposit_paid" defaultChecked={initial?.deposit_paid ?? false} />
          Acconto versato
        </label>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="technical_rider_notes">Rider tecnico</Label>
        <Textarea
          id="technical_rider_notes"
          name="technical_rider_notes"
          rows={2}
          defaultValue={initial?.technical_rider_notes ?? ""}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
