"use client";

import { useActionState, useState } from "react";
import { toggleMemberHidden } from "./actions";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Il chiamante passa `key={hidden}`: quando il valore reale cambia lato server (dopo
// revalidate), React rimonta il componente da zero invece di lasciare lo stato locale
// disallineato — così il toggle torna sempre a riflettere lo stato vero, anche se
// l'azione fallisce (colonna mancante, guardie admin, ecc.).
export function HiddenCheckbox({ memberId, hidden }: { memberId: string; hidden: boolean }) {
  const [state, formAction] = useActionState(toggleMemberHidden, undefined);
  const [checked, setChecked] = useState(hidden);

  return (
    <form action={formAction}>
      <label className="flex items-center gap-1.5">
        <span className={cn("text-xs font-medium", checked ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500")}>
          {checked ? "Invisibile" : "Visibile"}
        </span>
        <input type="hidden" name="member_id" value={memberId} />
        <Switch
          name="hidden"
          value="true"
          checked={checked}
          activeClassName="peer-checked:bg-amber-500"
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
