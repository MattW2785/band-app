"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome e cognome</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>
      <div>
        <Label htmlFor="password">Nuova password (lascia vuoto per non cambiarla)</Label>
        <Input id="password" name="password" type="password" minLength={8} placeholder="••••••••" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio…" : "Salva modifiche"}
      </Button>
    </form>
  );
}
