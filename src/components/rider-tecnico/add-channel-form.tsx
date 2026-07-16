"use client";

import { useActionState } from "react";
import { addChannel } from "@/app/(dashboard)/rider-tecnico/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AddChannelForm() {
  const [state, formAction, pending] = useActionState(addChannel, undefined);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div>
        <Label htmlFor="channel_number">Canale</Label>
        <Input id="channel_number" name="channel_number" type="number" placeholder="1" />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="source">Sorgente</Label>
        <Input id="source" name="source" placeholder="Es. Cassa" required />
      </div>
      <div>
        <Label htmlFor="mic_or_di">Mic/DI</Label>
        <Input id="mic_or_di" name="mic_or_di" placeholder="Es. SM57" />
      </div>
      <div>
        <Label htmlFor="stand">Asta</Label>
        <Input id="stand" name="stand" placeholder="Es. corta" />
      </div>
      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="notes">Note</Label>
        <Input id="notes" name="notes" />
      </div>
      {state?.error && <p className="col-span-2 text-sm text-red-600 sm:col-span-5">{state.error}</p>}
      <div className="col-span-2 sm:col-span-5">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi canale"}
        </Button>
      </div>
    </form>
  );
}
