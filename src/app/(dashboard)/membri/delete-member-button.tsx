"use client";

import { useActionState } from "react";
import { deleteMember } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [state, formAction, pending] = useActionState(deleteMember, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Eliminare ${memberName} dalla band? L'azione non è reversibile.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="member_id" value={memberId} />
      <Button type="submit" variant="ghost" className="text-red-500 hover:bg-red-50" disabled={pending}>
        {pending ? "…" : "Rimuovi"}
      </Button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
