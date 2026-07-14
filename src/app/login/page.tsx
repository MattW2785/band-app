"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">♪</span>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-zinc-900">BandSpace</h1>
            <p className="text-xs text-zinc-500">Accedi con l&apos;account della tua band</p>
          </div>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Accesso in corso…" : "Accedi"}
          </Button>
        </form>
        <p className="mt-6 text-xs text-zinc-400">
          Non hai un account? Chiedi a un admin della band di invitarti.
        </p>
      </Card>
    </div>
  );
}
