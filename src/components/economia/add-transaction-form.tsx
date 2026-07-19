"use client";

import { useActionState } from "react";
import { addTransaction } from "@/app/(dashboard)/economia/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "cachet", label: "Cachet" },
  { value: "attrezzatura", label: "Attrezzatura" },
  { value: "trasporto", label: "Trasporto" },
  { value: "sala_prove", label: "Sala prove" },
  { value: "promozione", label: "Promozione" },
  { value: "commissione_booking", label: "Commissione booking" },
  { value: "altro", label: "Altro" },
];

export function AddTransactionForm({
  events,
  members,
}: {
  events: { id: string; title: string }[];
  members: { id: string; full_name: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(addTransaction, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue="uscita">
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">Importo (€)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
      </div>
      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select id="category" name="category" defaultValue="altro">
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Data</Label>
        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
      </div>
      <div>
        <Label htmlFor="related_event_id">Evento collegato</Label>
        <Select id="related_event_id" name="related_event_id" defaultValue="">
          <option value="">Nessuno</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="paid_by">Pagato/incassato da</Label>
        <Select id="paid_by" name="paid_by" defaultValue="">
          <option value="">Non specificato</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">Descrizione</Label>
        <Input id="description" name="description" placeholder="Es. noleggio furgone" />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi movimento"}
        </Button>
      </div>
    </form>
  );
}
