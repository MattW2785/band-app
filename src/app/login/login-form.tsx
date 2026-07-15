"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

// Il link di invito/reset di Supabase torna con i token nel frammento URL (#access_token=...),
// che non arriva mai al server: va intercettato qui, lato client, per aprire la sessione.
function useAuthLinkActivation() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "activating" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const errorDescription = params.get("error_description");
    if (errorDescription) {
      window.history.replaceState(null, "", window.location.pathname);
      setTimeout(() => {
        setStatus("error");
        setErrorMessage("Il link non è più valido o è scaduto. Chiedi a un admin di inviartene uno nuovo.");
      }, 0);
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    setTimeout(() => setStatus("activating"), 0);
    window.history.replaceState(null, "", window.location.pathname);

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage("Impossibile completare l'attivazione. Riprova o chiedi un nuovo link.");
        return;
      }
      router.push("/completa-profilo");
    });
  }, [router]);

  return { status, errorMessage };
}

export function LoginForm({ suspendedError }: { suspendedError?: string }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const { status, errorMessage } = useAuthLinkActivation();
  const topError = errorMessage ?? suspendedError;

  if (status === "activating") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 p-4">
        <p className="text-sm text-zinc-500">Attivazione dell&apos;invito in corso…</p>
      </div>
    );
  }

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
        {topError && <p className="mb-4 text-sm text-red-600">{topError}</p>}
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
