import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { LastEdited } from "@/components/ui/last-edited";
import { VenueForm } from "@/components/venues/venue-form";
import { DeleteVenueButton } from "@/components/venues/delete-venue-button";
import { updateVenue } from "../actions";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function LocaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();
  const [hiddenIds, { data: venue }, { data: rawPastEvents }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("venues").select("*").eq("id", id).single(),
    supabase
      .from("events")
      .select("id,title,date,type,created_by")
      .eq("venue_id", id)
      .order("date", { ascending: false }),
  ]);
  if (!venue) notFound();

  const pastEvents = (rawPastEvents ?? []).filter((e) => !e.created_by || !hiddenIds.has(e.created_by));

  const editorName =
    venue.updated_by && !hiddenIds.has(venue.updated_by)
      ? (await supabase.from("profiles").select("full_name").eq("id", venue.updated_by).single()).data?.full_name ??
        null
      : null;

  return (
    <div className="max-w-2xl">
      <BackLink href="/locali">Torna ai locali</BackLink>
      <h1 className="mb-1 mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{venue.name}</h1>
      <LastEdited name={editorName} at={venue.updated_at} className="mb-6 text-xs text-zinc-400 dark:text-zinc-500" />

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Dettagli</h2>
        <VenueForm action={updateVenue} initial={venue} submitLabel="Salva modifiche" />
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Storico concerti/prove qui</h2>
        {pastEvents.length > 0 ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
            {pastEvents.map((e) => (
              <li key={e.id} className="py-2">
                <Link href={`/eventi/${e.id}`} className="text-zinc-800 dark:text-zinc-200 hover:underline">
                  {e.title}
                </Link>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {format(parseISO(e.date), "d MMMM yyyy", { locale: it })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun evento registrato ancora presso questo locale.</p>
        )}
      </Card>

      <DeleteVenueButton venueId={venue.id} />
    </div>
  );
}
