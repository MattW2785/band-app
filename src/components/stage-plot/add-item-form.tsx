"use client";

import { useActionState } from "react";
import { addStagePlotItem } from "@/app/(dashboard)/stage-plot/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AddStagePlotItemForm() {
  const [state, formAction, pending] = useActionState(addStagePlotItem, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <Label htmlFor="instrument">Strumento/postazione</Label>
        <Input id="instrument" name="instrument" placeholder="Es. Chitarra" required />
      </div>
      <div>
        <Label htmlFor="position">Posizione sul palco</Label>
        <Input id="position" name="position" placeholder="Es. palco sinistra" required />
      </div>
      <div>
        <Label htmlFor="notes">Note</Label>
        <Input id="notes" name="notes" placeholder="Es. 2 DI box" />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-3">{state.error}</p>}
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi"}
        </Button>
      </div>
    </form>
  );
}
