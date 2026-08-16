"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserPlus } from "lucide-react";
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
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Attivazione dell&apos;invito in corso…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 dark:bg-starfield dark:opacity-100" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-32 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"
      />
      <Card className="animate-fade-in relative w-full max-w-sm shadow-xl shadow-black/5 dark:shadow-black/40">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="" width={64} height={64} className="mb-3 h-16 w-16 object-contain" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">BandSpace</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Accedi con l&apos;account della tua band</p>
        </div>

        {topError && (
          <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {topError}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Accesso in corso…" : "Accedi"}
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-800/70 dark:bg-zinc-800/30">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Non hai un account?
            <br />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Chiedi a un admin della band</span> di
            invitarti.
          </p>
        </div>
      </Card>
    </div>
  );
}
