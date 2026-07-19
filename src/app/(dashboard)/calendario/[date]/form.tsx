"use client";

import { useActionState } from "react";
import { setAvailability } from "../actions";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import type { AvailabilityStatus } from "@/types/database";

const STATUS_OPTIONS: { value: AvailabilityStatus | ""; label: string }[] = [
  { value: "", label: "Non specificato" },
  { value: "disponibile", label: "Disponibile" },
  { value: "forse", label: "Forse" },
  { value: "non_disponibile", label: "Non disponibile" },
];

export function AvailabilityForm({
  date,
  initial,
}: {
  date: string;
  initial: Record<"mattina" | "pomeriggio" | "sera", AvailabilityStatus | "">;
}) {
  const [state, formAction, pending] = useActionState(setAvailability, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["mattina", "pomeriggio", "sera"] as const).map((slot) => (
          <div key={slot}>
            <Label htmlFor={slot} className="capitalize">
              {slot}
            </Label>
            <Select id={slot} name={slot} defaultValue={initial[slot]}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="note">Nota (opzionale)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="Es. disponibile solo dopo le 19" />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio…" : "Salva disponibilità"}
      </Button>
    </form>
  );
}
