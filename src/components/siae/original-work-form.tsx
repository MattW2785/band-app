"use client";

import { useActionState, useMemo, useState } from "react";
import { upsertOriginalWork } from "@/app/(dashboard)/siae/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function OriginalWorkForm({
  songId,
  members,
  initial,
}: {
  songId: string;
  members: { id: string; full_name: string | null }[];
  initial?: {
    siae_deposit_date: string | null;
    siae_code: string | null;
    notes: string | null;
    authors_split: Record<string, number>;
  };
}) {
  const [state, formAction, pending] = useActionState(upsertOriginalWork, undefined);
  const [splits, setSplits] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.id, String(initial?.authors_split?.[m.id] ?? "")]))
  );

  const total = useMemo(
    () => Object.values(splits).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [splits]
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="song_id" value={songId} />
      <div>
        <Label htmlFor={`siae_deposit_date_${songId}`}>Data deposito SIAE</Label>
        <Input
          id={`siae_deposit_date_${songId}`}
          name="siae_deposit_date"
          type="date"
          defaultValue={initial?.siae_deposit_date ?? ""}
        />
      </div>
      <div>
        <Label htmlFor={`siae_code_${songId}`}>Codice SIAE</Label>
        <Input id={`siae_code_${songId}`} name="siae_code" defaultValue={initial?.siae_code ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <Label>Ripartizione diritti (%)</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-600">{m.full_name}</span>
              <Input
                name={`split_${m.id}`}
                type="number"
                min={0}
                max={100}
                className="w-16"
                value={splits[m.id]}
                onChange={(e) => setSplits((s) => ({ ...s, [m.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <p className={`mt-1.5 text-xs ${total === 100 ? "text-emerald-600" : "text-amber-600"}`}>
          Totale: {total}% {total !== 100 && "(dovrebbe essere 100%)"}
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`notes_${songId}`}>Note</Label>
        <Textarea id={`notes_${songId}`} name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Salva dati SIAE"}
        </Button>
      </div>
    </form>
  );
}
