"use client";

import { useActionState } from "react";
import { updateTechRider } from "@/app/(dashboard)/rider-tecnico/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import type { TechRider } from "@/types/database";

export function TechRiderForm({ initial }: { initial: TechRider | null }) {
  const [state, formAction, pending] = useActionState(updateTechRider, undefined);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3">
      <div>
        <Label htmlFor="pa_requirements">Requisiti impianto audio</Label>
        <Textarea
          id="pa_requirements"
          name="pa_requirements"
          rows={2}
          defaultValue={initial?.pa_requirements ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="monitor_requirements">Requisiti monitor</Label>
        <Textarea
          id="monitor_requirements"
          name="monitor_requirements"
          rows={2}
          defaultValue={initial?.monitor_requirements ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="power_requirements">Requisiti alimentazione</Label>
        <Textarea
          id="power_requirements"
          name="power_requirements"
          rows={2}
          defaultValue={initial?.power_requirements ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="notes">Note aggiuntive</Label>
        <Textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes ?? ""} />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : "Salva"}
        </Button>
      </div>
    </form>
  );
}
