"use client";

import { useActionState } from "react";
import { addTask } from "@/app/(dashboard)/task/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function AddTaskForm({
  members,
  events,
}: {
  members: { id: string; full_name: string | null }[];
  events: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(addTask, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="title">Titolo</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="due_date">Scadenza (opzionale)</Label>
        <Input id="due_date" name="due_date" type="date" />
      </div>
      <div>
        <Label htmlFor="assigned_to">Assegnato a</Label>
        <Select id="assigned_to" name="assigned_to" defaultValue="">
          <option value="">Nessuno</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
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
      <div className="sm:col-span-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi task"}
        </Button>
      </div>
    </form>
  );
}
