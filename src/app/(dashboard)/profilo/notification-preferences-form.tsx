"use client";

import { useActionState } from "react";
import { updateNotificationPreferences } from "./actions";
import { Button } from "@/components/ui/button";
import type { NotificationPreference } from "@/types/database";

const OPTIONS: { field: keyof Omit<NotificationPreference, "user_id" | "email_enabled">; label: string }[] = [
  { field: "notify_new_song", label: "Nuovo brano proposto" },
  { field: "notify_availability_reminder", label: "Promemoria disponibilità mancante" },
  { field: "notify_task_assigned", label: "Task assegnato a me" },
  { field: "notify_booking_update", label: "Aggiornamento trattativa booking" },
  { field: "notify_payment_due", label: "Scadenza acconto/saldo in avvicinamento" },
];

export function NotificationPreferencesForm({ preferences }: { preferences: NotificationPreference | null }) {
  const [state, formAction, pending] = useActionState(updateNotificationPreferences, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
        <input type="checkbox" name="email_enabled" defaultChecked={preferences?.email_enabled ?? true} />
        Ricevi notifiche via email
      </label>
      <div className="ml-1 space-y-2 border-l border-zinc-200 pl-4">
        {OPTIONS.map((o) => (
          <label key={o.field} className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" name={o.field} defaultChecked={preferences?.[o.field] ?? true} />
            {o.label}
          </label>
        ))}
      </div>
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Salvataggio…" : "Salva preferenze"}
      </Button>
    </form>
  );
}
