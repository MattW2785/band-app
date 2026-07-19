"use client";

import { useActionState, useState } from "react";
import { toggleMemberSuspended } from "./actions";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Il chiamante passa `key={suspended}`: quando il valore reale cambia lato server (dopo
// revalidate), React rimonta il componente da zero invece di lasciare lo stato locale
// disallineato — così il toggle torna sempre a riflettere lo stato vero, anche se
// l'azione fallisce (guardie admin, colonna mancante, ecc.).
export function SuspendCheckbox({ memberId, suspended }: { memberId: string; suspended: boolean }) {
  const [state, formAction] = useActionState(toggleMemberSuspended, undefined);
  const [checked, setChecked] = useState(suspended);

  return (
    <form action={formAction}>
      <label className="flex items-center gap-1.5">
        <span className={cn("text-xs font-medium", checked ? "text-red-600 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500")}>
          {checked ? "Bloccato" : "Attivo"}
        </span>
        <input type="hidden" name="member_id" value={memberId} />
        <Switch
          name="suspended"
          value="true"
          checked={checked}
          activeClassName="peer-checked:bg-red-500"
          onChange={(e) => {
            setChecked(e.target.checked);
            e.currentTarget.form?.requestSubmit();
          }}
        />
      </label>
      {state?.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.error}</p>}
    </form>
  );
}
