import Link from "next/link";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";
import { createEvent } from "../actions";

export default async function NuovoEventoPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireSessionProfile();
  const { date } = await searchParams;
  const supabase = await createClient();
  const { data: venues } = await supabase.from("venues").select("id,name").order("name");

  return (
    <div className="max-w-2xl">
      <Link href="/eventi" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
        ← Torna agli eventi
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Nuovo evento</h1>
      <Card>
        <EventForm
          action={createEvent}
          initial={date ? { date } : undefined}
          venues={venues ?? []}
          submitLabel="Crea evento"
        />
      </Card>
    </div>
  );
}
