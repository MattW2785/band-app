"use client";

import { useActionState } from "react";
import { completeProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function CompleteProfileForm() {
  const [state, formAction, pending] = useActionState(completeProfile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Nome e cognome</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvataggio…" : "Continua"}
      </Button>
    </form>
  );
}
