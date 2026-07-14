"use client";

import { useActionState } from "react";
import { inviteMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMember, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="email">Email da invitare</Label>
        <Input id="email" name="email" type="email" placeholder="nome@esempio.it" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Invio…" : "Invita"}
      </Button>
      {state?.error && <p className="text-sm text-red-600 sm:ml-3">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600 sm:ml-3">{state.success}</p>}
    </form>
  );
}
