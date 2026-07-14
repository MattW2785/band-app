"use client";

import { useActionState } from "react";
import { generateSetlist } from "@/app/(dashboard)/scalette/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function GenerateSetlistForm({ events }: { events: { id: string; title: string; date: string }[] }) {
  const [state, formAction, pending] = useActionState(generateSetlist, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <Label htmlFor="title">Titolo scaletta</Label>
        <Input id="title" name="title" placeholder="Es. Concerto 12 luglio" required />
      </div>
      <div>
        <Label htmlFor="target_duration_minutes">Durata target (minuti)</Label>
        <Input id="target_duration_minutes" name="target_duration_minutes" type="number" min={1} required />
      </div>
      <div>
        <Label htmlFor="event_id">Evento collegato (opzionale)</Label>
        <Select id="event_id" name="event_id" defaultValue="">
          <option value="">Nessuno</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} — {e.date}
            </option>
          ))}
        </Select>
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Generazione…" : "Genera scaletta"}
        </Button>
      </div>
    </form>
  );
}
